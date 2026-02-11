#!/bin/sh
set -ex # Exit on error and print all commands

echo "Starting OpenClaw (Moltbot Edition - DEBUG v107)..."

# Ensure the config directory exists before configure.js runs
mkdir -p /root/.openclaw

if [ -f "/root/clawd/configure.js" ]; then
    echo "Running configure.js..."
    node /root/clawd/configure.js
else
    echo "CRITICAL: configure.js not found!"
    ls -la /root/clawd
    exit 1
fi

export PORT=3000
echo "Starting OpenClaw binary..."
exec openclaw

