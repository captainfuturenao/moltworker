
import { fetch } from 'undici';
const PROXY_URL = 'https://lf-gemini-proxy.naoki-joy.workers.dev';

async function testOpenAI() {
    console.log('Testing OpenAI compatible endpoint (/v1/chat/completions)...');
    try {
        const res = await fetch(`${PROXY_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer dummy',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gemini-1.5-pro',
                messages: [{ role: 'user', content: 'Hello from tests' }]
            })
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text.slice(0, 200)}`);
    } catch (e) {
        console.error('OpenAI Error:', e.message);
    }
}

testOpenAI();
