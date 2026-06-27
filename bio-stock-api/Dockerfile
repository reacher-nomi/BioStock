FROM python:3.11-slim

# Avoid .pyc files and buffer stdout for live logs.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY . .

EXPOSE 8000

# Seed the demo user/data (idempotent) then launch the API.
CMD ["sh", "-c", "python seed_data.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
