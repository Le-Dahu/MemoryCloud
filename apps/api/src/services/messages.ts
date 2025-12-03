import { supabase } from './supabase';
import * as zep from './zep';
import { Message, Session, SearchContextResponse } from '../types';
import { getProject } from './projects';

/**
 * Creates a new session within a project
 * @param projectId - The project ID
 * @param source - Source of the session (e.g., 'mcp', 'api', 'web')
 * @param externalId - Optional external identifier
 * @returns The created session
 */
export async function createSession(
  projectId: string,
  source: string,
  externalId?: string
): Promise<Session> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        project_id: projectId,
        source,
        external_id: externalId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    if (!session) {
      throw new Error('Session was not created');
    }

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets a session by ID
 * @param sessionId - The session ID
 * @returns The session or null if not found
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw new Error(`Failed to fetch session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets all sessions for a project
 * @param projectId - The project ID
 * @returns Array of sessions
 */
export async function getSessions(projectId: string): Promise<Session[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    return sessions || [];
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw new Error(`Failed to fetch sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Adds a message to a session and syncs with ZEP
 * ZEP uses project_id as the session identifier
 * @param sessionId - The session ID
 * @param role - Message role (user, assistant, system, function)
 * @param content - Message content
 * @param metadata - Optional metadata
 * @returns The created message
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system' | 'function',
  content: string,
  metadata: Record<string, any> = {}
): Promise<Message> {
  try {
    // Get session to find project
    const session = await getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Try to add to ZEP using project_id as the ZEP session ID
    try {
      await zep.addMemory(
        session.project_id, // Use project_id as ZEP sessionId
        [
          {
            role,
            content,
            metadata: {
              ...metadata,
              session_id: sessionId,
              project_id: session.project_id,
            },
          },
        ]
      );
    } catch (zepError) {
      console.warn('Failed to add message to ZEP:', zepError);
      // Continue without ZEP - message will still be saved to database
    }

    // Create message in database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    if (!message) {
      throw new Error('Message was not created');
    }

    return message;
  } catch (error) {
    console.error('Error adding message:', error);
    throw new Error(`Failed to add message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets all messages for a session
 * @param sessionId - The session ID
 * @returns Array of messages ordered by creation time
 */
export async function getMessages(sessionId: string): Promise<Message[]> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Searches for relevant context across a project using ZEP semantic search
 * Uses project_id as the ZEP session identifier
 * @param projectId - The project ID
 * @param query - The search query
 * @param maxTokens - Maximum number of tokens to return (approximate)
 * @returns Relevant messages and token count
 */
export async function searchContext(
  projectId: string,
  query: string,
  maxTokens: number = 2000
): Promise<SearchContextResponse> {
  try {
    // Perform semantic search in ZEP using project_id as session ID
    const searchResults = await zep.searchMemory(
      projectId, // Use project_id as ZEP sessionId
      query,
      20 // Get top 20 results
    );

    if (searchResults.length === 0) {
      // No results from ZEP, fall back to recency-based search
      return await fallbackContextSearch(projectId, maxTokens);
    }

    // Extract content from ZEP search results and format as messages
    const messages: Message[] = searchResults
      .filter((result) => result.message && result.message.content)
      .map((result, index) => ({
        id: result.message?.uuid || `zep-${index}`,
        session_id: (result.message?.metadata as any)?.session_id || '',
        role: (result.message?.role as any) || 'assistant',
        content: result.message!.content!,
        zep_memory_id: result.message?.uuid || null,
        metadata: {
          ...result.message?.metadata,
          zep_score: result.score,
        },
        created_at: result.message?.createdAt || new Date().toISOString(),
      }));

    // Truncate to maxTokens
    const { truncatedMessages, totalTokens } = truncateByTokens(
      messages,
      maxTokens
    );

    return {
      messages: truncatedMessages,
      total_tokens: totalTokens,
    };
  } catch (error) {
    console.error('Error searching context with ZEP:', error);
    // Fall back to recency-based search
    return await fallbackContextSearch(projectId, maxTokens);
  }
}

/**
 * Fallback context search based on recency (when ZEP is unavailable)
 */
async function fallbackContextSearch(
  projectId: string,
  maxTokens: number
): Promise<SearchContextResponse> {
  try {
    // Get recent messages across all sessions in the project
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sessions!inner(project_id)')
      .eq('sessions.project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    const { truncatedMessages, totalTokens } = truncateByTokens(
      messages || [],
      maxTokens
    );

    return {
      messages: truncatedMessages,
      total_tokens: totalTokens,
    };
  } catch (error) {
    console.error('Error in fallback context search:', error);
    return { messages: [], total_tokens: 0 };
  }
}

/**
 * Truncates messages array to fit within token limit
 * Simple approximation: ~4 characters per token
 */
function truncateByTokens(
  messages: Message[],
  maxTokens: number
): { truncatedMessages: Message[]; totalTokens: number } {
  const CHARS_PER_TOKEN = 4;
  const maxChars = maxTokens * CHARS_PER_TOKEN;

  let totalChars = 0;
  const truncatedMessages: Message[] = [];

  for (const message of messages) {
    const messageChars = message.content.length;
    if (totalChars + messageChars > maxChars && truncatedMessages.length > 0) {
      break;
    }
    truncatedMessages.push(message);
    totalChars += messageChars;
  }

  return {
    truncatedMessages,
    totalTokens: Math.ceil(totalChars / CHARS_PER_TOKEN),
  };
}

export default {
  createSession,
  getSession,
  getSessions,
  addMessage,
  getMessages,
  searchContext,
};
