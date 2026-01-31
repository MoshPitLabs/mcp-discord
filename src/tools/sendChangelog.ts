/**
 * Send Changelog Tool - Send a structured changelog post to Discord
 */

import { sendChangelogInputSchema } from '../types/schemas.js';
import { ResponseFormat } from '../types/enums.js';
import { DISCORD_MESSAGE_LIMIT, LIVING_LANDS_LOGO_URL } from '../constants.js';
import { getWebhookUrl, loadWebhooks } from '../utils/storage.js';
import { sendWebhookMessage } from '../utils/webhook.js';
import { buildChangelogEmbed, formatChangelog } from '../utils/embed.js';
import { handleError } from '../utils/errors.js';

export async function handleSendChangelog(params: unknown): Promise<string> {
  try {
    const validated = sendChangelogInputSchema.parse(params);

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
      const thumbnail = validated.thumbnailUrl || LIVING_LANDS_LOGO_URL;
      const embed = buildChangelogEmbed({
        title: validated.title,
        sections: validated.sections,
        version: validated.version,
        summary: validated.summary,
        url: validated.url,
        style: validated.style,
        embedColor: validated.embedColor,
        thumbnailUrl: thumbnail,
        footerText: validated.footerText,
      });

      const result = await sendWebhookMessage(webhookUrl, {
        embeds: [embed],
        username: validated.username,
      });

      if (validated.responseFormat === ResponseFormat.JSON) {
        return JSON.stringify({ result, embed, format: 'changelog_embed' }, null, 2);
      }

      if (result.success) {
        return `Changelog sent successfully!`;
      }
      return `Error: Failed to send changelog. ${result.error ?? 'Unknown error'}`;
    }

    const message = formatChangelog({
      title: validated.title,
      sections: validated.sections,
      version: validated.version,
      summary: validated.summary,
      url: validated.url,
    });

    if (message.length > DISCORD_MESSAGE_LIMIT) {
      return `Error: Changelog is too long (${message.length} chars). Discord limit is ${DISCORD_MESSAGE_LIMIT} characters. Reduce sections/items or shorten text.`;
    }

    const result = await sendWebhookMessage(webhookUrl, {
      content: message,
      username: validated.username,
    });

    if (validated.responseFormat === ResponseFormat.JSON) {
      return JSON.stringify(
        {
          result,
          changelog_preview: message,
          character_count: message.length,
          format: 'plain_text',
        },
        null,
        2
      );
    }

    return result.success
      ? `Changelog sent successfully!\n\n**Preview:**\n\`\`\`\n${message}\n\`\`\``
      : `Error: Failed to send changelog. ${result.error ?? 'Unknown error'}`;
  } catch (error) {
    return handleError(error);
  }
}
