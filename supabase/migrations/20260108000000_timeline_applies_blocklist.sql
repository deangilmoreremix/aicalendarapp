-- The record timeline leaves out events that have a blocked guest (calendar_blocklist), before counting and paginating,
-- so pages and the total always describe the same events. Replaces the function from 20251229000000_calendar_timeline.sql.
create or replace function public.get_timeline_calendar_events(
  p_target_type text,
  p_target_id   uuid,
  p_page_size   integer default 10,
  p_offset      integer default 0
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with matched as (
    select e.*
    from public.calendar_events e
    where exists (
            select 1 from public.calendar_event_targets t
            where t.calendar_event_id = e.id and t.target_type = p_target_type and t.target_id = p_target_id)
       or (p_target_type = 'contact' and exists (
            select 1 from public.calendar_event_participants p
            where p.calendar_event_id = e.id and p.contact_id = p_target_id))
  ),
  visible as (
    -- events with a blocked guest are left out BEFORE counting and paginating (same rule as the app's
    -- isEmailBlocklisted: an address blocks that address, "@example.com" blocks the domain and its sub-domains)
    select m.* from matched m
    where not exists (
      select 1
      from public.calendar_event_participants bp
      join public.calendar_blocklist b
        on lower(btrim(bp.handle)) = b.handle
        or (left(b.handle, 1) = '@' and (
              substring(lower(btrim(bp.handle)) from '[^@]*$') = substr(b.handle, 2)
              or right(substring(lower(btrim(bp.handle)) from '[^@]*$'), length(b.handle)) = '.' || substr(b.handle, 2)
            ))
      where bp.calendar_event_id = m.id
    )
  ),
  page as (
    select * from visible order by start_date desc limit greatest(p_page_size, 1) offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'totalNumberOfCalendarEvents', (select count(*) from visible),
    'timelineCalendarEvents', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pg.id,
          'title', case when pg.visibility = 'METADATA' and pg.user_id is distinct from auth.uid() then null else pg.title end,
          'description', case when pg.visibility = 'METADATA' and pg.user_id is distinct from auth.uid() then null else pg.description end,
          'location', case when pg.visibility = 'METADATA' and pg.user_id is distinct from auth.uid() then null else pg.location end,
          'conferenceSolution', case when pg.visibility = 'METADATA' and pg.user_id is distinct from auth.uid() then null else pg.conference_solution end,
          'conferenceLink', case when pg.visibility = 'METADATA' and pg.user_id is distinct from auth.uid() then null
                                 when pg.conference_link is null then null
                                 else jsonb_build_object('primaryLinkLabel', coalesce(pg.conference_solution, 'Join'), 'primaryLinkUrl', pg.conference_link) end,
          'isCanceled', pg.is_canceled,
          'isFullDay', pg.is_all_day,
          'startsAt', pg.start_date,
          'endsAt', pg.end_date,
          'visibility', pg.visibility,
          'participants', coalesce((
            select jsonb_agg(jsonb_build_object(
              'handle', p.handle,
              'displayName', p.display_name,
              'firstName', split_part(p.display_name, ' ', 1),
              'lastName', nullif(regexp_replace(p.display_name, '^\S+\s*', ''), ''),
              'avatarUrl', '',
              'personId', p.contact_id,
              'workspaceMemberId', null))
            from public.calendar_event_participants p where p.calendar_event_id = pg.id), '[]'::jsonb)
        ) order by pg.start_date desc)
      from page pg), '[]'::jsonb)
  );
$$;
