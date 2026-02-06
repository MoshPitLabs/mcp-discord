# Build Guide

This document explains how to build the Discord MCP Server using different methods.

## Table of Contents

- [Docker Build](#docker-build)
- [Nix Flake Build](#nix-flake-build)
- [Manual Build](#manual-build)
- [Build Verification](#build-verification)

## Docker Build

Docker builds are **local only** - you must clone the repository first.

### Prerequisites

- Docker 20.10+
- Git

### Basic Docker Build

```bash
# Clone the repository
git clone https://github.com/MoshPitCodes/mcp-server-discord.git
cd mcp-server-discord

# Build the image
docker build -t discord-mcp-server .

# Verify the build
docker images | grep discord-mcp-server
```

### Using Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Running the Docker Container

```bash
# Interactive mode (for stdio communication)
docker run -i discord-mcp-server

# With persistent webhook configuration
docker run -i \
  -v ~/.config/discord_mcp:/root/.config/discord_mcp \
  discord-mcp-server

# With custom config directory
docker run -i \
  -e DISCORD_MCP_CONFIG_DIR=/custom/path \
  -v /host/path:/custom/path \
  discord-mcp-server
```

### Docker Build Details

**Image Layers:**
1. Builder stage: Installs dependencies and builds TypeScript
2. Production stage: Only includes built files and production dependencies

**Image Size:**
- Builder stage: ~200MB
- Production stage: ~100MB

**What's Included:**
- Bun runtime (Alpine-based)
- Built application (`dist/`)
- Production node_modules
- Configuration directory (`/root/.config/discord_mcp`)

**What's Excluded:**
- Source TypeScript files (`.ts`)
- Documentation (`.md` files)
- Development dependencies
- Git history
- IDE configurations

## Nix Flake Build

Nix builds support **both local and remote** builds.

### Prerequisites

- Nix with flakes enabled
- For remote builds: Internet connection only (no git clone needed!)

### Local Build

```bash
# Clone the repository
git clone https://github.com/MoshPitCodes/mcp-server-discord.git
cd mcp-server-discord

# Build the package
nix build

# Run the built package
./result/bin/discord-mcp

# Or run directly without building
nix run
```

### Remote Build (No Clone Needed!)

This is the key advantage of Nix flakes - you can build and run directly from GitHub:

```bash
# Build from remote repository
nix build github:MoshPitCodes/mcp-server-discord

# Run directly from remote (no build artifact)
nix run github:MoshPitCodes/mcp-server-discord

# Enter development shell from remote
nix develop github:MoshPitCodes/mcp-server-discord
```

### Development Environment

```bash
# Local dev shell
nix develop

# Remote dev shell
nix develop github:MoshPitCodes/mcp-server-discord

# Inside the dev shell, you have access to:
# - bun
# - nodejs_23
# - typescript
# - docker
```

### Nix Build Details

**Build Process:**
1. Fetch source from GitHub (remote) or local directory
2. Install dependencies with `bun install --frozen-lockfile`
3. Build TypeScript with `bun run build`
4. Install to Nix store with wrapper script

**Output Structure:**
```
/nix/store/<hash>-discord-mcp-server-2.0.0/
├── bin/
│   └── discord-mcp          # Wrapper script
└── lib/
    └── discord-mcp/
        ├── dist/
        ├── node_modules/
        └── package.json
```

**Advantages of Nix:**
- Reproducible builds (exact same result every time)
- Build from remote without cloning
- Isolated build environment
- Cached dependencies (fast rebuilds)
- Can pin to specific commits: `github:user/repo/commit-hash`

### Using Specific Versions

```bash
# Build from specific branch
nix build github:MoshPitCodes/mcp-server-discord/develop

# Build from specific commit
nix build github:MoshPitCodes/mcp-server-discord/abc123def

# Build from specific tag
nix build github:MoshPitCodes/mcp-server-discord/v2.0.0
```

## Manual Build

For development or when Docker/Nix aren't available.

### Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Build
bun run build

# Run
bun run start

# Or run source directly (development)
bun run dev
```

### Using Node.js

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build
npm run build

# Run
npm run start
```

## Build Verification

### Docker Verification

```bash
# Check image exists
docker images | grep discord-mcp-server

# Check image size
docker images discord-mcp-server --format "{{.Size}}"

# Inspect image layers
docker history discord-mcp-server

# Test run
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i discord-mcp-server
```

### Nix Verification

```bash
# Check build result
ls -lah result/

# Verify executable
file result/bin/discord-mcp

# Test run
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | ./result/bin/discord-mcp

# Check runtime dependencies
nix-store -q --references ./result
```

### Manual Build Verification

```bash
# Check build output
ls -lah dist/

# Verify type checking passes
bun run typecheck

# Test run
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | bun run start
```

## Comparing Build Methods

| Feature | Docker | Nix Flake | Manual |
|---------|--------|-----------|--------|
| Remote Build | ❌ No | ✅ Yes | ❌ No |
| Reproducible | ✅ Yes | ✅ Yes | ⚠️ Depends |
| Build Speed | Medium | Fast (cached) | Fast |
| Container Ready | ✅ Yes | ⚠️ Can export | ❌ No |
| Cross Platform | ✅ Yes | ⚠️ Linux/Mac | ✅ Yes |
| Disk Space | ~100MB | ~200MB | ~50MB |
| Dependencies | Docker | Nix | Bun/Node |

## Troubleshooting

### Docker Build Fails

```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t discord-mcp-server .

# Check logs
docker build -t discord-mcp-server . 2>&1 | tee build.log
```

### Nix Build Fails

```bash
# Update flake inputs
nix flake update

# Clear build cache
nix-collect-garbage -d

# Rebuild with verbose output
nix build --print-build-logs
```

### Manual Build Fails

```bash
# Clean and reinstall
rm -rf node_modules dist
bun install
bun run build

# Check for type errors
bun run typecheck
```

## CI/CD Integration

### GitHub Actions (Docker)

```yaml
- name: Build Docker image
  run: docker build -t discord-mcp-server .

- name: Test Docker image
  run: docker run -i discord-mcp-server --version
```

### GitHub Actions (Nix)

```yaml
- uses: cachix/install-nix-action@v22
  with:
    enable_flakes: true

- name: Build with Nix
  run: nix build

- name: Test
  run: ./result/bin/discord-mcp --version
```

## Next Steps

- [README.md](./README.md) - User documentation
- [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) - Architecture details
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing procedures
