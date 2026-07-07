import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from config import get_settings
from database import SessionLocal
from db_bootstrap import run_migrations
from logging_config import RequestLoggingMiddleware, configure_logging
from routes import auth, dashboard, fhir, health, mfa, tokens
from services.goal_engine import resolve_all_due_goals

configure_logging()
logger = logging.getLogger("bio-stock")
settings = get_settings()  # validates configuration at startup

run_migrations()

# Background backstop for staking goal resolution. The primary mechanism is
# lazy, per-request resolution (see routes/tokens.py, dashboard.py) — this
# just guarantees it also happens for users who don't open the app. The first
# run is delayed by a full interval (not run-on-startup) so a fast test suite
# never triggers it against a real database as a side effect.
GOAL_RESOLUTION_INTERVAL_SECONDS = int(os.environ.get("GOAL_RESOLUTION_INTERVAL_SECONDS", "1800"))


async def _goal_resolution_loop():
    while True:
        await asyncio.sleep(GOAL_RESOLUTION_INTERVAL_SECONDS)
        try:
            db = SessionLocal()
            try:
                resolved = resolve_all_due_goals(db)
                if resolved:
                    logger.info(f"background_goal_resolution resolved_users={resolved}")
            finally:
                db.close()
        except Exception:
            logger.exception("background_goal_resolution_failed")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_goal_resolution_loop())
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="Bio-Stock API", version="1.0", lifespan=lifespan)
app.add_middleware(RequestLoggingMiddleware)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Log the full error server-side; return a safe, generic message to clients.
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(tokens.router)
app.include_router(dashboard.router)
app.include_router(fhir.router)
app.include_router(mfa.router)


@app.get("/healthcheck")
def health_check():
    return {"status": "ok"}


# Serve the built Expo web app from the same origin as the API (single-origin
# deployment). This is what makes the app work in GitHub Codespaces: the browser
# only talks to one forwarded, already-authenticated URL, so there is no
# cross-origin / second-port problem.
#
# The catch-all below is a SPA fallback: real files (JS/CSS/images) are served
# directly, and any other path returns index.html so client-side routes like
# /register resolve even on a hard refresh. Declared after all API routers, so
# they take priority.
WEB_DIR = os.path.abspath(os.environ.get("WEB_DIST_DIR", "webdist"))
if os.path.isdir(WEB_DIR):
    _index = os.path.join(WEB_DIR, "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        candidate = os.path.normpath(os.path.join(WEB_DIR, full_path))
        if full_path and candidate.startswith(WEB_DIR) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(_index)
else:
    @app.get("/")
    def read_root():
        return {"message": "Bio-Stock API running"}
