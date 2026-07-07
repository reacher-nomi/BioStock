from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from database import Base
from time_utils import utcnow


class UserMFA(Base):
    __tablename__ = "user_mfa"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    # Encrypted at rest (Fernet, see services/crypto.py) — never store the raw TOTP seed.
    secret = Column(String, nullable=False)
    enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
