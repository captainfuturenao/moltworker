import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { MOLTBOT_PORT } from '../config';
import { findExistingMoltbotProcess } from '../gateway';

/**
 * Public routes - NO Cloudflare Access authentication required
 *
 * These routes are mounted BEFORE the auth middleware is applied.
 * Includes: health checks, static assets, and public API endpoints.
 */
const publicRoutes = new Hono<AppEnv>();

// GET /sandbox-health - Health check endpoint
publicRoutes.get('/sandbox-health', (c) => {
  return c.json({
    status: 'ok',
    service: 'moltbot-sandbox',
    gateway_port: MOLTBOT_PORT,
  });
});

// GET /logo.png - Serve logo from ASSETS binding
publicRoutes.get('/logo.png', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// GET /logo-small.png - Serve small logo from ASSETS binding
publicRoutes.get('/logo-small.png', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// GET /api/status - Public health check for gateway status (no auth required)
publicRoutes.get('/api/status', async (c) => {
  const sandbox = c.get('sandbox');

  try {
    const process = await findExistingMoltbotProcess(sandbox);
    if (!process) {
      return c.json({ ok: false, status: 'not_running' });
    }

    // Process exists, check if it's actually responding
    // Try to reach the gateway with a short timeout
    try {
      await process.waitForPort(MOLTBOT_PORT, { mode: 'tcp', timeout: 5000 });
      return c.json({ ok: true, status: 'running', processId: process.id });
    } catch {
      return c.json({ ok: false, status: 'not_responding', processId: process.id });
    }
  } catch (err) {
    return c.json({
      ok: false,
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// GET /_admin/assets/* - Admin UI static assets (CSS, JS need to load for login redirect)
// Assets are built to dist/client with base "/_admin/"
publicRoutes.get('/_admin/assets/*', async (c) => {
  const url = new URL(c.req.url);
  // Rewrite /_admin/assets/* to /assets/* for the ASSETS binding
  const assetPath = url.pathname.replace('/_admin/assets/', '/assets/');
  const assetUrl = new URL(assetPath, url.origin);
  return c.env.ASSETS.fetch(new Request(assetUrl.toString(), c.req.raw));
});

// Temporary diagnostic endpoint for API Key
publicRoutes.get('/api/debug-google-key', async (c) => {
  const key = c.env.GOOGLE_API_KEY;
  if (!key) return c.json({ error: 'No GOOGLE_API_KEY configured' }, 500);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });

    const data = await response.json();
    return c.json({
      status: response.status,
      ok: response.ok,
      data: data
    });
  } catch (e: any) {
    return c.json({ error: e.message, stack: e.stack }, 500);
  }
});

// GET /api/debug-logs - Public diagnostic for all container logs
publicRoutes.get('/api/debug-logs', async (c) => {
  const sandbox = c.get('sandbox');
  try {
    const processes = await sandbox.listProcesses();
    const results = [];
    for (const p of processes) {
      const logs = await p.getLogs();
      results.push({
        id: p.id,
        command: p.command,
        status: p.status,
        logs
      });
    }
    return c.json({ ok: true, processLogs: results });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message });
  }
});

// GET /api/emergency-log - Unauthenticated access to openclaw.log (Temporary Debug)
// GET /api/emergency-log - Unauthenticated access to openclaw.log (Temporary Debug)
publicRoutes.get('/api/emergency-log', async (c) => {
  const sandbox = c.get('sandbox');
  try {
    const logResult = await sandbox.exec('cat /root/openclaw.log').catch((e: Error) => ({ stdout: '', stderr: e.message }));
    const psResult = await sandbox.exec('ps aux').catch((e: Error) => ({ stdout: '', stderr: e.message }));

    return c.text(
      'STDOUT:\n' + (logResult?.stdout || '(empty)') +
      '\n\nSTDERR:\n' + (logResult?.stderr || '(empty)') +
      '\n\n--- PROCESS CHECK ---\n' + (psResult?.stdout || psResult?.stderr || '(failed)')
    );
  } catch (e: any) {
    return c.text('Error inside emergency-log: ' + e.message, 500);
  }
});

export { publicRoutes };
