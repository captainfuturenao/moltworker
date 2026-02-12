#!/bin/sh
# OpenClaw Final Deployment (v140 - WS Fix & Log Consistency)
mkdir -p /root/.openclaw

echo "[STARTUP] Generating config v140..."
node /root/clawd/configure.js

echo "[STARTUP] Starting OpenClaw..."
# Standard cleanup
rm -f /root/openclaw.log

# Start OpenClaw with log piping
# 2>&1 | tee is excellent for debug + persistence
openclaw 2>&1 | tee /root/openclaw.log &
OPENCLAW_PID=$!

echo "[STARTUP] OpenClaw started (PID: $OPENCLAW_PID). Logs are streaming."

# Heartbeat loop
while true; do
  if kill -0 $OPENCLAW_PID 2>/dev/null; then
    # Silent success to avoid log spam, process is alive
    sleep 60
  else
    echo "[CRITICAL] OpenClaw process EXITED at $(date). Checking tail:"
    tail -n 20 /root/openclaw.log
    # If it dies, we just sleep to keep container alive for debug inspection
    sleep 60
  fi
done
