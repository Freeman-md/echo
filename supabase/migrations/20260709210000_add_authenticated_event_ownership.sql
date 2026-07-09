-- Milestone 5.5: replace the anonymous demo data model with authenticated,
-- event-scoped ownership. Existing demo rows remain unowned and inaccessible;
-- all new application events are required by RLS to carry auth.uid().

alter table public.events
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists events_user_id_created_at_idx
  on public.events(user_id, created_at desc);

drop policy if exists "anon can read demo events" on public.events;
drop policy if exists "anon can insert demo events" on public.events;
drop policy if exists "anon can update demo events" on public.events;
drop policy if exists "anon can read demo transcripts" on public.transcripts;
drop policy if exists "anon can insert demo transcripts" on public.transcripts;
drop policy if exists "anon can update demo transcripts" on public.transcripts;
drop policy if exists "anon can read demo people" on public.people;
drop policy if exists "anon can insert demo people" on public.people;
drop policy if exists "anon can update demo people" on public.people;
drop policy if exists "anon can read demo event insights" on public.event_insights;
drop policy if exists "anon can insert demo event insights" on public.event_insights;
drop policy if exists "anon can update demo event insights" on public.event_insights;

revoke all on public.events from anon;
revoke all on public.transcripts from anon;
revoke all on public.people from anon;
revoke all on public.event_insights from anon;

grant select, insert, update on public.events to authenticated;
grant select, insert, update, delete on public.transcripts to authenticated;
grant select, insert, update, delete on public.people to authenticated;
grant select, insert, update, delete on public.event_insights to authenticated;

create policy "users can read their events"
  on public.events for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can create their events"
  on public.events for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update their events"
  on public.events for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users can manage transcripts for their events"
  on public.transcripts for all
  to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = transcripts.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = transcripts.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "users can manage people for their events"
  on public.people for all
  to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = people.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = people.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "users can manage insights for their events"
  on public.event_insights for all
  to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = event_insights.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = event_insights.event_id
        and events.user_id = auth.uid()
    )
  );
