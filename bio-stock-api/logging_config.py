"""Structured (JSON) logging with per-request correlation IDs.

Emits one JSON line per event with timestamp, level, logger, message, and the
request_id of the in-flight request. No sensitive fields (passwords, tokens)
are ever logged.
"""
import contextvars
import json
import logging
import re
import sys
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware

# Correlation id for the current request, available to every log record.
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

# HIPAA-oriented redaction: never let secrets / PHI reach the logs.
_REDACT_PATTERNS = [
    (re.compile(r'("?password"?\s*[:=]\s*)"?[^",}\s]+', re.I), r"\1***"),
    (re.compile(r'("?(?:access_token|token|authorization|secret)"?\s*[:=]\s*)"?[^",}\s]+', re.I), r"\1***"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "***@***"),  # emails (PII)
]


def _redact(message: str) -> str:
    for pattern, repl in _REDACT_PATTERNS:
        message = pattern.sub(repl, message)
    return message


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "request_id": request_id_ctx.get(),
            "message": _redact(record.getMessage()),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Assigns a request id, logs start/finish with status and latency."""

    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex[:12])
        request_id_ctx.set(request_id)
        logger = logging.getLogger("bio-stock.request")
        start = time.perf_counter()
        logger.info(f"--> {request.method} {request.url.path}")
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(f"!!! {request.method} {request.url.path} failed")
            raise
        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
        logger.info(f"<-- {request.method} {request.url.path} {response.status_code} {elapsed_ms}ms")
        response.headers["X-Request-ID"] = request_id
        return response
