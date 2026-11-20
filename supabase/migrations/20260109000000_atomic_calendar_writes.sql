-- Two calendar writes that touch several tables now run as ONE transaction (a Postgres function is atomic), so a
-- failure part-way leaves nothing behind. Both are `security invoker`: the caller's row-level security still applies.

-- Create an event together with its guests and links.
create or replace function public.create_calendar_event_with_guests(
  p_event        jsonb,
  p_participants jsonb default '[]'::jsonb,
  p_targets      jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.calendar_events (
    title, description, location, start_date, end_date, is_all_day, time_zone, visibility, conference_link
  ) values (
    p_event->>'title',
    nullif(p_event->>'description', ''),
    nullif(p_event->>'location', ''),
    (p_event->>'start_date')::timestamptz,
    nullif(p_event->>'end_date', '')::timestamptz,
    coalesce((p_event->>'is_all_day')::boolean, false),
    nullif(p_event->>'time_zone', ''),
    coalesce(nullif(p_event->>'visibility', ''), 'SHARE_EVERYTHING'),
    nullif(p_event->>'conference_link', '')
  ) returning id into v_id;

  insert into public.calendar_event_participants (calendar_event_id, handle, display_name, contact_id)
  select v_id, p->>'handle', coalesce(p->>'display_name', ''), nullif(p->>'contact_id', '')::uuid
  from jsonb_array_elements(coalesce(p_participants, '[]'::jsonb)) p;

  insert into public.calendar_event_targets (calendar_event_id, target_type, target_id)
  select v_id, t->>'target_type', (t->>'target_id')::uuid
  from jsonb_array_elements(coalesce(p_targets, '[]'::jsonb)) t
  on conflict (calendar_event_id, target_type, target_id) do nothing;

  return v_id;
end;
$$;

-- A contact was created or its email changed: guests with that email become that contact and their events are linked
-- to it. Returns how many events were linked.
create or replace function public.link_guests_to_contact(p_contact_id uuid, p_email text)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_events uuid[];
begin
  if v_email = '' then
    return 0;
  end if;

  -- claim the guests first and work only with the rows this call actually claimed, so two contacts with the same
  -- email can never both link (or count) the same event
  with claimed as (
    update public.calendar_event_participants
    set contact_id = p_contact_id
    where lower(btrim(handle)) = v_email and contact_id is null
    returning calendar_event_id
  )
  select array_agg(distinct calendar_event_id) into v_events from claimed;

  if v_events is null then
    return 0;
  end if;

  insert into public.calendar_event_targets (calendar_event_id, target_type, target_id)
  select e, 'contact', p_contact_id from unnest(v_events) e
  on conflict (calendar_event_id, target_type, target_id) do nothing;

  return coalesce(array_length(v_events, 1), 0);
end;
$$;

grant execute on function public.create_calendar_event_with_guests(jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.link_guests_to_contact(uuid, text) to anon, authenticated;
