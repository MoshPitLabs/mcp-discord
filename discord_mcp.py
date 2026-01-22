#!/usr/bin/env python3
"""
Discord MCP Server - Model Context Protocol server for Discord integration.

This server provides tools to interact with Discord via webhooks, including:
- Sending messages to channels via webhooks
- Sending formatted release announcements
- Managing webhook configurations

Authentication:
- Uses Discord webhooks (no bot token required for basic functionality)
- Webhook URLs are stored in a local JSON configuration file
"""

import json
import os
import sys
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Initialize the MCP server
mcp = FastMCP("discord_mcp")

# Constants
CHARACTER_LIMIT = 25000
DISCORD_MESSAGE_LIMIT = 2000  # Discord's message character limit
CONFIG_DIR = Path(os.environ.get("DISCORD_MCP_CONFIG_DIR", Path.home() / ".config" / "discord_mcp"))
WEBHOOKS_FILE = CONFIG_DIR / "webhooks.json"
LIVING_LANDS_LOGO_URL = "https://raw.githubusercontent.com/MoshPitCodes/hytale-livinglands/main/.github/assets/logo/hytale-livinglands-logo.png"

# Ensure config directory exists
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


# ==============================================================================
# Enums
# ==============================================================================

class ResponseFormat(str, Enum):
    """Output format for tool responses."""
    MARKDOWN = "markdown"
    JSON = "json"


class AnnouncementStyle(str, Enum):
    """Style presets for release announcements."""
    RELEASE = "release"  # Standard release announcement
    HOTFIX = "hotfix"    # Urgent hotfix announcement
    BETA = "beta"        # Beta/preview release
    CUSTOM = "custom"    # Custom format


# ==============================================================================
# Pydantic Models
# ==============================================================================

class WebhookConfig(BaseModel):
    """Configuration for a Discord webhook."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    name: str = Field(..., description="Friendly name for this webhook (e.g., 'releases', 'general')", min_length=1, max_length=50)
    url: str = Field(..., description="Discord webhook URL", min_length=50, max_length=300)
    description: Optional[str] = Field(default=None, description="Optional description of what this webhook is for", max_length=200)

    @field_validator('url')
    @classmethod
    def validate_webhook_url(cls, v: str) -> str:
        if not v.startswith("https://discord.com/api/webhooks/") and not v.startswith("https://discordapp.com/api/webhooks/"):
            raise ValueError("Invalid Discord webhook URL. Must start with 'https://discord.com/api/webhooks/' or 'https://discordapp.com/api/webhooks/'")
        return v


class SendMessageInput(BaseModel):
    """Input model for sending a message to Discord."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    webhook_name: str = Field(..., description="Name of the configured webhook to use (e.g., 'releases', 'announcements')", min_length=1, max_length=50)
    content: str = Field(..., description="Message content to send (max 2000 characters)", min_length=1, max_length=2000)
    username: Optional[str] = Field(default=None, description="Override the webhook's default username", max_length=80)
    avatar_url: Optional[str] = Field(default=None, description="Override the webhook's default avatar URL")
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format for the response")


