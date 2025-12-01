// Core entity types for MemoryCloud

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  zep_collection_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_preview: string;
  last_used_at: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  project_id: string;
  source: string;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  zep_memory_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Request/Response types

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateSessionRequest {
  source: string;
  external_id?: string;
}

export interface CreateMessageRequest {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  metadata?: Record<string, any>;
}

export interface SearchContextRequest {
  query: string;
  max_tokens?: number;
}

export interface SearchContextResponse {
  messages: Message[];
  total_tokens: number;
}

// ZEP-specific types

export interface ZepMemory {
  uuid: string;
  content: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ZepSearchResult {
  memory: ZepMemory;
  score: number;
}
