#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping frontend server..."
    kill $(jobs -p)
    exit
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  set -a
  . .env.local
  set +a
fi

# Map PROJECT_ID to GOOGLE_CLOUD_PROJECT for Vertex AI
if [ -n "$PROJECT_ID" ]; then
  export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"
fi

echo "Starting Frontend (Next.js)..."
cd apps/frontend
npm run dev 2>&1 | tee frontend.log &
FRONTEND_PID=$!

# Wait for all background jobs to finish
wait
