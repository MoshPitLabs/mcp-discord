/**
 * Remove Webhook Tool - Remove a Discord webhook configuration
 */

import { removeWebhookInputSchema } from '../types/schemas.js';
import { loadWebhooks, saveWebhooks } from '../utils/storage.js';

export async function handleRemoveWebhook(params: unknown): Promise<string> {
  try {
    // 1. Validate input
    const validated = removeWebhookInputSchema.parse(params);
    
    // 2. Load webhooks
    const webhooks = await loadWebhooks();
    
    const nameLower = validated.name.toLowerCase();
    if (!(nameLower in webhooks)) {
      const available = Object.keys(webhooks);
      if (available.length > 0) {
        return `Error: Webhook '${validated.name}' not found. Available webhooks: ${available.join(', ')}`;
      }
      return `Error: Webhook '${validated.name}' not found. No webhooks configured.`;
    }
    
    // 3. Remove webhook
    delete webhooks[nameLower];
    await saveWebhooks(webhooks);
    
    return `Webhook '${validated.name}' removed successfully.`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to remove webhook: ${error.message}`;
    }
    return `Error: Failed to remove webhook: ${String(error)}`;
  }
}
