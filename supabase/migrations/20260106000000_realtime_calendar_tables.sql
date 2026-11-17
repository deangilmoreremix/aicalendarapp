-- Let Supabase Realtime broadcast changes of the tables the calendar shows, so open calendars refresh by themselves.
-- Guarded: skipped when the publication does not exist (plain Postgres) and when a table is already published.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['calendar_events', 'tasks', 'deals', 'contacts'] loop
      if to_regclass('public.' || t) is not null
         and not exists (
           select 1 from pg_publication_tables
           where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
         ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
