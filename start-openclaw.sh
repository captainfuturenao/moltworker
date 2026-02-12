#!/bin/sh
# OpenClaw Final Deployment (v137 - Official Schema & Robust)
mkdir -p /root/.openclaw

echo "[STARTUP] Generating config v137..."
node /root/clawd/configure.js

echo "[STARTUP] Starting OpenClaw..."
# We use --non-interactive (or equivalent environment if supported)
# And we ensure logs are captured
openclaw > /root/openclaw.log 2>&1 &
OPENCLAW_PID=$!

echo "[STARTUP] OpenClaw started (PID: $OPENCLAW_PID). Waiting for it to stabilize..."

# Heartbeat loop to keep container alive and provide diagnostics
while true; do
  if kill -0 $OPENCLAW_PID 2>/dev/null; then
    echo "[HEALTH] OpenClaw is running (PID: $OPENCLAW_PID) at $(date)"
  else
    echo "[CRITICAL] OpenClaw process EXITED at $(date). Check /root/openclaw.log"
    # Even if it exits, we don't exit the script to avoid Sandbox reset loop
  fi
  sleep 60
done
