#!/usr/bin/env bash
# Brings up the Bio-Stock stack inside a Codespace / devcontainer.
# Single-origin: the API serves the web app on port 8000, so there is nothing
# to wire between ports. Stays non-fatal so creation never fails on a hiccup.
set +e

echo "Building and starting Bio-Stock (this takes a few minutes the first time)..."
docker compose up -d --build

echo ""
echo "Bio-Stock is starting on port 8000."
echo "Open the forwarded port 8000 to use the app (API docs at /docs)."
exit 0
