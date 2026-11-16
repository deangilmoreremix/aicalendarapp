-- Marks demo/sample records so the "Delete mock data" button can remove exactly those and nothing else.
-- Existing rows default to false (real data). Flag your demo rows once with scripts/mark-sample-data.sql.
alter table public.contacts        add column if not exists is_sample boolean not null default false;
alter table public.tasks           add column if not exists is_sample boolean not null default false;
alter table public.deals           add column if not exists is_sample boolean not null default false;
alter table public.activities      add column if not exists is_sample boolean not null default false;
alter table public.calendar_events add column if not exists is_sample boolean not null default false;

create index if not exists contacts_is_sample_idx        on public.contacts (id)        where is_sample;
create index if not exists tasks_is_sample_idx           on public.tasks (id)           where is_sample;
create index if not exists deals_is_sample_idx           on public.deals (id)           where is_sample;
create index if not exists activities_is_sample_idx      on public.activities (id)      where is_sample;
create index if not exists calendar_events_is_sample_idx on public.calendar_events (id) where is_sample;
