/**
 * Discord embed builders for rich announcements
 */

import { AnnouncementStyle } from '../types/enums.js';
import { LIVING_LANDS_LOGO_URL, KOFI_USERNAME, KOFI_URL } from '../constants.js';
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

function parseColor(hex?: string): number | null {
  if (!hex) return null;
  try {
    return parseInt(hex.replace('#', ''), 16);
  } catch {
    return null;
  }
}
