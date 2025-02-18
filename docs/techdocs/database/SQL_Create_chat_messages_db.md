# Chat Messages Database Schema

## Overview
The `chat_messages` table stores all chat interactions, research outputs, and search results. It supports message threading, multiple message types, and maintains relationships with research sessions and users.

For the complete SQL implementation, see: [`supabase/migrations/create_chat_db.sql`](../../supabase/migrations/create_chat_db.sql)

## Schema Structure

### Core Tables
1. `chat_messages`: Main table for all message types
2. `sources`: Related table for storing reference materials

### Enums
1. `message_type`:
   - user_prompt
   - ai_response
   - search_results
   - image_results
   - search_summary
   - chat_title
   - tool_output

2. `chat_role`:
   - user
   - assistant
   - system
   - data

## Message Threading Implementation

### Current Implementation
We use a parent-child relationship model where:
- User messages are independent (no parent_id)
- Each AI response is linked to the user message it's responding to
- Threading is maintained through parent_message_id references

Example flow:
```
User Message 1 (no parent)
└── AI Response 1 (parent: User Message 1)
User Message 2 (no parent)
└── AI Response 2 (parent: User Message 2)
```

### Threading Rules
1. User Messages:
   - Always created without parent_message_id
   - Represent new thoughts/questions in the conversation
   - Can be queried as conversation starters

2. AI Responses:
   - Must have parent_message_id linking to the user message they're responding to
   - Created in two steps:
     a. Initial empty message with parent link
     b. Updated with content when streaming completes

### Future Threading Considerations
Several approaches are being considered for handling longer conversation chains:

1. **Thread ID with Sequence**
   - Linear conversation tracking
   - Simple ordering by sequence
   - Good for straightforward dialogs

2. **Linked List Model**
   - Direct parent-child relationships
   - Easy backward traversal
   - Simple implementation

3. **Adjacency List with Depth**
   - Supports branching conversations
   - Easy level-based queries
   - Maintains conversation hierarchy

4. **Materialized Path**
   - Complete conversation path tracking
   - Easy ancestor/descendant queries
   - Good for complex hierarchies

5. **Hybrid Approach**
   - Combines thread IDs with parent references
   - Supports both linear and branching conversations
   - More flexible but complex implementation

## Key Columns

| Column Name | Type | Description |
|------------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to profiles |
| research_session_id | UUID | Reference to research session |
| role | chat_role | Message role (user/assistant/system/data) |
| content | TEXT | Message content (nullable) |
| message_type | message_type | Type of message |
| metadata | JSONB | Additional message data |
| annotations | JSONB | Message annotations |
| parent_message_id | UUID | Reference to parent message |
| thread_id | UUID | Thread grouping ID |
| sequence_number | BIGINT | Message order in thread |
| search_query | TEXT | Original search query |
| search_source | TEXT | Source of search results |
| tool_name | TEXT | Tool used for message |
| summary_type | TEXT | Type of summary |
| is_visible | BOOLEAN | Message visibility flag |
| is_edited | BOOLEAN | Edit status flag |
| depth_level | INTEGER | Search depth level |

## Key Features

1. **Message Threading**
   - Parent-child relationships via `parent_message_id`
   - Thread grouping via `thread_id`
   - Sequential ordering via `sequence_number`

2. **Security**
   - Row Level Security (RLS) enabled
   - User-based access control
   - Separate read/write policies

3. **Performance**
   - Optimized indexes for common queries
   - JSONB for flexible metadata storage
   - Automatic timestamp management



## Best Practices

1. Always use transactions for multi-step operations
2. Validate message types and roles before insertion
3. Handle message visibility changes through updates
4. Maintain proper thread relationships
5. Use appropriate indexes for your queries
6. Regular monitoring of table and index sizes
7. Implement proper error handling
8. Sanitize user input
9. Use prepared statements
10. Regular backups and maintenance

## Table Structure



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