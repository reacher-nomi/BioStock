import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database import Base, engine
from logging_config import RequestLoggingMiddleware, configure_logging
from models import Goal, HealthLog, TokenLedger, User  # noqa: F401
from routes import auth, dashboard, fhir, health, mfa, tokens

configure_logging()
logger = logging.getLogger("bio-stock")
settings = get_settings()  # validates configuration at startup

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bio-Stock API", version="1.0")
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
# cross-origin / second-port problem. Mounted last so API routes take priority.
WEB_DIR = os.environ.get("WEB_DIST_DIR", "webdist")
if os.path.isdir(WEB_DIR):
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
else:
    @app.get("/")
    def read_root():
        return {"message": "Bio-Stock API running"}
