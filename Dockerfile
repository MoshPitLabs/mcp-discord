# Multi-stage build for Discord MCP Server
FROM oven/bun:1.2.5-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the project
RUN bun run build

# Production image
FROM oven/bun:1.2.5-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create config directory for webhook storage
RUN mkdir -p /root/.config/discord_mcp

# Set environment variable for config directory
ENV DISCORD_MCP_CONFIG_DIR=/root/.config/discord_mcp

# Run the server
CMD ["bun", "run", "dist/index.js"]
