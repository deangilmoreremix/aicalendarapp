import { supabase } from '../lib/supabase';
import { Contact, Task, Deal, Activity, AIInsight } from '../types';

// TaskSuggestion interface for AI API
interface TaskSuggestion {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedDueDate?: Date;
  estimatedDuration?: number;
  subtasks: Array<{
    title: string;
    estimatedDuration?: number;
  }>;
  tags: string[];
  category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  type: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other';
  reasoning: string;
  confidence: number;
}

// Database record types
interface ContactDB {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone?: string;
  title: string;
  company: string;
  industry?: string;
  avatar?: string;
  avatar_src?: string;
  sources: string[];
  interest_level: string;
  status: string;
  tags: string[];
  notes?: string;
  social_profiles?: Record<string, string>;
  custom_fields?: Record<string, string>;
  is_favorite: boolean;
  ai_score?: number;
  created_at: string;
  updated_at: string;
}

interface TaskDB {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  category: string;
  type: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  estimated_duration?: number;
  actual_duration?: number;
  tags: string[];
  attachments?: any[];
  subtasks?: any[];
  related_to?: any;
  notes?: string;
}

interface DealDB {
  id: string;
  company: string;
  value: string;
  probability: string;
  due_date: string;
  contact_id: string;
  status: string;
  stage: string;
  priority: string;
  ai_prediction?: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Utility functions for data mapping
export const mapContactFromDB = (contact: ContactDB): Contact => ({
  id: contact.id,
  firstName: contact.first_name,
  lastName: contact.last_name,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  title: contact.title,
  company: contact.company,
  industry: contact.industry,
  avatar: contact.avatar,
  avatarSrc: contact.avatar_src,
  sources: contact.sources,
  interestLevel: contact.interest_level as Contact['interestLevel'],
  status: contact.status as Contact['status'],
  tags: contact.tags,
  notes: contact.notes,
  socialProfiles: contact.social_profiles || {},
  customFields: contact.custom_fields || {},
  isFavorite: contact.is_favorite,
  aiScore: contact.ai_score,
  createdAt: new Date(contact.created_at),
  updatedAt: new Date(contact.updated_at)
});

export const mapContactToDB = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => ({
  first_name: contact.firstName,
  last_name: contact.lastName,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  title: contact.title,
  company: contact.company,
  industry: contact.industry,
  avatar: contact.avatar,
  avatar_src: contact.avatarSrc,
  sources: contact.sources,
  interest_level: contact.interestLevel,
  status: contact.status,
  tags: contact.tags,
  notes: contact.notes,
  social_profiles: contact.socialProfiles,
  custom_fields: contact.customFields,
  is_favorite: contact.isFavorite,
  ai_score: contact.aiScore
});

export const mapTaskFromDB = (task: TaskDB): Task => ({
  id: task.id,
  title: task.title,
  description: task.description,
  dueDate: task.due_date ? new Date(task.due_date) : undefined,
  priority: task.priority as Task['priority'],
  status: task.status as Task['status'],
  category: task.category as Task['category'],
  type: task.type as Task['type'],
  completed: task.completed,
  createdAt: new Date(task.created_at),
  completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
  assignedUserId: task.assigned_user_id,
  assignedUserName: task.assigned_user_name,
  estimatedDuration: task.estimated_duration,
  actualDuration: task.actual_duration,
  tags: task.tags,
  attachments: task.attachments || [],
  subtasks: task.subtasks || [],
  relatedTo: task.related_to,
  notes: task.notes
});

export const mapTaskToDB = (task: Omit<Task, 'id' | 'createdAt'>) => ({
  title: task.title,
  description: task.description,
  due_date: task.dueDate?.toISOString(),
  priority: task.priority,
  status: task.status,
  category: task.category,
  type: task.type,
  completed: task.completed,
  completed_at: task.completedAt?.toISOString(),
  assigned_user_id: task.assignedUserId,
  assigned_user_name: task.assignedUserName,
  estimated_duration: task.estimatedDuration,
  actual_duration: task.actualDuration,
  tags: task.tags,
  attachments: task.attachments,
  subtasks: task.subtasks,
  related_to: task.relatedTo,
  notes: task.notes
});

export const mapDealFromDB = (deal: DealDB): Deal => ({
  id: deal.id,
  company: deal.company,
  value: deal.value,
  probability: deal.probability,
  dueDate: deal.due_date || '',
  contactId: deal.contact_id,
  status: deal.status as Deal['status'],
  stage: deal.stage as Deal['stage'],
  priority: deal.priority as Deal['priority'],
  aiPrediction: deal.ai_prediction,
  description: deal.description,
  notes: deal.notes,
  createdAt: new Date(deal.created_at),
  updatedAt: new Date(deal.updated_at)
});

export const mapDealToDB = (deal: any) => ({
  company: deal.company,
  value: deal.value,
  probability: deal.probability,
  due_date: deal.dueDate,
  contact_id: deal.contactId,
  status: deal.status,
  stage: deal.stage,
  priority: deal.priority,
  ai_prediction: deal.aiPrediction,
  description: deal.description,
  notes: deal.notes
});

// Contact API
export const contactApi = {
  async getAll(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(mapContactFromDB);
  },

  async create(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert(mapContactToDB(contact))
      .select()
      .single();

    if (error) throw error;

    return mapContactFromDB(data);
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const updateData: any = {};

    Object.keys(updates).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (updates[key as keyof Contact] !== undefined) {
        updateData[dbKey] = updates[key as keyof Contact];
      }
    });

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapContactFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Task API
export const taskApi = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapTaskFromDB);
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(mapTaskToDB(task))
      .select()
      .single();

    if (error) throw error;

    return mapTaskFromDB(data);
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};

    Object.keys(updates).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (updates[key as keyof Task] !== undefined) {
        const value = updates[key as keyof Task];
        updateData[dbKey] = value instanceof Date ? value.toISOString() : value;
      }
    });

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapTaskFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Deal API
export const dealApi = {
  async getAll(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapDealFromDB);
  },

  async create(deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .insert(mapDealToDB(deal))
      .select()
      .single();

    if (error) throw error;

    return mapDealFromDB(data);
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const updateData: Partial<DealDB> = {};

    Object.keys(updates).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      (updateData as any)[dbKey] = (updates as any)[key];
    });

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapDealFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateStage(id: string, stage: string, notes?: string): Promise<any> {
    const updateData: any = {
      stage: stage,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapDealFromDB(data);
  }
};

