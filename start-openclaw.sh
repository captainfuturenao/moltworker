# v154: Proxy Wrapper Strategy
# 1. Node.js server starts IMMEDIATELY on port 3000 (Satisfies Worker connection)
# 2. OpenClaw starts in background on port 3001
# 3. Wrapper proxies 3000 -> 3001 only when 3001 is ready


# v163: CRITICAL FIX - Manually creating/overwriting configure.js to ensure schema fixes and model updates are applied
# The container image seems to have an old/broken version, and file sync is not reliable.
mkdir -p /root/clawd
cat <<'EOF' > /root/clawd/configure.js
import fs from 'node:fs';
const path = process.env.OPENCLAW_CONFIG_PATH || '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating updated configuration (v164 - Manual Injection)...');

const config = {
    // Gateway Settings
    // [v162] Removed 'host' and 'cors' as they are unrecognized by current OpenClaw schema
    gateway: {
        port: 3001,
        mode: 'local'
    },

    // Models Configuration
    models: {
        providers: {
            google: {
                apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "",
                // [v162] Added missing required fields based on error logs
                baseUrl: "https://generativelanguage.googleapis.com/v1beta",
                // [v164] Fix schema: models must be objects, not strings. Using { name: ... }
                models: [
                    { name: "gemini-2.0-flash-exp" },
                    { name: "gemini-1.5-flash" }
                ]
            }
        }
    },

    // Agents Configuration
    agents: {
        defaults: {
            model: {
                // v159: Updated to gemini-2.0-flash-exp per user feedback
                primary: "google/gemini-2.0-flash-exp"
            }
        }
    },

    // Channels
    // [v162] Moved 'channels' OUT of 'agents' block (Fixed Syntax Logic Error)
    channels: {}
};

// 1. Developer Mode
if (process.env.OPENCLAW_DEV_MODE === 'true' && config.gateway) {
    config.gateway.controlUi = { allowInsecureAuth: true };
}

// 2. Telegram
if (process.env.TELEGRAM_BOT_TOKEN) {
    config.channels = config.channels || {};
    config.channels.telegram = {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        enabled: true,
        dmPolicy: process.env.TELEGRAM_DM_POLICY || 'pairing'
    };
}

try {
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path, JSON.stringify(config, null, 2));
    console.log('[CONFIGURE] Configuration generated successfully at ' + path);
    // Log redacted config
    const logConfig = JSON.parse(JSON.stringify(config));
    if (logConfig.models?.providers?.google?.apiKey) logConfig.models.providers.google.apiKey = "***";
    console.log('[CONFIGURE] Generated config:', JSON.stringify(logConfig, null, 2));
} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
EOF

cat <<'EOF' > /root/wrapper.js
const http = require('http');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const PROXY_PORT = 3000;
const OPENCLAW_PORT = 3001;
let openclawProcess = null;
let isOpenClawReady = false;

console.log('[WRAPPER] Starting v164 Wrapper on port ' + PROXY_PORT);

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
                '--- WRAPPER LOGS (v164) ---\n' +
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
             res.end('<h1>OpenClaw is Starting... (v163 Forced-Config)</h1><p>Please reload in a few seconds.</p><script>setTimeout(() => location.reload(), 3000);</script>');
             return;
        }
        // [v155] Return 200 even if starting, because Cloudflare Sandbox library throws error on 503
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'starting', message: 'OpenClaw is booting up (v163)...' }));
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
    console.log('[WRAPPER] --- DIAGNOSTICS v163 START ---');
    try {
        console.log('[DIAG] Check binary exists:');
        console.log(execSync('ls -l /usr/local/bin/openclaw || echo "NOT FOUND"').toString());
        
        console.log('[DIAG] Check version:');
        console.log(execSync('openclaw --version || echo "EXEC FAILED"').toString());
    } catch (e) {
        console.error('[DIAG] Diagnostic command failed:', e.message);
    }
    console.log('[WRAPPER] --- DIAGNOSTICS v163 END ---');

    console.log('[WRAPPER] Generating config...');
    
    // Run configure.js first (Using our manually injected file)
    const configProc = spawn('node', ['/root/clawd/configure.js']);
    configProc.on('close', (code) => {
        if (code !== 0) {
            console.error('[WRAPPER] Config generation failed with code', code);
            return;
        }
        console.log('[WRAPPER] Config generated. Launching openclaw (v163 captured)...');
        
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


# v161: Helper - Install Node.js v22.12.0 (Required by OpenClaw)
install_node() {
    if [ -f "/root/node-v22.12.0-linux-x64/bin/node" ]; then
        echo "[STARTUP] Node v22 already installed."
    else
        echo "[STARTUP] Installing Node.js v22.12.0..."
        curl -L -o node.tar.gz https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-x64.tar.gz
        tar -xzf node.tar.gz -C /root/
        rm node.tar.gz
        echo "[STARTUP] Node v22 installed."
    fi
    # Update PATH for this session
    export PATH="/root/node-v22.12.0-linux-x64/bin:$PATH"
    echo "[STARTUP] Current Node Version: $(node -v)"
}

install_node

echo "[STARTUP] Executing Wrapper v154..."
# v156: Redirect output to log file so /api/emergency-log can read it!
exec node /root/wrapper.js > /root/openclaw.log 2>&1

