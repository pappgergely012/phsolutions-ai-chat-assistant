#!/bin/bash

source venv/bin/activate

echo "Starting API server..."
uvicorn src.api:app --reload --port 8000 &
API_PID=$!

echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "API:      http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
