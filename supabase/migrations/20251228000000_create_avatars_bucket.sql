-- Public-read bucket for AI-generated avatars. Writes happen via the contacts_image edge function (service role).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_authenticated_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');
