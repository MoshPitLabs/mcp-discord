/**
 * Discord embed builders for rich announcements
 */

import { AnnouncementStyle } from '../types/enums.js';
import {
  DISCORD_EMBED_FIELD_VALUE_LIMIT,
  DISCORD_EMBED_FIELDS_LIMIT,
  DISCORD_EMBED_TOTAL_CHARS_LIMIT,
  LIVING_LANDS_LOGO_URL,
  KOFI_USERNAME,
  KOFI_URL,
} from '../constants.js';
import type { DiscordEmbed } from '../types/interfaces.js';

// Color mapping (Discord uses decimal values)
const STYLE_COLORS: Record<AnnouncementStyle, number> = {
  [AnnouncementStyle.RELEASE]: 0x57F287,  // Green
  [AnnouncementStyle.HOTFIX]: 0xED4245,   // Red
  [AnnouncementStyle.BETA]: 0xFEE75C,     // Yellow
  [AnnouncementStyle.CUSTOM]: 0x5865F2,   // Blurple
};

// Emoji mapping
const STYLE_EMOJIS: Record<AnnouncementStyle, string> = {
  [AnnouncementStyle.RELEASE]: '📦',
  [AnnouncementStyle.HOTFIX]: '🚨',
  [AnnouncementStyle.BETA]: '🧪',
  [AnnouncementStyle.CUSTOM]: '📢',
};

export function buildAnnouncementEmbed(params: {
  version: string;
  headline: string;
  changes: string[];
  downloadUrl?: string;
  style: AnnouncementStyle;
  betaWarning: boolean;
  embedColor?: string;
  thumbnailUrl?: string;
  footerText?: string;
}): DiscordEmbed {
  const color = parseColor(params.embedColor) ?? STYLE_COLORS[params.style];
  const emoji = STYLE_EMOJIS[params.style];
  
  const embed: DiscordEmbed = {
    title: `${emoji} ${params.version} is live!`,
    description: params.headline,
    color,
    timestamp: new Date().toISOString(),
    fields: [],
  };
  
  // Add changes field
  const changesText = params.changes.map(c => `→ ${c}`).join('\n');
  embed.fields!.push({
    name: 'What\'s New',
    value: changesText,
    inline: false,
  });
  
  // Beta warning
  if (params.betaWarning) {
    embed.fields!.push({
      name: '⚠️ Warning',
      value: 'This is a **beta release**. Back up your world before updating!',
      inline: false,
    });
  }
  
  // Download link
  if (params.downloadUrl) {
    embed.url = params.downloadUrl;
    embed.fields!.push({
      name: '🔗 Download',
      value: `[Get it here](${params.downloadUrl})`,
      inline: false,
    });
  }
  
  // Donation field
  embed.fields!.push({
    name: '☕ Support Development',
    value: `Enjoying Living Lands Reloaded? Consider supporting development: [Ko-fi.com/${KOFI_USERNAME}](${KOFI_URL})`,
    inline: false,
  });
  
  // Thumbnail
  embed.thumbnail = { url: params.thumbnailUrl ?? LIVING_LANDS_LOGO_URL };
  
  // Footer
  embed.footer = { text: params.footerText ?? 'Release Announcement' };
  
  return embed;
}

export function buildTeaserEmbed(params: {
  version: string;
  headline: string;
  highlights: string[];
  additionalInfo?: string;
  style: AnnouncementStyle;
  embedColor?: string;
  thumbnailUrl?: string;
  footerText?: string;
}): DiscordEmbed {
  const color = parseColor(params.embedColor) ?? STYLE_COLORS[params.style];
  
  const embed: DiscordEmbed = {
    title: `👀 ${params.version} - ${params.headline}`,
    description: 'Something exciting is on the way... 🌱',
    color,
    timestamp: new Date().toISOString(),
    fields: [],
  };
  
  // Highlights
  const highlightsText = params.highlights.map(h => `→ ${h}`).join('\n');
  embed.fields!.push({
    name: '✨ What to Expect',
    value: highlightsText,
    inline: false,
  });
  
  // Additional info
  if (params.additionalInfo) {
    embed.fields!.push({
      name: '💡 More Info',
      value: params.additionalInfo,
      inline: false,
    });
  }
  
  // Donation field
  embed.fields!.push({
    name: '☕ Support Development',
    value: `Enjoying Living Lands Reloaded? Consider supporting development: [Ko-fi.com/${KOFI_USERNAME}](${KOFI_URL})`,
    inline: false,
  });
  
  embed.thumbnail = { url: params.thumbnailUrl ?? LIVING_LANDS_LOGO_URL };
  embed.footer = { text: params.footerText ?? `${params.version} • Coming Soon` };
  
  return embed;
}

