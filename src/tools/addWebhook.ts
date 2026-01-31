/**
 * Add Webhook Tool - Add or update a Discord webhook configuration
 */

import { addWebhookInputSchema } from '../types/schemas.js';
import { loadWebhooks, saveWebhooks } from '../utils/storage.js';

export async function handleAddWebhook(params: unknown): Promise<string> {
  try {
    // 1. Validate input
    const validated = addWebhookInputSchema.parse(params);
    
    // 2. Load existing webhooks
    const webhooks = await loadWebhooks();
    
    const isUpdate = validated.name in webhooks;
    
    // 3. Save webhook
    webhooks[validated.name] = {
      url: validated.url,
      description: validated.description,
      added_at: new Date().toISOString(),
    };
    
    await saveWebhooks(webhooks);
    
    const action = isUpdate ? 'updated' : 'added';
    return `Webhook '${validated.name}' ${action} successfully. You can now use it with send_message, send_announcement, or send_teaser.`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to save webhook configuration: ${error.message}`;
    }
    return `Error: Failed to save webhook configuration: ${String(error)}`;
  }
}
