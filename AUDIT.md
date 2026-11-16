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
| Migrations on a fresh DB | **failed** at the 2nd migration | all 20 apply (Postgres 16) |
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

## RESOLVED (option 2): calendar tables now use the same open access as the core tables
The app has no sign-in and uses the Supabase **anon** key, so contacts/tasks/deals/activities use open policies. The calendar tables
(`calendar_events`, `calendar_event_participants`, `calendar_event_targets`, `calendar_settings`, `calendar_views`) had owner-only
policies for signed-in users, which blocked every write from the real app (verified on Postgres as the `anon` role).
Migration `20251231000000_calendar_access_matches_app.sql` gives them the same open policies and makes `calendar_settings` a single
`default` row. Re-verified on Postgres 16 as both `anon` and `authenticated`: insert, read, update, delete, settings upsert and the
timeline function all work.
**Security note:** this is not multi-tenant safe. Anyone holding the anon key can read and modify every contact, task, deal, activity,
calendar event, saved view and setting. Add sign-in and per-user policies before storing sensitive data.

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
| Database: full migration chain + access as anon/authenticated | Postgres 16 | pass |
| Home screen: stat trends, Recent Activity, Tasks Schedule, Stage Funnel, Interaction History | tests + browser | **real data** (was hardcoded); empty states when there is none |
| Accessibility (axe) | browser | critical issues fixed; contrast/heading-order remain (see Accessibility) |

## Accessibility (axe-core, `node scripts/axe-audit.cjs`)
Run on 5 views x desktop/mobile. Before -> after, per view (critical/serious/moderate rule types):
- **Fixed**: `select-name` (every `<select>` now has an accessible name), `label` (list-view checkboxes, birthday date input),
  `button-name` (modal close buttons, kanban add-task, email recipient/attachment remove, contact custom-field remove),
  `nested-interactive` (kanban favorite star removed from draggable cards; Interaction History card no longer a `role=button`
  containing a button), `label-content-name-mismatch` (command menu, due-date button, Filters/Views), `landmark-one-main`
  (`<main>` added), `page-has-heading-one`, week-number and Delete-mock-data text contrast.
- **Result**: no critical issues remain (was 4 rule types incl. `select-name` x2-5 and `button-name` x1-4 per view).
- **Still open (design-dependent, left as is by the "do not change the design" rule)**: `color-contrast` on white text over
  coloured calendar event bars / blue avatar chips / Interaction History cards (about 3-20 nodes per view), `heading-order`
  (1-2 per view) and `region` on the New Contact modal (13 nodes, dialog content outside landmarks).

## Needs your keys (cannot run here)
- Deploy: `supabase link`, `supabase db push` (chain now applies), `supabase functions deploy`, `supabase secrets set OPENAI_API_KEY ...`.
- Smoke each AI function with a real key: `contacts_enrich` (web_search + strict JSON together), `contacts_score`, `contacts_image`
  (model `gpt-image-2.6-flare`, `avatars` bucket), `ai_stream` (SSE through Supabase), `research_web`, `generate_*`.
- Confirm model IDs (`gpt-6-astra`, `gpt-image-2.6-flare`) accept the parameters sent (no temperature, `reasoning.effort`, `include` sources).
- Netlify deploy and `VITE_HOST_ORIGIN` for the host embed.

## Re-running
`npx vitest run --coverage`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, and `scripts/e2e-audit.cjs` (see its header).

## Screenshots

`docs/screenshots/*.png` (24 images) are produced by `node scripts/screenshots.cjs` against a mocked Supabase REST API (no live OpenAI key), so the UI and flows are real but AI results are canned.

### Edit Task from the calendar (resolved)
Earlier sweeps reported that pressing **Edit Task** "did nothing". It was not a dead click: clicking a task on the calendar opens the *event details* dialog, whose **Edit Task** button hands over to the task modal, which then opened in **view** mode with a second **Edit Task** button. Users (and the sweep) had to press Edit twice. `TaskDetailsModal` now takes `startInEditMode`, and the calendar passes it, so both routes ("Edit Task" in event details and "Edit" in the right-click menu) open straight in edit mode. Regression tests in `recordCalendar.test.tsx` drive the real flow and fail without the change. The modal's reset effect is also keyed on ids rather than object identity, so a parent re-render cannot wipe a form in progress.

