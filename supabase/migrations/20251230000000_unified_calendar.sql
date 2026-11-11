-- Unified CRM calendar support
-- 1) tasks.start_time/end_time: the Task type and calendar already used them but no column existed,
--    so time-blocked tasks were dropped on create and rejected on update.
alter table public.tasks
  add column if not exists start_time timestamptz,
  add column if not exists end_time   timestamptz;

-- 2) contacts get a follow-up date so they can be shown (and rescheduled) on the calendar.
alter table public.contacts
  add column if not exists next_follow_up date;

create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_contacts_next_follow_up on public.contacts(next_follow_up);

-- 3) Saved calendar views (shape follows Twenty's View: calendarLayout, calendar field, filters,
--    visibility, position).
create table if not exists public.calendar_views (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid(),
  name            text not null,
  calendar_layout text not null default 'MONTH' check (calendar_layout in ('DAY','WEEK','MONTH','AGENDA')),
  -- which date each record type is placed on, e.g. {"task":"dueDate","deal":"dueDate","contact":"nextFollowUp"}
  field_by_type   jsonb not null default '{}'::jsonb,
  filters         jsonb not null default '{}'::jsonb,
  visible_types   text[] not null default array['task','deal','contact','event'],
  visibility      text not null default 'PRIVATE' check (visibility in ('PRIVATE','WORKSPACE')),
  position        integer not null default 0,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_calendar_views_user on public.calendar_views(user_id, position);

alter table public.calendar_views enable row level security;

create policy "calendar_views_owner_all" on public.calendar_views
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
