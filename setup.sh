#!/usr/bin/env bash
set -e
echo "Setting up Bio-Stock API..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed_data.py
echo "Setup complete. Run: uvicorn main:app --reload"
