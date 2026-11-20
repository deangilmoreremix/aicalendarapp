-- .ics import/export and repeating events.
--   ical_uid:        the UID of an imported event, so importing the same file again skips events that already exist
--   recurrence_rule: an RFC 5545 RRULE value (FREQ, INTERVAL, COUNT, UNTIL, BYDAY) for a repeating event; the app expands
--                    the occurrences itself, so one row is one whole series
alter table public.calendar_events
  add column if not exists ical_uid text,
  add column if not exists recurrence_rule text;

create unique index if not exists calendar_events_ical_uid_key
  on public.calendar_events (ical_uid) where ical_uid is not null;

-- repeating events are read by "starts before the range ends", whatever their end date
create index if not exists calendar_events_recurring_idx
  on public.calendar_events (start_date) where recurrence_rule is not null;

-- create_calendar_event_with_guests now also stores ical_uid and recurrence_rule (same signature as before)
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
    title, description, location, start_date, end_date, is_all_day, time_zone, visibility, conference_link,
    ical_uid, recurrence_rule
  ) values (
    p_event->>'title',
    nullif(p_event->>'description', ''),
    nullif(p_event->>'location', ''),
    (p_event->>'start_date')::timestamptz,
    nullif(p_event->>'end_date', '')::timestamptz,
    coalesce((p_event->>'is_all_day')::boolean, false),
    nullif(p_event->>'time_zone', ''),
    coalesce(nullif(p_event->>'visibility', ''), 'SHARE_EVERYTHING'),
    nullif(p_event->>'conference_link', ''),
    nullif(p_event->>'ical_uid', ''),
    nullif(p_event->>'recurrence_rule', '')
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

grant execute on function public.create_calendar_event_with_guests(jsonb, jsonb, jsonb) to anon, authenticated;
