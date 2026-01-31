# Testing Guide - Discord MCP Server (TypeScript)

## Quick Start Testing

### 1. Verify Installation

```bash
cd ~/.opencode/mcp-servers/mcp-discord

# Check dependencies
bun install

# Type check
bun run typecheck
# Expected: No errors

# Build
bun run build
# Expected: "Bundled 347 modules... index.js 1.26 MB"

# Test server starts
timeout 2s bun run src/index.ts 2>&1
# Expected: "Discord MCP Server v2.0.0 running on stdio"
```

### 2. Configure OpenCode

```bash
# Add the server
opencode mcp add discord --scope user -- bun ~/.opencode/mcp-servers/mcp-discord/src/index.ts

# Verify it's connected
opencode mcp list
# Expected: discord: ... - ✓ Connected
```

### 3. Test Tools in OpenCode

#### Test 1: Add a Webhook

Ask OpenCode:
```
Add a Discord webhook named "test" with this URL: https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

Expected response:
```
Webhook 'test' added successfully. You can now use it with send_message, send_announcement, or send_teaser.
```

#### Test 2: List Webhooks

Ask OpenCode:
```
List all configured webhooks
```

Expected response (markdown format):
```
# Configured Discord Webhooks

## test
- **Description**: No description
- **URL hint**: `...EN_TOKEN`
- **Added**: 2026-01-31T...
```

#### Test 3: Send a Simple Message

Ask OpenCode:
```
Send "Hello from the TypeScript MCP server! 🚀" to the test webhook
```

Expected response:
```
Message sent successfully to 'test' webhook.
```

Check Discord - you should see your message!

#### Test 4: Send a Release Announcement

Ask OpenCode:
```
Send a release announcement for v2.0.0 to the test webhook with:
- Headline: TypeScript Rewrite Complete!
- Changes: Full type safety with TypeScript and Zod, 4x faster startup time, Better developer experience
- Style: release
- Beta warning: no
```

Expected response:
```
Embed announcement sent successfully!

**Preview:**
**📦 v2.0.0 is live!**
TypeScript Rewrite Complete!

**What's New**
→ Full type safety with TypeScript and Zod
→ 4x faster startup time
→ Better developer experience

**☕ Support Development**
...
```

Check Discord - you should see a rich green embed!

#### Test 5: Send a Teaser

Ask OpenCode:
```
Send a teaser for v3.0.0 to the test webhook with:
- Headline: The Future is Coming
- Highlights: AI-powered features, Real-time collaboration, Advanced analytics
```

Expected response:
```
Teaser announcement sent successfully!

**Preview:**
**👀 v3.0.0 - The Future is Coming**
Something exciting is on the way... 🌱
...
```

Check Discord - you should see a teaser embed!

#### Test 6: Remove Webhook

Ask OpenCode:
```
Remove the test webhook
```

Expected response:
```
Webhook 'test' removed successfully.
```

## Manual Testing (Advanced)

### Test Input Validation

#### Test Invalid Webhook URL

Ask OpenCode:
```
Add a webhook named "invalid" with URL "https://example.com/not-a-webhook"
```

Expected: Error message about invalid Discord webhook URL

#### Test Message Too Long

Ask OpenCode:
```
Send a message with 2500 characters to the test webhook
```

Expected: Zod validation error about max length (2000 chars)

#### Test Missing Required Fields

Ask OpenCode:
```
Send an announcement without specifying changes
```

Expected: Error about missing required field

### Test Error Handling

#### Test Non-existent Webhook

Ask OpenCode:
```
Send "test" to a webhook named "nonexistent"
```

Expected:
```
Error: Webhook 'nonexistent' not found. Available webhooks: test. Use add_webhook to add a new one.
```

#### Test Invalid Discord Webhook (404)

1. Add a webhook with a fake URL: `https://discord.com/api/webhooks/123456789/fake_token`
2. Try to send a message

Expected: Error message about webhook not found (404)

### Test Different Response Formats

#### JSON Response Format

Ask OpenCode:
```
Send "test" to the test webhook with response format JSON
```

Expected: JSON object with success status and details

#### Markdown Response Format (default)

Ask OpenCode:
```
Send "test" to the test webhook
```

