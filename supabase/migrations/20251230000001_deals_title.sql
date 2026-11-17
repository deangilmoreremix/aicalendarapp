-- The New Deal form requires a "Deal Title" but deals had no column for it, so it was silently discarded.
alter table public.deals add column if not exists title text;
