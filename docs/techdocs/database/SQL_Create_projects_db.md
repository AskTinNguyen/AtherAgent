# Projects Table Implementation

## Overview
The `projects` table manages research projects and their metadata, supporting team collaboration and research session organization. It serves as a container for research sessions and maintains project status, settings, and team information.

## Table Structure

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active',
    project_type TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    team_members UUID[] DEFAULT ARRAY[]::UUID[],
    owner_id UUID REFERENCES profiles(id),
    research_sessions UUID[] DEFAULT ARRAY[]::UUID[],
    last_active_session_id UUID,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ
);
```

## Columns

| Column Name | Type | Description | Default |
|------------|------|-------------|----------|
| id | UUID | Primary key identifier | uuid_generate_v4() |
| user_id | UUID | Reference to creator's profile | NULL |
| name | TEXT | Project name | NULL |
| description | TEXT | Project description | NULL |
| created_at | TIMESTAMPTZ | Creation timestamp | now() |
| updated_at | TIMESTAMPTZ | Last update timestamp | now() |
| status | TEXT | Project status | 'active' |
| project_type | TEXT | Type of project | NULL |
| settings | JSONB | Project settings | '{}' |
| metadata | JSONB | Project metadata | '{}' |
| team_members | UUID[] | Array of team member IDs | [] |
| owner_id | UUID | Project owner's profile ID | NULL |
| research_sessions | UUID[] | Array of session IDs | [] |
| last_active_session_id | UUID | Last active session ID | NULL |
| tags | TEXT[] | Project tags | [] |
| priority | INTEGER | Project priority level | 0 |
| due_date | TIMESTAMPTZ | Project deadline | NULL |

## Relationships

- `user_id` references `profiles(id)`
- `owner_id` references `profiles(id)`
- Referenced by:
  - `research_sessions.project_id`

## Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_projects_user_id 
    ON projects(user_id);
CREATE INDEX idx_projects_status 
    ON projects(status);
CREATE INDEX idx_projects_owner 
    ON projects(owner_id);
CREATE INDEX idx_projects_team_members 
    ON projects USING GIN (team_members);
CREATE INDEX idx_projects_tags 
    ON projects USING GIN (tags);
CREATE INDEX idx_projects_priority 
    ON projects(priority DESC);
CREATE INDEX idx_projects_due_date 
    ON projects(due_date);
```

## Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Ensure owner is in team_members
CREATE OR REPLACE FUNCTION ensure_owner_in_team()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.owner_id IS NOT NULL AND 
       (NEW.team_members IS NULL OR 
        NOT (NEW.owner_id = ANY(NEW.team_members))) THEN
        NEW.team_members = array_append(COALESCE(NEW.team_members, ARRAY[]::UUID[]), NEW.owner_id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_owner_in_team_trigger
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION ensure_owner_in_team();
```

## Security Policies

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Team members can view projects"
    ON projects FOR SELECT
    USING (
        auth.uid() = ANY(team_members) OR
        auth.uid() = user_id OR
        auth.uid() = owner_id
    );

-- Insert access
CREATE POLICY "Authenticated users can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update access
CREATE POLICY "Project owners can update projects"
    ON projects FOR UPDATE
    USING (
        auth.uid() = owner_id OR
        (auth.uid() = ANY(team_members) AND 
         EXISTS (
             SELECT 1 FROM profiles 
             WHERE id = auth.uid() AND role = 'admin'
         ))
    );

-- Delete access
CREATE POLICY "Only owners can delete projects"
    ON projects FOR DELETE
    USING (auth.uid() = owner_id);
```

## Common Queries

### Get Project with Team Details
```sql
SELECT 
    p.*,
    json_agg(DISTINCT jsonb_build_object(
        'id', pr.id,
        'username', pr.username,
        'full_name', pr.full_name,
        'avatar_url', pr.avatar_url
    )) as team_members_details
FROM projects p
LEFT JOIN profiles pr ON pr.id = ANY(p.team_members)
WHERE p.id = '[project_id]'
GROUP BY p.id;
```

### Get User's Active Projects
```sql
SELECT p.*
FROM projects p
WHERE p.status = 'active'
AND (
    p.user_id = '[user_id]' OR
    p.owner_id = '[user_id]' OR
    '[user_id]' = ANY(p.team_members)
)
ORDER BY p.priority DESC, p.due_date ASC;
```

### Get Project Research Progress
```sql
SELECT 
    p.*,
    COUNT(DISTINCT rs.id) as total_sessions,
    COUNT(DISTINCT s.id) as total_sources,
    COUNT(DISTINCT cm.id) as total_messages
FROM projects p
LEFT JOIN research_sessions rs ON rs.project_id = p.id
LEFT JOIN sources s ON s.session_id = rs.id
LEFT JOIN chat_messages cm ON cm.research_session_id = rs.id
WHERE p.id = '[project_id]'
GROUP BY p.id;
```

## JSONB Structure Examples

### Project Settings
```json
{
    "visibility": "private",
    "default_session_settings": {
        "max_depth": 3,
        "auto_summarize": true
    },
    "collaboration": {
        "allow_comments": true,
        "require_approval": false
    },
    "notifications": {
        "on_session_complete": true,
        "on_team_changes": true
    }
}
```

### Project Metadata
```json
{
    "category": "research",
    "objectives": [
        "Analyze market trends",
        "Identify key competitors"
    ],
    "milestones": [
        {
            "name": "Initial Research",
            "completed": true,
            "date": "2024-03-01"
        },
        {
            "name": "Data Analysis",
            "completed": false,
            "date": "2024-04-01"
        }
    ],
    "external_links": {
        "github": "https://github.com/org/repo",
        "docs": "https://docs.example.com"
    }
}
```

## Implementation Notes

1. Always validate team member UUIDs
2. Implement proper status transitions
3. Handle project archival gracefully
4. Maintain proper session references
5. Implement proper tag validation
6. Handle priority conflicts
7. Validate due dates

## Maintenance

1. Regular VACUUM ANALYZE recommended
2. Archive completed projects
3. Clean up orphaned sessions
4. Update team member access
5. Monitor array column sizes
6. Regular validation of session references