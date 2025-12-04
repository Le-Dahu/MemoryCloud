import { ZepClient } from '@getzep/zep-cloud';
import type { Zep } from '@getzep/zep-cloud';

// Initialize ZEP Cloud client singleton
let zepClient: ZepClient | null = null;

function getZepClient(): ZepClient {
  if (!zepClient) {
    // Lazy load config to avoid initialization on module load
    const { config } = require('../config/env');

    if (!config.zep.apiKey) {
      throw new Error('ZEP_API_KEY is not configured');
    }
    zepClient = new ZepClient({ apiKey: config.zep.apiKey });
  }
  return zepClient;
}

/**
 * Adds messages to a ZEP session
 * Sessions are created automatically on first add
 * @param sessionId - The session ID (use project_id or project_id:session_id)
 * @param messages - Array of messages to add
 * @returns Success response from ZEP
 */
export async function addMemory(
  sessionId: string,
  messages: Array<{
    role: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>
): Promise<Zep.SuccessResponse> {
  try {
    const client = getZepClient();

    // Convert messages to ZEP format
    const zepMessages: Zep.Message[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata,
    }));

    // Add memory to session (creates session if it doesn't exist)
    const response = await client.memory.add(sessionId, {
      messages: zepMessages,
    });

    return response;
  } catch (error) {
    console.error('Error adding memory to ZEP:', error);
    throw new Error(`Failed to add memory to ZEP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieves memory for a session
 * @param sessionId - The session ID
 * @returns Memory object with messages, summary, and facts
 */
export async function getMemory(
  sessionId: string
): Promise<Zep.Memory | null> {
  try {
    const client = getZepClient();
    const memory = await client.memory.get(sessionId);
    return memory;
  } catch (error) {
    // Session might not exist yet
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    console.error('Error getting memory from ZEP:', error);
    throw new Error(`Failed to get memory from ZEP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Performs semantic search within a session's memory
 * @param sessionId - The session ID
 * @param query - The search query text
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results with messages, scores, and summaries
 */
export async function searchMemory(
  sessionId: string,
  query: string,
  limit: number = 10
): Promise<Zep.MemorySearchResult[]> {
  try {
    const client = getZepClient();

    // Perform semantic search
    const results = await client.memory.search(sessionId, {
      text: query,
      limit,
    });

    return results;
  } catch (error) {
    // Session might not exist yet, return empty results
    if (error instanceof Error && error.message.includes('404')) {
      return [];
    }
    console.error('Error searching ZEP memory:', error);
    throw new Error(`Failed to search ZEP memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets a session from ZEP
 * @param sessionId - The session ID
 * @returns Session object or null if not found
 */
export async function getSession(
  sessionId: string
): Promise<Zep.Session | null> {
  try {
    const client = getZepClient();
    const session = await client.memory.getSession(sessionId);
    return session;
  } catch (error) {
    // Session might not exist yet
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    console.error('Error getting ZEP session:', error);
    throw new Error(`Failed to get ZEP session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a new session in ZEP
 * Note: Sessions are automatically created on first memory add, so this is optional
 * @param sessionId - The session ID
 * @param metadata - Optional metadata for the session
 * @returns Session object
 */
export async function createSession(
  sessionId: string,
  metadata?: Record<string, unknown>
): Promise<Zep.Session> {
  try {
    const client = getZepClient();
    const session = await client.memory.addSession({
      sessionId,
      metadata,
    });
    return session;
  } catch (error) {
    console.error('Error creating ZEP session:', error);
    throw new Error(`Failed to create ZEP session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates session metadata
 * @param sessionId - The session ID
 * @param metadata - Metadata to update
 * @returns Updated session object
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: Record<string, unknown>
): Promise<Zep.Session> {
  try {
    const client = getZepClient();
    const session = await client.memory.updateSession(sessionId, {
      metadata,
    });
    return session;
  } catch (error) {
    console.error('Error updating ZEP session metadata:', error);
    throw new Error(`Failed to update ZEP session metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes all memory for a session
 * @param sessionId - The session ID
 */
export async function deleteMemory(sessionId: string): Promise<void> {
  try {
    const client = getZepClient();
    await client.memory.delete(sessionId);
  } catch (error) {
    console.error('Error deleting ZEP memory:', error);
    throw new Error(`Failed to delete ZEP memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  addMemory,
  getMemory,
  searchMemory,
  getSession,
  createSession,
  updateSessionMetadata,
  deleteMemory,
};
