-- Favorites for tasks and deals (contacts already have is_favorite).
alter table public.crm_tasks add column if not exists is_favorite boolean not null default false;
alter table public.deals add column if not exists is_favorite boolean not null default false;
