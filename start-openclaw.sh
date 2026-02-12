#!/bin/sh
# OpenClaw Startup Script (v148 - Stability Wrapper)
# Launches the Node.js wrapper which manages OpenClaw (port 3001) and exposes port 3000.

mkdir -p /root/.openclaw

echo "[STARTUP] Handing over control to Stability Wrapper (v148)..."
exec node /root/clawd/wrapper.js
