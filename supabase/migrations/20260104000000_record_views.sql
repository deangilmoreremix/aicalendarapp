-- Saved views for the Contacts / Deals / Tasks table (same idea as calendar_views). Open access like the other tables.
create table if not exists public.record_views (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  object_type text not null check (object_type in ('contact', 'deal', 'task')),
  filters     jsonb not null default '{"op":"and","rules":[]}'::jsonb,
  sort        jsonb not null default '{}'::jsonb,
  columns     text[] not null default '{}',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_record_views_object on public.record_views (object_type, position);

alter table public.record_views enable row level security;

drop policy if exists "open_all_record_views" on public.record_views;
create policy "open_all_record_views" on public.record_views
  for all to anon, authenticated using (true) with check (true);
