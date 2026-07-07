"""DB-backed rate limiter for auth endpoints.

An in-memory dict only rate-limits within a single process, which resets on
restart and desyncs across multiple worker processes. Backing it with a table
in the same database the app already uses makes it persistent and correct
under any number of workers, with no extra infrastructure (e.g. Redis).
"""
from datetime import timedelta

from sqlalchemy.orm import Session

from models.login_attempt import LoginAttempt
from time_utils import utcnow

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 60


def enforce_rate_limit(identifier: str, db: Session) -> bool:
    """Record an attempt for `identifier`; return False if the limit is exceeded."""
    now = utcnow()
    cutoff = now - timedelta(seconds=WINDOW_SECONDS)

    # Prune this identifier's old attempts so the table doesn't grow unbounded.
    db.query(LoginAttempt).filter(
        LoginAttempt.identifier == identifier, LoginAttempt.attempted_at < cutoff
    ).delete()

    count = db.query(LoginAttempt).filter(
        LoginAttempt.identifier == identifier, LoginAttempt.attempted_at >= cutoff
    ).count()

    if count >= MAX_ATTEMPTS:
        db.commit()
        return False

    db.add(LoginAttempt(identifier=identifier, attempted_at=now))
    db.commit()
    return True
