# Sources Table Implementation

[search-sources-sql](../../lib/supabase/search-sources.ts)

## Overview
The `sources` table manages research sources and references, storing URLs, content, and metadata for sources discovered during research sessions. It maintains relationships with research sessions and chat messages.

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