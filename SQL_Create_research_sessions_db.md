# Research Sessions Table Implementation

## Overview
The `research_sessions` table serves as the central hub for research activities, linking projects, users, chat messages, and sources. It maintains the core research session data and metadata.

## Table Structure

```sql
CREATE TABLE research_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    project_id UUID REFERENCES projects(id),
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);
```

## Columns

| Column Name | Type | Description | Default |
|------------|------|-------------|----------|
| id | UUID | Primary key identifier | uuid_generate_v4() |
| user_id | UUID | Reference to user profile | NULL |
| project_id | UUID | Reference to parent project | NULL |
| name | TEXT | Session name | NULL |
| description | TEXT | Session description | NULL |
| created_at | TIMESTAMPTZ | Creation timestamp | now() |
| updated_at | TIMESTAMPTZ | Last update timestamp | now() |
| metadata | JSONB | Additional session data | '{}' |

## Relationships

- `user_id` references `profiles(id)`
- `project_id` references `projects(id)`
- One-to-one with `research_states`
- One-to-many with `chat_messages`
- One-to-many with `sources`

## Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_research_sessions_user 
    ON research_sessions(user_id);
CREATE INDEX idx_research_sessions_project 
    ON research_sessions(project_id);
CREATE INDEX idx_research_sessions_created 
    ON research_sessions(created_at DESC);
```

## Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_research_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_research_sessions_timestamp
    BEFORE UPDATE ON research_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_research_sessions_updated_at();
```

## Security Policies

```sql
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Enable read access for session owners and team members"
    ON research_sessions FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = research_sessions.project_id
            AND projects.team_members @> ARRAY[auth.uid()]::uuid[]
        )
    );

-- Insert access
CREATE POLICY "Enable insert for project members"
    ON research_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_id
            AND (
                projects.user_id = auth.uid() OR
                projects.team_members @> ARRAY[auth.uid()]::uuid[]
            )
        )
    );

-- Update access
CREATE POLICY "Enable update for session owners"
    ON research_sessions FOR UPDATE
    USING (user_id = auth.uid());
```

## Common Queries

### Get Session with Related Data
```sql
SELECT 
    rs.*,
    rst.current_step,
    rst.visualization_data,
    json_agg(DISTINCT cm.*) as messages,
    json_agg(DISTINCT s.*) as sources
FROM research_sessions rs
LEFT JOIN research_states rst ON rst.session_id = rs.id
LEFT JOIN chat_messages cm ON cm.research_session_id = rs.id
LEFT JOIN sources s ON s.session_id = rs.id
WHERE rs.id = '[session_id]'
GROUP BY rs.id, rst.id;
```

### Get Project Sessions Summary
```sql
SELECT 
    rs.*,
    COUNT(DISTINCT cm.id) as message_count,
    COUNT(DISTINCT s.id) as source_count,
    MAX(cm.updated_at) as last_activity
FROM research_sessions rs
LEFT JOIN chat_messages cm ON cm.research_session_id = rs.id
LEFT JOIN sources s ON s.session_id = rs.id
WHERE rs.project_id = '[project_id]'
GROUP BY rs.id
ORDER BY last_activity DESC NULLS LAST;
```

### Get User's Recent Sessions
```sql
SELECT 
    rs.*,
    p.name as project_name,
    rst.current_step
FROM research_sessions rs
JOIN projects p ON p.id = rs.project_id
LEFT JOIN research_states rst ON rst.session_id = rs.id
WHERE rs.user_id = '[user_id]'
ORDER BY rs.updated_at DESC
LIMIT 10;
```

## JSONB Metadata Structure Examples

### Session Metadata
```json
{
    "status": "active",
    "research_type": "exploratory",
    "tags": ["ai", "machine-learning", "research"],
    "settings": {
        "max_depth": 3,
        "search_providers": ["academic", "web"],
        "language": "en"
    },
    "progress": {
        "completed_steps": 5,
        "total_steps": 10,
        "last_milestone": "data_collection"
    }
}
```

## Implementation Notes

1. Always include project context when creating sessions
2. Maintain proper relationship integrity
3. Use transaction blocks for multi-table operations
4. Handle session state changes through research_states
5. Monitor metadata JSONB size
6. Implement proper error handling for constraints

## Maintenance

1. Regular VACUUM ANALYZE recommended
2. Archive completed sessions after project completion
3. Monitor session activity patterns
4. Regular backup of session data
5. Clean up orphaned sessions 