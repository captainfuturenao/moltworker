# v154: Proxy Wrapper Strategy
# 1. Node.js server starts IMMEDIATELY on port 3000 (Satisfies Worker connection)
# 2. OpenClaw starts in background on port 3001
# 3. Wrapper proxies 3000 -> 3001 only when 3001 is ready

cat <<'EOF' > /root/wrapper.js
const http = require('http');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const PROXY_PORT = 3000;
const OPENCLAW_PORT = 3001;
let openclawProcess = null;
let isOpenClawReady = false;

console.log('[WRAPPER] Starting v158 Wrapper on port ' + PROXY_PORT);

// 1. Start Proxy Server immediately
const proxyServer = http.createServer((req, res) => {
    // [v157] Log-over-HTTP Endpoint
    if (req.url === '/wrapper-logs') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        try {
            const logContent = fs.existsSync('/root/openclaw.log') ? fs.readFileSync('/root/openclaw.log', 'utf8') : '(openclaw.log not found)';
            let psOutput = '';
            try { psOutput = execSync('ps aux').toString(); } catch (e) { psOutput = 'ps failed: ' + e.message; }
            
            res.end(
                '--- WRAPPER LOGS (v158) ---\n' +
                'Status: ' + (isOpenClawReady ? 'READY' : 'STARTING') + '\n\n' +
                '--- STDOUT/STDERR (openclaw.log) ---\n' + logContent + '\n\n' +
                '--- PROCESS LIST ---\n' + psOutput
            );
        } catch (e) {
            res.end('Error reading logs: ' + e.message);
        }
        return;
    }

    if (!isOpenClawReady) {
        // Still starting
        if (req.url === '/') {
             res.writeHead(200, { 'Content-Type': 'text/html' });
             res.end('<h1>OpenClaw is Starting... (v157 Log-Http)</h1><p>Please reload in a few seconds.</p><script>setTimeout(() => location.reload(), 3000);</script>');
             return;
        }
        // [v155] Return 200 even if starting, because Cloudflare Sandbox library throws error on 503
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'starting', message: 'OpenClaw is booting up (v157)...' }));
        return;
    }


    // Proxy logic (Simplified)
    const options = {
        hostname: '127.0.0.1',
        port: OPENCLAW_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (e) => {
        console.error('[PROXY] Request failed:', e.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'OpenClaw proxy failed', details: e.message }));
    });

    req.pipe(proxyReq, { end: true });
});

proxyServer.listen(PROXY_PORT, '0.0.0.0', () => {
    console.log('[WRAPPER] Proxy listening on ' + PROXY_PORT);
    startOpenClaw();
});

// 2. Diagnostics & Start OpenClaw
function startOpenClaw() {
    console.log('[WRAPPER] --- DIAGNOSTICS v158 START ---');
    try {
        console.log('[DIAG] Check binary exists:');
        console.log(execSync('ls -l /usr/local/bin/openclaw || echo "NOT FOUND"').toString());
        
        console.log('[DIAG] Check version:');
        console.log(execSync('openclaw --version || echo "EXEC FAILED"').toString());
    } catch (e) {
        console.error('[DIAG] Diagnostic command failed:', e.message);
    }
    console.log('[WRAPPER] --- DIAGNOSTICS v158 END ---');

    console.log('[WRAPPER] Generating config...');
    // Run configure.js first
    const configProc = spawn('node', ['/root/clawd/configure.js']);
    configProc.on('close', (code) => {
        if (code !== 0) {
            console.error('[WRAPPER] Config generation failed with code', code);
            return;
        }
        console.log('[WRAPPER] Config generated. Launching openclaw (v158 captured)...');
        
        // Launch OpenClaw
        // v158: Use 'pipe' to capture output manually, ensuring it goes to our log file
        openclawProcess = spawn('openclaw', ['--config', '/root/.openclaw/openclaw.json'], {
            stdio: ['ignore', 'pipe', 'pipe'] 
        });

        openclawProcess.stdout.on('data', (data) => {
            console.log('[OPENCLAW STDOUT]', data.toString().trim());
        });

        openclawProcess.stderr.on('data', (data) => {
            console.error('[OPENCLAW STDERR]', data.toString().trim());
        });

        openclawProcess.on('error', (err) => {
             console.error('[WRAPPER] OpenClaw spawn error:', err);
        });

        openclawProcess.on('close', (code) => {
             console.error('[WRAPPER] OpenClaw exited with code', code);
             isOpenClawReady = false;
        });

        // Check for port 3001 availability
        checkPort3001();
    });
}

function checkPort3001() {
    const net = require('net');
    const interval = setInterval(() => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on('connect', () => {
            console.log('[WRAPPER] OpenClaw port 3001 is OPEN!');
            isOpenClawReady = true;
            socket.destroy();
            clearInterval(interval);
        });
        socket.on('error', () => {
             socket.destroy();
        });
        socket.on('timeout', () => {
             socket.destroy();
        });
        socket.connect(OPENCLAW_PORT, '127.0.0.1');
    }, 1000);
}

// Prevent exit
process.on('uncaughtException', (err) => console.error('[WRAPPER] Uncaught:', err));
EOF

echo "[STARTUP] Executing Wrapper v154..."
# v156: Redirect output to log file so /api/emergency-log can read it!
exec node /root/wrapper.js > /root/openclaw.log 2>&1

