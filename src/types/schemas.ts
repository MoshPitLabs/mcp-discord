/**
 * Zod validation schemas for Discord MCP Server
 * These schemas match the Python Pydantic models exactly
 */

import { z } from 'zod';
import { ResponseFormat, AnnouncementStyle } from './enums.js';

// Webhook URL validator
const webhookUrlSchema = z.string()
  .min(50)
  .max(300)
  .refine(
    (url) => url.startsWith('https://discord.com/api/webhooks/') || 
             url.startsWith('https://discordapp.com/api/webhooks/'),
    { message: 'Invalid Discord webhook URL. Must start with \'https://discord.com/api/webhooks/\' or \'https://discordapp.com/api/webhooks/\'' }
  );

// Webhook Configuration
export const webhookConfigSchema = z.object({
  name: z.string().min(1).max(50),
  url: webhookUrlSchema,
  description: z.string().max(200).optional(),
  added_at: z.string().datetime(),  // snake_case for Python compatibility
});

// Tool Input Schemas
export const sendMessageInputSchema = z.object({
  content: z.string().min(1).max(2000),
  username: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional(),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
});

export const sendAnnouncementInputSchema = z.object({
  version: z.string().min(1).max(30),
  headline: z.string().min(1).max(256),
  changes: z.array(z.string()).min(1).max(10),
  downloadUrl: z.string().url().optional(),
  style: z.nativeEnum(AnnouncementStyle).default(AnnouncementStyle.RELEASE),
  betaWarning: z.boolean().default(false),
  useEmbed: z.boolean().default(true),
  embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  thumbnailUrl: z.string().url().optional(),
  footerText: z.string().max(100).optional(),
  username: z.string().max(80).optional(),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
});

export const sendTeaserInputSchema = z.object({
  version: z.string().min(1).max(30),
  headline: z.string().min(1).max(256),
  highlights: z.array(z.string()).min(1).max(10),
  additionalInfo: z.string().max(500).optional(),
  style: z.nativeEnum(AnnouncementStyle).default(AnnouncementStyle.CUSTOM),
  thumbnailUrl: z.string().url().optional(),
  footerText: z.string().max(100).optional(),
  username: z.string().max(80).optional(),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
});

export const sendChangelogInputSchema = z.object({
  title: z.string().min(1).max(256),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(256),
        items: z.array(z.string()).min(1).max(25),
      })
    )
    .min(1)
    .max(25),
  version: z.string().min(1).max(30).optional(),
  summary: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  style: z.nativeEnum(AnnouncementStyle).default(AnnouncementStyle.RELEASE),
  useEmbed: z.boolean().default(true),
  embedColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  thumbnailUrl: z.string().url().optional(),
  footerText: z.string().max(100).optional(),
  username: z.string().max(80).optional(),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
});

export const addWebhookInputSchema = z.object({
  name: z.string()
    .min(1)
    .max(50)
    .transform((name) => name.toLowerCase().replace(/\s+/g, '_'))
    .refine(
      (name) => /^[a-z0-9_]+$/.test(name),
      { message: 'Webhook name must contain only alphanumeric characters and underscores' }
    ),
  url: webhookUrlSchema,
  description: z.string().max(200).optional(),
});

export const removeWebhookInputSchema = z.object({
  name: z.string().min(1).max(50),
});

export const listWebhooksInputSchema = z.object({
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
});
