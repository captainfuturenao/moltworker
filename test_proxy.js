
import { fetch } from 'undici';

const PROXY_URL = 'https://lf-gemini-proxy.naoki-joy.workers.dev';

async function testAnthropic() {
    console.log('Testing Anthropic compatible endpoint (/v1/messages)...');
    try {
        const res = await fetch(`${PROXY_URL}/v1/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': 'dummy',
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'gemini-1.5-pro',
                messages: [{ role: 'user', content: 'Hello from tests' }],
                max_tokens: 100
            })
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text.slice(0, 200)}...`);
        return res.ok;
    } catch (e) {
        console.error('Anthropic Error:', e.message);
        return false;
    }
}

async function testOpenAI() {
    console.log('\nTesting OpenAI compatible endpoint (/v1/chat/completions)...');
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
        console.log(`Body: ${text.slice(0, 200)}...`);
        return res.ok;
    } catch (e) {
        console.error('OpenAI Error:', e.message);
        return false;
    }
}

async function run() {
    await testAnthropic();
    await testOpenAI();
}

run();
