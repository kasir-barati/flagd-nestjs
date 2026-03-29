#!/bin/sh

PORT="${PORT:-3000}"

# Start the NestJS application in the background
node /app/dist/main.js &
NEST_PID=$!

# Wait for NestJS to be ready (port must be listening)
echo "Waiting for NestJS to be ready on port ${PORT}..."
until curl -so /dev/null -w '' "http://localhost:${PORT}/flagd/flags.json" 2>/dev/null; do
  if ! kill -0 "$NEST_PID" 2>/dev/null; then
    echo "NestJS process exited unexpectedly."
    exit 1
  fi
  sleep 1
done
echo "NestJS is ready."

# Start flagd — syncs flag definitions from the NestJS REST API
flagd start \
  --port 8013 \
  --metrics-port 8014 \
  --ofrep-port 8016 \
  --uri "http://localhost:${PORT}/flagd/flags.json" &
FLAGD_PID=$!

# If signalled, stop both processes
cleanup() {
  kill "$NEST_PID" "$FLAGD_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# Monitor both processes — exit if either dies
while true; do
  if ! kill -0 "$NEST_PID" 2>/dev/null; then
    echo "NestJS exited, shutting down..."
    kill "$FLAGD_PID" 2>/dev/null
    exit 1
  fi
  if ! kill -0 "$FLAGD_PID" 2>/dev/null; then
    echo "flagd exited, shutting down..."
    kill "$NEST_PID" 2>/dev/null
    exit 1
  fi
  sleep 2
done
