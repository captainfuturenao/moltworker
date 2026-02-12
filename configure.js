import fs from 'node:fs';
// const path = '/root/.openclaw/openclaw.json';
// Use process.env.OPENCLAW_CONFIG_PATH or default
const path = process.env.OPENCLAW_CONFIG_PATH || '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v128 - Stability Fix)...');

const config = {
    // Server Settings
    server: {
        port: 3000,
        host: "0.0.0.0",
        cors: {
            enabled: true,
            origin: ["*"]
        }
    },

    // Gateways Configuration (Array)
    gateways: [
        {
            id: "main",
            provider: "google",
            model: "gemini-2.0-flash",
            apiKey: process.env.GOOGLE_API_KEY || "",
            params: {
                temperature: 0.7,
                contextWindow: 16384,
                maxTokens: 4096
            }
        }
    ],

    // Agents Configuration (Object - v68 Success Pattern)
    agents: {},

    // Channels (kept as object if supported, otherwise empty for now)
    channels: {}
};

// 1. Gateway Authentication (Optional)
if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    // If the binary supports auth in the gateway array, we might need to add it there.
    // For now, keeping it simple to get it running.
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
} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
