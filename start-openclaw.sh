#!/bin/sh
# OpenClaw Startup Script (v132 - Survival & Debug Enhanced)
mkdir -p /root/.openclaw
# Ensure the config is generated
node /root/clawd/configure.js

echo "[DEBUG] Starting OpenClaw at $(date)..."
# Stream logs to a file for extraction. 
# We use & to run in background so we can ensure the container stays alive even on failure.
openclaw > /root/openclaw_startup.log 2>&1 &
OPENCLAW_PID=$!

echo "[DEBUG] OpenClaw started with PID $OPENCLAW_PID. Monitoring..."

# Keep the container alive indefinitely for diagnostics
# Even if the PID exits, we don't finish the script.
echo "[DEBUG] Keeping container alive for diagnostics. Check /debug/fs/cat?path=/root/openclaw_startup.log"
sleep infinity
