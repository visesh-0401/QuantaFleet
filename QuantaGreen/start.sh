#!/bin/bash
# ==============================================================================
# QuantaGreen (SIH26138) — Complete Startup Script
# Starts FastAPI Backend on port 8001 and React Frontend on port 5174
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🌿 Starting QuantaGreen (SIH26138 Platform)"
echo "   Quantum-Inspired Fuel Prediction & Green Fleet Optimizer"
echo "=========================================================="

# 1. Start Backend in background
echo "⚡ [1/2] Launching Backend on port 8001..."
source "$DIR/backend/venv/bin/activate"
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "   Backend running (PID: $BACKEND_PID)"

# 2. Wait for backend to respond
echo "⏳ Waiting for backend healthcheck..."
for i in {1..15}; do
  if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy and ready!"
    break
  fi
  sleep 1
done

# 3. Start Frontend
echo "🌊 [2/2] Launching Frontend on port 5174..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 > /dev/null 2>&1

cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 QuantaGreen is LIVE!"
echo "   🌐 Frontend: http://localhost:5174"
echo "   ⚡ Backend API: http://localhost:8001"
echo "   📖 Swagger Docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
