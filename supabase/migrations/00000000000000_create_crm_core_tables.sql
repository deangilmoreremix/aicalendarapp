-- ============================================================================
-- CRM core tables for the AI Calendar remote app
-- Created: initial schema (must run before any RLS/optimization migration)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- contacts
-- ----------------------------------------------------------------------------
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null default '',
  last_name       text not null default '',
  name            text not null default '',
  email           text not null default '',
  phone           text,
  title           text not null default '',
  company         text not null default '',
  industry        text,
  avatar_src      text,
  avatar          text,
  sources         text[] not null default '{}',
  interest_level  text not null default 'medium'
                    check (interest_level in ('hot','warm','medium','cold')),
  status          text not null default 'lead'
                    check (status in ('lead','prospect','customer','churned','active','pending','inactive')),
  tags            text[] not null default '{}',
  notes           text,
  social_profiles jsonb not null default '{}'::jsonb,
  custom_fields   jsonb not null default '{}'::jsonb,
  is_favorite     boolean not null default false,
  ai_score        integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  user_id         uuid
);

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text,
  due_date           timestamptz,
  priority           text not null default 'medium'
                       check (priority in ('low','medium','high','urgent')),
  status             text not null default 'pending'
                       check (status in ('pending','in-progress','on-hold','completed','cancelled','overdue')),
  category           text not null default 'other'
                       check (category in ('call','email','meeting','follow-up','other')),
  type               text not null default 'other'
                       check (type in ('follow-up','meeting','call','email','proposal','research','administrative','other')),
  completed          boolean not null default false,
  created_at         timestamptz not null default now(),
  completed_at       timestamptz,
  assigned_user_id   uuid,
  assigned_user_name text,
  estimated_duration integer,
  actual_duration    integer,
  tags               text[] not null default '{}',
  attachments        jsonb not null default '[]'::jsonb,
  subtasks           jsonb not null default '[]'::jsonb,
  related_to         jsonb,
  notes              text,
  user_id            uuid
);

-- ----------------------------------------------------------------------------
-- deals
-- ----------------------------------------------------------------------------
create table if not exists public.deals (
  id           uuid primary key default gen_random_uuid(),
  company      text not null,
  value        text not null default '0',
  probability  text not null default '0',
  due_date     text,
  contact_id   uuid,
  status       text not null default 'offline'
                  check (status in ('online','offline')),
  stage        text not null default 'prospecting'
                  check (stage in ('prospecting','qualification','proposal','negotiation','closed-won','closed-lost')),
  priority     text not null default 'medium'
                  check (priority in ('low','medium','high')),
  ai_prediction integer,
  description  text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  user_id      uuid
);

-- ----------------------------------------------------------------------------
-- activities
-- ----------------------------------------------------------------------------
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  title       text not null,
  description text,
  user_id     uuid,
  user_name   text,
  entity_type text not null check (entity_type in ('task','deal','contact','calendar')),
  entity_id   uuid,
  created_at  timestamptz not null default now(),
  metadata    jsonb
);

create index if not exists idx_contacts_user_id on public.contacts (user_id);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_deals_user_id on public.deals (user_id);
create index if not exists idx_activities_user_id on public.activities (user_id);
create index if not exists idx_activities_entity on public.activities (entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- NOTE: This app ships WITHOUT an authentication flow (it uses the Supabase
-- anon key directly). The policies below therefore grant open access to the
-- four core tables so the remote module functions end-to-end. This is suitable
-- for a single-tenant / demo deployment but is NOT multi-tenant safe.
--
-- TODO (production hardening): introduce auth (supabase.auth.signIn*) and scope
-- every policy with `where auth.uid() = user_id`, set user_id on insert in
-- api.ts (mapContactToDB / mapTaskToDB / mapDealToDB), and remove the
-- open-access policies below.
-- ----------------------------------------------------------------------------
alter table public.contacts   enable row level security;
alter table public.tasks      enable row level security;
alter table public.deals      enable row level security;
alter table public.activities enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['contacts','tasks','deals','activities']
  loop
    execute format('drop policy if exists "open_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "open_all_%1$s" on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
