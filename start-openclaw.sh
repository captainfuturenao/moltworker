#!/bin/sh
# OpenClaw Final Deployment (v139 - Log to Stdout/File & Robust)
mkdir -p /root/.openclaw

echo "[STARTUP] Generating config v139..."
node /root/clawd/configure.js

echo "[STARTUP] Starting OpenClaw..."
# Use tee to send logs to BOTH stdout (for /api/debug-logs) and file (for /api/emergency-log)
# We run in background, but tee needs to flow.
openclaw 2>&1 | tee /root/openclaw.log &
OPENCLAW_PID=$!

echo "[STARTUP] OpenClaw started (PID: $OPENCLAW_PID). Logs are streaming to stdout and file."

# Heartbeat loop
while true; do
  if kill -0 $OPENCLAW_PID 2>/dev/null; then
    # We don't echo every minute to avoid spamming logs, maybe every 5 mins?
    # actually getting "still alive" is good for debug.
    echo "[HEALTH] OpenClaw is running (PID: $OPENCLAW_PID) at $(date)"
  else
    echo "[CRITICAL] OpenClaw process EXITED at $(date). Checking tail of log:"
    tail -n 20 /root/openclaw.log
    # Don't exit, stay alive for debug
  fi
  sleep 60
done
