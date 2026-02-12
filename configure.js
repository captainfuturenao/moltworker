import fs from 'node:fs';
// const path = '/root/.openclaw/openclaw.json';
// Use process.env.OPENCLAW_CONFIG_PATH or default
const path = process.env.OPENCLAW_CONFIG_PATH || '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v129 - Native Schema Fix)...');

const config = {
    // Server Settings
    gateway: {
        port: 3000,
        host: "0.0.0.0",
        mode: 'local',
        cors: {
            enabled: true,
            origin: ["*"]
        }
    },

    // Models Configuration (Object - v68 Success Pattern)
    models: {
        providers: {
            google: {
                baseUrl: "https://generativelanguage.googleapis.com",
                apiKey: process.env.GOOGLE_API_KEY || "",
                models: [
                    {
                        id: "gemini-2.0-flash",
                        name: "gemini-2.0-flash"
                    }
                ]
            }
        }
    },

    // Agents Configuration (Object - v68 Success Pattern)
    agents: {},

    // Channels
    channels: {}
};

// 1. Gateway Authentication (Optional)
// ...

// 2. Developer Mode
if (process.env.OPENCLAW_DEV_MODE === 'true' && config.gateway) {
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
