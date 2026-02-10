const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v70 - CF Gateway Fix & Gemini 2.5 Only)...');

// Account Configuration
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || process.env.CF_AI_GATEWAY_ACCOUNT_ID;
const CF_GATEWAY_ID = process.env.CF_AI_GATEWAY_ID || process.env.CF_AI_GATEWAY_GATEWAY_ID;

// Construct Base URL for Cloudflare AI Gateway
// If IDs are missing, fallback to Google (but this will fail with CF Key, so we log a warning)
let googleBaseUrl = "https://generativelanguage.googleapis.com";
if (CF_ACCOUNT_ID && CF_GATEWAY_ID) {
    googleBaseUrl = `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_GATEWAY_ID}/google`;
    console.log(`[CONFIGURE] Using Cloudflare AI Gateway: ${googleBaseUrl}`);
} else {
    console.warn('[CONFIGURE] WARNING: Cloudflare Account/Gateway ID missing. Using direct Google URL (Auth may fail with CF Key).');
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
            // Option 1: Google Provider (Previous attempt, might fail auth/path)
            google: {
                baseUrl: googleBaseUrl,
                apiKey: process.env.GOOGLE_API_KEY || process.env.CLOUDFLARE_AI_GATEWAY_API_KEY,
                models: [
                    {
                        id: "gemini-2.5-flash",
                        name: "gemini-2.5-flash (Google)"
                    }
                ]
            },

            // Option 2: OpenAI Compatible (v71 - Recommended for Cloudflare Gateway)
            // Uses the OpenAI-compatible endpoint of Cloudflare Gateway.
            // This often bypasses strict provider-specific key validation.
            openai: {
                baseUrl: (CF_ACCOUNT_ID && CF_GATEWAY_ID)
                    ? `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_GATEWAY_ID}/openai`
                    : "https://api.openai.com/v1",
                apiKey: process.env.CLOUDFLARE_AI_GATEWAY_API_KEY || "dummy-key",
                models: [
                    {
                        id: "gemini-2.5-flash",
                        name: "gemini-2.5-flash (via OpenAI/CF)"
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
    // console.log(JSON.stringify(config, null, 2)); // Reduce log noise
} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