## Delete mock data button
Previously the button only emptied the in-browser stores: nothing was deleted from Supabase (data came back on refresh) and real records on screen were wiped too. It now deletes rows flagged `is_sample` from the database (children before parents) and removes exactly those records from the stores; a database error leaves the screen untouched and is shown in the dialog. Covered by `src/__tests__/audit/sampleData.audit.test.tsx` and verified on Postgres 16 as role `anon` (only flagged rows deleted). Existing demo rows must be flagged once (see `DEPLOY.md`).

## Calendar event editing
Events could be created, moved and deleted but not edited. The existing event composer now has an edit mode (title, all-day, start/end, time zone, location, video link, description, visibility; guests and record links are left unchanged). It opens from the event details dialog ("Edit Event") and the right-click menu ("Edit"), prefilled, and saves with `calendarEventApi.update`; a failed save keeps the dialog open with an error. Tests in `recordCalendar.test.tsx`; the real browser sends the expected `PATCH calendar_events` body.

## Status of the 12 AI Calendar features
Done and tested: record calendar, card customization, persisted drag-and-drop, selection/keyboard, filtering, saved views, activity-linked tasks, record timeline, task grouping, embedded task widgets, contextual menus. Not done: external Google/Microsoft sync (excluded by decision). #12 detail layouts and within-day position reordering are now built (below). Filters, menu actions, saved-view UI and selection are labelled glue rather than verbatim Twenty code, since upstream has nothing portable there.

## Within-day reordering and detail layouts
**Reordering.** Tasks, deals, contacts and events have a `position` (migration `20260102000000_record_position.sql`). react-big-calendar reports only the day a card is dropped on, so within-day order is edited in a per-day list (`DayRecordsDialog`: "+N more" in a month cell, or right-click > "Reorder this day"), draggable by mouse, touch or keyboard, using Twenty's own `computeNewPositionOfDraggedRecord` (vendored, with its upstream tests). A day that was never ordered is numbered 1..n first. The change is applied immediately and rolled back with an error if saving fails. In the month grid, all-day cards (deals, contacts, untimed tasks/events) follow the saved order; timed cards always stay in time order, and all-day cards always sit above timed ones (react-big-calendar's own rule, not changeable).
**Layouts.** Compact / Full switch on the task, deal, contact (overview) and event details; remembered per record type in the browser (falls back gracefully when storage is blocked). Compact keeps key facts and hides secondary sections. This is a small version of Twenty's page layouts, which are metadata-driven and not portable here.

## Group A: task rows, favorites, calendar polish
- **Task rows** (list view and the record Tasks widget): due chip (Overdue / Today / Tomorrow / date), assignee avatar, click the chip to change the due date in place, star. `getDueChip` is unit tested.
- **Favorites**: tasks, deals and contacts can be starred (calendar right-click, details headers, kanban card, task rows); starred cards show a star; "Favorites only" calendar filter; a Favorites block on the home screen opens any record (`openRecordStore` + `OpenRecordHost`, reused by the command menu). Migration `20260103000000_favorites.sql` (verified on Postgres 16 as `anon`).
- **Calendar**: click an empty day to create a task, event (starting 9:00 that day) or a contact follow-up; hover/focus a card for a preview; ISO week numbers on Mondays in the month view (the day number is still a link to the day view). Today was already highlighted by the calendar.
- **Bug found and fixed while testing**: tasks did not read their saved `position` back from the database (only writes were mapped), so within-day order would not have survived a refresh for tasks. Read mappers for all four record types are now tested.

## Group B: notes and richer timeline
- **Notes** on contacts (Journey tab), deals, tasks and calendar events: add, edit, delete, pin; stored as `activities` rows of type `note_added` (no schema change). Formatting is markdown-lite (bold, italic, code, bullet lists, http(s) links) rendered as React elements, so note text cannot inject markup (tested, incl. `javascript:` links). Twenty's block editor was not used (it needs a large editor dependency).
- **Timeline** (`RecordTimeline`, used for contact, deal and task): typed rows, grouped by month with collapsible headers, type filter chips, "Load more", linked calendar events merged in. Timelines now ask the server for just that record's activities (`activityApi.getForEntity`) instead of loading every activity.
- `activityApi` gained `update` and `delete`; lists refresh through a small version store after any change.

