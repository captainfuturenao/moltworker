const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v66 - Single Agent Object Schema)...');

const config = {
    // Server / Network Settings
    gateway: {
        port: 18789,
        mode: 'local',
        trustedProxies: ['10.1.0.0'],
        auth: {}
    },

    // Models / Providers (Replaces 'gateways' array)
    // Matches User Guide "models.providers" structure
    models: {
        providers: {
            google: {
                // Ensure the provider knows about 2.5 if not built-in
                baseUrl: "https://generativelanguage.googleapis.com", // Optional, standard endpoint
                apiKey: process.env.GOOGLE_API_KEY || process.env.CLOUDFLARE_AI_GATEWAY_API_KEY,
                // Default search model? 
            }
        }
    },

    // Agents Configuration
    // Hypothesis: 'agents' is a configuration object, not a map.
    // We define the primary agent properties directly here?
    // OR, if it supports multiple, maybe it needs a 'list' key.
    // But 'Unrecognized key "main"' suggests strictly defined keys.
    // Let's try defining standard agent props directly.
    agents: {
        name: "Moltbot",
        role: "You are a helpful AI assistant. You must respond in Japanese. 日本語で応答してください。",
        model: "google/gemini-2.5-flash"
    },

    channels: {}
};

// 1. Gateway Authentication
if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    config.gateway.auth.token = process.env.OPENCLAW_GATEWAY_TOKEN;
}

// 2. Developer Mode
if (process.env.OPENCLAW_DEV_MODE === 'true') {
    config.gateway.controlUi = { allowInsecureAuth: true };
}

// 3. Telegram
if (process.env.TELEGRAM_BOT_TOKEN) {
    config.channels.telegram = {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        enabled: true,
        dmPolicy: process.env.TELEGRAM_DM_POLICY || 'pairing'
    };
    if (config.channels.telegram.dmPolicy === 'open') {
        config.channels.telegram.allowFrom = ['*'];
    }
}

try {
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path, JSON.stringify(config, null, 2));
    console.log('[CONFIGURE] Configuration generated successfully at ' + path);
    console.log(JSON.stringify(config, null, 2));
} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
