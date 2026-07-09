-- Atomically refresh an event's derived memory. The row lock serializes
-- concurrent refreshes, and the invoker's RLS policies still enforce ownership.

create or replace function public.replace_event_memory(
  p_event_id uuid,
  p_people jsonb,
  p_insight jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  person jsonb;
begin
  if not exists (
    select 1
    from public.events
    where id = p_event_id
    for update
  ) then
    raise exception 'Event not found or not accessible';
  end if;

  delete from public.people where event_id = p_event_id;
  delete from public.event_insights where event_id = p_event_id;

  insert into public.event_insights (
    event_id,
    summary,
    key_topics,
    patterns,
    missed_opportunities,
    recommended_next_actions,
    raw_json
  )
  values (
    p_event_id,
    nullif(p_insight->>'summary', ''),
    array(
      select jsonb_array_elements_text(coalesce(p_insight->'key_topics', '[]'::jsonb))
    ),
    array(
      select jsonb_array_elements_text(coalesce(p_insight->'patterns', '[]'::jsonb))
    ),
    array(
      select jsonb_array_elements_text(
        coalesce(p_insight->'missed_opportunities', '[]'::jsonb)
      )
    ),
    array(
      select jsonb_array_elements_text(
        coalesce(p_insight->'recommended_next_actions', '[]'::jsonb)
      )
    ),
    p_insight->'raw_json'
  );

  for person in
    select value from jsonb_array_elements(coalesce(p_people, '[]'::jsonb))
  loop
    insert into public.people (
      event_id,
      name,
      inferred_role,
      company,
      confidence,
      summary,
      topics,
      interests,
      memorable_details,
      suggested_follow_up,
      reconnect_priority,
      raw_json
    )
    values (
      p_event_id,
      nullif(person->>'name', ''),
      nullif(person->>'inferred_role', ''),
      nullif(person->>'company', ''),
      nullif(person->>'confidence', '')::numeric,
      nullif(person->>'summary', ''),
      array(
        select jsonb_array_elements_text(coalesce(person->'topics', '[]'::jsonb))
      ),
      array(
        select jsonb_array_elements_text(coalesce(person->'interests', '[]'::jsonb))
      ),
      array(
        select jsonb_array_elements_text(
          coalesce(person->'memorable_details', '[]'::jsonb)
        )
      ),
      nullif(person->>'suggested_follow_up', ''),
      nullif(person->>'reconnect_priority', ''),
      person->'raw_json'
    );
  end loop;
end;
$$;

revoke all on function public.replace_event_memory(uuid, jsonb, jsonb)
  from public, anon;
grant execute on function public.replace_event_memory(uuid, jsonb, jsonb)
  to authenticated;
