# Combined image: builds the Expo web app, then serves it from the FastAPI
# backend on a single port (single-origin). This is what makes the app work in
# GitHub Codespaces — the browser only talks to one forwarded, authenticated
# URL, so there is no cross-origin / second-port problem.

# Stage 1 — build the static web bundle.
FROM node:20-slim AS web
WORKDIR /web
COPY bio-stock-app/package.json bio-stock-app/package-lock.json* ./
RUN npm install
COPY bio-stock-app/ ./
RUN npx expo export --platform web --output-dir /web/dist

# Stage 2 — API that also serves the web bundle.
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    WEB_DIST_DIR=/app/webdist

WORKDIR /app
COPY bio-stock-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bio-stock-api/ .
COPY --from=web /web/dist ./webdist

# Non-root user (container hardening). /app is owned by appuser so the SQLite
# DB under /app/data is writable.
RUN useradd --create-home --uid 1001 appuser \
    && mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/healthcheck').status==200 else 1)"

# Seed the demo user/data (idempotent) then launch the API + web app.
CMD ["sh", "-c", "python seed_data.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
