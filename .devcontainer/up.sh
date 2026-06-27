#!/usr/bin/env bash
# Brings up the Bio-Stock stack inside a Codespace / devcontainer.
# Stays non-fatal so container creation never fails on a transient hiccup.
set +e

# In Codespaces, wire the web app + API CORS to the public forwarded URLs so
# the browser preview can reach the API. Locally these stay at localhost.
if [ -n "$CODESPACE_NAME" ]; then
  DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  export EXPO_PUBLIC_API_URL="https://${CODESPACE_NAME}-8000.${DOMAIN}"
  export CORS_ORIGINS="https://${CODESPACE_NAME}-19006.${DOMAIN}"
  echo "Codespaces detected:"
  echo "  API  -> $EXPO_PUBLIC_API_URL"
  echo "  Web  -> https://${CODESPACE_NAME}-19006.${DOMAIN}"
fi

echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo "Bio-Stock is starting."
echo "  - API:  port 8000 (docs at /docs)"
echo "  - Web:  port 19006"
echo "If the web app can't reach the API in Codespaces, set port 8000 to"
echo "'Public' in the Ports tab."
exit 0
