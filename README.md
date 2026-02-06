# Discord MCP Server

A Model Context Protocol (MCP) server for Discord integration via webhooks - TypeScript Edition.

## Features

- **Send Messages**: Post messages to Discord channels via webhooks
- **Release Announcements**: Send beautifully formatted release announcements with rich embeds
- **Teaser Announcements**: Send "coming soon" style teasers for upcoming releases
- **Changelog Posts**: Send structured changelogs (Added/Changed/Fixed) as rich embeds or plain text
- **Webhook Management**: Add, remove, and list webhook configurations
- **Secure Storage**: Webhook URLs stored locally with partial URL display for security
- **Type Safe**: Built with TypeScript and Zod validation for runtime safety

## Technology Stack

- **Runtime**: Bun (fast JavaScript runtime with native TypeScript support)
- **MCP SDK**: `@modelcontextprotocol/sdk` (official TypeScript implementation)
- **HTTP Client**: axios for Discord webhook API calls
- **Validation**: Zod for runtime type validation
- **Language**: TypeScript with strict mode enabled

## Quick Start

**Nix (Remote - No Clone!):**
```bash
nix run github:MoshPitLabs/mcp-discord
```

**Docker (Local):**
```bash
git clone https://github.com/MoshPitLabs/mcp-discord.git && cd mcp-discord
docker build -t discord-mcp-server .
docker run -i discord-mcp-server
```

## Installation

### Prerequisites

- Bun 1.0+ or Node.js 20+ (Bun recommended for best performance)
- Discord server with webhook access

### Using Bun (Recommended)

```bash
# Clone the repository
git clone https://github.com/MoshPitCodes/mcp-server-discord.git ~/.opencode/mcp-servers/mcp-discord
cd ~/.opencode/mcp-servers/mcp-discord

# Install dependencies
bun install

# Build the server
bun run build
```

### Using Node.js

```bash
cd ~/.opencode/mcp-servers/mcp-discord
npm install
npm run build
```

### Using Docker

```bash
# Clone the repository first
git clone https://github.com/MoshPitCodes/mcp-server-discord.git
cd mcp-server-discord

# Build the Docker image
docker build -t discord-mcp-server .

# Run the server (interactive mode for stdio communication)
docker run -i discord-mcp-server

# Or with volume mount for persistent webhook configuration
docker run -i -v ~/.config/discord_mcp:/root/.config/discord_mcp discord-mcp-server

# Using docker-compose
docker-compose up -d
```

### NixOS with Flakes

**Remote Build (from GitHub - no clone needed!):**
```bash
# Run directly from remote
nix run github:MoshPitLabs/mcp-discord

# Build from remote
nix build github:MoshPitLabs/mcp-discord

# Pin to a specific commit or tag
nix run github:MoshPitLabs/mcp-discord/v2.0.0

# Generate MCP client configuration
nix run github:MoshPitLabs/mcp-discord#generate-config -- claude-code
nix run github:MoshPitLabs/mcp-discord#generate-config -- vscode
```

**Local Build:**
```bash
# Enter development environment (automatically installs dependencies)
nix develop

# Build and run the package
nix build
./result/bin/discord-mcp --version

# Or run directly
nix run
```

## Configuration

### 1. Add to OpenCode

Add to your OpenCode configuration:

**For Bun users:**
```bash
opencode mcp add discord --scope user -- bun ~/.opencode/mcp-servers/mcp-discord/src/index.ts
```

**For Node.js users:**
```bash
opencode mcp add discord --scope user -- node ~/.opencode/mcp-servers/mcp-discord/dist/index.js
```

Or manually add to `~/.opencode.json`:

```json
{
  "mcpServers": {
    "discord": {
      "command": "bun",
      "args": ["~/.opencode/mcp-servers/mcp-discord/src/index.ts"]
    }
  }
}
```

### 2. Verify Connection

```bash
opencode mcp list
# Should show: discord: ... - ✓ Connected
```

### 3. Configure Webhooks

Each tool uses a dedicated webhook, allowing you to route different message types to different channels:

