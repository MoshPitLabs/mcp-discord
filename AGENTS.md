# Agent Instructions for Discord MCP Server

This document provides guidance for AI agents working on the Discord MCP Server project.

## Project Overview

**Discord MCP Server** is a Model Context Protocol (MCP) server that provides Discord webhook integration for AI assistants like Claude Code. Built with TypeScript and Bun, it enables seamless Discord communication through 7 MCP tools.

**Tech Stack:**
- **Runtime**: Bun (fast JavaScript runtime)
- **Language**: TypeScript with strict mode
- **Validation**: Zod for runtime type safety
- **HTTP Client**: axios for Discord API calls
- **MCP SDK**: Official `@modelcontextprotocol/sdk`

## Key Project Files

### Core Implementation
- `src/index.ts` - MCP server entry point, tool registration
- `src/constants.ts` - Configuration constants
- `src/types/` - TypeScript types and Zod schemas
  - `enums.ts` - ResponseFormat, AnnouncementStyle enums
  - `schemas.ts` - Zod validation schemas
  - `interfaces.ts` - TypeScript interfaces
- `src/tools/` - MCP tool implementations (7 tools)
- `src/utils/` - Utility functions
  - `storage.ts` - Webhook configuration storage
  - `webhook.ts` - Discord API HTTP operations
  - `embed.ts` - Discord embed builders
  - `errors.ts` - Error handling

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `bun.lock` - Dependency lock file
- `flake.nix` - NixOS development environment

### Documentation
- `README.md` - User documentation
- `TECHNICAL_DESIGN.md` - Architecture and design decisions
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `TESTING_GUIDE.md` - Testing procedures
- `CLAUDE.md` - Bun-specific instructions for AI agents

## Development Guidelines

### Using Bun (Not Node.js)

**Always use Bun commands** as specified in `CLAUDE.md`:

```bash
# Run the server
bun run src/index.ts

# Install dependencies
bun install

# Build the project
bun run build

# Type check
bun run typecheck
```

### Code Style

1. **TypeScript Strict Mode**: All code must pass strict type checking
2. **Zod Validation**: Use Zod schemas for runtime validation
3. **Async/Await**: Use modern async patterns consistently
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **No Magic Numbers**: Use constants from `src/constants.ts`

### File Naming Conventions

- Tool files: `camelCase.ts` (e.g., `sendMessage.ts`)
- Type files: `camelCase.ts` (e.g., `schemas.ts`)
- Utility files: `camelCase.ts` (e.g., `webhook.ts`)

### Common Tasks

#### Adding a New MCP Tool

1. Create tool file in `src/tools/newTool.ts`
2. Add Zod schema in `src/types/schemas.ts`
3. Add TypeScript interface in `src/types/interfaces.ts`
4. Register tool in `src/index.ts` (ListToolsRequestSchema and CallToolRequestSchema)
5. Update documentation in `README.md`
6. Add tests in `TESTING_GUIDE.md`

#### Modifying Discord Embed Format

1. Update builder functions in `src/utils/embed.ts`
2. Update `DiscordEmbed` interface in `src/types/interfaces.ts` if needed
3. Test with real Discord webhooks

#### Changing Validation Rules

1. Modify schemas in `src/types/schemas.ts`
2. TypeScript types will auto-update (using `z.infer<>`)
3. Update documentation if user-facing

## MCP Tools

The server provides 7 MCP tools:

1. **discord_send_message** - Send plain text messages
2. **discord_send_announcement** - Send rich release announcements
3. **discord_send_teaser** - Send teaser/preview announcements
4. **discord_send_changelog** - Send structured changelog posts
5. **discord_add_webhook** - Add or update webhook configurations
6. **discord_remove_webhook** - Remove webhook configurations
7. **discord_list_webhooks** - List all configured webhooks

## Testing

### Manual Testing

```bash
# 1. Build the server
bun run build

# 2. Test type checking
bun run typecheck

# 3. Run the server
bun run src/index.ts

# 4. Configure OpenCode to use the server
opencode mcp add discord --scope user -- bun ~/Development/mcp-discord/src/index.ts

# 5. Test each tool in OpenCode
# - Add a webhook
# - Send a message
# - Send an announcement
# - List webhooks
# - Remove webhook
```

See `TESTING_GUIDE.md` for comprehensive testing procedures.

## Architecture Principles

### Type Safety

- **Compile-time**: TypeScript strict mode catches type errors
- **Runtime**: Zod validates all inputs at runtime
- **Single Source of Truth**: Zod schemas → TypeScript types via `z.infer<>`

