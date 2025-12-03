#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, toolHandlers } from './tools/index.js';
import { config } from './config.js';

/**
 * MemoryCloud MCP Server
 *
 * Provides MCP tools for interacting with the MemoryCloud API:
 * - list_projects: List all projects
 * - search_context: Search for relevant context
 * - record_interaction: Record messages in memory
 * - create_project: Create new projects
 */

// Create MCP server instance
const server = new Server(
  {
    name: 'memorycloud-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Get the appropriate tool handler
    const handler = toolHandlers[name as keyof typeof toolHandlers];

    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute the tool
    const result = await handler(args as any);

    return result;
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  try {
    // Use stdio transport for Claude Desktop integration
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Log to stderr so it doesn't interfere with MCP protocol on stdout
    console.error('MemoryCloud MCP Server started');
    console.error(`API URL: ${config.apiUrl}`);
    console.error(`API Key configured: ${config.apiKey ? 'Yes' : 'No (using dev mode)'}`);
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();
