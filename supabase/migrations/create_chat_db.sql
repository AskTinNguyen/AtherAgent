-- Drop existing objects
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP VIEW IF EXISTS v_chat_messages CASCADE;
DROP FUNCTION IF EXISTS handle_message_threading() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS chat_role CASCADE;

-- Create message type enum
CREATE TYPE message_type AS ENUM (
    'user_prompt',
    'ai_response',
    'search_results',
    'image_results',
    'search_summary',
    'chat_title',
    'tool_output'
);

-- Create role enum to match OpenAI's convention plus our custom types
CREATE TYPE chat_role AS ENUM (
    'user',
    'assistant',
    'system',
    'data'
);

-- Recreate chat_messages with complete structure
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT,                                    -- Allowing NULL
    role chat_role NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    annotations JSONB,                              -- New field
    message_type message_type,                      -- New field
    parent_message_id UUID REFERENCES chat_messages(id),
    thread_id UUID,                                 -- New field
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    sequence_number BIGINT,                         -- New field
    updated_at TIMESTAMPTZ DEFAULT now(),
    search_query TEXT,                             -- New field
    search_source TEXT,                            -- New field
    tool_name TEXT,                                -- New field
    summary_type TEXT,                             -- New field
    is_visible BOOLEAN DEFAULT true NOT NULL,
    is_edited BOOLEAN DEFAULT false NOT NULL,      -- New field
    research_session_id UUID REFERENCES research_sessions(id) NOT NULL,
    depth_level INTEGER DEFAULT 1 NOT NULL         -- New field
);

-- Create essential indexes
CREATE INDEX idx_chat_messages_research_session ON chat_messages(research_session_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_parent ON chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_visibility ON chat_messages(is_visible) WHERE NOT is_visible;
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_sequence ON chat_messages(sequence_number);
CREATE INDEX idx_chat_messages_search ON chat_messages(search_query, search_source);

-- Simple updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate sources table with minimal structure
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id),
    url TEXT,
    title TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sources_message_id ON sources(message_id);

-- Add RLS policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
    ON chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
    ON chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
    ON chat_messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 