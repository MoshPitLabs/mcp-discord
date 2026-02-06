# Docker and Nix Build Guide

Quick reference for building the Discord MCP Server using Docker or Nix.

## TL;DR

```bash
# Docker (local only - requires clone)
git clone <repo> && cd <repo>
docker build -t discord-mcp-server .
docker run -i discord-mcp-server

# Nix (can build from remote!)
nix run github:MoshPitCodes/mcp-server-discord
# No git clone needed! ^^^
```

## Docker Build (Local Only)

### Why Docker?

- ✅ Container-ready deployment
- ✅ Isolated runtime environment
- ✅ Works on any platform (Linux/Mac/Windows)
- ✅ Small production image (~100MB)
- ❌ **Requires local clone** - cannot build from remote

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/MoshPitCodes/mcp-server-discord.git
cd mcp-server-discord

# 2. Build the image
docker build -t discord-mcp-server .

# 3. Run the server
docker run -i discord-mcp-server
```

### With Persistent Storage

```bash
# Mount webhook configuration directory
docker run -i \
  -v ~/.config/discord_mcp:/root/.config/discord_mcp \
  discord-mcp-server
```

### Using Docker Compose

```bash
# Start the server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

### Dockerfile Details

**Multi-stage Build:**

```dockerfile
# Stage 1: Builder (installs deps, builds TypeScript)
FROM oven/bun:1.2.5-alpine AS builder
# ... build process ...

# Stage 2: Production (only built files + runtime)
FROM oven/bun:1.2.5-alpine
# ... copy dist/ and node_modules only ...
```

**What's Included:**
- Bun runtime
- Built JavaScript (`dist/`)
- Production dependencies (`node_modules/`)
- Config directory

**What's Excluded:**
- Source TypeScript files
- Development dependencies
- Documentation
- Git history

## Nix Flake Build (Local + Remote)

### Why Nix?

- ✅ **Build from remote without cloning!**
- ✅ Reproducible builds (bit-for-bit identical)
- ✅ Cached dependencies (fast rebuilds)
- ✅ Pin to specific commits/tags/branches
- ✅ Isolated build environment
- ⚠️ Primarily for Linux/macOS

### Quick Start (Remote)

The killer feature - no clone needed:

```bash
# Run directly from GitHub
nix run github:MoshPitCodes/mcp-server-discord

# Build from GitHub
nix build github:MoshPitCodes/mcp-server-discord

# Dev shell from GitHub
nix develop github:MoshPitCodes/mcp-server-discord
```

### Quick Start (Local)

```bash
# Clone the repository
git clone https://github.com/MoshPitCodes/mcp-server-discord.git
cd mcp-server-discord

# Build
nix build

# Run
./result/bin/discord-mcp
```

### Advanced Remote Usage

```bash
# Build from specific branch
nix build github:MoshPitCodes/mcp-server-discord/develop

# Build from specific commit
nix build github:MoshPitCodes/mcp-server-discord/abc123def456

# Build from tag
nix build github:MoshPitCodes/mcp-server-discord/v2.0.0

# Run without building (doesn't leave result/ artifact)
nix run github:MoshPitCodes/mcp-server-discord/v2.0.0
```

### Flake Outputs

The flake provides three outputs:

1. **`packages.default`** - The built MCP server
2. **`apps.default`** - Runnable app wrapper
3. **`devShells.default`** - Development environment

```bash
# Use the package
nix build

# Use the app
nix run

# Use the dev shell
nix develop
```

### Development Shell

```bash
# Enter dev shell (local)
nix develop

# Enter dev shell (remote)
nix develop github:MoshPitCodes/mcp-server-discord

# Inside the shell:
bun install      # Install dependencies
bun run dev      # Run in dev mode
bun run build    # Build for production
docker build ... # Docker is available too!
```

## Comparison Matrix

