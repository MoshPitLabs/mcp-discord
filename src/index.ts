#!/usr/bin/env node
/**
 * Discord MCP Server - TypeScript Edition
 * 
 * Model Context Protocol server for Discord integration via webhooks.
 * Provides tools to send messages, announcements, and manage webhook configurations.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers
import { handleSendMessage } from './tools/sendMessage.js';
import { handleSendAnnouncement } from './tools/sendAnnouncement.js';
import { handleSendTeaser } from './tools/sendTeaser.js';
import { handleAddWebhook } from './tools/addWebhook.js';
import { handleRemoveWebhook } from './tools/removeWebhook.js';
import { handleListWebhooks } from './tools/listWebhooks.js';
import { handleError } from './utils/errors.js';

// Initialize MCP server
const server = new Server(
  {
    name: 'discord',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'discord_send_message',
      description: 'Send a message to a Discord channel via webhook. Use this tool when you need to post a plain text message to Discord.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookName: {
            type: 'string',
            description: 'Name of the configured webhook to use (e.g., "releases", "announcements")',
          },
          content: {
            type: 'string',
            description: 'Message content to send (max 2000 characters)',
          },
          username: {
            type: 'string',
            description: 'Optional: Override the webhook\'s default username',
          },
          avatarUrl: {
            type: 'string',
            description: 'Optional: Override the webhook\'s default avatar URL',
          },
          responseFormat: {
            type: 'string',
            enum: ['markdown', 'json'],
            description: 'Output format for the response (default: markdown)',
          },
        },
        required: ['webhookName', 'content'],
      },
    },
    {
      name: 'discord_send_announcement',
      description: 'Send a formatted release announcement to Discord. Creates a rich embed with version, headline, change list, and optional download link. Perfect for software releases, updates, and feature announcements.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookName: {
            type: 'string',
            description: 'Name of the configured webhook to use',
          },
          version: {
            type: 'string',
            description: 'Version number (e.g., "v2.6.0-beta", "1.0.0")',
          },
          headline: {
            type: 'string',
            description: 'Main headline/feature announcement (max 256 characters)',
          },
          changes: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of changes/features to highlight (1-10 items)',
          },
          downloadUrl: {
            type: 'string',
            description: 'Optional: URL to download/learn more',
          },
          style: {
            type: 'string',
            enum: ['release', 'hotfix', 'beta', 'custom'],
            description: 'Announcement style: release (green), hotfix (red), beta (yellow), custom (blue)',
          },
          betaWarning: {
            type: 'boolean',
            description: 'Include beta warning message (default: false)',
          },
          useEmbed: {
            type: 'boolean',
            description: 'Use rich embed format (default: true)',
          },
          embedColor: {
            type: 'string',
            description: 'Optional: Custom hex color for embed (e.g., "#5865F2")',
          },
          thumbnailUrl: {
            type: 'string',
            description: 'Optional: URL for thumbnail image in embed',
          },
          footerText: {
            type: 'string',
            description: 'Optional: Custom footer text',
          },
          username: {
            type: 'string',
            description: 'Optional: Override webhook username for this message',
          },
          responseFormat: {
            type: 'string',
            enum: ['markdown', 'json'],
            description: 'Output format for the response (default: markdown)',
          },
        },
        required: ['webhookName', 'version', 'headline', 'changes'],
      },
    },
    {
      name: 'discord_send_teaser',
      description: 'Send a teaser/preview announcement to Discord. Perfect for "coming soon" announcements and sneak peeks of upcoming features.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookName: {
            type: 'string',
            description: 'Name of the configured webhook to use',
          },
          version: {
            type: 'string',
            description: 'Version number (e.g., "v1.0.0-beta", "2.0.0")',
          },
          headline: {
            type: 'string',
            description: 'Main teaser headline (max 256 characters)',
          },
          highlights: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of features/highlights to tease (1-10 items)',
          },
          additionalInfo: {
            type: 'string',
            description: 'Optional: Additional context or call-to-action',
          },
          style: {
            type: 'string',
            enum: ['release', 'hotfix', 'beta', 'custom'],
            description: 'Teaser style (typically "beta" or "custom")',
          },
          thumbnailUrl: {
            type: 'string',
            description: 'Optional: URL for thumbnail image in embed',
          },
          footerText: {
            type: 'string',
            description: 'Optional: Custom footer text',
          },
          username: {
            type: 'string',
            description: 'Optional: Override webhook username for this message',
          },
          responseFormat: {
            type: 'string',
            enum: ['markdown', 'json'],
            description: 'Output format for the response (default: markdown)',
          },
        },
        required: ['webhookName', 'version', 'headline', 'highlights'],
      },
    },
    {
      name: 'discord_add_webhook',
      description: 'Add or update a Discord webhook configuration. Webhooks can be created in Discord: Server Settings > Integrations > Webhooks. The configuration is stored locally and persists between sessions.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Friendly name for this webhook (e.g., "releases", "general"). Will be sanitized to lowercase with underscores.',
          },
          url: {
            type: 'string',
            description: 'Discord webhook URL from Discord server settings (must start with https://discord.com/api/webhooks/)',
          },
          description: {
            type: 'string',
            description: 'Optional: Description of what this webhook is for',
          },
        },
        required: ['name', 'url'],
      },
    },
    {
      name: 'discord_remove_webhook',
      description: 'Remove a Discord webhook configuration. This only removes the local configuration - the actual Discord webhook is not affected.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the webhook to remove',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'discord_list_webhooks',
      description: 'List all configured Discord webhooks. For security, only the last 8 characters of webhook URLs are shown.',
      inputSchema: {
        type: 'object',
        properties: {
          responseFormat: {
            type: 'string',
            enum: ['markdown', 'json'],
            description: 'Output format for the response (default: markdown)',
          },
        },
      },
    },
  ],
}));

// Handle tool call requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result: string;
    
    switch (name) {
      case 'discord_send_message':
        result = await handleSendMessage(args);
        break;
      
      case 'discord_send_announcement':
        result = await handleSendAnnouncement(args);
        break;
      
      case 'discord_send_teaser':
        result = await handleSendTeaser(args);
        break;
      
      case 'discord_add_webhook':
        result = await handleAddWebhook(args);
        break;
      
      case 'discord_remove_webhook':
        result = await handleRemoveWebhook(args);
        break;
      
      case 'discord_list_webhooks':
        result = await handleListWebhooks(args);
        break;
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const errorMessage = handleError(error);
    return {
      content: [{ type: 'text', text: errorMessage }],
      isError: true,
    };
  }
});

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Discord MCP Server v2.0.0 running on stdio');
  console.error('Server name: discord');
  console.error('Tools: 6 (send_message, send_announcement, send_teaser, add_webhook, remove_webhook, list_webhooks)');
}

// Error handling for startup
main().catch((error) => {
  console.error('Fatal error starting Discord MCP Server:', error);
  process.exit(1);
});