export function formatAnnouncement(params: {
  version: string;
  headline: string;
  changes: string[];
  downloadUrl?: string;
  style: AnnouncementStyle;
  betaWarning: boolean;
}): string {
  const emoji = STYLE_EMOJIS[params.style];
  const lines: string[] = [
    `${emoji} **${params.version}** is live!`,
    '',
    params.headline,
    '',
  ];
  
  params.changes.forEach(change => {
    const prefix = change.startsWith('→') || change.startsWith('->') ? '' : '→ ';
    lines.push(prefix + change.replace('->', '→'));
  });
  
  if (params.betaWarning) {
    lines.push('', '⚠️ Beta — back up your world before updating.');
  }
  
  if (params.downloadUrl) {
    lines.push(`🔗 ${params.downloadUrl}`);
  }
  
  return lines.join('\n');
}

export function buildChangelogEmbed(params: {
  title: string;
  sections: Array<{ title: string; items: string[] }>;
  version?: string;
  summary?: string;
  url?: string;
  style: AnnouncementStyle;
  embedColor?: string;
  thumbnailUrl?: string;
  footerText?: string;
}): DiscordEmbed {
  const color = parseColor(params.embedColor) ?? STYLE_COLORS[params.style];
  const versionPrefix = params.version ? `${params.version} - ` : '';

  const embed: DiscordEmbed = {
    title: `${versionPrefix}${params.title}`,
    description: params.summary,
    color,
    timestamp: new Date().toISOString(),
    fields: [],
  };

  if (params.url) embed.url = params.url;

  const availableFields = Math.min(params.sections.length, DISCORD_EMBED_FIELDS_LIMIT);
  for (let i = 0; i < availableFields; i++) {
    const section = params.sections[i]!;
    const value = truncateEmbedFieldValue(section.items.map((it) => `- ${it}`).join('\n'));
    embed.fields!.push({
      name: section.title,
      value,
      inline: false,
    });
  }

  // Thumbnail
  embed.thumbnail = { url: params.thumbnailUrl ?? LIVING_LANDS_LOGO_URL };

  // Footer
  embed.footer = { text: params.footerText ?? 'Changelog' };

  return ensureEmbedTotalCharsLimit(embed);
}

export function formatChangelog(params: {
  title: string;
  sections: Array<{ title: string; items: string[] }>;
  version?: string;
  summary?: string;
  url?: string;
}): string {
  const lines: string[] = [];
  lines.push(`**${params.version ? `${params.version} - ` : ''}${params.title}**`);
  if (params.summary) lines.push(params.summary);
  if (params.url) lines.push(params.url);
  lines.push('');

  for (const section of params.sections) {
    lines.push(`**${section.title}**`);
    for (const item of section.items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function parseColor(hex?: string): number | null {
  if (!hex) return null;
  try {
    return parseInt(hex.replace('#', ''), 16);
  } catch {
    return null;
  }
}

function truncateEmbedFieldValue(value: string): string {
  if (value.length <= DISCORD_EMBED_FIELD_VALUE_LIMIT) return value;
  return value.slice(0, DISCORD_EMBED_FIELD_VALUE_LIMIT - 1) + '…';
}

function ensureEmbedTotalCharsLimit(embed: DiscordEmbed): DiscordEmbed {
  // Rough enforcement of 6000-char total embed limit (Discord).
  const parts: string[] = [];
  if (embed.title) parts.push(embed.title);
  if (embed.description) parts.push(embed.description);
  for (const f of embed.fields ?? []) {
    parts.push(f.name, f.value);
  }
  if (embed.footer?.text) parts.push(embed.footer.text);

  const total = parts.reduce((n, p) => n + p.length, 0);
  if (total <= DISCORD_EMBED_TOTAL_CHARS_LIMIT) return embed;

  const over = total - DISCORD_EMBED_TOTAL_CHARS_LIMIT;
  if (!embed.description || embed.description.length === 0) return embed;

  const newLen = Math.max(0, embed.description.length - over - 1);
  embed.description = newLen > 0 ? embed.description.slice(0, newLen) + '…' : undefined;
  return embed;
}
