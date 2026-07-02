#!/usr/bin/env bash
set -euo pipefail

# Setup backend Python virtualenv and install dependencies
echo "Setting up backend virtualenv and installing requirements..."
python3 -m venv bio-stock-api/venv
source bio-stock-api/venv/bin/activate
pip install --upgrade pip
pip install -r bio-stock-api/requirements.txt

# Install frontend dependencies
if [ -d "bio-stock-app" ]; then
  echo "Installing frontend dependencies..."
  cd bio-stock-app
  npm ci
  cd -
fi

echo "Setup complete. Activate backend venv with: source bio-stock-api/venv/bin/activate"
