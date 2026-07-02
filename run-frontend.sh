#!/usr/bin/env bash
set -euo pipefail

# Simple helper to install and start the Expo frontend locally
cd "$(dirname "$0")/bio-stock-app"

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm ci
fi

echo "Starting Expo..."
npm start
