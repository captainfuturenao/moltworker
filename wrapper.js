const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

// Configuration
const PROXY_PORT = 3000;      // External (Cloudflare) connects here
const APP_PORT = 3001;        // OpenClaw runs here
const LOG_FILE = '/root/openclaw.log';

console.log(`[WRAPPER] Starting Moltbot Stability Wrapper v148...`);
console.log(`[WRAPPER] Listening on port ${PROXY_PORT}, managing App on port ${APP_PORT}`);

// State
let appProcess = null;
let appState = 'STARTING'; // STARTING, RUNNING, CRASHED
let lastError = '';

// Start OpenClaw
function startApp() {
    console.log('[WRAPPER] Launching OpenClaw...');

    // Ensure config exists
    try {
        require('child_process').execSync('node /root/clawd/configure.js');
    } catch (e) {
        console.error('[WRAPPER] Config gen failed:', e);
    }

    // Cleanup logs
    try { fs.unlinkSync(LOG_FILE); } catch (e) { }

    const outStream = fs.createWriteStream(LOG_FILE);

    appProcess = spawn('openclaw', [], {
        stdiao: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PORT: APP_PORT } // Ensure env var matches too if used
    });

    appProcess.stdout.on('data', (data) => {
        outStream.write(data);
        process.stdout.write(`[APP] ${data}`); // Pass through to docker logs
    });

    appProcess.stderr.on('data', (data) => {
        outStream.write(data);
        process.stderr.write(`[APP_ERR] ${data}`);
        lastError = data.toString();
    });

    appProcess.on('exit', (code) => {
        console.log(`[WRAPPER] App exited with code ${code}`);
        appState = 'CRASHED';
        appProcess = null;
    });

    // Check availability
    checkAppHealth();
}

// Health Check Loop
function checkAppHealth() {
    if (appState === 'CRASHED') return;

    const req = http.get(`http://127.0.0.1:${APP_PORT}/`, (res) => {
        if (appState !== 'RUNNING') {
            console.log('[WRAPPER] OpenClaw is serving traffic! Switching state to RUNNING.');
            appState = 'RUNNING';
        }
    });

    req.on('error', (e) => {
        if (appState === 'RUNNING') {
            console.log('[WRAPPER] App failing to respond...');
            // Don't switch to CRASHED immediately, wait for process exit or timeout
        }
        // Keep checking
        setTimeout(checkAppHealth, 1000);
    });
}

// Proxy Server
const server = http.createServer((req, res) => {
    if (appState === 'RUNNING') {
        // Simple Proxy
        const options = {
            hostname: '127.0.0.1',
            port: APP_PORT,
            path: req.url,
            method: req.method,
            headers: req.headers,
        };

        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error('[WRAPPER] Proxy error:', e);
            serveError(res, 'Proxy Connection Failed', e.message);
        });

        req.pipe(proxyReq);
    } else if (appState === 'STARTING') {
        serveLoading(res);
    } else {
        serveError(res, 'OpenClaw Crashed', readLogs());
    }
});

function readLogs() {
    try {
        return fs.readFileSync(LOG_FILE, 'utf8');
    } catch (e) {
        return 'No logs available.\nLast STDERR: ' + lastError;
    }
}

function serveLoading(res) {
    const html = `
    <html>
    <head><title>Starting...</title><meta http-equiv="refresh" content="2"></head>
    <body style="background:#222; color:#eee; font-family:sans-serif; text-align:center; padding-top:20%;">
        <h1>Moltbot is Starting...</h1>
        <p>Please wait while the AI agent initializes.</p>
        <p style="color:#aaa;">Target Port: ${APP_PORT}</p>
        <div style="margin-top:20px;">
            <div style="display:inline-block; width:20px; height:20px; border:3px solid #555; border-top:3px solid #0f0; border-radius:50%; animation:spin 1s linear infinite;"></div>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    </body>
    </html>`;
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end(html);
}

function serveError(res, title, logs) {
    const html = `
    <html>
    <head><title>Error</title></head>
    <body style="background:#111; color:#f88; font-family:monospace; padding:20px;">
        <h1>${title}</h1>
        <pre style="background:#000; border:1px solid #444; padding:15px; overflow:scroll; max-height:80vh;">${logs.replace(/</g, '&lt;')}</pre>
    </body>
    </html>`;
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(html);
}

server.listen(PROXY_PORT, () => {
    console.log(`[WRAPPER] Proxy running on port ${PROXY_PORT}`);
    startApp();
});
