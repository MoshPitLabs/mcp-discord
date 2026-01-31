/**
 * Constants and configuration for Discord MCP Server
 */

import { homedir } from 'os';
import { join } from 'path';

export const CHARACTER_LIMIT = 25000;
export const DISCORD_MESSAGE_LIMIT = 2000;

// Discord embed limits
export const DISCORD_EMBED_FIELDS_LIMIT = 25;
export const DISCORD_EMBED_FIELD_VALUE_LIMIT = 1024;
export const DISCORD_EMBED_TOTAL_CHARS_LIMIT = 6000;

export const CONFIG_DIR = process.env.DISCORD_MCP_CONFIG_DIR || 
  join(homedir(), '.config', 'discord_mcp');

export const WEBHOOKS_FILE = join(CONFIG_DIR, 'webhooks.json');

export const LIVING_LANDS_LOGO_URL = 
  'https://raw.githubusercontent.com/MoshPitCodes/living-lands-reloaded/main/.github/assets/logo/living-lands-reloaded-logo.png';

export const KOFI_USERNAME = 'moshpitplays';
export const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`;
