#!/bin/sh
# OpenClaw Survival Test (v133 - Minimalist Isolation)
# We DO NOT run OpenClaw or Node here. Just stay alive.
mkdir -p /root/.openclaw

echo "STABILIZED_V133" > /root/isolation_test.txt
echo "[DEBUG] v133 Isolation Mode: Keeping container alive without running app..."

# Keep the container alive indefinitely
sleep infinity
