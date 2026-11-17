-- calendar_events was altered by 20251227000000 but never created.
create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  description text,
  start_date  timestamptz not null,
  end_date    timestamptz,
  is_all_day  boolean not null default false,
  location    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_id     uuid default auth.uid()
);

alter table public.calendar_events enable row level security;

create policy "calendar_events_owner_all" on public.calendar_events
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists idx_calendar_events_user_id on public.calendar_events(user_id);
create index if not exists idx_calendar_events_start_date on public.calendar_events(start_date);
