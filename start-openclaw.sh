#!/bin/sh
# OpenClaw Diagnostic Survival (v135 - Bare Minimal)
echo "[STARTUP] Container v135 is alive at $(date)"
echo "[ENVIRONMENT]"
env | grep -v "_KEY" | grep -v "_TOKEN" # Logs env vars but redacts secrets

# Just stay alive and output occasionally
while true; do
  echo "[HEARTBEAT] Still alive at $(date)"
  sleep 60
done
