# Research States Table Implementation

## Overview
The `research_states` table maintains the state and progress of research sessions, storing visualization data, metrics, and current progress information.

## Table Structure

```sql
CREATE TABLE research_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    previous_result JSONB DEFAULT '{}'::jsonb,
    visualization_data JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT research_states_session_id_key UNIQUE(session_id)
);
```

## Columns

| Column Name | Type | Description | Default |
|------------|------|-------------|----------|
| id | UUID | Primary key identifier | uuid_generate_v4() |
| session_id | UUID | Reference to research session | NULL |
| current_step | INTEGER | Current step in research process | 1 |
| previous_result | JSONB | Previous research results | '{}' |
| visualization_data | JSONB | Data for visualizations | '{}' |
| metrics | JSONB | Research metrics and statistics | '{}' |
| updated_at | TIMESTAMPTZ | Last update timestamp | now() |

## Relationships

- `session_id` references `research_sessions(id)` with CASCADE delete
- One-to-one relationship with research_sessions (enforced by UNIQUE constraint)

## Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_research_states_session ON research_states(session_id);
```

## Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_research_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_research_states_timestamp
    BEFORE UPDATE ON research_states
    FOR EACH ROW
    EXECUTE FUNCTION update_research_states_updated_at();
```

## Security Policies

```sql
ALTER TABLE research_states ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Enable read access for all users"
    ON research_states FOR SELECT
    USING (true);

-- Insert access
CREATE POLICY "Enable insert for authenticated users only"
    ON research_states FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Update access
CREATE POLICY "Enable update for users based on session_id"
    ON research_states FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM research_sessions
            WHERE research_sessions.id = research_states.session_id
            AND research_sessions.user_id = auth.uid()
        )
    );
```

## Common Queries

### Get Current State of Research Session
```sql
SELECT *
FROM research_states
WHERE session_id = '[session_id]';
```

### Update Research Progress
```sql
UPDATE research_states
SET 
    current_step = current_step + 1,
    previous_result = '[new_result]'::jsonb,
    visualization_data = '[new_visualization]'::jsonb,
    metrics = '[new_metrics]'::jsonb
WHERE session_id = '[session_id]';
```

### Get Research Progress with Session Details
```sql
SELECT 
    rs.*,
    rst.current_step,
    rst.visualization_data,
    rst.metrics
FROM research_sessions rs
JOIN research_states rst ON rst.session_id = rs.id
WHERE rs.id = '[session_id]';
```

## JSONB Structure Examples

### Previous Result
```json
{
    "type": "search",
    "query": "example query",
    "timestamp": "2024-03-20T10:00:00Z",
    "results": []
}
```

### Visualization Data
```json
{
    "type": "graph",
    "nodes": [],
    "edges": [],
    "settings": {}
}
```

### Metrics
```json
{
    "total_searches": 10,
    "average_relevance": 0.85,
    "completion_rate": 0.75,
    "time_spent": 3600
}
```

## Implementation Notes

1. Always use parameterized queries to prevent SQL injection
2. Handle JSONB operations efficiently
3. Implement proper error handling for constraint violations
4. Use transaction blocks for multi-step operations
5. Monitor JSONB column sizes for performance

## Maintenance

1. Regular VACUUM ANALYZE recommended
2. Monitor index usage
3. Archive old research states if needed
4. Backup strategy should include JSONB data validation