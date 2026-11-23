# Changelog

All notable changes to the AI Calendar App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Calendar import/export, repeating events, event cleaner, shared-project deploy
- **.ics export** (calendar toolbar "Import / Export", and "Export" on a record's Calendar card): standard iCalendar file with times in UTC (or whole days), guests, and the repeat rule; a repeating event is written once.
- **.ics import**: pick a file, see what it contains, import. Reads UTC, floating and TZID times, whole days, DURATION, guests and supported repeat rules; skips cancelled events and edited single occurrences of a series (with a message). `ical_uid` (new column, unique) makes importing the same file twice skip events already stored.
- **Repeating events**: daily / weekly (days) / monthly / yearly with interval and an end (never, on a date, after N times), in the event editor. One stored row per series; the calendar shows each occurrence. Editing or deleting applies to the whole series; single occurrences cannot be dragged on their own (documented limit). Record timelines show the series once.
- **Event cleaner**: Calendar Settings, "Clean up orphan events" removes events with no guests and no links (older than an hour) through `clean_orphan_calendar_events`.
- **Shared Supabase project**: the task table is now `crm_tasks` (it clashed with a `tasks` table in a shared project); `20260111000000_app_grants.sql` grants the API roles access explicitly (projects with private-by-default tables need it). Migrations: `20260111` grants, `20260112` ical_uid + recurrence, `20260113` orphan cleaner (32 in total).
- Fixed on the way: a `;` in an event title was not escaped in the .ics text (caught by lint, covered by a round-trip test).

### Calendar follow-ups (branch `claude/calendar-link-match-realtime`)
- **Link an existing event** to a contact or deal from its Calendar card (`calendar_event_targets`, duplicates ignored).
- **Guests matched to contacts by email** (case-insensitive): a new event links matching guests to the contact and the event to that contact; when a contact is created or its email changes, existing guests with that email are linked too. Ours (glue): Twenty's matcher runs inside its workspace-schema server code and is not portable.
- **Live updates** through Supabase Realtime for events, tasks, deals and contacts (migration `20260106000000_realtime_calendar_tables.sql` adds them to the `supabase_realtime` publication; skipped on plain Postgres).
- **More date fields**: tasks by Completed / Created, deals and contacts by Last updated. Records placed by a system date (created / updated / completed) can't be dragged.
- **More of Twenty's calendar code**: `src/vendor/twenty/calendar-sync/` (time zone helpers, blocklist matching, text clean-up, date parsing, with 47 upstream tests) and `record-calendar/card/` constants. New **calendar blocklist** (`20260107000000_calendar_blocklist.sql`, Calendar Settings card): events with a blocked address or domain are left out of the calendar and record timelines. Event text is stripped of control characters and an empty time zone falls back to UTC. Record timelines apply the blocklist inside the database function before counting and paging (`20260108000000_timeline_applies_blocklist.sql`); the blocklist list is cached for 10 s and refreshed on Realtime changes. Ticking a task in the list view is now saved (it only changed the screen before, so a refresh brought the old state back). `src/vendor/twenty/README.md` lists what was audited and not ported, with reasons.
- **Review fixes (round 2)**: creating an event with its guests and links, and linking a new contact's guests, are now single database transactions (`20260109000000_atomic_calendar_writes.sql`, called through RPC) instead of several writes with a clean-up; Realtime also watches event guests and links (published in `20260106000000`) so another open calendar never keeps a half-saved event; saves of the same task run in order with a rollback taken just before each save, and a Realtime task refresh that overlaps a save of one of our tasks is read again instead of applied; the blocklist card reloads after a removal so a just-added entry stays visible; the ids excluded from the linkable-events search must be UUIDs. Round 3: imported contacts are linked to matching guests; a Realtime task refresh given up while a save is pending runs again once saves settle; `updateTask` joins the per-task save queue; `link_guests_to_contact` claims the guests first so two contacts with the same email cannot both link an event; `20260110000000_updated_at_triggers.sql` keeps `updated_at` current on contacts and deals (the "Last updated" date field).

### OpenAI Responses API migration
- All AI runs through the OpenAI Responses API (`gpt-6-astra`) via a shared Supabase Edge Function helper: strict JSON schemas, `web_search` for contact enrichment and research (with sources), real SSE streaming (`ai_stream`), GPT Image 2.6 avatars stored in Supabase Storage.
- Removed non-stack services (Gemini copy, `googleapis`, Pexels/ui-avatars hotlinks, mock Google/Microsoft OAuth).
- Replaced mocked AI screens with real data (insights, deals, scoring, interaction timeline, email composer saves to activity log).
- Fixed: `useHostDataSync` store writes, CSV import header mapping and error display, contact interest level `warm`, kanban selected task, activity feed/contact profile record handling, missing `calendar_events` migration.
- Calendar: ported Twenty's calendar timeline (utils/tests verbatim, UI logic in our design), event composer, per-event visibility, Calendar tab on contacts, Supabase timeline RPC.
- Unified CRM calendar: tasks, deals, contacts (new follow-up date) and events on `BigTaskCalendar`; drag-and-drop date changes persisted through the existing services; filters, saved views (`calendar_views`), right-click menu (edit / duplicate / reschedule / delete), record selection, embedded task widgets in contacts and deals, task-to-record linking. Upstream Twenty `record-calendar` / `record-drag` utilities are used for ranges, week titles and date shifting.
- Fixed: `tasks.start_time/end_time` had no columns (time-blocked tasks were dropped / updates failed), calendar events had no read API, calendar toolbar navigation (Today, per-view Prev/Next), linked-event lookup in `TaskDetailsModal`.
- Twenty-style CRM features (no design change): task rows with due chips, favorites, calendar polish (empty-day chooser, preview, week numbers), notes, typed timeline, command menu (Ctrl/Cmd+K), advanced filter rules, table view with saved views and bulk actions, file attachments, compact/full detail layouts, within-day position reordering, calendar event editing, "Delete mock data" for sample-flagged rows.
- Home screen now uses real data (trends, recent activity, schedule, funnel, latest deals); leftover fake AI paths replaced by real calls.
- Accessibility: every select/checkbox/icon button named, nested interactives removed, `<main>` landmark; axe sweep in `scripts/axe-audit.cjs`.
- Lint: 0 errors (`no-explicit-any` is a warning, off in tests). Removed unused `react-router-dom` (prod `npm audit`: 0).
- Migrations added: `20251231` calendar access, `20260101` is_sample, `20260102` record position, `20260103` favorites, `20260104` record_views, `20260105` attachments (+ private `attachments` bucket).
- See `DEPLOY.md` for deployment.

## [Earlier] - 2026-04-27

### 🚀 Major Enhancements

#### Calendar System Overhaul
- **Enterprise Calendar Components**: Replaced basic react-big-calendar with Twenty's professional calendar system
- **Advanced Event Management**: Added TimelineCalendarEvent data model with participants, conferencing, and visibility controls
- **Rich Event Display**: Implemented CalendarEventsCard, CalendarMonthCard, and CalendarEventRow components
- **Event Persistence**: Extended database schema with enhanced event fields (participants, conference links, visibility)
- **Calendar Settings**: Added comprehensive settings UI for external calendar integrations

#### AI Intelligence Upgrade
- **LLM-Powered Task Suggestions**: Upgraded from rule-based to the OpenAI Responses API for intelligent task analysis
- **Smart Task Breakdown**: Enhanced task suggestions with automatic subtasks, priority assessment, and due date recommendations
- **Contextual Reasoning**: Improved AI responses with sophisticated analysis of task prompts and requirements

#### Contact Intelligence Enhancement
- **Social Media Integration**: Added LinkedIn, Twitter, Website, and Phone fields to contact profiles
- **Enhanced Scoring**: Improved contact scoring algorithm with additional social media and professional data points
- **AI Enrichment**: Upgraded contact analysis with more comprehensive data enrichment capabilities

#### Technical Infrastructure
- **Twenty Integration**: Successfully integrated Twenty's CRM components and data models
- **TypeScript Enhancements**: Added comprehensive type definitions for enhanced calendar events and contacts
- **Build System Updates**: Configured Vite and path mappings for Twenty component imports
- **Database Migrations**: Applied schema changes for enhanced data persistence

### 📚 Documentation
- **README Updates**: Comprehensive documentation of new features and Twenty integration
- **License Addition**: Added project license for open-source compliance

### 🔧 Technical Improvements
- **Component Architecture**: Created adapter components for seamless Twenty integration
- **State Management**: Enhanced Zustand stores with Twenty-compatible data structures
- **API Enhancements**: Improved Supabase integration with new data models
- **Performance Optimization**: Optimized component rendering and data processing

### 🐛 Bug Fixes
- **Build Issues**: Resolved CardTitle component export issues
- **Type Compatibility**: Fixed TypeScript compatibility with Twenty components
- **Migration Conflicts**: Resolved Supabase migration synchronization issues

## [1.0.0] - 2026-03-18

### ✨ Initial Release
- Basic calendar functionality with task integration
- Contact management system
- Deal pipeline tracking
- Activity feed
- Rule-based AI suggestions
- Supabase backend integration

---

## Enhancement Summary

### Calendar Features Added:
- ✅ Professional event management with participants
- ✅ Conference call integration (Zoom, Teams, etc.)
- ✅ Event visibility controls (public/private sharing)
- ✅ Advanced event creation and editing
- ✅ Calendar synchronization preparation (Google/Microsoft)

### AI Features Enhanced:
- ✅ OpenAI Responses API powered task suggestions
- ✅ Intelligent priority and category detection
- ✅ Automatic subtask generation
- ✅ Context-aware due date recommendations
- ✅ Enhanced confidence scoring

### Contact Features Enhanced:
- ✅ Social media profile integration
- ✅ Professional networking data
- ✅ Improved scoring algorithms
- ✅ Enhanced contact enrichment

### Infrastructure Improvements:
- ✅ Twenty CRM integration
- ✅ Enterprise-grade component library
- ✅ Enhanced database schema
- ✅ Type-safe data models
- ✅ Professional UI/UX components

---

## Migration Notes

### Database Changes
- Added `is_canceled`, `conference_solution`, `conference_link`, `visibility`, `participants` to `calendar_events` table
- Created performance indexes for visibility queries
- Maintained backward compatibility with existing data

### Breaking Changes
- Calendar component interface updated (internal changes only)
- Task suggestion API enhanced (backward compatible)
- Contact scoring algorithm refined (results may vary slightly)

### Dependencies Added
- `@floating-ui/react`, `@nivo/calendar`, `framer-motion`
- `@radix-ui/colors`, `@tabler/icons-react`
- `deep-equal`, `type-fest`, `react-responsive`

---

## Future Roadmap

### Phase 3 Enhancements (Optional)
- Google/Microsoft Calendar OAuth integration
- Recurring event patterns
- Advanced calendar analytics
- Workflow automation expansion

### Performance Optimizations
- Lazy loading for calendar components
- Database query optimization
- Component memoization improvements

---

For more details on any release, check the commit history or contact the development team.</content>
<parameter name="filePath">CHANGELOG.md
