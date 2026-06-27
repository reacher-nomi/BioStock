import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import Goal, HealthLog, TokenLedger, User  # noqa: F401
from routes import auth, dashboard, health, tokens

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bio-Stock API", version="1.0")

# Restrict CORS to known origins. Override with a comma-separated CORS_ORIGINS env var.
_default_origins = "http://localhost:8081,http://localhost:19006,http://localhost:3000"
allowed_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(tokens.router)
app.include_router(dashboard.router)


@app.get("/")
def read_root():
    return {"message": "Bio-Stock API running"}


@app.get("/healthcheck")
def health_check():
    return {"status": "ok"}
