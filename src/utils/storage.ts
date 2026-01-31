/**
 * Webhook storage management using JSON files
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { CONFIG_DIR, WEBHOOKS_FILE } from '../constants.js';
import type { WebhookStorage } from '../types/interfaces.js';

export async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadWebhooks(): Promise<WebhookStorage> {
  await ensureConfigDir();
  
  if (!existsSync(WEBHOOKS_FILE)) {
    return {};
  }
  
  try {
    const content = await readFile(WEBHOOKS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load webhooks:', error);
    return {};
  }
}

export async function saveWebhooks(webhooks: WebhookStorage): Promise<void> {
  await ensureConfigDir();
  await writeFile(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2), 'utf-8');
}

export async function getWebhookUrl(name: string): Promise<string | null> {
  const webhooks = await loadWebhooks();
  const webhook = webhooks[name.toLowerCase()];
  return webhook?.url ?? null;
}
