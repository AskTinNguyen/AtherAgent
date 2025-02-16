-- Create chat_messages table
create table if not exists public.chat_messages (
    id uuid default gen_random_uuid() primary key,
    chat_id text not null,
    content text not null,
    role text not null check (role in ('user', 'assistant', 'system', 'data')),
    annotations jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade
);

-- Create indexes for better query performance
create index if not exists chat_messages_chat_id_idx on public.chat_messages(chat_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);

-- Enable Row Level Security
alter table public.chat_messages enable row level security;

-- Create policies
create policy "Users can view their own chat messages"
    on public.chat_messages for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
    on public.chat_messages for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own chat messages"
    on public.chat_messages for update
    using (auth.uid() = user_id);

create policy "Users can delete their own chat messages"
    on public.chat_messages for delete
    using (auth.uid() = user_id);

-- Create function to handle realtime subscriptions
create or replace function public.handle_new_chat_message()
returns trigger as $$
begin
  perform pg_notify(
    'chat_messages',
    json_build_object(
      'chat_id', NEW.chat_id,
      'message', json_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'role', NEW.role,
        'created_at', NEW.created_at,
        'annotations', NEW.annotations
      )
    )::text
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for realtime
create trigger on_chat_message_created
  after insert on public.chat_messages
  for each row execute procedure public.handle_new_chat_message(); 