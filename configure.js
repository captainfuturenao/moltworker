const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIGURE] Generating deterministic configuration (v65 - Pure Array Schema)...');

// Pure Array Schema (Strict)
const config = {
    // Gateways Array
    gateways: [
        {
            id: "main",
            provider: "google",
            model: "gemini-2.5-flash",
            // Explicitly inject key
            apiKey: process.env.GOOGLE_API_KEY || process.env.CLOUDFLARE_AI_GATEWAY_API_KEY,
            params: {
                temperature: 0.7,
                contextWindow: 16384,
                maxTokens: 8192
            }
        }
    ],

    // Agents Array
    agents: [
        {
            id: "main",
            name: "Moltbot",
            role: "You are a helpful AI assistant. You must respond in Japanese. 日本語で応答してください。",
            gateway: "main"
        }
    ]
};

// Optional: Channels (If supported in Array schema context, usually top-level object is fine if keys don't conflict)
// But to be safe and "Pure", we will inject channels only if we are sure of the structure.
// v62 mixed 'channels: {}' (Object).
// Let's assume 'channels' is still an object map at root, even with arrays for core types.
config.channels = {};

// 3. Telegram Channel
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