### Error Handling

All errors return structured responses:
```typescript
{
  success: boolean;
  error?: string;
  message?: string;
}
```

User-friendly error messages for common Discord API errors (400, 401, 403, 404, 429).

### Storage

- Webhooks stored in `~/.config/discord_mcp/webhooks.json`
- Format: `{ [name: string]: { url: string, description?: string, addedAt: string } }`
- URLs sanitized in listings (only last 8 chars shown for security)

## Common Pitfalls to Avoid

1. **Don't use Node.js commands** - Always use Bun (see `CLAUDE.md`)
2. **Don't skip Zod validation** - All tool inputs must be validated
3. **Don't use `any` type** - Strict mode disallows this
4. **Don't hardcode values** - Use `src/constants.ts`
5. **Don't expose full webhook URLs** - Sanitize in tool responses
6. **Don't forget `.js` extensions** - TypeScript imports need `.js` with bundler mode

## Build and Deployment

### Build Process

```bash
bun run build
# Output: dist/index.js (1.26 MB bundled)
```

### Installation Script

The `install.sh` script copies essential files to `~/.opencode/mcp-servers/mcp-discord/`:

```bash
./install.sh
```

Only includes:
- `src/` directory
- `package.json`
- `tsconfig.json`
- `bun.lock`
- `flake.nix`
- `flake.lock`

Excludes:
- Documentation (`.md` files)
- Git files
- Python remnants
- Test files

## Discord API Integration

### Webhook Format

Discord webhooks accept:
```typescript
{
  content?: string;           // Plain text message
  username?: string;          // Override webhook username
  avatar_url?: string;        // Override webhook avatar
  embeds?: DiscordEmbed[];    // Rich embeds
}
```

### Embed Structure

```typescript
{
  title?: string;             // Embed title
  description?: string;       // Main content
  color?: number;            // Sidebar color (decimal, not hex)
  fields?: Array<{           // Content sections
    name: string;
    value: string;
    inline?: boolean;
  }>;
  thumbnail?: { url: string };
  footer?: { text: string };
  timestamp?: string;        // ISO 8601 format
}
```

### Rate Limits

Discord rate limits webhook requests. The server handles this with:
- 30-second timeout on HTTP requests
- User-friendly 429 error messages
- Axios retry logic (built-in)

## Environment Variables

- `DISCORD_MCP_CONFIG_DIR` - Override webhook storage directory (default: `~/.config/discord_mcp`)

## Troubleshooting

### Common Issues

**Build fails:**
```bash
bun install
bun run build
```

**Type errors:**
```bash
bun run typecheck
# Fix errors shown
```

**Server won't start:**
```bash
# Check dependencies
bun install

# Verify build
bun run build

# Check for port conflicts (none - uses stdio)
```

**Webhook not found:**
- Use `discord_list_webhooks` to see configured webhooks
- Use `discord_add_webhook` to add webhooks

## Performance Targets

- **Startup time**: < 100ms
- **Memory usage**: < 50MB
- **Build time**: < 5 seconds
- **Bundle size**: ~1.3MB

## Contributing

When making changes:

1. **Create feature branch** from `develop`
2. **Make changes** following guidelines above
3. **Test thoroughly** (see `TESTING_GUIDE.md`)
4. **Update documentation** (`README.md`, `TECHNICAL_DESIGN.md`)
5. **Create PR** using `.github/pull_request_template.md`
6. **Ensure CI passes** (type checking, build)

## Agent-Specific Tips

### For Code Review Agents

- Check TypeScript strict mode compliance
- Verify Zod schemas match interfaces
- Ensure error handling is comprehensive
- Review Discord API usage for best practices

### For Documentation Agents

- Keep user docs (README.md) separate from technical docs
- Use examples from `TESTING_GUIDE.md`
- Update all relevant docs when features change

### For Testing Agents

- Follow procedures in `TESTING_GUIDE.md`
- Test all 7 MCP tools
- Verify Discord webhook integration
- Check error handling paths

### For Refactoring Agents

- Maintain type safety (no `any` types)
- Keep Zod schemas and interfaces in sync
- Don't break MCP tool contracts
- Update documentation after refactoring

## Questions?

- See `TECHNICAL_DESIGN.md` for architecture details
- See `TESTING_GUIDE.md` for testing procedures
- See `README.md` for user-facing documentation
- See `CLAUDE.md` for Bun-specific instructions
