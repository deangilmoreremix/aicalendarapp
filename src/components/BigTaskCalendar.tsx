import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Event, NavigateAction, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Temporal } from 'temporal-polyfill';
import { enUS } from 'date-fns/locale';
import { type TimelineCalendarEvent } from '../adapters/twenty/calendar/types';
import { toTimelineCalendarEvent, getConferenceProviderIcon, getVisibilityLabel } from '../adapters/twenty/calendar/transformers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Plus,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useCalendarSelectionStore } from '../store/calendarSelectionStore';
import { DealDetailsModal } from './ui/DealDetailsModal';
import { ContactDetailView } from './ContactDetailView';
import { getRecordCalendarDaysRange } from '../vendor/twenty/record-calendar/utils/getRecordCalendarDaysRange';
import { formatRecordCalendarWeekRange } from '../vendor/twenty/record-calendar/utils/formatRecordCalendarWeekRange';
import { ViewCalendarLayout } from '../vendor/twenty/record-calendar/shared/ViewCalendarLayout';
import {
  ALL_RECORD_TYPES,
  buildUnifiedRecords,
  getDropUpdates,
  userTimeZone,
  type UnifiedCalendarRecord,
  type UnifiedRecordType
} from './calendar/unifiedCalendarRecords';
import { applyRescheduleUpdates, deleteRecord, duplicateRecord, rescheduleRecordByDays } from './calendar/recordCalendarActions';
import { RecordCalendarEventCard } from './calendar/RecordCalendarEventCard';
import { RecordContextMenu, type RecordMenuAction } from './calendar/RecordContextMenu';
import { CalendarFiltersMenu } from './calendar/CalendarFiltersMenu';
import { CalendarViewsMenu } from './calendar/CalendarViewsMenu';
import type { CalendarView, CalendarViewFilters } from '../services/api';
import { Task, CalendarEvent, CalendarEventParticipant } from '../types';
import { TaskDetailsModal } from './TaskDetailsModal';

const localizer = momentLocalizer(moment);

const DnDCalendar = withDragAndDrop<TaskEvent>(Calendar);

// Week start from Calendar Settings (0 = Sunday, 1 = Monday)
const readWeekStartsOn = (): number => {
  try {
    const raw = localStorage.getItem('calendar-preferences');
    const value = raw ? JSON.parse(raw).weekStartsOn : undefined;
    return value === 0 || value === 1 ? value : 1;
  } catch {
    return 1;
  }
};

const LAYOUT_BY_VIEW: Record<string, ViewCalendarLayout> = {
  month: ViewCalendarLayout.MONTH,
  agenda: ViewCalendarLayout.MONTH,
  week: ViewCalendarLayout.WEEK,
  day: ViewCalendarLayout.DAY
};

interface TaskEvent extends Event {
  id?: string;
  resource: {
    type: 'task' | 'calendar-event' | 'deal' | 'contact';
    /** the unified record this calendar entry was built from */
    record: UnifiedCalendarRecord;
    data: Task | any;
    priority?: Task['priority'];
    status?: Task['status'];
    conferenceSolution?: string;
    conferenceLink?: string;
    visibility?: 'SHARE_EVERYTHING' | 'METADATA';
    participants?: CalendarEventParticipant[];
  };
}

interface EventModalProps {
  event: TaskEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose, onEdit }) => {
  if (!event) return null;

  const { resource } = event;
  const isTask = resource.type === 'task';
  const data = resource.data;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {/* Event Details */}
          <div className="space-y-3">
            {/* Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>
                {moment(event.start).format('MMMM D, YYYY [at] h:mm A')}
                {event.end && ` - ${moment(event.end).format('h:mm A')}`}
              </span>
            </div>

            {/* Task-specific details */}
            {isTask && (
              <>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(resource.priority!)}>
                    {resource.priority!.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(resource.status!)}>
                    {resource.status!.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>

                {data.assignedUserName && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>{data.assignedUserName}</span>
                  </div>
                )}

                {data.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>{data.description}</p>
                  </div>
                )}

                {data.estimatedDuration && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{data.estimatedDuration} minutes</span>
                  </div>
                )}
              </>
            )}

            {/* Deal / contact details */}
            {(resource.type === 'deal' || resource.type === 'contact') && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {resource.record.subtitle && <p>{resource.record.subtitle}</p>}
                {resource.type === 'contact' && data.email && <p>{data.email}</p>}
                {resource.type === 'deal' && data.description && <p>{data.description}</p>}
              </div>
            )}

            {/* Calendar event details */}
            {resource.type === 'calendar-event' && (
              <>
                {data.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>{data.location}</span>
                  </div>
                )}

                {data.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>{data.description}</p>
                  </div>
                )}

