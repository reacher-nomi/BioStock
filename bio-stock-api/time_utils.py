"""Single source of truth for "now" in UTC.

datetime.utcnow() is deprecated (Python 3.12+) and returns a naive datetime
that's easy to misuse. This returns a naive datetime that is explicitly UTC by
convention throughout the app (DB columns, JWT claims, comparisons) — naive on
purpose so every stored/compared timestamp uses the same convention without
needing timezone-aware SQLite columns.
"""
from datetime import UTC, datetime


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)
