const fs = require('fs');
const path = '/root/.openclaw/openclaw.json';

console.log('[CONFIG PATCH] Starting configuration patch...');
console.log('[CONFIG PATCH] Version: v48 (Timestamp: ' + new Date().toISOString() + ')');

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
    // Aggressively clear other providers to prevent "ANTHROPIC_API_KEY missing" errors
    conf.models.providers = {};
    conf.agents = conf.agents || {};
    conf.agents.defaults = conf.agents.defaults || {};

    // 1. Force Google Provider (if API Key exists)
    // Check for GOOGLE_API_KEY or CLOUDFLARE_AI_GATEWAY_API_KEY (from user manual)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.CLOUDFLARE_AI_GATEWAY_API_KEY;

    if (apiKey) {
        // REMOVED manual provider injection to fallback to OpenClaw defaults.
        // This avoids the "api: undefined" or "api: invalid" crash.
        // OpenClaw automatically uses GOOGLE_API_KEY.

        // Set default model
        console.log('[CONFIG PATCH] Setting default model to Gemini 2.0 Flash (Generic ID)...');
        conf.agents.defaults.model = {
            primary: 'google/gemini-2.0-flash'
        };

        // Force Japanese System Prompt - REMOVED due to "Unrecognized key" crash
        // conf.agents.defaults.instructions = ...
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
