#!/usr/bin/env sh
set -eu

required_vars="DJANGO_SECRET_KEY DJANGO_DEBUG DJANGO_ALLOWED_HOSTS CORS_ALLOWED_ORIGINS"

for var in $required_vars; do
  if ! grep -q "^${var}=" .env; then
    echo "Missing required env var: $var"
    exit 1
  fi
done

echo "Environment validation passed."
