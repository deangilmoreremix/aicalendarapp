-- Calendar timeline (ported concepts from twentyhq/twenty calendar module, AGPL-3.0, used with permission):
--   calendarEventParticipant, calendarChannel visibility (METADATA | SHARE_EVERYTHING),
--   timeline events for a record (contact/deal/task) with visibility masking.
-- No external calendar sync: events are created in-app.

alter table public.calendar_events
  add column if not exists is_canceled boolean not null default false,
  add column if not exists conference_solution text,
  add column if not exists conference_link text,
  add column if not exists visibility text not null default 'SHARE_EVERYTHING',
  add column if not exists time_zone text;

alter table public.calendar_events drop constraint if exists calendar_events_visibility_check;
alter table public.calendar_events
  add constraint calendar_events_visibility_check check (visibility in ('SHARE_EVERYTHING', 'METADATA'));

-- Participants (twenty: calendarEventParticipant)
create table if not exists public.calendar_event_participants (
  id                uuid primary key default gen_random_uuid(),
  calendar_event_id uuid not null references public.calendar_events(id) on delete cascade,
  handle            text not null,
  display_name      text not null default '',
  is_organizer      boolean not null default false,
  response_status   text not null default 'NEEDS_ACTION'
                      check (response_status in ('ACCEPTED','DECLINED','NEEDS_ACTION','TENTATIVE')),
  contact_id        uuid references public.contacts(id) on delete set null,
  created_at        timestamptz not null default now(),
  user_id           uuid default auth.uid()
);

-- Links an event to the records it is about (twenty: calendarEventTarget / "Link events")
create table if not exists public.calendar_event_targets (
  id                uuid primary key default gen_random_uuid(),
  calendar_event_id uuid not null references public.calendar_events(id) on delete cascade,
  target_type       text not null check (target_type in ('contact','deal','task')),
  target_id         uuid not null,
  created_at        timestamptz not null default now(),
  user_id           uuid default auth.uid(),
  unique (calendar_event_id, target_type, target_id)
);

-- Default visibility for new events (twenty: calendarChannel.shareOptions)
create table if not exists public.calendar_settings (
  user_id            uuid primary key default auth.uid(),
  default_visibility text not null default 'SHARE_EVERYTHING'
                       check (default_visibility in ('SHARE_EVERYTHING','METADATA')),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_calendar_participants_event on public.calendar_event_participants(calendar_event_id);
create index if not exists idx_calendar_participants_contact on public.calendar_event_participants(contact_id);
create index if not exists idx_calendar_targets_target on public.calendar_event_targets(target_type, target_id);
create index if not exists idx_calendar_targets_event on public.calendar_event_targets(calendar_event_id);

alter table public.calendar_event_participants enable row level security;
alter table public.calendar_event_targets enable row level security;
alter table public.calendar_settings enable row level security;

create policy "calendar_participants_owner_all" on public.calendar_event_participants
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "calendar_targets_owner_all" on public.calendar_event_targets
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "calendar_settings_owner_all" on public.calendar_settings
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Timeline for one record. Mirrors twenty's getTimelineCalendarEventsFromObjectRecord:
-- events linked to the record OR having it as a participant, newest first, paginated,
-- with title/description/location/conference masked when visibility = METADATA and the caller
-- does not own the event (twenty: apply-calendar-events-visibility-restrictions).
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
  page as (
    select * from matched order by start_date desc limit greatest(p_page_size, 1) offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'totalNumberOfCalendarEvents', (select count(*) from matched),
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

grant execute on function public.get_timeline_calendar_events(text, uuid, integer, integer) to authenticated;
