from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from database import Base
from time_utils import utcnow


class RefreshToken(Base):
    """Long-lived token used to obtain new access tokens without re-authenticating.

    Only the SHA-256 hash is stored, never the raw token, so a DB leak alone
    can't be used to impersonate a session. Rotated (revoked + replaced) on
    every use so a stolen-but-unused token has a bounded lifetime.
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
