#!/bin/sh
# OpenClaw Diagnostic v142 (Dummy Server)
# Listens on port 3000 to satisfy Sandbox readiness checks.

echo "[STARTUP] v142: Starting dummy HTTP server on port 3000..."

# Create the dummy server script
cat <<EOF > /root/dummy_server.js
const http = require('http');
const port = 3000; // Matches src/config.ts MOLTBOT_PORT

const server = http.createServer((req, res) => {
    console.log('[DUMMY] Request received: ' + req.method + ' ' + req.url);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        ok: true,
        status: 'dummy-server-alive-v142',
        time: new Date().toISOString()
    }));
});

server.listen(port, () => {
    console.log('[DUMMY] Server listening on port ' + port);
});
EOF

# Run the dummy server (using exec to replace shell process)
exec node /root/dummy_server.js
