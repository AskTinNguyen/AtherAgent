# Sources Table Implementation

## Overview
The `sources` table manages research sources and references, storing URLs, content, and metadata for sources discovered during research sessions. It maintains relationships with research sessions and chat messages.

## Table Structure

```sql
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
```

## Columns

| Column Name | Type | Description | Default |
|------------|------|-------------|----------|
| id | UUID | Primary key identifier | uuid_generate_v4() |
| session_id | UUID | Reference to research session | NULL |
| message_id | UUID | Reference to chat message | NULL |
| url | TEXT | Source URL | NULL |
| title | TEXT | Source title | NULL |
| content | TEXT | Source content | NULL |
| relevance | NUMERIC | Relevance score | 0 |
| metadata | JSONB | Additional source data | '{}' |
| created_at | TIMESTAMPTZ | Creation timestamp | now() |
| is_processed | BOOLEAN | Processing status flag | false |

## Relationships

- `session_id` references `research_sessions(id)`
- `message_id` references `chat_messages(id)`
- Many-to-one with research sessions
- Many-to-one with chat messages

## Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_sources_session 
    ON sources(session_id);
CREATE INDEX idx_sources_message 
    ON sources(message_id);
CREATE INDEX idx_sources_url 
    ON sources(url);
CREATE INDEX idx_sources_relevance 
    ON sources(relevance DESC);
CREATE INDEX idx_sources_processed 
    ON sources(is_processed);
```

## Triggers

```sql
-- Update processing status trigger
CREATE OR REPLACE FUNCTION update_source_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS NOT NULL AND OLD.content IS NULL THEN
        NEW.is_processed = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_source_status
    BEFORE UPDATE ON sources
    FOR EACH ROW
    EXECUTE FUNCTION update_source_processing_status();
```

## Security Policies

```sql
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Enable read access for session participants"
    ON sources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = sources.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Insert access
CREATE POLICY "Enable insert for session participants"
    ON sources FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = sources.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Update access
CREATE POLICY "Enable update for session owners"
    ON sources FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = sources.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );
```

## Common Queries

### Get Session Sources by Relevance
```sql
SELECT *
FROM sources
WHERE session_id = '[session_id]'
ORDER BY relevance DESC;
```

### Get Unprocessed Sources
```sql
SELECT *
FROM sources
WHERE is_processed = false
ORDER BY created_at;
```

### Get Sources with Message Context
```sql
SELECT 
    s.*,
    cm.content as message_content,
    cm.message_type
FROM sources s
JOIN chat_messages cm ON cm.id = s.message_id
WHERE s.session_id = '[session_id]'
ORDER BY s.relevance DESC;
```

### Get Source Statistics
```sql
SELECT 
    session_id,
    COUNT(*) as total_sources,
    AVG(relevance) as avg_relevance,
    COUNT(*) FILTER (WHERE is_processed) as processed_count
FROM sources
GROUP BY session_id;
```

## JSONB Metadata Structure Examples

### Web Source
```json
{
    "source_type": "web",
    "last_updated": "2024-03-20T10:00:00Z",
    "language": "en",
    "word_count": 1500,
    "domain_authority": 85,
    "citations": 12,
    "keywords": ["ai", "research", "technology"],
    "fetch_metadata": {
        "status_code": 200,
        "content_type": "text/html",
        "encoding": "utf-8"
    }
}
```

### Academic Source
```json
{
    "source_type": "academic",
    "authors": [
        {"name": "John Doe", "affiliation": "University X"},
        {"name": "Jane Smith", "affiliation": "Institute Y"}
    ],
    "publication_date": "2023-12-01",
    "journal": "Journal of AI Research",
    "doi": "10.1234/example.doi",
    "citation_count": 25,
    "impact_factor": 4.5
}
```

## Implementation Notes

1. Always validate URLs before insertion
2. Handle content extraction efficiently
3. Implement proper error handling for network issues
4. Use transaction blocks for multi-step operations
5. Monitor content and metadata sizes
6. Handle duplicate URLs appropriately
7. Implement proper content sanitization

## Maintenance

1. Regular VACUUM ANALYZE recommended
2. Archive old or irrelevant sources
3. Monitor storage usage for content
4. Regular validation of URLs
5. Clean up orphaned sources
6. Update relevance scores periodically 