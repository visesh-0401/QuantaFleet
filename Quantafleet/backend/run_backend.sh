#!/bin/bash
# Run the FastAPI backend using the virtual environment
# Usage: ./run_backend.sh

cd "$(dirname "$0")"

# Ensure venv exists
if [ ! -f "venv/bin/uvicorn" ]; then
    echo "❌ venv not found. Run: python3 -m venv venv && venv/bin/pip install -r requirements.txt"
    exit 1
fi

echo "🚀 Starting QuantaFleet backend (venv) on http://0.0.0.0:8000"
exec venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
