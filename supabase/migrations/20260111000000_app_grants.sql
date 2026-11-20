-- This app talks to Supabase with the public anon key and no sign-in, and its tables use open row-level-security policies
-- (see 20251231000000_calendar_access_matches_app.sql). Plain Supabase projects already grant table access to the API roles
-- by default; a project with hardened default privileges (new public tables private) does not, so the app would get
-- "permission denied" even though the policies allow everything. Grant it explicitly. Idempotent and harmless elsewhere.
-- NOT multi-tenant safe: anyone with the project's anon key can read and write these tables until sign-in and per-user
-- policies are added (documented in DEPLOY.md).
grant usage on schema public to anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'contacts', 'crm_tasks', 'deals', 'activities', 'attachments', 'record_views',
    'calendar_events', 'calendar_event_participants', 'calendar_event_targets',
    'calendar_settings', 'calendar_views', 'calendar_blocklist'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    end if;
  end loop;
end $$;

grant execute on function public.get_timeline_calendar_events(text, uuid, integer, integer) to anon, authenticated;
grant execute on function public.create_calendar_event_with_guests(jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.link_guests_to_contact(uuid, text) to anon, authenticated;
