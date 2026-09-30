#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

source "$DIR/venv/bin/activate"
echo "🌊 Starting QuantaGreen FastAPI Server on port 8001..."
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

