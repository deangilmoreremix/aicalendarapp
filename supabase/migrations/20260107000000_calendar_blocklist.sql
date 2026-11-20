-- People and domains to leave out of the calendar. Twenty's blocklist drops events that involve a listed address or
-- domain ("@example.com" blocks the whole domain, an address blocks just it). Open access like the other calendar tables.
create table if not exists public.calendar_blocklist (
  id         uuid primary key default gen_random_uuid(),
  handle     text not null unique check (length(btrim(handle)) > 0), -- stored trimmed and lower-case by the app
  created_at timestamptz not null default now()
);

alter table public.calendar_blocklist enable row level security;

drop policy if exists "open_all_calendar_blocklist" on public.calendar_blocklist;
create policy "open_all_calendar_blocklist" on public.calendar_blocklist
  for all to anon, authenticated using (true) with check (true);

-- Let open calendars hear about blocklist changes made elsewhere (same guarded publication step as the other calendar tables).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calendar_blocklist'
     ) then
    alter publication supabase_realtime add table public.calendar_blocklist;
  end if;
end $$;