class SendAnnouncementInput(BaseModel):
    """Input model for sending a formatted release announcement."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    webhook_name: str = Field(..., description="Name of the configured webhook to use", min_length=1, max_length=50)
    version: str = Field(..., description="Version number (e.g., 'v2.6.0-beta', '1.0.0')", min_length=1, max_length=30)
    headline: str = Field(..., description="Main headline/feature announcement (e.g., 'The Claims Module is here!')", min_length=1, max_length=256)
    changes: List[str] = Field(..., description="List of changes/features to highlight", min_items=1, max_items=10)
    download_url: Optional[str] = Field(default=None, description="URL to download/learn more")
    style: AnnouncementStyle = Field(default=AnnouncementStyle.RELEASE, description="Announcement style preset")
    beta_warning: bool = Field(default=False, description="Include beta warning message")
    use_embed: bool = Field(default=True, description="Use rich embed format (recommended) or plain text")
    embed_color: Optional[str] = Field(default=None, description="Custom hex color for embed (e.g., '#5865F2'). If not set, uses style default.")
    thumbnail_url: Optional[str] = Field(default=None, description="URL for thumbnail image in embed")
    footer_text: Optional[str] = Field(default=None, description="Custom footer text", max_length=100)
    username: Optional[str] = Field(default=None, description="Override webhook username for this message", max_length=80)
    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format for the response")


class AddWebhookInput(BaseModel):
    """Input model for adding a new webhook configuration."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    name: str = Field(..., description="Friendly name for this webhook (e.g., 'releases', 'general')", min_length=1, max_length=50)
    url: str = Field(..., description="Discord webhook URL from Discord server settings", min_length=50, max_length=300)
    description: Optional[str] = Field(default=None, description="Optional description of what this webhook is for", max_length=200)

    @field_validator('url')
    @classmethod
    def validate_webhook_url(cls, v: str) -> str:
        if not v.startswith("https://discord.com/api/webhooks/") and not v.startswith("https://discordapp.com/api/webhooks/"):
            raise ValueError("Invalid Discord webhook URL. Must start with 'https://discord.com/api/webhooks/' or 'https://discordapp.com/api/webhooks/'")
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        # Sanitize name for use as key
        sanitized = v.lower().replace(' ', '_')
        if not sanitized.replace('_', '').isalnum():
            raise ValueError("Webhook name must contain only alphanumeric characters and spaces/underscores")
        return sanitized


class RemoveWebhookInput(BaseModel):
    """Input model for removing a webhook configuration."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra='forbid'
    )

    name: str = Field(..., description="Name of the webhook to remove", min_length=1, max_length=50)


class ListWebhooksInput(BaseModel):
    """Input model for listing webhooks."""
    model_config = ConfigDict(extra='forbid')

    response_format: ResponseFormat = Field(default=ResponseFormat.MARKDOWN, description="Output format for the response")


# ==============================================================================
# Webhook Configuration Management
# ==============================================================================

def _load_webhooks() -> Dict[str, Dict[str, Any]]:
    """Load webhook configurations from file."""
    if not WEBHOOKS_FILE.exists():
        return {}
    try:
        with open(WEBHOOKS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def _save_webhooks(webhooks: Dict[str, Dict[str, Any]]) -> None:
    """Save webhook configurations to file."""
    with open(WEBHOOKS_FILE, 'w') as f:
        json.dump(webhooks, f, indent=2)


def _get_webhook_url(name: str) -> Optional[str]:
    """Get webhook URL by name."""
    webhooks = _load_webhooks()
    webhook = webhooks.get(name.lower())
    return webhook.get('url') if webhook else None


# ==============================================================================
# Shared Utilities
# ==============================================================================

async def _send_webhook_message(
    webhook_url: str,
    content: Optional[str] = None,
    username: Optional[str] = None,
    avatar_url: Optional[str] = None,
    embeds: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Send a message via Discord webhook.

    Args:
        webhook_url: The Discord webhook URL
        content: Message content to send (optional if embeds provided)
        username: Optional username override
        avatar_url: Optional avatar URL override
        embeds: Optional list of embed objects

    Returns:
        Dict with success status and message details
    """
    payload: Dict[str, Any] = {}

    if content:
        payload["content"] = content
    if username:
        payload["username"] = username
    if avatar_url:
        payload["avatar_url"] = avatar_url
    if embeds:
        payload["embeds"] = embeds

    async with httpx.AsyncClient() as client:
        response = await client.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30.0
        )

        if response.status_code == 204:
            # Success - Discord returns 204 No Content for successful webhook posts
            return {
                "success": True,
                "status_code": 204,
                "message": "Message sent successfully"
            }
        elif response.status_code == 200:
            # Success with response body (rare for webhooks)
            return {
                "success": True,
                "status_code": 200,
                "message": "Message sent successfully",
                "response": response.json() if response.text else None
            }
        else:
            # Error
            error_text = response.text
            try:
                error_json = response.json()
                error_text = error_json.get("message", error_text)
            except (json.JSONDecodeError, ValueError):
                pass

            return {
                "success": False,
                "status_code": response.status_code,
                "error": error_text
            }