// Activity API
export const activityApi = {
  async getAll(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      userId: activity.user_id,
      userName: activity.user_name,
      entityType: activity.entity_type,
      entityId: activity.entity_id,
      createdAt: new Date(activity.created_at),
      metadata: activity.metadata
    }));
  },

  async create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        type: activity.type,
        title: activity.title,
        description: activity.description,
        user_id: activity.userId,
        user_name: activity.userName,
        entity_type: activity.entityType,
        entity_id: activity.entityId,
        metadata: activity.metadata
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      userId: data.user_id,
      userName: data.user_name,
      entityType: data.entity_type,
      entityId: data.entity_id,
      createdAt: new Date(data.created_at),
      metadata: data.metadata
    };
  }
};

// AI API (Edge Functions)
export const aiApi = {
  async generateInsights(contacts: Contact[]): Promise<AIInsight[]> {
    const { data, error } = await supabase.functions.invoke('generate_ai_insights', {
      body: { contacts }
    });

    if (error) throw error;
    return data;
  },

  async predictDealSuccess(contactId: string, dealValue: number): Promise<number> {
    const { data, error } = await supabase.functions.invoke('predict_deal_success', {
      body: { contact_id: contactId, deal_value: dealValue }
    });

    if (error) throw error;
    return data;
  },

  async optimizeMeetingTime(attendeeIds: string[], duration: number): Promise<Date[]> {
    const { data, error } = await supabase.functions.invoke('optimize_meeting_time', {
      body: { attendee_ids: attendeeIds, duration }
    });

    if (error) throw error;
    return data.map((dateStr: string) => new Date(dateStr));
  },

  async generateMeetingAgenda(title: string, attendees: string[]): Promise<string[]> {
    const { data, error } = await supabase.functions.invoke('generate_meeting_agenda', {
      body: { title, attendees }
    });

    if (error) throw error;
    return data;
  },

  async generateTaskSuggestions(prompt: string, context?: Record<string, unknown>): Promise<TaskSuggestion[]> {
    const { data, error } = await supabase.functions.invoke('generate_task_suggestions', {
      body: { prompt, context }
    });

    if (error) throw error;
    return data;
  },

  async streamTaskSuggestions(prompt: string, onChunk?: (chunk: string) => void): Promise<TaskSuggestion> {
    // For now, implement as regular call - streaming can be added later with WebSockets/SSE
    const { data, error } = await supabase.functions.invoke('generate_task_suggestions', {
      body: { prompt, stream: true }
    });

    if (error) throw error;

    // Simulate streaming by calling onChunk for each part
    if (onChunk && typeof data === 'string') {
      const chunks = data.split(' ');
      chunks.forEach((chunk: string, index: number) => {
        setTimeout(() => onChunk(chunk + ' '), index * 100);
      });
    }

    return data;
  }
};