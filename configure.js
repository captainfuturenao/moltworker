const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v73 - Standard OpenAI Compatible)...');

// Account Configuration
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || process.env.CF_AI_GATEWAY_ACCOUNT_ID;
const CF_GATEWAY_ID = process.env.CF_AI_GATEWAY_ID || process.env.CF_AI_GATEWAY_GATEWAY_ID;

// Construct Base URL for Cloudflare AI Gateway (OpenAI Compatible)
// Standard format: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai
let openaiBaseUrl = "https://api.openai.com/v1";
if (CF_ACCOUNT_ID && CF_GATEWAY_ID) {
    openaiBaseUrl = `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_GATEWAY_ID}/openai`;
    console.log(`[CONFIGURE] Using Cloudflare AI Gateway (OpenAI Compatible): ${openaiBaseUrl}`);
} else {
    console.warn('[CONFIGURE] WARNING: Cloudflare Account/Gateway ID missing. Falling back to OpenAI (will fail without key).');
}

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
            openai: {
                api: "openai", // Explicitly state OpenAI provider
                baseUrl: openaiBaseUrl,
                // Cloudflare Gateway authenticates via Bearer token (the CF API Key/Token)
                apiKey: process.env.CLOUDFLARE_AI_GATEWAY_API_KEY || "dummy-key",
                models: [
                    {
                        id: "gemini-2.5-flash",
                        name: "gemini-2.5-flash"
                    }
                ]
            }
        }
    },

    // Agents Configuration
    // Keep empty to avoid schema crashes. Pair and configure via Admin UI.
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
