-- MemoryCloud Database Schema
-- This schema defines the core tables for the MemoryCloud inter-AI memory service

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Projects table: Represents user projects with optional Zep collection integration
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    zep_collection_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API Keys table: Stores hashed API keys for authentication
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_preview VARCHAR(10) NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions table: Tracks conversation sessions within projects
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table: Stores individual messages within sessions
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
    content TEXT NOT NULL,
    zep_memory_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- API Keys indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Sessions indexes
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_external_id ON sessions(external_id) WHERE external_id IS NOT NULL;

-- Messages indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sessions table
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR PROJECTS
-- ============================================================================

-- Users can view their own projects
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES FOR API_KEYS
-- ============================================================================

-- Users can view their own API keys
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert their own API keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
    ON api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES FOR SESSIONS
-- ============================================================================

-- Users can view sessions from their projects
CREATE POLICY "Users can view sessions from their projects"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can insert sessions in their projects
CREATE POLICY "Users can insert sessions in their projects"
    ON sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can update sessions in their projects
CREATE POLICY "Users can update sessions in their projects"
    ON sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sessions.project_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can delete sessions in their projects
CREATE POLICY "Users can delete sessions in their projects"
    ON sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sessions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES FOR MESSAGES
-- ============================================================================

-- Users can view messages from their sessions
CREATE POLICY "Users can view messages from their sessions"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            JOIN projects ON projects.id = sessions.project_id
            WHERE sessions.id = messages.session_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can insert messages in their sessions
CREATE POLICY "Users can insert messages in their sessions"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            JOIN projects ON projects.id = sessions.project_id
            WHERE sessions.id = messages.session_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can update messages in their sessions
CREATE POLICY "Users can update messages in their sessions"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            JOIN projects ON projects.id = sessions.project_id
            WHERE sessions.id = messages.session_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            JOIN projects ON projects.id = sessions.project_id
            WHERE sessions.id = messages.session_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can delete messages in their sessions
CREATE POLICY "Users can delete messages in their sessions"
    ON messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            JOIN projects ON projects.id = sessions.project_id
            WHERE sessions.id = messages.session_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE projects IS 'Projects represent collections of AI sessions with optional Zep integration';
COMMENT ON TABLE api_keys IS 'Hashed API keys for programmatic access to the MemoryCloud API';
COMMENT ON TABLE sessions IS 'Conversation sessions within projects';
COMMENT ON TABLE messages IS 'Individual messages within sessions';

COMMENT ON COLUMN projects.zep_collection_id IS 'Optional Zep Cloud collection ID for enhanced memory features';
COMMENT ON COLUMN api_keys.key_hash IS 'Bcrypt hash of the API key';
COMMENT ON COLUMN api_keys.key_preview IS 'First 8-10 characters of the key for identification';
COMMENT ON COLUMN sessions.source IS 'Source of the session (e.g., "mcp", "api", "web")';
COMMENT ON COLUMN sessions.external_id IS 'Optional external identifier for session tracking';
COMMENT ON COLUMN messages.role IS 'Message role: user, assistant, system, or function';
COMMENT ON COLUMN messages.zep_memory_id IS 'Optional Zep memory ID for linking to Zep Cloud';
COMMENT ON COLUMN messages.metadata IS 'Additional metadata stored as JSON';