def _handle_error(e: Exception) -> str:
    """Consistent error formatting across all tools."""
    if isinstance(e, httpx.HTTPStatusError):
        status = e.response.status_code
        if status == 400:
            return "Error: Bad request. Check that the message content is valid and within Discord's limits."
        elif status == 401:
            return "Error: Unauthorized. The webhook URL may be invalid or expired."
        elif status == 403:
            return "Error: Forbidden. The webhook may have been deleted or you don't have permission."
        elif status == 404:
            return "Error: Webhook not found. The webhook URL may be invalid or deleted."
        elif status == 429:
            return "Error: Rate limited. Too many requests. Please wait before sending more messages."
        return f"Error: Discord API returned status {status}"
    elif isinstance(e, httpx.TimeoutException):
        return "Error: Request timed out. Discord may be experiencing issues. Please try again."
    elif isinstance(e, httpx.ConnectError):
        return "Error: Could not connect to Discord. Check your internet connection."
    return f"Error: {type(e).__name__}: {str(e)}"


def _format_announcement(
    version: str,
    headline: str,
    changes: List[str],
    download_url: Optional[str],
    style: AnnouncementStyle,
    beta_warning: bool
) -> str:
    """Format a release announcement message as plain text."""
    # Choose emoji based on style
    emoji_map = {
        AnnouncementStyle.RELEASE: "\U0001F4E6",  # Package emoji
        AnnouncementStyle.HOTFIX: "\U0001F6A8",   # Rotating light emoji
        AnnouncementStyle.BETA: "\U0001F9EA",     # Test tube emoji
        AnnouncementStyle.CUSTOM: "\U0001F4E2",   # Loudspeaker emoji
    }
    emoji = emoji_map.get(style, "\U0001F4E6")

    # Build announcement
    lines = [f"{emoji} **{version}** is live!"]
    lines.append("")
    lines.append(headline)
    lines.append("")

    if changes:
        for change in changes:
            # Add arrow if not already present
            if not change.startswith("\u2192") and not change.startswith("->"):
                lines.append(f"\u2192 {change}")
            else:
                lines.append(change.replace("->", "\u2192"))

    if beta_warning:
        lines.append("")
        lines.append("\u26A0\uFE0F Beta \u2014 back up your world before updating.")

    if download_url:
        lines.append(f"\U0001F517 {download_url}")

    return "\n".join(lines)


