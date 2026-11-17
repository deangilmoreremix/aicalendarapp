-- One-time helper: flag your existing DEMO rows as sample data so the "Delete mock data" button can remove them.
-- Review each statement and adjust the condition to match YOUR demo data, run a SELECT first, and only then UPDATE.
-- Real rows must not match. (The button deletes rows where is_sample = true and nothing else.)

-- select id, email from public.contacts where email like '%@example.com';
update public.contacts set is_sample = true where email like '%@example.com';

-- Everything linked to those sample contacts (adjust to how your demo data is related):
update public.deals set is_sample = true where contact_id in (select id from public.contacts where is_sample);
update public.tasks set is_sample = true where related_to->>'id' in (select id::text from public.contacts where is_sample);
update public.activities set is_sample = true where entity_id in (select id from public.contacts where is_sample);
