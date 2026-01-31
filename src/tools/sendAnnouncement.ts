/**
 * Send Announcement Tool - Send a formatted release announcement to Discord
 */

import { sendAnnouncementInputSchema } from '../types/schemas.js';
import { ResponseFormat } from '../types/enums.js';
import { DISCORD_MESSAGE_LIMIT, LIVING_LANDS_LOGO_URL } from '../constants.js';
import { getWebhookUrl, loadWebhooks } from '../utils/storage.js';
import { sendWebhookMessage } from '../utils/webhook.js';
import { buildAnnouncementEmbed, formatAnnouncement } from '../utils/embed.js';
import { handleError } from '../utils/errors.js';

export async function handleSendAnnouncement(params: unknown): Promise<string> {
  try {
    // 1. Validate input
    const validated = sendAnnouncementInputSchema.parse(params);
    
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
    
    if (validated.useEmbed) {
      // Build rich embed
      const thumbnail = validated.thumbnailUrl || LIVING_LANDS_LOGO_URL;
      
      const embed = buildAnnouncementEmbed({
        version: validated.version,
        headline: validated.headline,
        changes: validated.changes,
        downloadUrl: validated.downloadUrl,
        style: validated.style,
        betaWarning: validated.betaWarning,
        embedColor: validated.embedColor,
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
          format: 'embed',
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
        return `Embed announcement sent successfully!\n\n**Preview:**\n${preview}`;
      } else {
        return `Error: Failed to send announcement. ${result.error ?? 'Unknown error'}`;
      }
    } else {
      // Use plain text format
      const announcement = formatAnnouncement({
        version: validated.version,
        headline: validated.headline,
        changes: validated.changes,
        downloadUrl: validated.downloadUrl,
        style: validated.style,
        betaWarning: validated.betaWarning,
      });
      
      // Check Discord message limit
      if (announcement.length > DISCORD_MESSAGE_LIMIT) {
        return `Error: Announcement is too long (${announcement.length} chars). Discord limit is ${DISCORD_MESSAGE_LIMIT} characters. Reduce the number of changes or shorten descriptions.`;
      }
      
      // Send message
      const result = await sendWebhookMessage(webhookUrl, {
        content: announcement,
        username: validated.username,
      });
      
      if (validated.responseFormat === ResponseFormat.JSON) {
        return JSON.stringify({
          result,
          announcement_preview: announcement,
          character_count: announcement.length,
          format: 'plain_text',
        }, null, 2);
      }
      
      if (result.success) {
        return `Announcement sent successfully!\n\n**Preview:**\n\`\`\`\n${announcement}\n\`\`\``;
      } else {
        return `Error: Failed to send announcement. ${result.error ?? 'Unknown error'}`;
      }
    }
  } catch (error) {
    return handleError(error);
  }
}
