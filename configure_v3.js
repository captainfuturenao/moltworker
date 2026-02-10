const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v56 - Object Schema / Stable Model)...');
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
    // Object Schema (v53 style) - Known to start successfully
    models: {
        providers: {
            google: {
                // Explicitly inject key
                apiKey: process.env.GOOGLE_API_KEY || process.env.CLOUDFLARE_AI_GATEWAY_API_KEY
            }
        }
    },
    agents: {
        defaults: {
            model: {
                primary: 'google/gemini-1.5-flash' // Fallback to 1.5 Flash for stability checks
            }
        },
        main: {
            name: "Moltbot",
            role: "You are a helpful AI assistant. You must respond in Japanese. 日本語で応答してください。",
            model: "google/gemini-1.5-flash"
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
    // Handle 'open' policy allowing all users
    if (config.channels.telegram.dmPolicy === 'open') {
        config.channels.telegram.allowFrom = ['*'];
    } else if (process.env.TELEGRAM_DM_ALLOW_FROM) {
        config.channels.telegram.allowFrom = process.env.TELEGRAM_DM_ALLOW_FROM.split(',');
    }
}

// 4. Discord Channel
if (process.env.DISCORD_BOT_TOKEN) {
    config.channels.discord = {
        token: process.env.DISCORD_BOT_TOKEN,
        enabled: true,
        dm: {
            policy: process.env.DISCORD_DM_POLICY || 'pairing'
        }
    };
    if (config.channels.discord.dm.policy === 'open') {
        config.channels.discord.dm.allowFrom = ['*'];
    }
}

// 5. Slack Channel
if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
    config.channels.slack = {
        botToken: process.env.SLACK_BOT_TOKEN,
        appToken: process.env.SLACK_APP_TOKEN,
        enabled: true
    };
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
    // Log content for debugging (secrets redacted in production logs typically, but env vars are visible anyway)
    console.log(JSON.stringify(config, null, 2));

} catch (e) {
    console.error('[CONFIGURE] CRITICAL ERROR writing config:', e);
    process.exit(1);
}
