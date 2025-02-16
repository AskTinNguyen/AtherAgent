# Chat Messages Table Implementation

## Overview
The `chat_messages` table stores all chat interactions, research outputs, and search results. It supports message threading, multiple message types, and maintains relationships with research sessions and users.

## Table Structure

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    research_session_id UUID REFERENCES research_sessions(id),
    message_type message_type,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    parent_message_id UUID REFERENCES chat_messages(id),
    thread_id UUID,
    sequence_number BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    search_query TEXT,
    search_source TEXT,
    tool_name TEXT,
    is_visible BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    depth_level INTEGER DEFAULT 1
);
```

## Message Types Enum

```sql
CREATE TYPE message_type AS ENUM (
    'user_prompt',
    'ai_response',
    'search_results',
    'summary',
    'error',
    'system'
);
```

## Columns

| Column Name | Type | Description | Default |
|------------|------|-------------|----------|
| id | UUID | Primary key identifier | uuid_generate_v4() |
| user_id | UUID | Reference to user profile | NULL |
| research_session_id | UUID | Reference to research session | NULL |
| message_type | ENUM | Type of message | NULL |
| content | TEXT | Message content | NULL |
| metadata | JSONB | Additional message data | '{}' |
| parent_message_id | UUID | Reference to parent message | NULL |
| thread_id | UUID | Thread grouping ID | NULL |
| sequence_number | BIGINT | Message order in thread | NULL |
| created_at | TIMESTAMPTZ | Creation timestamp | now() |
| updated_at | TIMESTAMPTZ | Last update timestamp | now() |
| search_query | TEXT | Original search query | NULL |
| search_source | TEXT | Source of search results | NULL |
| tool_name | TEXT | Tool used for message | NULL |
| is_visible | BOOLEAN | Message visibility flag | true |
| is_edited | BOOLEAN | Edit status flag | false |
| depth_level | INTEGER | Search depth level | 1 |

## Relationships

- `user_id` references `profiles(id)`
- `research_session_id` references `research_sessions(id)`
- `parent_message_id` self-references `chat_messages(id)`
- Related to `sources` table through message references

## Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_chat_messages_research_session 
    ON chat_messages(research_session_id);
CREATE INDEX idx_chat_messages_user 
    ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_thread 
    ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_parent 
    ON chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_type 
    ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_sequence 
    ON chat_messages(research_session_id, sequence_number);
```

## Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_messages_timestamp
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- Auto-generate sequence numbers
CREATE OR REPLACE FUNCTION generate_message_sequence()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sequence_number = (
        SELECT COALESCE(MAX(sequence_number), 0) + 1
        FROM chat_messages
        WHERE research_session_id = NEW.research_session_id
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_message_sequence
    BEFORE INSERT ON chat_messages
    FOR EACH ROW
    WHEN (NEW.sequence_number IS NULL)
    EXECUTE FUNCTION generate_message_sequence();
```

## Security Policies

```sql
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Enable read access for session participants"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = chat_messages.research_session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Insert access
CREATE POLICY "Enable insert for session participants"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = chat_messages.research_session_id
            AND research_sessions.user_id = auth.uid()
        )
    );

-- Update access
CREATE POLICY "Enable update for message owners"
    ON chat_messages FOR UPDATE
    USING (user_id = auth.uid());
```

## Common Queries

### Get Thread Messages
```sql
SELECT *
FROM chat_messages
WHERE thread_id = '[thread_id]'
ORDER BY sequence_number;
```

### Get Session Messages with Sources
```sql
SELECT 
    cm.*,
    json_agg(s.*) as sources
FROM chat_messages cm
LEFT JOIN sources s ON s.message_id = cm.id
WHERE cm.research_session_id = '[session_id]'
GROUP BY cm.id
ORDER BY cm.sequence_number;
```

### Get Message Tree
```sql
WITH RECURSIVE message_tree AS (
    -- Base case: root message
    SELECT 
        id,
        parent_message_id,
        content,
        1 as level
    FROM chat_messages
    WHERE id = '[root_message_id]'
    
    UNION ALL
    
    -- Recursive case: child messages
    SELECT 
        cm.id,
        cm.parent_message_id,
        cm.content,
        mt.level + 1
    FROM chat_messages cm
    JOIN message_tree mt ON cm.parent_message_id = mt.id
)
SELECT * FROM message_tree;
```

## JSONB Metadata Structure Examples

### User Message
```json
{
    "client_timestamp": "2024-03-20T10:00:00Z",
    "client_info": {
        "browser": "Chrome",
        "version": "122.0.0",
        "platform": "macOS"
    }
}
```

### AI Response
```json
{
    "model": "gpt-4",
    "temperature": 0.7,
    "tokens_used": 150,
    "processing_time": 2.5
}
```

### Search Results
```json
{
    "total_results": 10,
    "search_time": 1.2,
    "filters_applied": {
        "date_range": "past_year",
        "source_types": ["academic", "news"]
    }
}
```

## Implementation Notes

1. Use appropriate message types for different content
2. Maintain proper message threading
3. Handle sequence numbers carefully in concurrent situations
4. Implement proper error handling for constraint violations
5. Use transaction blocks for multi-step operations
6. Monitor content length and storage
7. Implement proper content sanitization
8. Handle message visibility changes appropriately
9. Track message edits with audit trail
10. Implement proper thread management
11. Handle message deletion gracefully
12. Validate tool names and sources

## Maintenance

1. Regular VACUUM ANALYZE recommended
2. Archive old messages if needed
3. Monitor index usage and performance
4. Regular backup of message data
5. Clean up orphaned messages
6. Monitor sequence number gaps
7. Validate thread integrity
8. Clean up deleted messages
9. Update search indices
10. Monitor JSONB column sizes