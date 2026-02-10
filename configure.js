const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v64 - Canonical / Object Schema / Gemini 2.5)...');
console.log('[CONFIGURE] Env Check: GOOGLE_API_KEY=' + (process.env.GOOGLE_API_KEY ? 'YES' : 'NO') +
    ', CF_AI_GATEWAY_API_KEY=' + (process.env.CLOUDFLARE_AI_GATEWAY_API_KEY ? 'YES' : 'NO'));

// Base Configuration Structure
const config = {
    gateway: {
        port: 18789,
        mode: 'local',
        trustedProxies: ['10.1.0.0'], // Required for Cloudflare Sandbox networking
        auth: {}
    },
    channels: {},

    // Object Schema (v60 style) - REQUIRED by openclaw@latest (v2026.2.9)
    agents: {
        defaults: {
            model: {
                primary: 'google/gemini-2.5-flash'
            }
        },
        main: {
            name: "Moltbot",
            role: "You are a helpful AI assistant. You must respond in Japanese. 日本語で応答してください。",
            model: "google/gemini-2.5-flash"
        }
    }
};

// 1. Gateway Authentication
if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    config.gateway.auth.token = process.env.OPENCLAW_GATEWAY_TOKEN;
}

// 2. Developer Mode (Insecure UI)
if (process.env.OPENCLAW_DEV_MODE === 'true') {
    config.gateway.controlUi = { allowInsecureAuth: true };
}

// 3. Telegram Channel
if (process.env.TELEGRAM_BOT_TOKEN) {
    config.channels.telegram = {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        enabled: true,
        dmPolicy: process.env.TELEGRAM_DM_POLICY || 'pairing'
    };
    if (config.channels.telegram.dmPolicy === 'open') {
        config.channels.telegram.allowFrom = ['*'];
    } else if (process.env.TELEGRAM_DM_ALLOW_FROM) {
        config.channels.telegram.allowFrom = process.env.TELEGRAM_DM_ALLOW_FROM.split(',');
    }
}

// Write Configuration to Disk
try {
    // Ensure directory exists
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path, JSON.stringify(config, null, 2));
    console.log('[CONFIGURE] Configuration generated successfully at ' + path);
    // Log content for debugging
    console.log(JSON.stringify(config, null, 2));

} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
