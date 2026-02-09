const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIG PATCH] Starting configuration patch...');

try {
    let conf = {};
    try {
        if (fs.existsSync(path)) {
            conf = JSON.parse(fs.readFileSync(path, 'utf8'));
            console.log('[CONFIG PATCH] Loaded existing config.');
        } else {
            console.log('[CONFIG PATCH] No existing config found, creating new.');
        }
    } catch (e) {
        console.error('[CONFIG PATCH] Error reading config:', e.message);
        conf = {};
    }

    // Ensure structure exists
    conf.models = conf.models || {};
    conf.models.providers = conf.models.providers || {};
    conf.agents = conf.agents || {};
    conf.agents.defaults = conf.agents.defaults || {};

    // 1. Force Google Provider (if API Key exists)
    // Check for GOOGLE_API_KEY or CLOUDFLARE_AI_GATEWAY_API_KEY (from user manual)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.CLOUDFLARE_AI_GATEWAY_API_KEY;

    if (apiKey) {
        console.log('[CONFIG PATCH] Injecting Google provider...');
        conf.models.providers.google = {
            provider: 'google',
            apiKey: apiKey
        };

        // 2. Force Gemini 2.5 Flash Model with Limits
        console.log('[CONFIG PATCH] Setting default model to Gemini 2.5 Flash (2048 context)...');
        conf.agents.defaults.model = {
            primary: 'gemini-2.5-flash',
            provider: 'google',
            params: {
                temperature: 0.7,
                contextWindow: 2048, // Strict limit for 128MB container
                maxTokens: 2048
            }
        };
    } else {
        console.warn('[CONFIG PATCH] SKIPPED: No API Key found (GOOGLE_API_KEY or CLOUDFLARE_AI_GATEWAY_API_KEY).');
    }

    // Write back
    fs.writeFileSync(path, JSON.stringify(conf, null, 2));
    console.log('[CONFIG PATCH] Configuration patched successfully.');

} catch (e) {
    console.error('[CONFIG PATCH] Fatal error:', e);
    process.exit(1);
}