## Group C: command menu
Ctrl/Cmd+K (or the search button in the header) opens a palette: type to find tasks, deals, contacts and events (scored match; every word must match; favorites get a small boost) and open them in their normal details view, or run a command (new task / event / contact / deal, go to Calendar / Kanban / list / activity, toggle dark mode, open settings, delete mock data). With an empty box it lists recent items and favorites. Arrow keys, Enter and Esc work; it is a combobox/listbox for screen readers. Recent items are kept in the browser and the menu still works when storage is blocked. "Reorder this day" is not in the menu (it needs a particular day open on the calendar); use the calendar's right-click menu for it.

## Group D: advanced filters and table view
- **Advanced filters**: rules with operators (text: contains / does not contain / is / is not / starts with / empty; number: = / != / > / < / between; date: is / before / after / between / today / next or last N days; select: is / is not / is any of; tags: has any / has all; yes/no) joined by AND or OR. The operand names and meanings follow Twenty's record filters; the matcher is ours, over this app's typed records (Twenty's runs on GraphQL/metadata and could not be reused). Currency strings like "$85,000" compare as numbers. A single flat group (no nested groups). Available in the calendar Filters menu ("Advanced rules", saved with calendar views; older saved views still load) and in the table.
- **Table view** (new button in the view switcher, and "Go to Table view" in the command menu): Contacts / Deals / Tasks tabs with sortable columns (asc, desc, off; empty values always last), column picker, search, rules, row selection with bulk actions (favorite / unfavorite, mark complete, add tag, set status or stage, delete with confirmation; partial failures are reported, not hidden), paging, and saved views per record type (new `record_views` table, migration `20260104000000_record_views.sql`, verified on Postgres 16 as `anon`). Clicking a row opens the normal details view.

## Group E: attachments
Files can be attached to contacts (Journey tab), deals, tasks and calendar events: choose or drop files (up to 25 MB each, several at a time), see name, size and date, download through a one-minute signed link (opened without opener access), and delete after a confirmation. Metadata lives in the new `attachments` table and the bytes in a new private `attachments` Storage bucket (migration `20260105000000_attachments.sql`, verified on Postgres 16 as `anon`, including the storage policies). Uploads appear in the record timeline as "File added: ..."; if the timeline entry cannot be written the upload still counts. A failed metadata write removes the stored file again, so nothing is orphaned. Deleting sample data also deletes the files of the deleted records. Storage keys use a sanitised name while the readable name is kept in the table.
**Needs your project**: Supabase Storage must be enabled (it already is for avatars); after `supabase db push`, upload one real file to confirm the bucket and policies on your project.

## Real data on the home screen
The home blocks used invented numbers; they now read your records. **Stat chips**: week-over-week change in tasks created and tasks completed, shown only when last week gives a real baseline (hover shows "N this week, M last week"). **Recent Activity**: the latest rows of the activities table (plain-text snippets, relative times) and real completed/pending task counts, with an empty state. **Upcoming Deals** now opens the deal and "View All" opens the deals list (they only logged to the console). **Tasks Schedule**: this week by day and this month's assignees come from task due dates and assignees; the month name is the current month. **Stage Funnel**: open pipeline by stage with weighted and total value from deals. **Interaction History**: your latest deals as cards, opening the deal. "Pipeline Insights" now calls the real insights function. Still placeholder: a few option handlers in the Tasks Schedule menu (export, share link, etc.) show browser alerts, as before.

Also replaced three leftover fakes with the real functions: the task form's AI writing buttons (random canned sentences, now `generate_task_suggestions`), the contact detail "Analyze" button (random 60-100 score after a 2 s sleep, now `contacts_score`) and the contacts list analyze action (random placeholder score, now `contacts_score`). A failed AI call shows an error and changes nothing; no score is invented.