{data.attendees && data.attendees.length > 0 && (
                   <div className="text-sm text-gray-600 dark:text-gray-400">
                     <span className="font-medium text-gray-900 dark:text-gray-100">Attendees:</span>
                     <div className="mt-1 space-y-1">
                       {data.attendees.map((attendee: string, index: number) => (
                         <div key={index} className="flex items-center space-x-2">
                           <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                           <span>{attendee}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Enhanced: Rich participants from Twenty model */}
                 {resource.participants && resource.participants.length > 0 && (
                   <div className="text-sm text-gray-600 dark:text-gray-400">
                     <span className="font-medium text-gray-900 dark:text-gray-100">Participants:</span>
                     <div className="mt-1 flex flex-wrap gap-2">
                       {resource.participants.map((participant, index) => (
                         <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                           {participant.avatarUrl ? (
                             <img
                               src={participant.avatarUrl}
                               alt={participant.displayName}
                               className="h-5 w-5 rounded-full"
                             />
                           ) : (
                             <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                               {participant.displayName.charAt(0) || '?'}
                             </div>
                           )}
                           <span className="text-sm">{participant.displayName}</span>
                           {participant.handle && (
                             <span className="text-xs text-gray-500">@{participant.handle}</span>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Enhanced: Conference link from Twenty model */}
                 {(resource.conferenceSolution || resource.conferenceLink) && (
                   <div className="flex items-center space-x-2 text-sm">
                     <span className="text-gray-600 dark:text-gray-400">
                       {getConferenceProviderIcon(resource.conferenceSolution)}
                     </span>
                     {resource.conferenceLink ? (
                       <a
                         href={resource.conferenceLink}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-700 underline"
                       >
                         Join {resource.conferenceSolution || 'Meeting'}
                       </a>
                     ) : (
                       <span className="text-gray-600 dark:text-gray-400">{resource.conferenceSolution}</span>
                     )}
                   </div>
                 )}

                 {/* Enhanced: Visibility badge from Twenty model */}
                 {resource.visibility && (
                   <div className="flex items-center space-x-2 text-sm">
                     <span className="text-gray-600 dark:text-gray-400">Visibility:</span>
                     <Badge variant={resource.visibility === 'METADATA' ? 'secondary' : 'default'}>
                       {getVisibilityLabel(resource.visibility)}
                     </Badge>
                   </div>
                 )}
               </>
             )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit}>
              Edit {{ task: 'Task', deal: 'Deal', contact: 'Contact', 'calendar-event': 'Event' }[resource.type]}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const BigTaskCalendar: React.FC = () => {
  const { 
    tasks, 
    calendarEvents,
    loadInitialData,
    loadCalendarEvents,
  } = useTaskStore();
  const { deals, loadDeals } = useDealStore();
  const { contacts, loadContacts, updateContact } = useContactStore();
  const { selectedKeys, select, clear: clearSelection } = useCalendarSelectionStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<TaskEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<UnifiedRecordType[]>(ALL_RECORD_TYPES);
  const [filters, setFilters] = useState<CalendarViewFilters>({});
  const [fieldByType, setFieldByType] = useState<Partial<Record<UnifiedRecordType, string>>>({});
  const [contextMenu, setContextMenu] = useState<{ record: UnifiedCalendarRecord; x: number; y: number } | null>(null);
  const [editDealId, setEditDealId] = useState<string | null>(null);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const weekStartsOn = useMemo(readWeekStartsOn, []);

  // Week start from Calendar Settings applies to the week grid
  useEffect(() => {
    moment.updateLocale(moment.locale(), { week: { dow: weekStartsOn, doy: weekStartsOn === 0 ? 6 : 4 } });
  }, [weekStartsOn]);

  // Mock calendars data for now
  const calendars = [
    { id: 'default', name: 'Default', color: '#3174ad', isVisible: true },
    { id: 'personal', name: 'Personal', color: '#10b981', isVisible: true },
    { id: 'work', name: 'Work', color: '#f59e0b', isVisible: true },
  ];

  const [visibleCalendars, setVisibleCalendars] = useState<string[]>(
    calendars.filter(cal => cal.isVisible).map(cal => cal.id)
  );

  // Records load once; events load for the visible window (range from upstream getRecordCalendarDaysRange)
  useEffect(() => {
    void loadInitialData();
    if (Object.keys(useDealStore.getState().deals).length === 0) void loadDeals();
    if (Object.keys(useContactStore.getState().contacts).length === 0) void loadContacts();
  }, [loadInitialData, loadDeals, loadContacts]);

  const visibleRange = useMemo(() => {
    const { firstDay, lastDay } = getRecordCalendarDaysRange({
      selectedDate: Temporal.PlainDate.from({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      }),
      calendarLayout: LAYOUT_BY_VIEW[currentView] ?? ViewCalendarLayout.MONTH,
      weekStartsOnDayIndex: weekStartsOn,
    });
    return {
      firstDay,
      lastDay,
      from: new Date(firstDay.year, firstDay.month - 1, firstDay.day),
      to: new Date(lastDay.year, lastDay.month - 1, lastDay.day, 23, 59, 59),
    };
  }, [currentDate, currentView, weekStartsOn]);

  useEffect(() => {
    void loadCalendarEvents(visibleRange.from, visibleRange.to);
  }, [loadCalendarEvents, visibleRange.from.getTime(), visibleRange.to.getTime()]);

  // Unified records: tasks, deals, contacts and events on one calendar
  const records: UnifiedCalendarRecord[] = useMemo(
    () =>
      buildUnifiedRecords({
        tasks: Object.values(tasks),
        deals: Object.values(deals),
        contacts: Object.values(contacts),
        events: calendarEvents,
        fieldByType,
        visibleTypes,
        filters,
        visibleCalendars,
      }),
    [tasks, deals, contacts, calendarEvents, fieldByType, visibleTypes, filters, visibleCalendars]
  );

  const events: TaskEvent[] = useMemo(
    () =>
      records.map((record) => ({
        id: record.key,
        title: record.title,
        start: record.start,
        end: record.end,
        allDay: record.allDay,
        resource: {
          type: record.type === 'event' ? ('calendar-event' as const) : record.type,
          record,
          data: record.raw,
          ...(record.type === 'task' && {
            priority: (record.raw as Task).priority,
            status: (record.raw as Task).status,
          }),
          ...(record.type === 'event' && {
            conferenceSolution: (record.raw as CalendarEvent).conferenceSolution,
            conferenceLink: (record.raw as CalendarEvent).conferenceLink,
            visibility: (record.raw as CalendarEvent).visibility,
            participants: (record.raw as CalendarEvent).participants,
          }),
        },
      })),
    [records]
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.status).filter((v): v is string => !!v))).sort(),
    [records]
  );
  const assigneeOptions = useMemo(() => {
    const byId = new Map<string, string>();
    Object.values(tasks).forEach((t) => t.assignedUserId && byId.set(t.assignedUserId, t.assignedUserName || t.assignedUserId));
    return Array.from(byId, ([id, name]) => ({ id, name }));
  }, [tasks]);

   const handleSelectEvent = (event: TaskEvent) => {
     select(event.resource.record.key);
     setSelectedEvent(event);
     setShowEventModal(true);
   };

  const handleEditEvent = () => {
    if (!selectedEvent) return;

    setShowEventModal(false);
    
    if (selectedEvent.resource.type === 'task') {
      setSelectedTask(selectedEvent.resource.data);
      setShowTaskModal(true);
    } else if (selectedEvent.resource.type === 'deal') {
      setEditDealId(selectedEvent.resource.record.id);
    } else if (selectedEvent.resource.type === 'contact') {
      setEditContactId(selectedEvent.resource.record.id);
    } else {
      // Handle calendar event editing
      console.log('Edit calendar event:', selectedEvent.resource.data);
    }
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  const toggleCalendarVisibility = (calendarId: string) => {
    setVisibleCalendars(prev => 
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  // Toolbar navigation moves by the current view's unit (TODAY jumps to today)
  const handleToolbarNavigate = (action: NavigateAction) => {
    if (action === 'TODAY') return setCurrentDate(new Date());
    if (action === 'DATE') return;
    const unit = currentView === 'week' ? 'week' : currentView === 'day' ? 'day' : 'month';
    setCurrentDate(moment(currentDate).add(action === 'NEXT' ? 1 : -1, unit).toDate());
  };

  const toolbarTitle =
    currentView === 'week'
      ? formatRecordCalendarWeekRange({ firstDayOfWeek: visibleRange.firstDay, lastDayOfWeek: visibleRange.lastDay, locale: enUS })
      : currentView === 'day'
        ? moment(currentDate).format('dddd, MMMM D, YYYY')
        : moment(currentDate).format('MMMM YYYY');

  // Drag a card to another day/time: persisted through the existing stores/services
  const handleEventDrop = async ({ event, start, end, isAllDay }: EventInteractionArgs<TaskEvent>) => {
    setActionError(null);
    const record = event.resource.record;
    const updates = getDropUpdates(record, { start: new Date(start), end: new Date(end), isAllDay }, userTimeZone());
    if (!(await applyRescheduleUpdates(record, updates))) setActionError(`Could not move "${record.title}".`);
  };

  const handleEventResize = async ({ event, start, end }: EventInteractionArgs<TaskEvent>) => {
    setActionError(null);
    const record = event.resource.record;
    const updates = getDropUpdates(record, { start: new Date(start), end: new Date(end), isAllDay: false }, userTimeZone());
    if (!(await applyRescheduleUpdates(record, updates))) setActionError(`Could not resize "${record.title}".`);
  };

  const isTimed = (event: TaskEvent) => !event.allDay && (event.resource.type === 'task' || event.resource.type === 'calendar-event');

  // Right-click: select the record, then open its menu at the cursor (upstream useOpenRecordContextMenu behaviour)
  const openContextMenu = useCallback(
    (e: React.MouseEvent, record: UnifiedCalendarRecord) => {
      e.preventDefault();
      select(record.key);
      setContextMenu({ record, x: e.clientX, y: e.clientY });
    },
    [select]
  );

  const handleMenuAction = async (action: RecordMenuAction, record: UnifiedCalendarRecord) => {
    setActionError(null);
    let ok = true;
    if (action === 'edit') {
      if (record.type === 'task') {
        setSelectedTask(record.raw as Task);
        setShowTaskModal(true);
      } else if (record.type === 'deal') setEditDealId(record.id);
      else if (record.type === 'contact') setEditContactId(record.id);
    } else if (action === 'duplicate') ok = await duplicateRecord(record);
    else if (action === 'tomorrow') ok = await rescheduleRecordByDays(record, 1);
    else if (action === 'nextWeek') ok = await rescheduleRecordByDays(record, 7);
    else if (action === 'delete') {
      const label = record.type === 'contact' ? 'Clear the follow-up date for' : 'Delete';
      if (!window.confirm(`${label} "${record.title}"?`)) return;
      ok = await deleteRecord(record);
    }
    if (!ok) setActionError('That action could not be completed.');
  };

  // Escape clears the selection (upstream: RecordSelectionEscapeHotkeyEffect)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && clearSelection();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  const eventComponent = useMemo(
    () =>
      ({ event }: { event: TaskEvent }) => (
        <RecordCalendarEventCard
          record={event.resource.record}
          isSelected={selectedKeys.includes(event.resource.record.key)}
          compact={currentView === 'month'}
          onContextMenu={openContextMenu}
        />
      ),
    [selectedKeys, currentView, openContextMenu]
  );

  const applySavedView = (view: CalendarView) => {
    setCurrentView(view.layout.toLowerCase() as View);
    setFieldByType(view.fieldByType);
    setFilters(view.filters);
    setVisibleTypes(view.visibleTypes);
  };

  // Custom event style getter
  const eventStyleGetter = (event: TaskEvent) => {
    if (event.resource.type === 'task') {
      const { priority, status } = event.resource;
      
      let backgroundColor = '#3174ad';
      let borderColor = '#3174ad';
      
      if (status === 'completed') {
        backgroundColor = '#10b981';
        borderColor = '#10b981';
      } else if (status === 'cancelled') {
        backgroundColor = '#f59e0b';
        borderColor = '#f59e0b';
      } else if (priority === 'urgent') {
        backgroundColor = '#ef4444';
        borderColor = '#ef4444';
      } else if (priority === 'high') {
        backgroundColor = '#f97316';
        borderColor = '#f97316';
      }

      return {
        style: {
          backgroundColor,
          borderColor,
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
        }
      };
    } else if (event.resource.type === 'deal' || event.resource.type === 'contact') {
      const color = event.resource.type === 'deal' ? '#8b5cf6' : '#0d9488';
      return {
        style: {
          backgroundColor: color,
          borderColor: color,
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
        }
      };
    } else {
      // Calendar event styling
      const calendar = calendars.find(cal => cal.id === event.resource.data.calendarId);
      return {
        style: {
          backgroundColor: calendar?.color || '#6b7280',
          borderColor: calendar?.color || '#6b7280',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
        }
      };
    }
  };

  // Custom toolbar
  const CustomToolbar = ({ date, view, onNavigate, onView }: Pick<ToolbarProps<TaskEvent, object>, 'date' | 'view' | 'onNavigate' | 'onView'>) => {
    const navigate = (action: NavigateAction) => {
      onNavigate(action);
    };

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous"
              onClick={() => navigate('PREV')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('TODAY')}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next"
              onClick={() => navigate('NEXT')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {toolbarTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CalendarFiltersMenu
            filters={filters}
            onFiltersChange={setFilters}
            visibleTypes={visibleTypes}
            onVisibleTypesChange={setVisibleTypes}
            statusOptions={statusOptions}
            assigneeOptions={assigneeOptions}
            fieldByType={fieldByType}
            onFieldByTypeChange={setFieldByType}
          />
          <CalendarViewsMenu
            current={{ layout: currentView.toUpperCase() as CalendarView['layout'], fieldByType, filters, visibleTypes }}
            onApply={applySavedView}
          />

          {/* Calendar visibility toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Calendars
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {calendars.map((calendar) => (
                <DropdownMenuItem
                  key={calendar.id}
                  onClick={() => toggleCalendarVisibility(calendar.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: calendar.color }}
                    />
                    <span>{calendar.name}</span>
                  </div>
                  {visibleCalendars.includes(calendar.id) ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View selector */}
          <div className="flex items-center space-x-1 border rounded-md">
            {['month', 'week', 'day', 'agenda'].map((viewName) => (
              <Button
                key={viewName}
                variant={view === viewName ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onView(viewName as View)}
                className="rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
              </Button>
            ))}
          </div>

          <Button size="sm" onClick={() => setShowTaskModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Called as a function (no hooks inside) so the toolbar and its dropdowns keep their state across renders */}
      {CustomToolbar({
        date: currentDate,
        view: currentView,
        onNavigate: handleToolbarNavigate,
        onView: handleViewChange,
      })}
      {actionError && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}
      <div
        className="flex-1 relative"
        onClick={(e) => {
          // clicking outside any card resets the selection (upstream: click-outside listener)
          if (!(e.target as HTMLElement).closest('.rbc-event')) clearSelection();
        }}
      >
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          resizableAccessor={isTimed}
          popup
          components={{
            toolbar: () => null, // We use custom toolbar
            event: eventComponent,
          }}
          className="h-full bg-white dark:bg-gray-900"
        />
      </div>

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
      />

      {contextMenu && (
        <RecordContextMenu
          record={contextMenu.record}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onAction={handleMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editDealId && <DealDetailsModal isOpen dealId={editDealId} onClose={() => setEditDealId(null)} />}
      {editContactId && contacts[editContactId] && (
        <ContactDetailView
          contact={contacts[editContactId]}
          isOpen
          onClose={() => setEditContactId(null)}
          onUpdate={async (id, updates) => {
            await updateContact(id, updates);
            return useContactStore.getState().contacts[id] ?? contacts[id];
          }}
        />
      )}

      {/* Task Details Modal */}
      {showTaskModal && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};