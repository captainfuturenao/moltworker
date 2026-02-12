#!/bin/sh
# OpenClaw Incremental Test (v134 - Config Generation Only)
mkdir -p /root/.openclaw

echo "[DEBUG] v134: Testing configure.js execution..."
# Run config generation and capture output
node /root/clawd/configure.js > /root/config_gen.log 2>&1
CONFIG_EXIT=$?

if [ $CONFIG_EXIT -eq 0 ]; then
    echo "CONFIG_SUCCESS" > /root/isolation_test.txt
else
    echo "CONFIG_FAILED_CODE_$CONFIG_EXIT" > /root/isolation_test.txt
fi

echo "[DEBUG] Execution finished. Keeping container alive for diagnostics..."
sleep infinity
