export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  relatedTo?: {
    type: 'contact' | 'deal';
    id: string;
    name: string;
  };
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

export interface TaskFilters {
  status: 'all' | 'completed' | 'uncompleted';
  priority: 'all' | 'high' | 'medium' | 'low';
  dateRange: 'all' | 'overdue' | 'today' | 'thisWeek';
  category: 'all' | 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
}

export interface TaskSort {
  field: 'dueDate' | 'priority' | 'title' | 'createdAt';
  direction: 'asc' | 'desc';
}