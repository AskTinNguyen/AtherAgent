-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enable Row Level Security
alter table if exists research_sessions enable row level security;
alter table if exists search_results enable row level security;
alter table if exists research_states enable row level security;
alter table if exists sources enable row level security;

-- Create tables
create table if not exists research_sessions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    chat_id text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    metadata jsonb default '{}'::jsonb,
    constraint valid_metadata check (jsonb_typeof(metadata) = 'object')
);

create table if not exists search_results (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references research_sessions(id) on delete cascade,
    query text not null,
    results jsonb not null,
    created_at timestamptz default now(),
    depth_level int default 1,
    constraint valid_results check (jsonb_typeof(results) = 'array')
);

create table if not exists research_states (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references research_sessions(id) on delete cascade,
    previous_results jsonb,
    visualization_data jsonb,
    metrics jsonb,
    updated_at timestamptz default now(),
    constraint valid_metrics check (jsonb_typeof(metrics) = 'object')
);

create table if not exists sources (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references research_sessions(id) on delete cascade,
    url text not null,
    title text,
    content text,
    relevance decimal(5,2) default 0,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_research_sessions_user_id on research_sessions(user_id);
create index if not exists idx_search_results_session_query on search_results(session_id, query);
create index if not exists idx_sources_url on sources(url);

-- Create RLS policies
create policy "Users can view own research sessions"
    on research_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert own research sessions"
    on research_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update own research sessions"
    on research_sessions for update
    using (auth.uid() = user_id);

create policy "Users can delete own research sessions"
    on research_sessions for delete
    using (auth.uid() = user_id);

-- Search results policies
create policy "Users can view search results of own sessions"
    on search_results for select
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = search_results.session_id
        and research_sessions.user_id = auth.uid()
    ));

create policy "Users can insert search results to own sessions"
    on search_results for insert
    with check (exists (
        select 1 from research_sessions
        where research_sessions.id = search_results.session_id
        and research_sessions.user_id = auth.uid()
    ));

-- Research states policies
create policy "Users can view research states of own sessions"
    on research_states for select
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = research_states.session_id
        and research_sessions.user_id = auth.uid()
    ));

create policy "Users can modify research states of own sessions"
    on research_states for all
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = research_states.session_id
        and research_sessions.user_id = auth.uid()
    ));

-- Sources policies
create policy "Users can view sources of own sessions"
    on sources for select
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = sources.session_id
        and research_sessions.user_id = auth.uid()
    ));

create policy "Users can modify sources of own sessions"
    on sources for all
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = sources.session_id
        and research_sessions.user_id = auth.uid()
    )); 