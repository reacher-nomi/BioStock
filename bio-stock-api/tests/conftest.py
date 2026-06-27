import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main
from database import Base, get_db
from routes import auth


@pytest.fixture
def client():
    # Isolated in-memory DB shared across the test's connections.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[get_db] = override_get_db
    auth._attempts.clear()  # reset rate limiter between tests

    with TestClient(main.app) as c:
        yield c

    main.app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    """A client already registered + authenticated as a test user."""
    res = client.post("/auth/register", json={"email": "t@t.com", "password": "password1"})
    token = res.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


GREEN_LOG = {"systolic_bp": 115, "diastolic_bp": 75, "steps": 9000, "sleep_hours": 8.0, "resting_hr": 60}
