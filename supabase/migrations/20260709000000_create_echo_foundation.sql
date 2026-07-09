create extension if not exists "pgcrypto";

create table public.events (
  id uuid primary key default gen_random_uuid(),
  device_session_id text not null,
  name text,
  location text,
  context text,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  raw_text text not null,
  source text not null default 'manual_or_audio',
  created_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text,
  inferred_role text,
  company text,
  confidence numeric,
  summary text,
  topics text[],
  interests text[],
  memorable_details text[],
  suggested_follow_up text,
  reconnect_priority text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table public.event_insights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  summary text,
  key_topics text[],
  patterns text[],
  missed_opportunities text[],
  recommended_next_actions text[],
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create index transcripts_event_id_idx on public.transcripts(event_id);
create index people_event_id_idx on public.people(event_id);
create index event_insights_event_id_idx on public.event_insights(event_id);
create index events_created_at_idx on public.events(created_at desc);

alter table public.events enable row level security;
alter table public.transcripts enable row level security;
alter table public.people enable row level security;
alter table public.event_insights enable row level security;

grant select, insert, update on public.events to anon;
grant select, insert, update on public.transcripts to anon;
grant select, insert, update on public.people to anon;
grant select, insert, update on public.event_insights to anon;

-- Demo-grade hackathon policies for Milestones 0–1. Anonymous users can
-- currently read, insert, and update all demo rows, but cannot delete them.
-- device_session_id is useful continuity metadata only; it does NOT provide
-- secure row ownership and must not be treated as an authorization boundary.
-- TODO: Before storing sensitive conversations, move writes behind
-- server-owned sessions or authentication and replace these policies with
-- ownership-scoped checks.
create policy "anon can read demo events"
  on public.events for select to anon using (true);
create policy "anon can insert demo events"
  on public.events for insert to anon with check (true);
create policy "anon can update demo events"
  on public.events for update to anon using (true) with check (true);

create policy "anon can read demo transcripts"
  on public.transcripts for select to anon using (true);
create policy "anon can insert demo transcripts"
  on public.transcripts for insert to anon with check (true);
create policy "anon can update demo transcripts"
  on public.transcripts for update to anon using (true) with check (true);

create policy "anon can read demo people"
  on public.people for select to anon using (true);
create policy "anon can insert demo people"
  on public.people for insert to anon with check (true);
create policy "anon can update demo people"
  on public.people for update to anon using (true) with check (true);

create policy "anon can read demo event insights"
  on public.event_insights for select to anon using (true);
create policy "anon can insert demo event insights"
  on public.event_insights for insert to anon with check (true);
create policy "anon can update demo event insights"
  on public.event_insights for update to anon using (true) with check (true);
