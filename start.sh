#!/bin/bash
# QuantaFleet — Start both servers
# Run this from /home/visesh-chauhan/Documents/SIH/

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Fix PATH for nvm node in non-interactive shells
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$HOME/.npm-global/bin:$PATH"

echo ""
echo "  ⚛  QuantaFleet Launcher"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Python backend ─────────────────────────────────────────
echo "[1/2] Starting FastAPI backend (venv) on :8000 ..."
cd "$ROOT/backend"

if [ ! -f "venv/bin/uvicorn" ]; then
  echo "  → Creating venv and installing deps..."
  python3 -m venv venv
  venv/bin/pip install -q fastapi "uvicorn[standard]" pydantic numpy networkx dwave-neal scipy
fi

nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/quantafleet_backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID  (logs: /tmp/quantafleet_backend.log)"

# ── Frontend ───────────────────────────────────────────────
echo ""
echo "[2/2] Installing & starting Vite frontend on :5173 ..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  → Running npm install ..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "  ✅  Both servers running!"
echo "  📱  Open: http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both."
echo ""

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" SIGINT SIGTERM
wait $BACKEND_PID $FRONTEND_PID
