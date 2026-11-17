-- The app has no sign-in flow: it talks to Supabase with the anon key only (see the note in the core tables
-- migration), so contacts/tasks/deals/activities use open policies. The calendar tables added later used owner-only
-- policies for `authenticated`, which blocks every read and write from an anon-key client.
-- Per the project owner's decision, the calendar tables now follow the same open-access model as the core tables.
--
-- NOT multi-tenant safe: anyone holding the anon key can read and modify these rows, exactly as with contacts today.
-- TODO (production hardening): introduce sign-in and scope every policy with auth.uid() = user_id.

-- calendar_settings: a single settings row per deployment (there is no signed-in user to key it by)
alter table public.calendar_settings add column if not exists id text;
update public.calendar_settings set id = 'default' where id is null;
alter table public.calendar_settings alter column id set default 'default';
alter table public.calendar_settings alter column id set not null;
alter table public.calendar_settings drop constraint if exists calendar_settings_pkey;
alter table public.calendar_settings add primary key (id);
alter table public.calendar_settings alter column user_id drop not null;

alter table public.calendar_views alter column user_id drop not null;
alter table public.calendar_views alter column user_id drop default;

do $$
declare
  t text;
begin
  foreach t in array array[
    'calendar_events',
    'calendar_event_participants',
    'calendar_event_targets',
    'calendar_settings',
    'calendar_views'
  ]
  loop
    execute format('drop policy if exists "open_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "open_all_%1$s" on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

drop policy if exists "calendar_events_owner_all" on public.calendar_events;
drop policy if exists "calendar_participants_owner_all" on public.calendar_event_participants;
drop policy if exists "calendar_targets_owner_all" on public.calendar_event_targets;
drop policy if exists "calendar_settings_owner_all" on public.calendar_settings;
drop policy if exists "calendar_views_owner_all" on public.calendar_views;

grant execute on function public.get_timeline_calendar_events(text, uuid, integer, integer) to anon, authenticated;
