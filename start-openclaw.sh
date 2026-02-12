#!/bin/sh
# OpenClaw Regression Test (v141 - Sleep Only)
# Completely disable OpenClaw startup to confirm Sandbox survival.

echo "[STARTUP] v141: Entering sleep mode to verify infrastructure health."
echo "ALIVE" > /root/status.txt

# Do nothing but sleep. This consumes almost 0 memory/cpu.
sleep infinity
