#!/bin/sh
# OpenClaw Incremental Test (v136 - Version Check)
echo "[STARTUP] Container v136 is alive"

echo "[DEBUG] Checking OpenClaw version..."
openclaw --version > /root/version.txt 2>&1
VERSION_EXIT=$?

if [ $VERSION_EXIT -eq 0 ]; then
    echo "VERSION_SUCCESS: $(cat /root/version.txt)" > /root/isolation_test.txt
else
    echo "VERSION_FAILED_CODE_$VERSION_EXIT: $(cat /root/version.txt)" > /root/isolation_test.txt
fi

echo "[DEBUG] Monitoring heartbeat..."
while true; do
  echo "[HEARTBEAT] $(date)"
  sleep 60
done
