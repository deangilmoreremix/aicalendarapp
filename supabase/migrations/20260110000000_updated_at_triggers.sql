-- Keep `updated_at` current on every update of contacts and deals (the calendar's "Last updated" date field reads it).
-- A trigger covers every write path (the app's API, CSV import, SQL), not only the calls that remember to set it.
create or replace function public.crm_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.crm_set_updated_at();

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
  before update on public.deals
  for each row execute function public.crm_set_updated_at();
