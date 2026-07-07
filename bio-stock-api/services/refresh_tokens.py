"""Refresh-token issuance, rotation, and revocation.

Only a SHA-256 hash of the token is ever stored — the raw value exists only
in the response body and the client's storage. Every successful refresh
rotates the token (old one revoked, new one issued), so a stolen-but-unused
refresh token has a bounded window before it's invalidated by legitimate use.
"""
import hashlib
import secrets
from datetime import timedelta

from sqlalchemy.orm import Session

from models.refresh_token import RefreshToken
from time_utils import utcnow

REFRESH_TOKEN_EXPIRE_DAYS = 30


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_refresh_token(user_id: int, db: Session) -> str:
    raw = secrets.token_urlsafe(48)
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=_hash(raw),
        expires_at=utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    db.commit()
    return raw


def rotate_refresh_token(raw_token: str, db: Session) -> tuple[int, str] | None:
    """Validate + revoke the given token and issue a new one. Returns
    (user_id, new_raw_token), or None if the token is invalid/expired/revoked."""
    rec = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash(raw_token)).first()
    if not rec or rec.revoked or rec.expires_at < utcnow():
        return None

    rec.revoked = True
    user_id = rec.user_id
    new_token = create_refresh_token(user_id, db)
    db.commit()
    return user_id, new_token


def revoke_refresh_token(raw_token: str, db: Session) -> None:
    db.query(RefreshToken).filter(RefreshToken.token_hash == _hash(raw_token)).update({"revoked": True})
    db.commit()
