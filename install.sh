#!/usr/bin/env bash
# Installation script for Discord MCP Server
# Copies only essential files needed to run the server

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Target directory
TARGET_DIR="$HOME/.opencode/mcp-servers/mcp-discord"

echo -e "${BLUE}Discord MCP Server - Installation Script${NC}"
echo "=========================================="
echo ""

# Create target directory
echo -e "${YELLOW}Creating target directory...${NC}"
mkdir -p "$TARGET_DIR"

# Copy essential files
echo -e "${YELLOW}Copying source files...${NC}"
rsync -av \
	--include='src/***' \
	--include='package.json' \
	--include='tsconfig.json' \
	--include='bun.lock' \
	--include='flake.nix' \
	--include='flake.lock' \
	--exclude='*' \
	./ "$TARGET_DIR/"

# Navigate to target directory
cd "$TARGET_DIR"

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
bun install

# Build the project
echo ""
echo -e "${YELLOW}Building the project...${NC}"
bun run build

# Verify build
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
if [ -f "$TARGET_DIR/dist/index.js" ]; then
	echo -e "${GREEN}✓ Build successful${NC}"
else
	echo -e "${RED}✗ Build failed${NC}"
	exit 1
fi

# Display completion message
echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Installation directory: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "1. Add to OpenCode:"
echo "   ${BLUE}opencode mcp add discord --scope user -- bun $TARGET_DIR/src/index.ts${NC}"
echo ""
echo "2. Verify connection:"
echo "   ${BLUE}opencode mcp list${NC}"
echo ""
echo "3. Configure webhooks:"
echo "   Use the discord_add_webhook tool in OpenCode"
echo ""