- **`messages`** - Used by `discord_send_message`
- **`releases`** - Used by `discord_send_announcement`
- **`teasers`** - Used by `discord_send_teaser`
- **`changelog`** - Used by `discord_send_changelog`

**To get your Discord webhook URL:**
1. Go to your Discord server
2. **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Choose a name and channel (e.g., "releases" webhook → #releases channel)
5. **Copy Webhook URL**
6. Use the `discord_add_webhook` tool in OpenCode to add it with the appropriate name

**Example setup:**
```
discord_add_webhook messages <webhook-url> "General messages"
discord_add_webhook releases <webhook-url> "Release announcements"
discord_add_webhook teasers <webhook-url> "Teaser announcements"
discord_add_webhook changelog <webhook-url> "Changelog posts"
```

### Environment Variables (Optional)

- `DISCORD_MCP_CONFIG_DIR`: Custom directory for webhook configurations (default: `~/.config/discord_mcp`)

## Usage

Simply ask OpenCode in natural language! The MCP server tools will be invoked automatically.

### Send a Simple Message

```
Send "Hello from OpenCode!" to the releases webhook
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
- Donation section

### Send a Teaser

```
Send a teaser for v3.0.0 with:
- Headline: A Complete Rewrite
- Highlights: New architecture, Better performance, Modern UI
```

## Tools

### discord_send_message

Send a plain text message to a Discord channel. **Uses the `messages` webhook.**

**Parameters:**
- `content` (required): Message content (max 2000 chars)
- `username` (optional): Override webhook username
- `avatarUrl` (optional): Override webhook avatar
- `responseFormat` (optional): `markdown` or `json`

### discord_send_announcement

Send a formatted release announcement with rich Discord embeds. **Uses the `releases` webhook.**

**Parameters:**
- `version` (required): Version number (e.g., "v2.6.0-beta")
- `headline` (required): Main announcement headline (max 256 chars)
- `changes` (required): Array of changes/features (1-10 items)
- `downloadUrl` (optional): Download/info URL
- `style` (optional): `release` (green) / `hotfix` (red) / `beta` (yellow) / `custom` (blue)
- `betaWarning` (optional): Include backup warning
- `useEmbed` (optional): Use rich embed format (default: true)
- `embedColor` (optional): Custom hex color (e.g., "#5865F2")
- `thumbnailUrl` (optional): Custom thumbnail URL (defaults to Living Lands logo)
- `footerText` (optional): Custom footer text
- `username` (optional): Override webhook display name
- `responseFormat` (optional): `markdown` or `json`

**Embed Format:**
- Colored sidebar based on style
- Version title with emoji (📦 release, 🧪 beta, 🚨 hotfix, 📢 custom)
- Headline as description
- "What's New" field with changes
- Optional warning field
- Download link field
- Living Lands logo thumbnail (automatic)
- Donation section (automatic)
- Timestamp footer

### discord_send_teaser

Send a teaser/preview announcement for upcoming releases. **Uses the `teasers` webhook.**

**Parameters:**
- `version` (required): Version number
- `headline` (required): Teaser headline
- `highlights` (required): Array of features to highlight (1-10 items)
- `additionalInfo` (optional): Additional context (max 500 chars)
- `style` (optional): Teaser style (default: `custom`)
- `thumbnailUrl` (optional): Custom thumbnail URL
- `footerText` (optional): Custom footer text
- `username` (optional): Override webhook username
- `responseFormat` (optional): `markdown` or `json`

### discord_add_webhook

Add or update a webhook configuration.

**Parameters:**
- `name` (required): Friendly name for the webhook
- `url` (required): Discord webhook URL
- `description` (optional): What this webhook is for

**Note:** Webhook names are automatically sanitized (lowercase, spaces replaced with underscores).

### discord_remove_webhook

Remove a webhook configuration.

**Parameters:**
- `name` (required): Name of webhook to remove

### discord_list_webhooks

List all configured webhooks (URLs partially hidden for security).

**Parameters:**
- `responseFormat` (optional): `markdown` or `json`

### discord_send_changelog

Send a structured changelog post with sections (e.g., Added/Changed/Fixed). **Uses the `changelog` webhook.**

**Parameters:**
- `title` (required): Changelog title (max 256 chars)
- `sections` (required): Array of sections (1-25). Each: `{ title: string, items: string[] }`
- `version` (optional): Version string (e.g., "v1.2.3")
- `summary` (optional): Intro text (max 2000 chars)
- `url` (optional): Link to release notes/download
- `style` (optional): `release` / `hotfix` / `beta` / `custom`
- `useEmbed` (optional): Use embed format (default: true)
- `embedColor` (optional): Custom hex color (e.g., "#5865F2")
- `thumbnailUrl` (optional): Custom thumbnail URL
- `footerText` (optional): Custom footer text
- `username` (optional): Override webhook username
- `responseFormat` (optional): `markdown` or `json`

## Development

### Project Structure

```
mcp-discord/
├── src/
│   ├── index.ts                    # Server entry point & MCP setup
│   ├── constants.ts                # Global configuration constants
│   ├── types/
│   │   ├── enums.ts               # ResponseFormat, AnnouncementStyle
│   │   ├── schemas.ts             # Zod validation schemas
│   │   └── interfaces.ts          # TypeScript interfaces
│   ├── utils/
│   │   ├── storage.ts             # Webhook storage (JSON file I/O)
│   │   ├── webhook.ts             # Discord webhook HTTP operations
│   │   ├── embed.ts               # Discord embed builders
│   │   └── errors.ts              # Centralized error handling
│   └── tools/
│       ├── sendMessage.ts         # discord_send_message tool
│       ├── sendAnnouncement.ts    # discord_send_announcement tool
│       ├── sendTeaser.ts          # discord_send_teaser tool
│       ├── addWebhook.ts          # discord_add_webhook tool
│       ├── removeWebhook.ts       # discord_remove_webhook tool
│       └── listWebhooks.ts        # discord_list_webhooks tool
├── dist/                          # Compiled output (generated)
├── package.json                   # Project metadata & dependencies
├── tsconfig.json                  # TypeScript configuration
└── flake.nix                      # NixOS development environment
```

### Scripts

```bash
# Development mode (watch & reload)
bun run dev

# Build for production
bun run build

# Run production build
bun run start

# Type check without building
bun run typecheck
```

### Type Safety

The server uses strict TypeScript mode with Zod for runtime validation:
- All inputs are validated against Zod schemas
- Type inference from schemas ensures consistency
- No `any` types in the codebase
- Comprehensive error handling

## Security

- Webhook URLs are stored locally in `~/.config/discord_mcp/webhooks.json`
- Full URLs are never displayed in tool outputs (only last 8 characters shown)
- Keep your configuration file secure as webhook URLs allow posting to channels
- The `webhooks.json` file is gitignored by default

## Performance

- **Startup time**: ~50ms
- **Memory usage**: ~30MB
- **Type safety**: Compile-time + runtime validation
- **Bundle size**: ~1.3MB (includes all dependencies)

## Troubleshooting

### Server won't start

```bash
# Check if dependencies are installed
bun install

# Verify TypeScript compilation
bun run typecheck

# Try rebuilding
bun run build
```

### Webhook not found errors

```bash
# List configured webhooks
# (use discord_list_webhooks tool in OpenCode)

# Add a webhook
# (use discord_add_webhook tool in OpenCode)
```

### Discord API errors

Common errors and solutions:
- **400 Bad Request**: Message content exceeds 2000 characters or invalid format
- **401 Unauthorized**: Webhook URL is invalid or expired
- **403 Forbidden**: Webhook has been deleted from Discord
- **404 Not Found**: Webhook URL is incorrect
- **429 Rate Limited**: Too many requests, wait before retrying

## License

MIT

## Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Discord Webhook Documentation](https://discord.com/developers/docs/resources/webhook)
- [Bun Documentation](https://bun.sh/)
- [Technical Design Document](./TECHNICAL_DESIGN.md)
