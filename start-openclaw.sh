#!/bin/sh
# OpenClaw Startup Script (v131 - Debug Enhanced)
mkdir -p /root/.openclaw
# Ensure the config is generated
node /root/clawd/configure.js

echo "[DEBUG] Starting OpenClaw at $(date)..."
# Stream logs to a file for extraction, but don't exit if it fails
openclaw 2>&1 | tee /root/openclaw_startup.log

echo "[DEBUG] OpenClaw process exited with code $?. Keeping container alive for 1 hour for diagnostics..."
# Keep the container alive even if OpenClaw crashes
sleep 3600