def _build_announcement_embed(
    version: str,
    headline: str,
    changes: List[str],
    download_url: Optional[str],
    style: AnnouncementStyle,
    beta_warning: bool,
    embed_color: Optional[str] = None,
    thumbnail_url: Optional[str] = None,
    footer_text: Optional[str] = None
) -> Dict[str, Any]:
    """Build a Discord embed object for release announcements.

    Args:
        version: Version number
        headline: Main announcement headline
        changes: List of changes
        download_url: Optional download URL
        style: Announcement style for color/emoji
        beta_warning: Include beta warning
        embed_color: Custom hex color (overrides style default)
        thumbnail_url: Optional thumbnail image URL
        footer_text: Optional footer text

    Returns:
        Discord embed object as dict
    """
    # Style-based colors (Discord uses decimal color values)
    color_map = {
        AnnouncementStyle.RELEASE: 0x57F287,   # Green
        AnnouncementStyle.HOTFIX: 0xED4245,    # Red
        AnnouncementStyle.BETA: 0xFEE75C,      # Yellow
        AnnouncementStyle.CUSTOM: 0x5865F2,    # Blurple
    }

    # Style-based emojis for title
    emoji_map = {
        AnnouncementStyle.RELEASE: "\U0001F4E6",  # Package
        AnnouncementStyle.HOTFIX: "\U0001F6A8",   # Rotating light
        AnnouncementStyle.BETA: "\U0001F9EA",     # Test tube
        AnnouncementStyle.CUSTOM: "\U0001F4E2",   # Loudspeaker
    }

    # Parse custom color if provided
    if embed_color:
        try:
            # Remove # if present and convert to int
            color_hex = embed_color.lstrip('#')
            color = int(color_hex, 16)
        except ValueError:
            color = color_map.get(style, 0x5865F2)
    else:
        color = color_map.get(style, 0x5865F2)

    emoji = emoji_map.get(style, "\U0001F4E6")

    # Build the embed
    embed: Dict[str, Any] = {
        "title": f"{emoji} {version} is live!",
        "description": headline,
        "color": color,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Add changes as a field
    if changes:
        changes_text = "\n".join([f"\u2192 {change}" for change in changes])
        embed["fields"] = [
            {
                "name": "What's New",
                "value": changes_text,
                "inline": False
            }
        ]

    # Add beta warning as a field
    if beta_warning:
        warning_field = {
            "name": "\u26A0\uFE0F Warning",
            "value": "This is a **beta release**. Back up your world before updating!",
            "inline": False
        }
        if "fields" in embed:
            embed["fields"].append(warning_field)
        else:
            embed["fields"] = [warning_field]

    # Add download URL
    if download_url:
        embed["url"] = download_url
        # Also add as a field for visibility
        link_field = {
            "name": "\U0001F517 Download",
            "value": f"[Get it here]({download_url})",
            "inline": False
        }
        if "fields" in embed:
            embed["fields"].append(link_field)
        else:
            embed["fields"] = [link_field]

    # Add thumbnail if provided
    if thumbnail_url:
        embed["thumbnail"] = {"url": thumbnail_url}

    # Add footer
    footer_content = footer_text or "Release Announcement"
    embed["footer"] = {"text": footer_content}

    return embed


# ==============================================================================
# Tool Implementations
# ==============================================================================

@mcp.tool(
    name="discord_send_message",
    annotations={
        "title": "Send Discord Message",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def discord_send_message(params: SendMessageInput) -> str:
    """Send a message to a Discord channel via webhook.

    This tool sends a text message to a Discord channel using a configured webhook.
    The webhook must be added first using discord_add_webhook.

    Args:
        params (SendMessageInput): Validated input parameters containing:
            - webhook_name (str): Name of the configured webhook to use
            - content (str): Message content (max 2000 characters)
            - username (Optional[str]): Override default webhook username
            - avatar_url (Optional[str]): Override default webhook avatar
            - response_format (ResponseFormat): Output format (markdown/json)

    Returns:
        str: Success or error message

    Examples:
        - Use when: "Post a message to the releases channel" with webhook_name="releases"
        - Use when: "Send an update to Discord" with configured webhook
        - Don't use when: You need to send a formatted announcement (use discord_send_announcement)
        - Don't use when: Webhook is not configured (use discord_add_webhook first)

    Error Handling:
        - Returns error if webhook_name is not configured
        - Returns error if Discord API fails (rate limit, invalid webhook, etc.)
    """
    try:
        # Get webhook URL
        webhook_url = _get_webhook_url(params.webhook_name)
        if not webhook_url:
            webhooks = _load_webhooks()
            available = list(webhooks.keys()) if webhooks else []
            if available:
                return f"Error: Webhook '{params.webhook_name}' not found. Available webhooks: {', '.join(available)}. Use discord_add_webhook to add a new one."
            return f"Error: Webhook '{params.webhook_name}' not found. No webhooks configured. Use discord_add_webhook to add one first."

        # Send message
        result = await _send_webhook_message(
            webhook_url=webhook_url,
            content=params.content,
            username=params.username,
            avatar_url=params.avatar_url
        )

        if params.response_format == ResponseFormat.JSON:
            return json.dumps(result, indent=2)

        if result["success"]:
            return f"Message sent successfully to '{params.webhook_name}' webhook."
        else:
            return f"Error: Failed to send message. {result.get('error', 'Unknown error')}"

    except Exception as e:
        return _handle_error(e)


@mcp.tool(
    name="discord_send_announcement",
    annotations={
        "title": "Send Release Announcement",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def discord_send_announcement(params: SendAnnouncementInput) -> str:
    """Send a formatted release announcement to Discord.

    This tool sends a beautifully formatted release announcement with version,
    headline, change list, and optional download link. Supports rich embeds
    (default) or plain text format.

    Args:
        params (SendAnnouncementInput): Validated input parameters containing:
            - webhook_name (str): Name of the configured webhook to use
            - version (str): Version number (e.g., 'v2.6.0-beta')
            - headline (str): Main feature announcement
            - changes (List[str]): List of changes to highlight
            - download_url (Optional[str]): Download/info URL
            - style (AnnouncementStyle): release/hotfix/beta/custom
            - beta_warning (bool): Include beta backup warning
            - use_embed (bool): Use rich embed format (default True)
            - embed_color (Optional[str]): Custom hex color for embed
            - thumbnail_url (Optional[str]): Thumbnail image URL
            - footer_text (Optional[str]): Custom footer text
            - username (Optional[str]): Override webhook username
            - response_format (ResponseFormat): Output format

    Returns:
        str: Success message with preview, or error

    Examples:
        - Use when: "Announce version 2.0 release to Discord"
        - Use when: "Post a hotfix announcement with red color"
        - Don't use when: Sending a plain text message (use discord_send_message)

    Embed colors by style:
        - release: Green (#57F287)
        - hotfix: Red (#ED4245)
        - beta: Yellow (#FEE75C)
        - custom: Blurple (#5865F2)
    """
    try:
        # Get webhook URL
        webhook_url = _get_webhook_url(params.webhook_name)
        if not webhook_url:
            webhooks = _load_webhooks()
            available = list(webhooks.keys()) if webhooks else []
            if available:
                return f"Error: Webhook '{params.webhook_name}' not found. Available webhooks: {', '.join(available)}"
            return f"Error: Webhook '{params.webhook_name}' not found. No webhooks configured. Use discord_add_webhook first."

        if params.use_embed:
            # Build rich embed
            # Use Living Lands logo as thumbnail if no custom thumbnail provided
            thumbnail = params.thumbnail_url or LIVING_LANDS_LOGO_URL

            embed = _build_announcement_embed(
                version=params.version,
                headline=params.headline,
                changes=params.changes,
                download_url=params.download_url,
                style=params.style,
                beta_warning=params.beta_warning,
                embed_color=params.embed_color,
                thumbnail_url=thumbnail,
                footer_text=params.footer_text
            )

            # Send with embed
            result = await _send_webhook_message(
                webhook_url=webhook_url,
                embeds=[embed],
                username=params.username
            )

            if params.response_format == ResponseFormat.JSON:
                return json.dumps({
                    "result": result,
                    "embed": embed,
                    "format": "embed"
                }, indent=2, default=str)

            if result["success"]:
                # Build preview text
                preview_lines = [
                    f"**{embed['title']}**",
                    embed['description'],
                    ""
                ]
                for field in embed.get("fields", []):
                    preview_lines.append(f"**{field['name']}**")
                    preview_lines.append(field['value'])
                    preview_lines.append("")

                preview = "\n".join(preview_lines)
                return f"Embed announcement sent successfully!\n\n**Preview:**\n{preview}"
            else:
                return f"Error: Failed to send announcement. {result.get('error', 'Unknown error')}"

        else:
            # Use plain text format
            announcement = _format_announcement(
                version=params.version,
                headline=params.headline,
                changes=params.changes,
                download_url=params.download_url,
                style=params.style,
                beta_warning=params.beta_warning
            )

            # Check Discord message limit
            if len(announcement) > DISCORD_MESSAGE_LIMIT:
                return f"Error: Announcement is too long ({len(announcement)} chars). Discord limit is {DISCORD_MESSAGE_LIMIT} characters. Reduce the number of changes or shorten descriptions."

            # Send message
            result = await _send_webhook_message(
                webhook_url=webhook_url,
                content=announcement,
                username=params.username
            )

            if params.response_format == ResponseFormat.JSON:
                return json.dumps({
                    "result": result,
                    "announcement_preview": announcement,
                    "character_count": len(announcement),
                    "format": "plain_text"
                }, indent=2)

            if result["success"]:
                return f"Announcement sent successfully!\n\n**Preview:**\n```\n{announcement}\n```"
            else:
                return f"Error: Failed to send announcement. {result.get('error', 'Unknown error')}"

    except Exception as e:
        return _handle_error(e)


@mcp.tool(
    name="discord_add_webhook",
    annotations={
        "title": "Add Discord Webhook",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def discord_add_webhook(params: AddWebhookInput) -> str:
    """Add or update a Discord webhook configuration.

    This tool saves a Discord webhook URL with a friendly name for later use.
    Webhooks can be created in Discord: Server Settings > Integrations > Webhooks.

    Args:
        params (AddWebhookInput): Validated input parameters containing:
            - name (str): Friendly name for the webhook (e.g., 'releases')
            - url (str): Discord webhook URL
            - description (Optional[str]): What this webhook is used for

    Returns:
        str: Success confirmation or error message

    Examples:
        - Use when: "Add a webhook for release announcements"
        - Use when: "Configure Discord channel for notifications"
        - After this: Use discord_send_message or discord_send_announcement

    Security Note:
        Webhook URLs are stored locally in ~/.config/discord_mcp/webhooks.json
        Keep this file secure as webhook URLs allow posting to your channels.
    """
    try:
        webhooks = _load_webhooks()

        is_update = params.name in webhooks

        webhooks[params.name] = {
            "url": params.url,
            "description": params.description,
            "added_at": datetime.now().isoformat()
        }

        _save_webhooks(webhooks)

        action = "updated" if is_update else "added"
        return f"Webhook '{params.name}' {action} successfully. You can now use it with discord_send_message or discord_send_announcement."

    except Exception as e:
        return f"Error: Failed to save webhook configuration: {str(e)}"


@mcp.tool(
    name="discord_remove_webhook",
    annotations={
        "title": "Remove Discord Webhook",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def discord_remove_webhook(params: RemoveWebhookInput) -> str:
    """Remove a Discord webhook configuration.

    This tool removes a previously saved webhook configuration. The actual
    Discord webhook is not affected - only the local configuration is removed.

    Args:
        params (RemoveWebhookInput): Validated input containing:
            - name (str): Name of the webhook to remove

    Returns:
        str: Success confirmation or error if webhook not found
    """
    try:
        webhooks = _load_webhooks()

        name_lower = params.name.lower()
        if name_lower not in webhooks:
            available = list(webhooks.keys()) if webhooks else []
            if available:
                return f"Error: Webhook '{params.name}' not found. Available webhooks: {', '.join(available)}"
            return f"Error: Webhook '{params.name}' not found. No webhooks configured."

        del webhooks[name_lower]
        _save_webhooks(webhooks)

        return f"Webhook '{params.name}' removed successfully."

    except Exception as e:
        return f"Error: Failed to remove webhook: {str(e)}"


@mcp.tool(
    name="discord_list_webhooks",
    annotations={
        "title": "List Discord Webhooks",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def discord_list_webhooks(params: ListWebhooksInput) -> str:
    """List all configured Discord webhooks.

    This tool shows all saved webhook configurations without exposing
    the full webhook URLs (for security).

    Args:
        params (ListWebhooksInput): Validated input containing:
            - response_format (ResponseFormat): Output format (markdown/json)

    Returns:
        str: List of configured webhooks with names and descriptions
    """
    try:
        webhooks = _load_webhooks()

        if not webhooks:
            return "No webhooks configured. Use discord_add_webhook to add one."

        if params.response_format == ResponseFormat.JSON:
            # Return sanitized data (hide full URLs)
            sanitized = {}
            for name, config in webhooks.items():
                url = config.get("url", "")
                # Show only last 8 chars of webhook URL for identification
                url_hint = f"...{url[-8:]}" if len(url) > 8 else url
                sanitized[name] = {
                    "description": config.get("description"),
                    "url_hint": url_hint,
                    "added_at": config.get("added_at")
                }
            return json.dumps(sanitized, indent=2)

        # Markdown format
        lines = ["# Configured Discord Webhooks", ""]
        for name, config in webhooks.items():
            url = config.get("url", "")
            url_hint = f"...{url[-8:]}" if len(url) > 8 else url
            desc = config.get("description", "No description")
            added = config.get("added_at", "Unknown")

            lines.append(f"## {name}")
            lines.append(f"- **Description**: {desc}")
            lines.append(f"- **URL hint**: `{url_hint}`")
            lines.append(f"- **Added**: {added}")
            lines.append("")

        return "\n".join(lines)

    except Exception as e:
        return f"Error: Failed to list webhooks: {str(e)}"


# ==============================================================================
# Server Entry Point
# ==============================================================================

if __name__ == "__main__":
    mcp.run()