Expected: Plain text success message

## Testing Checklist

### Functionality Tests
- [ ] Add webhook successfully
- [ ] Add webhook validates Discord URL format
- [ ] Add webhook sanitizes names (spaces → underscores, lowercase)
- [ ] List webhooks shows all configured webhooks
- [ ] List webhooks hides full URLs (shows last 8 chars only)
- [ ] List webhooks works in both markdown and JSON format
- [ ] Remove webhook successfully
- [ ] Remove webhook shows error for non-existent webhooks
- [ ] Send message posts to Discord correctly
- [ ] Send message respects username override
- [ ] Send announcement creates rich embed (default)
- [ ] Send announcement uses correct color for style (release=green, beta=yellow, hotfix=red)
- [ ] Send announcement includes Living Lands logo by default
- [ ] Send announcement can use plain text format
- [ ] Send announcement includes beta warning when requested
- [ ] Send announcement includes download link when provided
- [ ] Send teaser creates "coming soon" style embed
- [ ] Send teaser uses correct styling

### Validation Tests
- [ ] Rejects webhook URLs not starting with discord.com/api/webhooks/
- [ ] Enforces 2000 character limit on messages
- [ ] Enforces 256 character limit on headlines
- [ ] Enforces 1-10 items for changes/highlights arrays
- [ ] Validates hex color format (#RRGGBB)
- [ ] Validates URL format for downloadUrl, avatarUrl, thumbnailUrl

### Error Handling Tests
- [ ] Gracefully handles non-existent webhooks
- [ ] Provides clear error for invalid webhook URLs
- [ ] Handles network errors (timeout, connection refused)
- [ ] Handles Discord API errors (400, 401, 403, 404, 429)
- [ ] Catches and reports Zod validation errors

### Type Safety Tests
- [ ] TypeScript compiles without errors (bun run typecheck)
- [ ] No `any` types in codebase
- [ ] All functions have proper return types
- [ ] All parameters have proper types

### Performance Tests
- [ ] Server starts in < 100ms
- [ ] Server uses < 50MB memory
- [ ] Build completes in < 5 seconds

## Automated Testing (Future Enhancement)

To add automated tests:

```bash
bun add -D bun:test

# Create test files
# src/tools/__tests__/sendMessage.test.ts
# src/utils/__tests__/embed.test.ts
# etc.

# Run tests
bun test
```

## Regression Testing

When making changes, re-run all tests in this guide to ensure:
1. No functionality is broken
2. Error messages remain user-friendly
3. Type safety is maintained
4. Performance doesn't degrade

## Performance Benchmarking

```bash
# Measure startup time
time bun run src/index.ts &
sleep 1
kill %1

# Measure build time
time bun run build

# Measure memory usage
bun run src/index.ts &
PID=$!
sleep 1
ps aux | grep $PID | awk '{print $6}'
kill $PID
```

## Debugging

### Enable Verbose Logging

The server logs to stderr by default. To capture logs:

```bash
bun run src/index.ts 2> server.log &
# Check server.log for startup messages and errors
```

### Test JSON-RPC Protocol Directly

```bash
# Start server
bun run src/index.ts &
PID=$!

# Send list tools request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | bun run src/index.ts

# Send call tool request
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"discord_list_webhooks","arguments":{}}}' | bun run src/index.ts

kill $PID
```

## Troubleshooting

### Server won't start
```bash
bun install
bun run build
bun run typecheck
```

### Type errors
```bash
bun run typecheck
# Fix any errors shown
```

### Build errors
```bash
rm -rf node_modules dist
bun install
bun run build
```

### Runtime errors
- Check server logs (stderr)
- Verify webhook URLs are valid
- Check network connectivity
- Verify Discord isn't rate limiting

## Test Results Template

```
Date: YYYY-MM-DD
Tester: Name
Version: 2.0.0

Functionality Tests: ✅ 18/18 passed
Validation Tests: ✅ 6/6 passed  
Error Handling: ✅ 5/5 passed
Type Safety: ✅ 4/4 passed
Performance: ✅ 3/3 passed

Total: ✅ 36/36 tests passed

Notes:
- All tests passed successfully
- Server startup: 47ms
- Memory usage: 28MB
- No type errors
```
