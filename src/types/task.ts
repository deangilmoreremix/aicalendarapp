export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled' | 'overdue';
  category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  type: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  assignedUserId?: string;
  assignedUserName?: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  tags: string[];
  attachments: Attachment[];
  subtasks: Subtask[];
  relatedTo?: {
    type: 'contact' | 'deal' | 'project';
    id: string;
    name: string;
  };
  notes?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  calendarId: string;
  type: 'meeting' | 'call' | 'event' | 'reminder';
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_deleted' | 'task_assigned' | 
        'task_due_date_changed' | 'subtask_created' | 'subtask_completed' | 'comment_added' | 
        'file_attached' | 'call_logged' | 'email_sent' | 'meeting_scheduled' | 'reminder_set' |
        'call_made' | 'meeting_held' | 'note_added' | 'deal_moved' | 'contact_updated' | 
        'contact_updated' | 'file_uploaded' | 'reminder_sent' | 'ai_insight_generated';
  title: string;
  description?: string;
  userId: string;
  userName: string;
  entityType: 'task' | 'deal' | 'contact' | 'calendar';
  entityId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface TaskFilters {
  searchTerm?: string;
  priorities?: Task['priority'][];
  statuses?: Task['status'][];
  assigneeIds?: string[];
  tags?: string[];
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  isOverdue?: boolean;
  isDueToday?: boolean;
  hasSubtasks?: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'call' | 'meeting' | 'demo' | 'presentation';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  attendees: string[];
  location?: string;
  meetingLink?: string;
  reminders: {
    time: Date;
    sent: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}