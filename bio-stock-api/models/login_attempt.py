from sqlalchemy import Column, DateTime, Integer, String

from database import Base
from time_utils import utcnow


class LoginAttempt(Base):
    """One row per auth attempt, used for a DB-backed (persistent, multi-worker
    safe) rate limiter. Rows older than the rate-limit window are pruned as a
    side effect of each check, so the table stays small.
    """
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, nullable=False, index=True)  # client IP (or other key)
    attempted_at = Column(DateTime, default=utcnow, nullable=False, index=True)
