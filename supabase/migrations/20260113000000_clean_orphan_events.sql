-- Event cleaner (the idea of Twenty's calendar-event-cleaner): delete calendar events that have no guests and are linked
-- to no record, once they are older than `p_older_than` (so an event that is still being created is never touched).
-- Returns how many events were deleted. `security invoker`: the caller's row-level security still applies.
create or replace function public.clean_orphan_calendar_events(p_older_than interval default interval '1 hour')
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  with gone as (
    delete from public.calendar_events e
    where e.created_at < now() - p_older_than
      and not exists (select 1 from public.calendar_event_participants p where p.calendar_event_id = e.id)
      and not exists (select 1 from public.calendar_event_targets t where t.calendar_event_id = e.id)
    returning 1
  )
  select count(*) into v_count from gone;
  return v_count;
end;
$$;

grant execute on function public.clean_orphan_calendar_events(interval) to anon, authenticated;
