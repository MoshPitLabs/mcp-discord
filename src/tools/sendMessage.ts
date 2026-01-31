/**
 * Send Message Tool - Send a plain text message to Discord
 */

import { sendMessageInputSchema } from '../types/schemas.js';
import { ResponseFormat } from '../types/enums.js';
import { getWebhookUrl, loadWebhooks } from '../utils/storage.js';
import { sendWebhookMessage } from '../utils/webhook.js';
import { handleError } from '../utils/errors.js';

export async function handleSendMessage(params: unknown): Promise<string> {
  try {
    // 1. Validate input
    const validated = sendMessageInputSchema.parse(params);
    const webhookName = 'messages';
    
    // 2. Get webhook URL
    const webhookUrl = await getWebhookUrl(webhookName);
    if (!webhookUrl) {
      const webhooks = await loadWebhooks();
      const available = Object.keys(webhooks);
      if (available.length > 0) {
        return `Error: Webhook '${webhookName}' not found. Available webhooks: ${available.join(', ')}. Use discord_add_webhook to add a webhook named '${webhookName}'.`;
      }
      return `Error: Webhook '${webhookName}' not found. No webhooks configured. Use discord_add_webhook to add a webhook named '${webhookName}'.`;
    }
    
    // 3. Send message
    const result = await sendWebhookMessage(webhookUrl, {
      content: validated.content,
      username: validated.username,
      avatar_url: validated.avatarUrl,
    });
    
    // 4. Format response
    if (validated.responseFormat === ResponseFormat.JSON) {
      return JSON.stringify(result, null, 2);
    }
    
    return result.success
      ? `Message sent successfully to '${webhookName}' webhook.`
      : `Error: Failed to send message. ${result.error}`;
  } catch (error) {
    return handleError(error);
  }
}
