/**
 * Send Teaser Tool - Send a teaser/preview announcement to Discord
 */

import { sendTeaserInputSchema } from '../types/schemas.js';
import { ResponseFormat } from '../types/enums.js';
import { LIVING_LANDS_LOGO_URL } from '../constants.js';
import { getWebhookUrl, loadWebhooks } from '../utils/storage.js';
import { sendWebhookMessage } from '../utils/webhook.js';
import { buildTeaserEmbed } from '../utils/embed.js';
import { handleError } from '../utils/errors.js';

export async function handleSendTeaser(params: unknown): Promise<string> {
  try {
    // 1. Validate input
    const validated = sendTeaserInputSchema.parse(params);
    
    // 2. Get webhook URL
    const webhookUrl = await getWebhookUrl(validated.webhookName);
    if (!webhookUrl) {
      const webhooks = await loadWebhooks();
      const available = Object.keys(webhooks);
      if (available.length > 0) {
        return `Error: Webhook '${validated.webhookName}' not found. Available webhooks: ${available.join(', ')}`;
      }
      return `Error: Webhook '${validated.webhookName}' not found. No webhooks configured. Use add_webhook first.`;
    }
    
    // Use Living Lands logo as thumbnail if no custom thumbnail provided
    const thumbnail = validated.thumbnailUrl || LIVING_LANDS_LOGO_URL;
    
    // Build teaser embed
    const embed = buildTeaserEmbed({
      version: validated.version,
      headline: validated.headline,
      highlights: validated.highlights,
      additionalInfo: validated.additionalInfo,
      style: validated.style,
      thumbnailUrl: thumbnail,
      footerText: validated.footerText,
    });
    
    // Send with embed
    const result = await sendWebhookMessage(webhookUrl, {
      embeds: [embed],
      username: validated.username,
    });
    
    if (validated.responseFormat === ResponseFormat.JSON) {
      return JSON.stringify({
        result,
        embed,
        format: 'teaser_embed',
      }, null, 2);
    }
    
    if (result.success) {
      // Build preview text
      const previewLines = [
        `**${embed.title}**`,
        embed.description,
        '',
      ];
      
      for (const field of embed.fields ?? []) {
        previewLines.push(`**${field.name}**`);
        previewLines.push(field.value);
        previewLines.push('');
      }
      
      const preview = previewLines.join('\n');
      return `Teaser announcement sent successfully!\n\n**Preview:**\n${preview}`;
    } else {
      return `Error: Failed to send teaser. ${result.error ?? 'Unknown error'}`;
    }
  } catch (error) {
    return handleError(error);
  }
}
