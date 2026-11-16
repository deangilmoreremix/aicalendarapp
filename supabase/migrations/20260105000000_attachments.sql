-- Files attached to contacts, deals, tasks and calendar events: a table for the metadata and a private Storage bucket
-- for the files (downloaded through short-lived signed URLs). Open access like the other tables.
create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null check (entity_type in ('task', 'deal', 'contact', 'calendar')),
  entity_id    uuid not null,
  name         text not null,
  size         bigint not null default 0,
  mime_type    text,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_attachments_entity on public.attachments (entity_type, entity_id);

alter table public.attachments enable row level security;

drop policy if exists "open_all_attachments" on public.attachments;
create policy "open_all_attachments" on public.attachments
  for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)
on conflict (id) do nothing;

drop policy if exists "attachments_open_select" on storage.objects;
create policy "attachments_open_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'attachments');

drop policy if exists "attachments_open_insert" on storage.objects;
create policy "attachments_open_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'attachments');

drop policy if exists "attachments_open_delete" on storage.objects;
create policy "attachments_open_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'attachments');
