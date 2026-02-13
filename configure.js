import fs from 'node:fs';
const path = process.env.OPENCLAW_CONFIG_PATH || '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v132 - World Standard Model Alias)...');

const config = {
    // Gateway Settings (Singular as per research)
    gateway: {
        port: 3001,
        host: "0.0.0.0",
        mode: 'local',
        cors: {
            enabled: true,
            origin: ["*"]
        }
    },

    // Models Configuration (Native Provider Format)
    models: {
        providers: {
            google: {
                apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || ""
            }
        }
    },

    // Agents Configuration (Latest Official Schema: defaults.model.primary)
    agents: {
        defaults: {
            model: {
                model: {
                    // v159: Updated to gemini-2.0-flash-exp per user feedback
                    primary: "google/gemini-2.0-flash-exp"
                }
            }
        },

        // Channels
        channels: {}
    };

    // 1. Developer Mode
    if(process.env.OPENCLAW_DEV_MODE === 'true' && config.gateway) {
        config.gateway.controlUi = { allowInsecureAuth: true };
}

// 2. Telegram
if (process.env.TELEGRAM_BOT_TOKEN) {
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
