#!/usr/bin/env bash
#
# Discord MCP Server - Verification Script
# Verifies the TypeScript implementation is working correctly
#

set -e

echo "=================================="
echo "Discord MCP Server Verification"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run a test
run_test() {
	local test_name=$1
	local test_command=$2

	echo -n "Testing: $test_name... "

	if eval "$test_command" >/dev/null 2>&1; then
		echo -e "${GREEN}✓ PASS${NC}"
		((PASSED++))
		return 0
	else
		echo -e "${RED}✗ FAIL${NC}"
		((FAILED++))
		return 1
	fi
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

run_test "Bun installed" "command -v bun"
run_test "Node.js installed" "command -v node"
run_test "Git repository" "test -d .git"

echo ""
echo "Checking project structure..."
echo ""

run_test "package.json exists" "test -f package.json"
run_test "tsconfig.json exists" "test -f tsconfig.json"
run_test "src/ directory exists" "test -d src"
run_test "src/index.ts exists" "test -f src/index.ts"
run_test "src/types/ directory exists" "test -d src/types"
run_test "src/utils/ directory exists" "test -d src/utils"
run_test "src/tools/ directory exists" "test -d src/tools"

echo ""
echo "Checking dependencies..."
echo ""

if [ ! -d "node_modules" ]; then
	echo -e "${YELLOW}Installing dependencies...${NC}"
	bun install
fi

run_test "node_modules exists" "test -d node_modules"
run_test "@modelcontextprotocol/sdk installed" "test -d node_modules/@modelcontextprotocol"
run_test "axios installed" "test -d node_modules/axios"
run_test "zod installed" "test -d node_modules/zod"

echo ""
echo "Running type checks..."
echo ""

run_test "TypeScript type checking" "bun run typecheck"

echo ""
echo "Building project..."
echo ""

run_test "Build succeeds" "bun run build"
run_test "dist/index.js exists" "test -f dist/index.js"

echo ""
echo "Testing server startup..."
echo ""

# Test that server starts without crashing
if timeout 2s bun run src/index.ts 2>&1 | grep -q "Discord MCP Server"; then
	echo -e "Testing: Server starts... ${GREEN}✓ PASS${NC}"
	((PASSED++))
else
	echo -e "Testing: Server starts... ${RED}✗ FAIL${NC}"
	((FAILED++))
fi

echo ""
echo "Checking documentation..."
echo ""

run_test "README.md exists" "test -f README.md"
run_test "TECHNICAL_DESIGN.md exists" "test -f TECHNICAL_DESIGN.md"
run_test "IMPLEMENTATION_SUMMARY.md exists" "test -f IMPLEMENTATION_SUMMARY.md"
run_test "TESTING_GUIDE.md exists" "test -f TESTING_GUIDE.md"
run_test "MIGRATION_GUIDE.md exists" "test -f MIGRATION_GUIDE.md"

echo ""
echo "Verifying source files..."
echo ""

# Count TypeScript files
TS_FILES=$(find src -name "*.ts" | wc -l)
if [ "$TS_FILES" -eq 15 ]; then
	echo -e "Testing: Source file count (15)... ${GREEN}✓ PASS${NC}"
	((PASSED++))
else
	echo -e "Testing: Source file count (15)... ${RED}✗ FAIL${NC} (found $TS_FILES)"
	((FAILED++))
fi

# Check each expected file
run_test "src/index.ts exists" "test -f src/index.ts"
run_test "src/constants.ts exists" "test -f src/constants.ts"
run_test "src/types/enums.ts exists" "test -f src/types/enums.ts"
run_test "src/types/schemas.ts exists" "test -f src/types/schemas.ts"
run_test "src/types/interfaces.ts exists" "test -f src/types/interfaces.ts"
run_test "src/utils/storage.ts exists" "test -f src/utils/storage.ts"
run_test "src/utils/webhook.ts exists" "test -f src/utils/webhook.ts"
run_test "src/utils/embed.ts exists" "test -f src/utils/embed.ts"
run_test "src/utils/errors.ts exists" "test -f src/utils/errors.ts"
run_test "src/tools/sendMessage.ts exists" "test -f src/tools/sendMessage.ts"
run_test "src/tools/sendAnnouncement.ts exists" "test -f src/tools/sendAnnouncement.ts"
run_test "src/tools/sendTeaser.ts exists" "test -f src/tools/sendTeaser.ts"
run_test "src/tools/addWebhook.ts exists" "test -f src/tools/addWebhook.ts"
run_test "src/tools/removeWebhook.ts exists" "test -f src/tools/removeWebhook.ts"
run_test "src/tools/listWebhooks.ts exists" "test -f src/tools/listWebhooks.ts"

echo ""
echo "=================================="
echo "Verification Results"
echo "=================================="
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
	echo -e "${GREEN}✓ All tests passed!${NC}"
	echo ""
	echo "Next steps:"
	echo "1. Configure Claude Code:"
	echo "   claude mcp add discord --scope user -- bun $(pwd)/src/index.ts"
	echo ""
	echo "2. Verify connection:"
	echo "   claude mcp list"
	echo ""
	echo "3. Start using Discord integration in Claude!"
	exit 0
else
	echo -e "${RED}✗ Some tests failed.${NC}"
	echo ""
	echo "Please check the errors above and try:"
	echo "  bun install    # Install dependencies"
	echo "  bun run build  # Rebuild"
	echo "  ./verify.sh    # Re-run verification"
	exit 1
fi
