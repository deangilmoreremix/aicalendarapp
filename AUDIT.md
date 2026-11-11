# Calendar app audit

Scope: every view, modal, store, service function, edge function and migration, checked by unit/integration tests,
a real-browser sweep against a mocked Supabase, a Postgres 16 migration/RLS run, and static/security checks.
Everything here ran in a sandbox: **nothing was run against a live OpenAI key or a real Supabase project** (see "Needs your keys").

## Results at a glance
| Check | Before | After |
|---|---|---|
| Tests | 269 | **353 passing** (32 files) |
| Line coverage | 28% | **42%** (17 files still at 0%, mostly modals covered only by the browser sweep) |
| `tsc` | 0 errors | 0 errors |
| Browser sweep (`scripts/e2e-audit.cjs`) | crashed/looped in 3 places | **all 24 steps pass, 0 console errors/warnings** |
| Migrations on a fresh DB | **failed** at the 2nd migration | all 19 apply (Postgres 16) |
| `npm audit` (prod) | 9 (6 high) | 2 moderate (react-router, needs a breaking major) |

## Bugs found and fixed
| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | **Critical** | Kanban: `tasks` was a new array every render and drove an effect that called the OpenAI-backed `generate_ai_insights` and set state, so opening the Kanban view called the AI endpoint in an endless loop | memoised tasks + debounced effect |
| 2 | **Critical** | `supabase db push` on a fresh project failed: six migrations (written for another app) reference tables that don't exist | every statement guarded; chain verified |
| 3 | High | Send Email, Schedule Meeting and Add User modals reset their own form on every render ("Maximum update depth exceeded", typed input wiped) because of a `= []` default prop | module-level default |
| 4 | High | Deals: the required "Deal Title" was silently discarded (no column/mapping) | `deals.title` column + mapping |
| 5 | High | Kanban drop into Completed set the status but not the `completed` flag; every move blanked the board via a global loading flag | flag kept in sync; optimistic move |
| 6 | High | Contact cards made 2-4 identical OpenAI scoring requests each (score + next action + repeat effects), and next-best-action scored a contact it only had an id for | per-contact cache + shared in-flight request, real contact passed |
| 7 | Medium | `tasks.start_time/end_time` had no columns (time-blocked tasks were dropped) | migration + mappers (earlier phase, verified end to end here) |
| 8 | Medium | Kanban built `undefined@company.com` emails (always-truthy template literal) | fixed |
| 9 | Medium | Modals ignored Escape (Dialog, settings, New Contact/Deal, clear-data) and had no dialog role/name | Escape + `role="dialog"` + accessible name |
| 10 | Medium | "Delete All Mock Data" says it "permanently deletes" your data and counts real records; it only clears the in-memory copy | wording corrected, Escape added |
| 11 | Medium | Mobile: calendar toolbar and kanban header overflowed the page (1043px at 390px wide) | wrapping / board scrolls inside itself |
| 12 | Medium | Host messaging accepts any origin and applies host CSS/data; records without `id` were stored under key "undefined" | `VITE_HOST_ORIGIN`, invalid records ignored |
| 13 | Low | Unlabelled "Related record" field, toolbar prev/next buttons | labelled |
| 14 | Low | 7 vulnerable dependencies | `npm audit fix` |

## OPEN: decision needed - calendar tables are blocked for the real app
The app has no sign-in flow and uses the Supabase **anon** key, so contacts/tasks/deals/activities use open policies
(documented in the core migration). The calendar tables added later (`calendar_events`, `calendar_event_participants`,
`calendar_event_targets`, `calendar_settings`, `calendar_views`) only allow signed-in (`authenticated`) users.
Verified on Postgres as the `anon` role: inserts into the first four succeed; **inserts into `calendar_events` and
`calendar_settings` are rejected by row-level security, and the timeline function returns nothing.** So creating events,
the contact Calendar tab, saved views, and the visibility setting will not work in the deployed app until one of:
1. add real sign-in (then the owner-only policies work and data is per-user - recommended for production), or
2. give these tables the same open policies as the core tables (works now; anyone with the anon key can read/write them, exactly like contacts today), or
3. leave as is.
I did not apply option 2 because it loosens security and needs your call.
Also note: with open core policies **anyone holding the anon key can read and modify every contact, task, deal and activity.**

## Feature matrix
| Area | How tested | Result |
|---|---|---|
| Calendar: month/week/day/agenda, Today/Prev/Next, week title | tests + browser | pass (Today/Prev/Next fixed) |
| Calendar: tasks, deals, contacts, events on one calendar | tests + browser | pass |
| Calendar: drag a card to another day (deal, contact, task, event) | tests + browser (real drag, request body checked) | pass |
| Calendar: filters, saved views, right-click menu, selection/Escape | tests + browser | pass (saved view POST verified) |
| Calendar: time-blocked tasks (start/end) | browser (create -> saved -> shown in week view) | pass |
| Task create/edit/delete/subtasks/tags/link to record | tests + browser | pass |
| Kanban: columns, drag between columns, search, open task | tests + browser | pass after fixes 1, 5, 8 |
| List view, activity view | browser | loads, no errors; no dedicated tests |
| Contacts: list, search, detail tabs (9), create, import (CSV) | tests + browser | pass |
| Contacts: AI score/next action/enrich/insights panel | tests (mocked API) + browser | pass (live AI untested) |
| Deals: create (contact required), list, details, tasks/calendar widgets | tests + browser | pass after fix 4 |
| Email composer (saves to activity log, no delivery) / Meeting scheduler | tests + browser | pass after fix 3 |
| Calendar Settings (prefs, default visibility) | tests + browser | pass |
| Embed/module federation (`CalendarApp`, `CalendarModule`, `ContactsModal` exposed; host sync, theme) | build output + 11 tests | pass |
| 14 edge functions (validation, fallbacks, OpenAI request shape, errors, streaming, image upload) | 44 handler tests | pass; live API untested |
| Database: full migration chain + RLS | Postgres 16 | pass; see OPEN item |
| Home screen "Recent Activity" panel and stat trend chips ("+5%", "24 completed") | browser | **hardcoded sample data, not real** |
| Accessibility (axe) | browser | backlog below |

## Accessibility backlog (not fixed; existing components)
axe found, per view: unlabelled `<select>`s (about 10 across New Contact/Deal, Email, filters), icon-only buttons without names
(modal close buttons, contact detail edit pencils, kanban header), checkboxes/date inputs without labels, low-contrast green
stat chips (`text-green-500` on white), no `<main>` landmark / heading order. Counts and elements are reproducible with the sweep.

## Needs your keys (cannot run here)
- Deploy: `supabase link`, `supabase db push` (chain now applies), `supabase functions deploy`, `supabase secrets set OPENAI_API_KEY ...`.
- Smoke each AI function with a real key: `contacts_enrich` (web_search + strict JSON together), `contacts_score`, `contacts_image`
  (model `gpt-image-2.6-flare`, `avatars` bucket), `ai_stream` (SSE through Supabase), `research_web`, `generate_*`.
- Confirm model IDs (`gpt-6-astra`, `gpt-image-2.6-flare`) accept the parameters sent (no temperature, `reasoning.effort`, `include` sources).
- Netlify deploy and `VITE_HOST_ORIGIN` for the host embed.

## Re-running
`npx vitest run --coverage`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, and `scripts/e2e-audit.cjs` (see its header).
