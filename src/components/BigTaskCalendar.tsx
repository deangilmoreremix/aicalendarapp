import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Event, NavigateAction, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarMonthCardAdapter } from '../adapters/twenty/calendar/CalendarMonthCardAdapter';
import { CalendarContext } from '../adapters/twenty/calendar/CalendarContext';
import { type TimelineCalendarEvent } from '../adapters/twenty/calendar/types';
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
import { Task } from '../types';
import { TaskDetailsModal } from './TaskDetailsModal';

const localizer = momentLocalizer(moment);

interface TaskEvent extends Event {
  resource: {
    type: 'task' | 'calendar-event';
    data: Task | any;
    priority?: Task['priority'];
    status?: Task['status'];
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

            {/* Calendar event details */}
            {!isTask && (
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
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit}>
              Edit {isTask ? 'Task' : 'Event'}
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
  } = useTaskStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<TaskEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Mock calendars data for now
  const calendars = [
    { id: 'default', name: 'Default', color: '#3174ad', isVisible: true },
    { id: 'personal', name: 'Personal', color: '#10b981', isVisible: true },
    { id: 'work', name: 'Work', color: '#f59e0b', isVisible: true },
  ];

  const [visibleCalendars, setVisibleCalendars] = useState<string[]>(
    calendars.filter(cal => cal.isVisible).map(cal => cal.id)
  );

  // Convert tasks and calendar events to calendar events
  const events: TaskEvent[] = useMemo(() => {
    const taskEvents: TaskEvent[] = Object.values(tasks)
      .filter(task => task.dueDate)
      .map(task => ({
        id: task.id,
        title: task.title,
        start: task.dueDate!,
        end: task.dueDate!,
        allDay: true,
        resource: {
          type: 'task' as const,
          data: task,
          priority: task.priority,
          status: task.status,
        },
      }));

    const calendarEventItems: TaskEvent[] = calendarEvents
      .filter(event => visibleCalendars.includes(event.calendarId))
      .map(event => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        allDay: event.isAllDay,
        resource: {
          type: 'calendar-event' as const,
          data: event,
        },
      }));

    return [...taskEvents, ...calendarEventItems];
  }, [tasks, calendarEvents, visibleCalendars]);

  // Convert to Twenty format
  const twentyEvents: TimelineCalendarEvent[] = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      isFullDay: event.allDay,
      startsAt: event.start.toISOString(),
      endsAt: event.end?.toISOString(),
      visibility: 'SHARE_EVERYTHING' as const,
      participants: event.resource.type === 'calendar-event' && event.resource.data.attendees
        ? event.resource.data.attendees.map((attendee: string) => ({
            displayName: attendee,
            firstName: '',
            lastName: '',
          }))
        : [],
    }));
  }, [events]);

  // Group events by day for Twenty context
  const calendarEventsByDayTime = useMemo(() => {
    const grouped: Record<number, TimelineCalendarEvent[]> = {};
    twentyEvents.forEach(event => {
      const dayTime = new Date(event.startsAt).setHours(0, 0, 0, 0);
      if (!grouped[dayTime]) grouped[dayTime] = [];
      grouped[dayTime].push(event);
    });
    return grouped;
  }, [twentyEvents]);

  // Generate dayTimes for current month
  const dayTimes = useMemo(() => {
    const days: number[] = [];
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.setHours(0, 0, 0, 0));
    }
    return days;
  }, [currentDate]);

  const handleSelectEvent = (event: TaskEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;

    setShowEventModal(false);
    
    if (selectedEvent.resource.type === 'task') {
      setSelectedTask(selectedEvent.resource.data);
      setShowTaskModal(true);
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
          border: 'none',
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
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
        }
      };
    }
  };

  // Custom toolbar
  const CustomToolbar = ({ date, view, onNavigate, onView }: ToolbarProps<TaskEvent, object>) => {
    const navigate = (action: NavigateAction) => {
      onNavigate(action);
    };

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
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
              onClick={() => navigate('NEXT')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {moment(date).format('MMMM YYYY')}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
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
      <CustomToolbar
        date={currentDate}
        view={currentView}
        onNavigate={(action) => handleNavigate(action === 'DATE' ? currentDate : action === 'PREV' ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
        onView={handleViewChange}
      />
      <div className="flex-1 p-6">
        <CalendarContext.Provider value={{ calendarEventsByDayTime }}>
          <CalendarMonthCardAdapter dayTimes={dayTimes} />
        </CalendarContext.Provider>
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