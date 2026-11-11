# Code ported from twentyhq/twenty

Source: https://github.com/twentyhq/twenty @ `f5cfa249c9fa` (AGPL-3.0, used with the owner's permission).
No ported file carries the `@license Enterprise` marker.

## `calendar/` - copied unchanged except for import paths
`utils/*`, `constants/Calendar.ts`, `hooks/useCalendarEvents.ts`, `shared/*` (enum, `groupArrayItemsBy`, `sortAsc/Desc`),
`types/*` and the upstream unit tests. Each file's header names its upstream path and the exact change.
Two real edits: `getTimelineCalendarEventLabel` uses a plain string instead of Lingui `t`, and
`types/CalendarEvent.ts` drops the call-recordings field (external recorder providers are out of stack).
`types/generated.ts` is a stand-in for Twenty's generated GraphQL types.

## Not verbatim (adapted, see headers in `src/components/calendar/`)
UI components keep upstream's logic and structure but use this app's Tailwind design instead of Linaria/twenty-ui.
The composer keeps the upstream fields and date rules but not the connected-account/email/OAuth parts.
Data comes from Supabase (`calendarEventApi`, `get_timeline_calendar_events`) instead of Twenty's GraphQL API.

## Not ported (outside Netlify + Supabase + OpenAI)
Google/Microsoft/CalDAV import and sync, webhooks, cron jobs, blocklist (only meaningful with sync),
call recordings, connected-account checks, NestJS/TypeORM server modules.

## `record-calendar/` - unified CRM calendar (copied unchanged except for import paths)
From `object-record/record-calendar` and `object-record/record-drag`: `getRecordCalendarDaysRange`, `formatRecordCalendarWeekRange`,
`getShiftedRecordCalendarDate`, `getShiftedRecordCalendarDateTime` and the two `...UpdateInput` helpers, plus
`ViewCalendarLayout`, `doNotTranslate` and `turnPlainDateToShiftedDateInSystemTimeZone` from `twenty-shared`, and their upstream tests.
Used by `BigTaskCalendar` (visible window, week title) and by every reschedule (drag, context menu).
Twenty's drag layer (@dnd-kit) cannot run inside react-big-calendar, so react-big-calendar's own drag-and-drop addon is the drag layer.

## Glue that is ours (no upstream equivalent), see headers in `src/components/calendar/`
`unifiedCalendarRecords.ts` (records -> calendar entries, filters), `recordCalendarActions.ts` (persistence through our stores),
`calendarSelectionStore.ts`, `RecordContextMenu.tsx` (upstream has no calendar menu actions), `CalendarFiltersMenu.tsx`,
`CalendarViewsMenu.tsx` (+ `calendar_views` table), `RecordTasksWidget.tsx`, `groupTasksByStatus.ts` (upstream rule, vendored `groupArrayItemsBy`).
