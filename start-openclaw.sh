#!/bin/bash
# FORCE LF LINE ENDINGS
# Startup script for OpenClaw in Cloudflare Sandbox (Reset v50)
#
# Strategy: "Holistic Configuration Reset"
# 1. Generate clean config from ENV vars (configure.js)
# 2. Start Gateway
#
# NO R2 restore. NO partial patching. NO onboarding wizard.

set -e

# OPTIMIZATION: Limit Node.js memory to prevent OOM
# export NODE_OPTIONS="--max-old-space-size=100"

if pgrep -f "openclaw gateway" > /dev/null 2>&1; then
    echo "OpenClaw gateway is already running, exiting."
    exit 0
fi

CONFIG_DIR="/root/.openclaw"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"

echo "Config directory: $CONFIG_DIR"

# ============================================================
# 1. GENERATE CONFIGURATION
# ============================================================
echo "Running holistic configuration generator..."
if [ -f "/root/clawd/configure.js" ]; then
    node /root/clawd/configure.js
else
    echo "CRITICAL: configure.js not found! Startup aborted."
    exit 1
fi

# ============================================================
# 2. START GATEWAY
# ============================================================
echo "Starting OpenClaw Gateway..."
echo "Gateway will be available on port 18789"

# Clear locks
rm -f /tmp/openclaw-gateway.lock 2>/dev/null || true
rm -f "$CONFIG_DIR/gateway.lock" 2>/dev/null || true

# Start Process
# We use --allow-unconfigured because we are confident in our config file,
# but we want it to start even if some optional integrations are missing.
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
    echo "Starting gateway with token auth..."
    openclaw gateway --port 18789 --verbose --allow-unconfigured --bind lan --token "$OPENCLAW_GATEWAY_TOKEN" || {
        echo "CRITICAL: OpenClaw Gateway crashed!"
        sleep infinity
    }
else
    echo "Starting gateway with device pairing (no token)..."
    openclaw gateway --port 18789 --verbose --allow-unconfigured --bind lan || {
        echo "CRITICAL: OpenClaw Gateway crashed!"
        sleep infinity
    }
fi
