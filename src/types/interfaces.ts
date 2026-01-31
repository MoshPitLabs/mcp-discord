/**
 * TypeScript interfaces for Discord MCP Server
 */

import { z } from 'zod';
import * as schemas from './schemas.js';

// Infer TypeScript types from Zod schemas
export type WebhookConfig = z.infer<typeof schemas.webhookConfigSchema>;
export type SendMessageInput = z.infer<typeof schemas.sendMessageInputSchema>;
export type SendAnnouncementInput = z.infer<typeof schemas.sendAnnouncementInputSchema>;
export type SendTeaserInput = z.infer<typeof schemas.sendTeaserInputSchema>;
export type AddWebhookInput = z.infer<typeof schemas.addWebhookInputSchema>;
export type RemoveWebhookInput = z.infer<typeof schemas.removeWebhookInputSchema>;
export type ListWebhooksInput = z.infer<typeof schemas.listWebhooksInputSchema>;

// Discord API types
export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  fields?: DiscordEmbedField[];
  thumbnail?: { url: string };
  footer?: { text: string };
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface WebhookMessagePayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  error?: string;
  response?: unknown;
}

export interface WebhookStorage {
  [name: string]: {
    url: string;
    description?: string;
    added_at: string;  // snake_case for Python compatibility
  };
}
