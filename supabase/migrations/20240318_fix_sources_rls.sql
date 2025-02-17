-- Drop existing policies for sources table
drop policy if exists "Users can view sources of own sessions" on sources;
drop policy if exists "Users can modify sources of own sessions" on sources;

-- Create new policies with proper checks
create policy "Users can view sources of own sessions"
    on sources for select
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = sources.session_id
        and research_sessions.user_id = auth.uid()
    ));

create policy "Users can insert sources to own sessions"
    on sources for insert
    with check (exists (
        select 1 from research_sessions
        where research_sessions.id = session_id
        and research_sessions.user_id = auth.uid()
    ));

create policy "Users can update sources of own sessions"
    on sources for update
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = sources.session_id
        and research_sessions.user_id = auth.uid()
    ));

create policy "Users can delete sources of own sessions"
    on sources for delete
    using (exists (
        select 1 from research_sessions
        where research_sessions.id = sources.session_id
        and research_sessions.user_id = auth.uid()
    )); 