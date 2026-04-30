-- User events table for behavioral tracking
-- Fire-and-forget event logging for workout recommendations

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Composite index for querying user events by type and time
create index idx_user_events_user_event_created
  on public.user_events (user_id, event, created_at desc);

-- RLS policies
alter table public.user_events enable row level security;

-- Users can insert their own events
create policy "Users can insert own events"
  on public.user_events for insert
  with check (auth.uid() = user_id);

-- Users can read their own events
create policy "Users can read own events"
  on public.user_events for select
  using (auth.uid() = user_id);
