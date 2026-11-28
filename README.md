# AI Calendar

An AI-assisted calendar and light CRM: tasks, deals and contacts on one calendar, Kanban/list/table views, notes, files and
a timeline per record, and OpenAI-powered scoring, enrichment, insights and drafting. Vite + React + TypeScript, Supabase
(Postgres, Storage, Edge Functions), Netlify, and the OpenAI API. Nothing else is used.

## What is in it
- **Unified calendar** (react-big-calendar): tasks, deals, contacts (next follow-up) and events; drag to reschedule, reorder
  inside a day, click an empty day to create, hover preview, right-click menu, favorites, week numbers, saved views.
- **Filters**: rule builder (AND/OR, per-field operators) used by the calendar and the table view; saved record views.
- **Calendar import/export**: .ics export (visible range or one record's events) and import; **repeating events** (daily/weekly/monthly/yearly); an orphan-event cleaner in Calendar Settings.
- **Table view** for contacts, deals and tasks: sort, column picker, search, paging, bulk actions.
- **Records**: compact/full detail layouts, notes (markdown-lite), files (Supabase Storage), typed timeline, task widgets.
- **Command menu** (Ctrl/Cmd+K): find any record or run an action.
- **AI** (server-side only): contact score and enrichment (web search with sources), AI avatars, email drafting (saved to the
  activity log, not sent), insights, task/meeting/deal suggestions, streaming.
- **Home screen** from real data (week-over-week task trends, recent activity, schedule, deal funnel, latest deals).
- **Delete mock data** removes only records flagged as sample data.
- Embeddable as a Module Federation remote (`MODULE_FEDERATION.md`, `EMBEDDING_GUIDE.md`).

Ported Twenty (AGPL) code is under `src/vendor/twenty/` with provenance headers; see its README. Pieces with no portable
upstream code are labelled "glue (ours)".

## Develop
```bash
npm ci
npm run dev
npm run test:run          # vitest
npx tsc -p tsconfig.app.json --noEmit
npm run lint              # 0 errors; `any` is a warning
npm run build
node scripts/axe-audit.cjs        # accessibility sweep (needs Playwright's Chromium)
node scripts/screenshots.cjs      # regenerates docs/screenshots (mocked Supabase)
```
Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Docs
- `DEPLOY.md`: Netlify + Supabase + OpenAI steps and the deploy checklist.
- `AUDIT.md`: feature matrix, test results, known limits.
- `CHANGELOG.md`, `docs/screenshots/README.md` (screenshot index).
- `docs/supabase-cli-README.md`: the Supabase CLI readme that used to live here.

## Known limits
- No sign-in: every table has open `anon, authenticated` policies (see `DEPLOY.md`, "Access model").
- AI functions were tested against mocks; they need a smoke test with a real key (added in Settings) after deploy. The app is bring-your-own-key: users add their own OpenAI key, kept only in their browser.
- No email delivery, no Google/Microsoft calendar sync (outside the Netlify + Supabase + OpenAI stack).
