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
supabase secrets set OPENAI_API_KEY=... OPENAI_MODEL=gpt-6-astra OPENAI_IMAGE_MODEL=gpt-image-2.6-flare
```

`OPENAI_MODEL` and `OPENAI_IMAGE_MODEL` are optional (defaults shown).

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
