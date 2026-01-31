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
    
    // 2. Get webhook URL
    const webhookUrl = await getWebhookUrl(validated.webhookName);
    if (!webhookUrl) {
      const webhooks = await loadWebhooks();
      const available = Object.keys(webhooks);
      if (available.length > 0) {
        return `Error: Webhook '${validated.webhookName}' not found. Available webhooks: ${available.join(', ')}. Use add_webhook to add a new one.`;
      }
      return `Error: Webhook '${validated.webhookName}' not found. No webhooks configured. Use add_webhook to add one first.`;
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
      ? `Message sent successfully to '${validated.webhookName}' webhook.`
      : `Error: Failed to send message. ${result.error}`;
  } catch (error) {
    return handleError(error);
  }
}
