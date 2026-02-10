const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v76 - User Compliant / Google Direct)...');

const config = {
    // Server Settings
    gateway: {
        port: 18789,
        mode: 'local',
        trustedProxies: ['10.1.0.0'],
        auth: {}
    },

    // Models Configuration
    models: {
        providers: {
            google: {
                api: "google-generative-ai",
                baseUrl: "https://generativelanguage.googleapis.com",

                // Direct Google Connection.
                // Requires GOOGLE_API_KEY in environment variables.
                apiKey: process.env.GOOGLE_API_KEY || "",

                models: [
                    // USER REQUESTED MODELS ONLY
                    {
                        id: "gemini-2.5-flash",
                        name: "gemini-2.5-flash"
                    },
                    // Technical fallback/preview (Gemini 2.0) if 2.5 is a typo/unavailable
                    {
                        id: "gemini-2.0-flash-exp",
                        name: "gemini-2.0-flash-exp"
                    }
                ]
            }
        }
    },

    // Agents Configuration
    agents: {},

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
} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
