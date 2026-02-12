#!/bin/sh
# OpenClaw Startup Script (v145 - Correct Model Name & Production Boot)
# Reverts dummy server usage and attempts to start OpenClaw with correct config.

mkdir -p /root/.openclaw

echo "[STARTUP] Generating config v145 (Model: gemini-1.5-flash-latest)..."
node /root/clawd/configure.js

echo "[STARTUP] Starting OpenClaw..."
# Standard cleanup
rm -f /root/openclaw.log

# Start OpenClaw with log piping to both file (for emergency-log) and stdout (for Cloudflare logs)
# Using 2>&1 to capture stderr as well.
# We trust that the model name fix will prevent the immediate crash.
openclaw 2>&1 | tee /root/openclaw.log &
OPENCLAW_PID=$!

echo "[STARTUP] OpenClaw started (PID: $OPENCLAW_PID). Logs are streaming."

# Monitor the process. If it dies, the container will exit (and restart),
# effectively signaling a crash to Cloudflare.
# However, to allow 'emergency-log' to work, we might want to keep it alive slightly longer?
# No, user wants real fix. If it crashes, let it crash (or 500).
# But for debugging 500s, we DO need it to stay alive if it crashes immediately.

# Survival loop: Monitor PID, if dead, sleep to allow log extraction.
while true; do
  if kill -0 $OPENCLAW_PID 2>/dev/null; then
    sleep 10
  else
    echo "[CRITICAL] OpenClaw process EXITED at $(date). Entering troubleshooting mode."
    echo "--- TAIL OF LOG ---"
    tail -n 20 /root/openclaw.log
    
    # Do NOT exit. Sleep to allow log retrieval via /api/emergency-log
    echo "Sleeping indefinitely to verify logs..."
    sleep infinity
  fi
done
