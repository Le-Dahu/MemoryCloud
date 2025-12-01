# MemoryCloud

MemoryCloud - Inter-AI Memory Service accessible via MCP

## Structure

- `apps/api` - Fastify backend API
- `packages/mcp-server` - MCP server implementation
- `docs/` - Documentation

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Run in development mode
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

## Development

This project uses pnpm workspaces for monorepo management.
