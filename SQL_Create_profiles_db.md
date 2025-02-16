# Profiles Table Implementation

## Overview
The `profiles` table serves as the core user data store, managing user profiles and preferences. It maintains a direct link with Supabase Auth and stores essential user information and research preferences.

## Table Structure

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    research_preferences JSONB DEFAULT '{}'::jsonb,
    last_active_at TIMESTAMPTZ,
    role TEXT DEFAULT 'user',
    settings JSONB DEFAULT '{}'::jsonb,
    email TEXT,
    is_active BOOLEAN DEFAULT true
);
```

## Columns

| Column Name | Type | Description | Default |
|------------|------|-------------|----------|
| id | UUID | Primary key, links to auth.users | NULL |
| updated_at | TIMESTAMPTZ | Last update timestamp | NULL |
| username | TEXT | Unique username | NULL |
| full_name | TEXT | User's full name | NULL |
| avatar_url | TEXT | Profile picture URL | NULL |
| website | TEXT | User's website | NULL |
| research_preferences | JSONB | Research settings and preferences | '{}' |
| last_active_at | TIMESTAMPTZ | Last activity timestamp | NULL |
| role | TEXT | User role (e.g., user, admin) | 'user' |
| settings | JSONB | User application settings | '{}' |
| email | TEXT | User's email address | NULL |
| is_active | BOOLEAN | Account status | true |

## Relationships

- Primary key `id` references `auth.users(id)`
- Referenced by:
  - `projects.user_id`
  - `projects.owner_id`
  - `research_sessions.user_id`
  - `chat_messages.user_id`

## Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_profiles_username 
    ON profiles(username);
CREATE INDEX idx_profiles_role 
    ON profiles(role);
CREATE INDEX idx_profiles_last_active 
    ON profiles(last_active_at DESC);
```

## Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Update last active trigger
CREATE OR REPLACE FUNCTION update_profiles_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_activity
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_profiles_last_active();
```

## Security Policies

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Insert access
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Update access
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
```

## Common Queries

### Get User Profile with Activity
```sql
SELECT 
    p.*,
    COUNT(DISTINCT rs.id) as total_sessions,
    COUNT(DISTINCT pr.id) as total_projects
FROM profiles p
LEFT JOIN research_sessions rs ON rs.user_id = p.id
LEFT JOIN projects pr ON pr.user_id = p.id
WHERE p.id = '[user_id]'
GROUP BY p.id;
```

### Get Active Users
```sql
SELECT *
FROM profiles
WHERE is_active = true
AND last_active_at > now() - interval '7 days'
ORDER BY last_active_at DESC;
```

### Get User Research Stats
```sql
SELECT 
    p.id,
    p.username,
    COUNT(DISTINCT rs.id) as session_count,
    COUNT(DISTINCT s.id) as source_count,
    COUNT(DISTINCT cm.id) as message_count
FROM profiles p
LEFT JOIN research_sessions rs ON rs.user_id = p.id
LEFT JOIN sources s ON s.session_id = rs.id
LEFT JOIN chat_messages cm ON cm.research_session_id = rs.id
WHERE p.id = '[user_id]'
GROUP BY p.id, p.username;
```

## JSONB Structure Examples

### Research Preferences
```json
{
    "default_search_depth": 3,
    "preferred_sources": ["academic", "news", "documentation"],
    "language": "en",
    "ai_model_preferences": {
        "temperature": 0.7,
        "max_tokens": 1000
    },
    "visualization_preferences": {
        "default_view": "graph",
        "color_scheme": "light"
    }
}
```

### Settings
```json
{
    "theme": "dark",
    "notifications": {
        "email": true,
        "desktop": false
    },
    "display": {
        "compact_view": false,
        "show_timestamps": true
    },
    "accessibility": {
        "font_size": "medium",
        "high_contrast": false
    }
}
```

## Implementation Notes

1. Always handle username uniqueness constraints
2. Implement proper email validation
3. Keep JSONB fields structured and documented
4. Handle user role changes securely
5. Maintain proper auth.users synchronization
6. Implement proper avatar URL validation
7. Handle user deactivation gracefully

## Maintenance

1. Regular VACUUM ANALYZE recommended
2. Monitor JSONB column sizes
3. Archive inactive users periodically
4. Update role permissions as needed
5. Clean up orphaned profiles
6. Regular validation of avatar URLs