import { ZepClient } from '@getzep/zep-cloud';
import { config } from '../config/env';
import { ZepMemory, ZepSearchResult } from '../types';

// Initialize ZEP Cloud client
let zepClient: any = null;

function getZepClient(): any {
  if (!zepClient) {
    if (!config.zep.apiKey) {
      throw new Error('ZEP_API_KEY is not configured');
    }
    zepClient = new ZepClient({ apiKey: config.zep.apiKey });
  }
  return zepClient;
}

/**
 * Creates a new collection in ZEP Cloud for a project
 * @param projectId - The project ID to associate with this collection
 * @param name - Name of the collection
 * @returns The collection ID created in ZEP
 */
export async function createCollection(
  projectId: string,
  name: string
): Promise<string> {
  try {
    const client = getZepClient();

    // Create collection with project metadata
    // Note: API methods may vary - adjust based on actual ZEP Cloud SDK documentation
    const collection: any = await (client.memory as any).addCollection({
      name: `project_${projectId}_${name}`,
      description: `Memory collection for project ${projectId}`,
      metadata: {
        project_id: projectId,
        created_by: 'memorycloud',
      },
    });

    return collection.uuid || collection.id || '';
  } catch (error) {
    console.error('Error creating ZEP collection:', error);
    throw new Error(`Failed to create ZEP collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Adds a memory (message) to a ZEP collection
 * @param collectionId - The ZEP collection ID
 * @param content - The message content
 * @param metadata - Optional metadata to attach to the memory
 * @returns The memory ID created in ZEP
 */
export async function addMemory(
  collectionId: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  try {
    const client = getZepClient();

    // Add memory to collection
    // Note: API methods may vary - adjust based on actual ZEP Cloud SDK documentation
    const memory: any = await client.memory.add(collectionId, {
      messages: [
        {
          content,
          role: metadata.role || 'user',
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });

    // Return the first memory UUID (ZEP returns array or single object)
    return memory.uuids?.[0] || memory.uuid || memory.id || '';
  } catch (error) {
    console.error('Error adding memory to ZEP:', error);
    throw new Error(`Failed to add memory to ZEP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Performs semantic search in a ZEP collection
 * @param collectionId - The ZEP collection ID
 * @param query - The search query
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results with memories and scores
 */
export async function searchMemory(
  collectionId: string,
  query: string,
  limit: number = 10
): Promise<ZepSearchResult[]> {
  try {
    const client = getZepClient();

    // Perform semantic search
    const results = await client.memory.search(collectionId, {
      text: query,
      limit,
    });

    // Map results to our format
    return results.map((result: any) => ({
      memory: {
        uuid: result.uuid || result.message?.uuid,
        content: result.message?.content || result.content || '',
        metadata: result.metadata || result.message?.metadata || {},
        created_at: result.created_at || result.message?.created_at,
      },
      score: result.score || 0,
    }));
  } catch (error) {
    console.error('Error searching ZEP memory:', error);
    throw new Error(`Failed to search ZEP memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets a specific collection by ID
 * @param collectionId - The ZEP collection ID
 * @returns Collection details
 */
export async function getCollection(collectionId: string) {
  try {
    const client = getZepClient();
    // Note: API methods may vary - adjust based on actual ZEP Cloud SDK documentation
    return await (client.memory as any).getCollection(collectionId);
  } catch (error) {
    console.error('Error getting ZEP collection:', error);
    throw new Error(`Failed to get ZEP collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a collection from ZEP
 * @param collectionId - The ZEP collection ID
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    const client = getZepClient();
    // Note: API methods may vary - adjust based on actual ZEP Cloud SDK documentation
    await (client.memory as any).deleteCollection(collectionId);
  } catch (error) {
    console.error('Error deleting ZEP collection:', error);
    throw new Error(`Failed to delete ZEP collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  createCollection,
  addMemory,
  searchMemory,
  getCollection,
  deleteCollection,
};
