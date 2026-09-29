#!/bin/bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd "$(dirname "$0")/frontend"
echo "Building frontend..."
npm run build
echo "Build complete."
