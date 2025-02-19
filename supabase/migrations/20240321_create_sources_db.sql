-- Create sources table
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id),
    message_id UUID REFERENCES chat_messages(id),
    url TEXT,
    title TEXT,
    content TEXT,
    relevance NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_processed BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX idx_sources_session ON sources(session_id);
CREATE INDEX idx_sources_message ON sources(message_id);
CREATE INDEX idx_sources_url ON sources(url);
CREATE INDEX idx_sources_relevance ON sources(relevance DESC);
CREATE INDEX idx_sources_processed ON sources(is_processed);

-- Create trigger function for updating processing status
CREATE OR REPLACE FUNCTION update_source_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS NOT NULL AND OLD.content IS NULL THEN
        NEW.is_processed = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_source_status
    BEFORE UPDATE ON sources
    FOR EACH ROW
    EXECUTE FUNCTION update_source_processing_status();

-- Enable Row Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Read access policy
CREATE POLICY "Enable read access for session participants"
    ON sources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = sources.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Insert access policy
CREATE POLICY "Enable insert for session participants"
    ON sources FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = sources.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Update access policy
CREATE POLICY "Enable update for session owners"
    ON sources FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = sources.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Add helpful comments
COMMENT ON TABLE sources IS 'Stores research sources and references with their metadata and content';
COMMENT ON COLUMN sources.id IS 'Unique identifier for the source';
COMMENT ON COLUMN sources.session_id IS 'Reference to the research session this source belongs to';
COMMENT ON COLUMN sources.message_id IS 'Reference to the chat message that generated this source';
COMMENT ON COLUMN sources.url IS 'URL of the source';
COMMENT ON COLUMN sources.title IS 'Title of the source';
COMMENT ON COLUMN sources.content IS 'Extracted content from the source';
COMMENT ON COLUMN sources.relevance IS 'Relevance score of the source';
COMMENT ON COLUMN sources.metadata IS 'Additional metadata about the source in JSONB format';
COMMENT ON COLUMN sources.created_at IS 'Timestamp when the source was created';
COMMENT ON COLUMN sources.is_processed IS 'Flag indicating if the source has been processed'; 