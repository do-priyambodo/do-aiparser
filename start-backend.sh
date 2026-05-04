#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping backend server..."
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

echo "Starting Backend (FastAPI + ADK)..."
cd apps/backend
export GOOGLE_APPLICATION_CREDENTIALS=/usr/local/google/home/priyambodo/.config/gcloud/application_default_credentials.json
export GOOGLE_CLOUD_QUOTA_PROJECT=work-mylab-machinelearning

# Execute the fast_api_app using uv run environment
PYTHONPATH=. uv run python -m app.fast_api_app 2>&1 | tee server.log &
BACKEND_PID=$!

# Wait for background jobs to finish
wait
