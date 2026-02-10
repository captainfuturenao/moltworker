#!/bin/sh
set -e

# Turn on debug mode if requested
if [ "$OPENCLAW_DEV_MODE" = "true" ]; then
  set -x
fi

echo "Starting OpenClaw (Moltbot Edition)..."
echo "Version: Latest (v73 - OpenAI Compatible)"

# ============================================================
# 0. DEBUGGING INFO
# ============================================================
echo "Environment Check:"
echo "  NODE_ENV: $NODE_ENV"
echo "  CF_ACCOUNT_ID: ${CF_ACCOUNT_ID:-(not set)}"
echo "  CF_AI_GATEWAY_ID: ${CF_AI_GATEWAY_ID:-(not set)}"
echo "  Google Key Present: $(if [ -n "$GOOGLE_API_KEY" ]; then echo "Yes"; else echo "No"; fi)"
echo "  CF Key Present: $(if [ -n "$CLOUDFLARE_AI_GATEWAY_API_KEY" ]; then echo "Yes"; else echo "No"; fi)"

# ============================================================
# 1. GENERATE CONFIGURATION
# ============================================================
echo "Running holistic configuration generator (v73 - OpenAI Compatible Standard)..."

# FORCE CLEAN: Remove any existing config to prevent R2 persistence issues
rm -f /root/.openclaw/openclaw.json

if [ -f "/root/clawd/configure.js" ]; then
    node /root/clawd/configure.js
else
    echo "CRITICAL: configure.js not found! Startup aborted."
    exit 1
fi

# Dummy key to prevent startup complaints if binary checks it by default
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-sk-ant-dummy}"

# ============================================================
# 2. START OPENCLAW
# ============================================================
echo "Initialization complete. Launching binary..."

# Use exec to replace shell with openclaw process (better signal handling)
exec openclaw
