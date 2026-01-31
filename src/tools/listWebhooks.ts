/**
 * List Webhooks Tool - List all configured Discord webhooks
 */

import { listWebhooksInputSchema } from '../types/schemas.js';
import { ResponseFormat } from '../types/enums.js';
import { loadWebhooks } from '../utils/storage.js';

export async function handleListWebhooks(params: unknown): Promise<string> {
  try {
    // 1. Validate input
    const validated = listWebhooksInputSchema.parse(params);
    
    // 2. Load webhooks
    const webhooks = await loadWebhooks();
    
    if (Object.keys(webhooks).length === 0) {
      return 'No webhooks configured. Use add_webhook to add one.';
    }
    
    if (validated.responseFormat === ResponseFormat.JSON) {
      // Return sanitized data (hide full URLs)
      const sanitized: Record<string, unknown> = {};
      for (const [name, config] of Object.entries(webhooks)) {
        const url = config.url || '';
        // Show only last 8 chars of webhook URL for identification
        const urlHint = url.length > 8 ? `...${url.slice(-8)}` : url;
        sanitized[name] = {
          description: config.description,
          url_hint: urlHint,
          added_at: config.added_at,
        };
      }
      return JSON.stringify(sanitized, null, 2);
    }
    
    // Markdown format
    const lines = ['# Configured Discord Webhooks', ''];
    for (const [name, config] of Object.entries(webhooks)) {
      const url = config.url || '';
      const urlHint = url.length > 8 ? `...${url.slice(-8)}` : url;
      const desc = config.description || 'No description';
      const added = config.added_at || 'Unknown';
      
      lines.push(`## ${name}`);
      lines.push(`- **Description**: ${desc}`);
      lines.push(`- **URL hint**: \`${urlHint}\``);
      lines.push(`- **Added**: ${added}`);
      lines.push('');
    }
    
    return lines.join('\n');
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to list webhooks: ${error.message}`;
    }
    return `Error: Failed to list webhooks: ${String(error)}`;
  }
}
