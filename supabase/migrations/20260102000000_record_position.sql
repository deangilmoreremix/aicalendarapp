-- Manual order of records that share a calendar day (Twenty's record `position`).
-- Nullable: records without a saved position sort as 0, like upstream (`record?.position ?? 0`).
alter table public.crm_tasks       add column if not exists position double precision;
alter table public.deals           add column if not exists position double precision;
alter table public.contacts        add column if not exists position double precision;
alter table public.calendar_events add column if not exists position double precision;
