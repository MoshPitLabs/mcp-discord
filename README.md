# Discord MCP Server

A Model Context Protocol (MCP) server for Discord integration via webhooks.

## Features

- **Send Messages**: Post messages to Discord channels via webhooks
- **Release Announcements**: Send beautifully formatted release announcements
- **Webhook Management**: Add, remove, and list webhook configurations
- **Secure Storage**: Webhook URLs stored locally with partial URL display for security

## Installation

### Prerequisites

- Python 3.10+ or NixOS with flakes enabled
- Discord server with webhook access

### NixOS (Recommended)

```bash
# Clone the repository
git clone https://github.com/MoshPitCodes/mcp-server-discord.git ~/.claude/mcp-servers/discord_mcp
cd ~/.claude/mcp-servers/discord_mcp

# Enter development environment (creates .venv and installs dependencies)
nix develop
```

### Using uv

```bash
cd ~/.claude/mcp-servers/discord_mcp
uv pip install -e .
```

### Using pip

```bash
cd ~/.claude/mcp-servers/discord_mcp
pip install -e .
```

## Configuration

### 1. Set Up Webhook Configuration (IMPORTANT - Security Step)

⚠️ **SECURITY WARNING**: The `webhooks.json` file contains sensitive Discord webhook URLs. Never commit this file to version control!

```bash
# Copy the template
cp webhooks.json.template webhooks.json

# Edit with your actual webhook URL(s)
nano webhooks.json
# or
vim webhooks.json
```

**To get your Discord webhook URL:**
1. Go to your Discord server
2. **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Choose a name and channel
5. **Copy Webhook URL**
6. Paste into `webhooks.json` replacing `YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN`

**Example `webhooks.json`:**
```json
{
  "releases": {
    "url": "https://discord.com/api/webhooks/1234567890/abcdefghijklmnop",
    "description": "Release announcements",
    "added_at": "2026-01-22T00:00:00.000000"
  }
}
```

### 2. Add to Claude Code

Add to your Claude configuration using the MCP command:

```bash
# For NixOS users
claude mcp add discord --scope user -- bash -c "cd ~/.claude/mcp-servers/discord_mcp && nix develop --command python discord_mcp.py"

# For standard Python users
claude mcp add discord --scope user -- python ~/.claude/mcp-servers/discord_mcp/discord_mcp.py
```

Or manually add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "discord": {
      "command": "bash",
      "args": ["-c", "cd ~/.claude/mcp-servers/discord_mcp && nix develop --command python discord_mcp.py"]
    }
  }
}
```

### 3. Verify Connection

```bash
claude mcp list
# Should show: discord: ... - ✓ Connected
```

### Environment Variables (Optional)

- `DISCORD_MCP_CONFIG_DIR`: Custom directory for webhook configurations (default: `~/.config/discord_mcp`)

## Usage

Simply ask Claude Code in natural language! The MCP server tools will be invoked automatically.

### Send a Simple Message

```
Send "Hello from Claude!" to the releases webhook
```

### Send a Release Announcement

```
Send a release announcement for v2.6.0-beta with:
- Headline: The Claims Module is here!
- Changes: Land claiming system, Trust management, Map visualization
- Beta warning: yes
- Download link: https://curseforge.com/...
```

The announcement will be formatted as a rich Discord embed with:
- Colored sidebar (green for release, yellow for beta, red for hotfix)
- Version title with emoji
- Feature highlights
- Download link
- Automatic Living Lands logo thumbnail

## Tools

### discord_send_message

Send a plain text message to a Discord channel.

**Parameters:**
- `webhook_name` (required): Name of configured webhook
- `content` (required): Message content (max 2000 chars)
- `username` (optional): Override webhook username
- `avatar_url` (optional): Override webhook avatar

### discord_send_announcement

Send a formatted release announcement with rich Discord embeds.

**Parameters:**
- `webhook_name` (required): Name of configured webhook
- `version` (required): Version number (e.g., "v2.6.0-beta")
- `headline` (required): Main announcement headline (max 256 chars)
- `changes` (required): List of changes/features (1-10 items)
- `download_url` (optional): Download/info URL
- `style` (optional): `release` (green) / `hotfix` (red) / `beta` (yellow) / `custom` (blue)
- `beta_warning` (optional): Include backup warning
- `use_embed` (optional): Use rich embed format (default: true)
- `embed_color` (optional): Custom hex color (e.g., "#5865F2")
- `thumbnail_url` (optional): Custom thumbnail URL (defaults to Living Lands logo)
- `footer_text` (optional): Custom footer text
- `username` (optional): Override webhook display name

**Embed Format:**
Rich Discord embed with:
- Colored sidebar based on style
- Version title with emoji (📦 release, 🧪 beta, 🚨 hotfix, 📢 custom)
- Headline as description
- "What's New" field with changes
- Optional warning field
- Download link field
- Living Lands logo thumbnail (automatic)
- Timestamp footer

### discord_add_webhook

Add or update a webhook configuration.

**Parameters:**
- `name` (required): Friendly name for the webhook
- `url` (required): Discord webhook URL
- `description` (optional): What this webhook is for

### discord_remove_webhook

Remove a webhook configuration.

**Parameters:**
- `name` (required): Name of webhook to remove

### discord_list_webhooks

List all configured webhooks (URLs partially hidden for security).

## Security

- Webhook URLs are stored locally in `~/.config/discord_mcp/webhooks.json`
- Full URLs are never displayed in tool outputs
- Keep your configuration file secure as webhook URLs allow posting to channels

## License

MIT