| Feature | Docker | Nix Flake |
|---------|--------|-----------|
| **Build from Remote** | ❌ No | ✅ Yes |
| **Reproducible** | ✅ Yes | ✅ Yes |
| **Container Ready** | ✅ Native | ⚠️ Can export |
| **Cross Platform** | ✅ Full | ⚠️ Linux/macOS |
| **Build Speed** | Medium | Fast (cached) |
| **Image Size** | ~100MB | ~200MB |
| **Requires Install** | Docker | Nix |
| **Pin to Commit** | ❌ No | ✅ Yes |
| **Dependency Cache** | Layer cache | Nix store |
| **Isolation** | Container | Nix store |

## Use Cases

### When to Use Docker

- ✅ Deploying to container orchestration (Kubernetes, ECS, etc.)
- ✅ Need runtime isolation
- ✅ Already using Docker in your stack
- ✅ Need Windows support
- ❌ Building in CI/CD from remote

### When to Use Nix

- ✅ **Building from GitHub without cloning**
- ✅ Need reproducible builds
- ✅ Want to pin to specific versions
- ✅ Already using NixOS/Nix
- ✅ CI/CD with build caching
- ❌ Need Windows support

### When to Use Both

You can use both! Common workflow:

1. **Development**: Use Nix dev shell (`nix develop`)
2. **Local Testing**: Use Docker (`docker build && docker run`)
3. **CI/CD**: Use Nix for fast cached builds
4. **Production**: Use Docker for deployment

## Integration Examples

### Claude Code Configuration

**Using Docker:**
```json
{
  "mcpServers": {
    "discord": {
      "command": "docker",
      "args": ["run", "-i", "discord-mcp-server"]
    }
  }
}
```

**Using Nix:**
```json
{
  "mcpServers": {
    "discord": {
      "command": "nix",
      "args": ["run", "github:MoshPitCodes/mcp-server-discord"]
    }
  }
}
```

### GitHub Actions (Docker)

```yaml
name: Build Docker
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t discord-mcp-server .
      - name: Test
        run: docker run -i discord-mcp-server --help
```

### GitHub Actions (Nix)

```yaml
name: Build Nix
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: cachix/install-nix-action@v22
        with:
          enable_flakes: true
      - name: Build from remote
        run: nix build github:${{ github.repository }}/${{ github.sha }}
      - name: Test
        run: ./result/bin/discord-mcp --help
```

Notice: Nix doesn't need `actions/checkout` - it can build directly from GitHub!

## Troubleshooting

### Docker Issues

**Build fails:**
```bash
docker builder prune
docker build --no-cache -t discord-mcp-server .
```

**Can't run container:**
```bash
# Check logs
docker logs <container-id>

# Run with shell
docker run -it --entrypoint sh discord-mcp-server
```

### Nix Issues

**Flake check fails:**
```bash
nix flake check --show-trace
```

**Build fails:**
```bash
# Update flake inputs
nix flake update

# Clear cache
nix-collect-garbage -d

# Rebuild
nix build --print-build-logs
```

**Remote build fails:**
```bash
# Check GitHub is accessible
nix flake show github:MoshPitCodes/mcp-server-discord

# Try with specific commit
nix build github:MoshPitCodes/mcp-server-discord/<commit-hash>
```

## Performance Tips

### Docker

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build -t discord-mcp-server .

# Multi-platform builds
docker buildx build --platform linux/amd64,linux/arm64 \
  -t discord-mcp-server .
```

### Nix

```bash
# Use binary cache (automatic with nixpkgs)
nix build --option substitute true

# Build in parallel
nix build -j8

# Keep build artifacts
nix build --keep-going
```

## Security Considerations

### Docker

- ✅ Base image: `oven/bun:1.2.5-alpine` (official, maintained)
- ✅ Multi-stage build (no build tools in production)
- ✅ Non-privileged user (runs as bun user)
- ⚠️ Webhook config stored in container (mount volume for persistence)

### Nix

- ✅ Isolated build environment (no network access during build)
- ✅ Reproducible (can verify builds match)
- ✅ Content-addressed storage (tamper-evident)
- ⚠️ Remote builds trust GitHub (use commit pinning for security)

## Next Steps

- See [BUILD.md](./BUILD.md) for detailed build instructions
- See [README.md](./README.md) for usage documentation
- See [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) for architecture details
