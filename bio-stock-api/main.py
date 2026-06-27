from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import Goal, HealthLog, TokenLedger, User  # noqa: F401
from routes import auth, dashboard, health, tokens

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bio-Stock API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
