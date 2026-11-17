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

## `record-calendar/position/` - within-day ordering (copied unchanged except for import paths)
`computeNewPositionOfDraggedRecord`, `computeNewPositionsOfDraggedRecords`, `computeNewEvenlySpacedPositions`, `sortByProperty`,
`isDefined`, `ArraySortDirection` and their upstream tests (from `object-record/utils` and `twenty-shared`).
Glue that is ours: `src/components/calendar/dayOrder.ts` (feeds the upstream function from this app's records and applies the
drop-index rules of upstream `useProcessCalendarCardDrop`) and the `DayRecordsDialog` list.

## `calendar-sync/` - the calendar import manager's pure helpers (copied unchanged except for import paths)
From `twenty-server/.../calendar` and `blocklist`, plus the `twenty-shared` date helpers they use, with their upstream specs
(converted from jest to vitest imports): `is-valid-time-zone`, `resolve-calendar-event-time-zone`, `getValidTimeZoneOrUndefined`,
`parseToInstantOrThrow` (+ `dateInputFormats`, `turnJSDateToPlainDate`), `is-email-blocklisted` (+ `get-domain-from-email`),
`filter-out-blocklisted-events`, `filter-events-and-return-events-to-remove`, `sanitizeCalendarEvent`, `is-event-in-time-range`,
`fetched-calendar-event.type`, `isDefined`, `isNonEmptyArray`. `has-calendar-event-changed` is the same logic with its entity type
spelled out (upstream has no test for it; the one here is ours).
Used by the app: time zone checks (composer, `calendarEventApi`), text clean-up on save (`sanitizeCalendarEvent`), and the
**blocklist** (`calendar_blocklist` table, Calendar Settings card, hides events with a blocked guest from the calendar and timelines).
Not wired: `is-event-in-time-range`, `filter-events-and-return-events-to-remove`, `has-calendar-event-changed`,
`parseToInstantOrThrow` (kept because they are portable and tested; they would serve a file or feed import).

## `record-calendar/card/` - card constants and ids (copied unchanged except for import paths)
`RecordCalendarVisibleRecordLimit`, `...CardDndType`, `...DayCollisionPriority`, `...ClickOutsideListenerId`, the three card constants,
`getRecordCalendarCardDraggableId`, `getRecordCalendarCardInstanceIdPrefix` and the upstream test. Not used yet:
react-big-calendar decides how many cards fit a day and has its own drag ids.

## Audited and NOT ported (and why)
- **Import/sync engine** (`build-calendar-event-save-operations`, `compute-calendar-event-channel-role`, `resolve-calendar-event-sharing`,
  `compute-calendar-event-sharing-key`, `build-calendar-event-participant-save-operations`, channel/account types): written around Twenty's
  connected accounts and calendar channels; without them there is nothing to feed them.
- **Provider code** (Google, Microsoft, CalDAV drivers, `to-*-event-input`, error parsers, CalDAV/iCal parsing which needs `node-ical`).
- **React/jotai/Apollo/Linaria components and hooks** of `record-calendar` and `activities/calendar`: their logic is re-built in this app's
  design (see the "Not verbatim" section); their tests need Twenty's state and GraphQL layers.
- `isCalendarCreationEnabledForAccount`, `useOpenCalendarEventTargetsPicker` and similar: depend on connected accounts or Twenty's metadata.
