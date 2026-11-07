#!/bin/bash
cd "$(dirname "$0")"
PORT=8088

if ! lsof -i :$PORT > /dev/null 2>&1; then
  echo "Starting local server at http://localhost:$PORT ..."
  python3 -m http.server $PORT &
  SERVER_PID=$!
  sleep 1
  open "http://localhost:$PORT"
  echo "Server is running (PID: $SERVER_PID). Press Ctrl+C to stop."
  wait $SERVER_PID
else
  echo "Server is already running on port $PORT. Opening browser..."
  open "http://localhost:$PORT"
fi
