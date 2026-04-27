// Consolidated type definitions to resolve conflicts
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

export interface CalendarEventParticipant {
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  handle?: string;
  personId?: string;
  workspaceMemberId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location?: string;
  attendees?: string[]; // legacy
  participants?: CalendarEventParticipant[];
  calendarId: string;
  type: 'meeting' | 'call' | 'event' | 'reminder';
  status: 'scheduled' | 'completed' | 'cancelled';
  isCanceled?: boolean;
  conferenceSolution?: string;
  conferenceLink?: string;
  visibility?: 'SHARE_EVERYTHING' | 'METADATA';
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

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  title: string;
  company: string;
  industry?: string;
  avatar?: string;
  avatarSrc?: string;
  sources: string[];
  interestLevel: 'hot' | 'warm' | 'medium' | 'cold';
  status: 'lead' | 'prospect' | 'customer' | 'churned' | 'active' | 'pending' | 'inactive';
  tags: string[];
  notes?: string;
  socialProfiles: {
    whatsapp?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  customFields: Record<string, string>;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  aiScore?: number;
}

export interface Deal {
  id: string;
  company: string;
  value: string;
  probability: string;
  dueDate: string;
  contactId: string;
  status: 'online' | 'offline';
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high';
  aiPrediction?: number;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSort {
  field: 'dueDate' | 'priority' | 'title' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'engagement' | 'conversion' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable?: boolean;
  suggestedActions?: string[];
  createdAt?: Date;
  category?: string;
  impact?: 'high' | 'medium' | 'low';
}