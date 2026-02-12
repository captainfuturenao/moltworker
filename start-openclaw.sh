# v149: Absolute Minimalist Survival Server
# We strip away ALL complexity (wrappers, monitors, failovers).
# We just want port 3000 to say "OK". If this works, the infrastructure is fine.

# 1. Create the simplest possible server
cat <<EOF > /root/survival_server.js
const http = require('http');
const port = 3000;

console.log('Starting Survival Server v149 on port ' + port);

const server = http.createServer((req, res) => {
    console.log('Request: ' + req.url);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'survival-mode-v149',
        ok: true,
        message: 'Infrastructure is responding. OpenClaw is currently disabled for diagnostics.',
        time: new Date().toISOString()
    }));
});

server.listen(port, '0.0.0.0', () => {
    console.log('Survival Server listening on ' + port);
});

// Prevent exit on error
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
});
EOF

# 2. Run it. Do not background it. Do not monitor it. Just run it.
echo "[STARTUP] Executing Survival Server..."
exec node /root/survival_server.js
