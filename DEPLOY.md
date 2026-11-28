# Deploying (Netlify + Supabase + OpenAI)

The stack is Netlify (hosting/build), Supabase (Postgres, Storage, Edge Functions) and the OpenAI API.
Nothing else is used. All OpenAI calls are made server-side from Supabase Edge Functions.

## 1. Netlify (frontend)
Build settings come from `netlify.toml`. Set these site environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

Deploy with Netlify's Git integration, or `npx netlify deploy --prod --dir=dist` after `npm run build`.

## 2. Supabase
```bash
supabase link --project-ref <ref>
supabase db push                 # tables, RLS, calendar_events, avatars storage bucket
supabase functions deploy        # all functions in supabase/functions
```

**OpenAI is bring-your-own-key.** There is no server-side OpenAI secret to set. Each user adds their own key in Settings ("OpenAI key"); it is kept only in that browser and sent in the `x-openai-key` header (optionally `x-openai-model`, `x-openai-image-model`) with each AI request. The edge functions forward it to OpenAI and never store or log it, and they do not fall back to a server key. The default models are `gpt-6-astra` and `gpt-image-2.6-flare`; a user whose account uses other models sets them in the same card. Limits: the key is readable by anything running in the page, and without sign-in it does not follow the user to another device, so recommend a project-limited key with a spend cap.

## Edge functions
| Function | OpenAI API | Used for |
| --- | --- | --- |
| `contacts_enrich` | Responses + `web_search` | Public-information enrichment (structured JSON + sources) |
| `contacts_score` | Responses (strict JSON) | Lead score, sub-scores, next best action |
| `contacts_image` | Images API | AI avatar, stored in the `avatars` bucket |
| `generate_ai_insights`, `generate_task_suggestions`, `generate_meeting_agenda`, `optimize_meeting_time`, `predict_deal_success`, `generate_deal_suggestions` | Responses (strict JSON) | CRM insights, tasks, meetings, deals |
| `email_compose`, `meetings_plan`, `research_web` | Responses (+ `web_search` for research) | Text generation |
| `ai_stream` | Responses (`stream: true`) | Server-sent token streaming to the UI |

## Notes
- Emails composed in the app are saved to the contact's activity log; no email delivery provider is part of this stack.
- `npm test` includes a stack allowlist test that fails if other services (Gemini, Google APIs, image CDNs, ...) are referenced.

## Calendar (ported from Twenty)
The contact view has a **Calendar** tab (timeline grouped by month/day, "New event" composer) and Calendar Settings has a default
event visibility (Everything / Metadata). The migration `20251229000000_calendar_timeline.sql` adds participants, event targets,
settings and the `get_timeline_calendar_events` RPC. There is no Google/Microsoft sync. See `src/vendor/twenty/README.md`.

## Unified calendar
Migration `20251230000000_unified_calendar.sql` adds `tasks.start_time/end_time`, `contacts.next_follow_up` and `calendar_views`.
Deals appear on the calendar when `due_date` is a `YYYY-MM-DD` date; free-text values (e.g. "Next Week") are skipped.

## Access model
There is no sign-in: the app uses the Supabase anon key and every table (contacts, tasks, deals, activities, calendar_*) has an open
`anon, authenticated` policy. Anyone with the anon key can read and change this data. Add sign-in and per-user policies before
storing sensitive data.

## Delete mock data button
The **Delete mock data** button (top right) deletes only records flagged `is_sample = true` (contacts, tasks, deals, activities, calendar events) from the database and the screen, plus the in-memory demo appointments. Unflagged (your own) records are never touched.

- Migration `20260101000000_is_sample_flag.sql` adds the flag (default `false`, so existing rows are treated as real).
- Flag your existing demo rows once with `scripts/mark-sample-data.sql`: read each statement, run its `select` first, adjust the condition to your demo data, then run the `update`.
- Until rows are flagged the dialog shows "No Sample Data Found".

## Migrations to apply (`supabase db push` applies all 32 in order)
New since the first release: `20251231000000_calendar_access_matches_app`, `20260101000000_is_sample_flag`,
`20260102000000_record_position`, `20260103000000_favorites`, `20260104000000_record_views`, `20260105000000_attachments`
(creates the private `attachments` Storage bucket; Storage must be enabled in the project), and `20260106000000_realtime_calendar_tables` (live calendar updates; Realtime must be enabled in the project, otherwise the calendar still works and refreshes on navigation) and `20260107000000_calendar_blocklist` (Calendar Settings blocklist), and `20260108000000_timeline_applies_blocklist` (record timelines leave out blocked events before paging), and `20260109000000_atomic_calendar_writes` (creating an event with its guests and links, and linking guests to a new contact, each run as one database transaction) and `20260110000000_updated_at_triggers` (keeps `updated_at` current on contacts and deals so the calendar's "Last updated" date follows edits), `20260111000000_app_grants` (explicit grants to the API roles, needed where new public tables are private by default), `20260112000000_ical_uid_recurrence` (.ics import UIDs and repeating events) and `20260113000000_clean_orphan_events` (Calendar Settings cleaner).

The tasks table is named `crm_tasks` (it used to be `tasks`). If you already applied the old migrations to a project, run `alter table public.tasks rename to crm_tasks;` once before `supabase db push`.

**Shared Supabase project?** Do not run the old `20251012*` migrations in a project that hosts other apps: they drop and recreate policies and indexes on tables such as `users`, `api_keys` and `apps`. Apply only the calendar/CRM migrations (everything from `00000000000000_create_crm_core_tables` onwards except `20251012*`), and remember the tables are open to anyone with the anon key until sign-in and per-user policies are added.

## Deploy checklist
1. `supabase db push`, then `supabase migration list` and check the local and remote histories match (an existing project only applies the new ones), then `supabase functions deploy`.
2. No OpenAI secret is needed (bring-your-own-key: users add their key in Settings).
3. Netlify env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (+ `VITE_HOST_ORIGIN` if embedded); deploy.
4. Smoke test with a key added in Settings: score and enrich a contact, draft an email, generate an avatar (file appears in `avatars`),
   upload a file to a record (appears in `attachments`), drag a task on the calendar, save a view.
5. Confirm the model ids exist on your account; override through the env vars if not.
6. Flag demo rows with `scripts/mark-sample-data.sql` if you want "Delete mock data" to remove them.
7. Before real customer data: add sign-in and per-user policies.

## `twenty/` submodule
`.gitmodules` still lists the upstream Twenty repository; the folder is empty and unused at runtime (`netlify.toml` removes it
before building). Vendored code lives in `src/vendor/twenty/`.

## Deployed to a shared Supabase project (notes)
The calendar/CRM migrations (everything except `20251012*`) were applied to project `bzxohkrxcwodllketcpz` through the Supabase connector, so its migration history carries the connector's own version stamps: do not run `supabase db push` against it (use `supabase migration repair` first if you ever need to). The edge functions are deployed with the CLI: `supabase link --project-ref bzxohkrxcwodllketcpz && supabase functions deploy`. No OpenAI secret is needed: the app is bring-your-own-key.
