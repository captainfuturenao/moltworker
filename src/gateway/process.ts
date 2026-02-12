import type { Sandbox, Process } from '@cloudflare/sandbox';
import type { MoltbotEnv } from '../types';
import { MOLTBOT_PORT } from '../config';
import { mountR2Storage } from './r2';

/**
 * Find an existing OpenClaw gateway process
 *
 * @param sandbox - The sandbox instance
 * @returns The process if found and running, null otherwise
 */
export async function findExistingMoltbotProcess(sandbox: Sandbox): Promise<Process | null> {
  try {
    const processes = await sandbox.listProcesses();
    return processes.find((p) => p.command.toLowerCase().includes('openclaw') && p.status === 'running') || null;
  } catch (error: any) {
    console.warn('[SANDBOX] listProcesses failed, assuming start is needed:', error.message);
    return null;
  }
}

/**
 * Ensure the OpenClaw gateway is running
 *
 * This will:
 * 1. Mount R2 storage if configured
 * 2. Explicitly start the sandbox container (exclusive start to avoid race conditions)
 * 3. Check for an existing gateway process
 * 4. Start a new one if necessary and wait for port 3000
 *
 * @param sandbox - The sandbox instance
 * @param env - Worker environment bindings
 * @returns The running gateway process
 */
export async function ensureMoltbotGateway(sandbox: Sandbox, env: MoltbotEnv): Promise<Process> {
  // Mount R2 storage for persistent data
  await mountR2Storage(sandbox, env);

  // 1. CRITICAL: Start the container first.
  // We use start() because it handles ports and is idempotent in its own way.
  // By doing this before findExistingMoltbotProcess, we avoid "The container is not running" errors.
  try {
    console.log('[SANDBOX] Ensuring container is started via sandbox.start()...');
    await sandbox.start();
  } catch (err: any) {
    if (err?.message?.includes('already running')) {
      console.log('[SANDBOX] Container already running.');
    } else {
      console.warn('[SANDBOX] Optional start() warning:', err.message);
    }
  }

  // 2. Now check for the process
  let existingProcess = await findExistingMoltbotProcess(sandbox);

  if (!existingProcess) {
    console.log('[SANDBOX] No gateway process found. Starting with /root/clawd/start-openclaw.sh...');
    // Absolute path and explicit shell to avoid path/permission issues
    existingProcess = await sandbox.startProcess('/root/clawd/start-openclaw.sh');
  }

  // 3. Wait for port 3000 to be ready inside the container
  console.log('[SANDBOX] Waiting for port 3000 to be ready...');
  await sandbox.waitForPort(MOLTBOT_PORT);

  return existingProcess;
}
