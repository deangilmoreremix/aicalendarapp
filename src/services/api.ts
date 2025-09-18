import { supabase } from '../lib/supabase';
import { Contact, Task, Deal, Activity } from '../types';

// Contact API
export const contactApi = {
  async getAll(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(contact => ({
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
      interestLevel: contact.interest_level,
      status: contact.status,
      tags: contact.tags,
      notes: contact.notes,
      socialProfiles: contact.social_profiles,
      customFields: contact.custom_fields,
      isFavorite: contact.is_favorite,
      aiScore: contact.ai_score,
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at)
    }));
  },

  async create(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      title: data.title,
      company: data.company,
      industry: data.industry,
      avatar: data.avatar,
      avatarSrc: data.avatar_src,
      sources: data.sources,
      interestLevel: data.interest_level,
      status: data.status,
      tags: data.tags,
      notes: data.notes,
      socialProfiles: data.social_profiles,
      customFields: data.custom_fields,
      isFavorite: data.is_favorite,
      aiScore: data.ai_score,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const updateData: any = {};

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.industry !== undefined) updateData.industry = updates.industry;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.avatarSrc !== undefined) updateData.avatar_src = updates.avatarSrc;
    if (updates.sources !== undefined) updateData.sources = updates.sources;
    if (updates.interestLevel !== undefined) updateData.interest_level = updates.interestLevel;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.socialProfiles !== undefined) updateData.social_profiles = updates.socialProfiles;
    if (updates.customFields !== undefined) updateData.custom_fields = updates.customFields;
    if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
    if (updates.aiScore !== undefined) updateData.ai_score = updates.aiScore;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      title: data.title,
      company: data.company,
      industry: data.industry,
      avatar: data.avatar,
      avatarSrc: data.avatar_src,
      sources: data.sources,
      interestLevel: data.interest_level,
      status: data.status,
      tags: data.tags,
      notes: data.notes,
      socialProfiles: data.social_profiles,
      customFields: data.custom_fields,
      isFavorite: data.is_favorite,
      aiScore: data.ai_score,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
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

    return data.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      priority: task.priority,
      status: task.status,
      category: task.category,
      type: task.type,
      completed: task.completed,
      createdAt: new Date(task.created_at),
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      assignedUserId: task.assigned_user_id,
      assignedUserName: task.assigned_user_name,
      estimatedDuration: task.estimated_duration,
      actualDuration: task.actual_duration,
      tags: task.tags,
      attachments: task.attachments,
      subtasks: task.subtasks,
      relatedTo: task.related_to,
      notes: task.notes
    }));
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      priority: data.priority,
      status: data.status,
      category: data.category,
      type: data.type,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      assignedUserId: data.assigned_user_id,
      assignedUserName: data.assigned_user_name,
      estimatedDuration: data.estimated_duration,
      actualDuration: data.actual_duration,
      tags: data.tags,
      attachments: data.attachments,
      subtasks: data.subtasks,
      relatedTo: data.related_to,
      notes: data.notes
    };
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString();
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt?.toISOString();
    if (updates.assignedUserId !== undefined) updateData.assigned_user_id = updates.assignedUserId;
    if (updates.assignedUserName !== undefined) updateData.assigned_user_name = updates.assignedUserName;
    if (updates.estimatedDuration !== undefined) updateData.estimated_duration = updates.estimatedDuration;
    if (updates.actualDuration !== undefined) updateData.actual_duration = updates.actualDuration;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
    if (updates.subtasks !== undefined) updateData.subtasks = updates.subtasks;
    if (updates.relatedTo !== undefined) updateData.related_to = updates.relatedTo;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      priority: data.priority,
      status: data.status,
      category: data.category,
      type: data.type,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      assignedUserId: data.assigned_user_id,
      assignedUserName: data.assigned_user_name,
      estimatedDuration: data.estimated_duration,
      actualDuration: data.actual_duration,
      tags: data.tags,
      attachments: data.attachments,
      subtasks: data.subtasks,
      relatedTo: data.related_to,
      notes: data.notes
    };
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
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(deal => ({
      id: deal.id,
      company: deal.company,
      value: deal.value,
      probability: deal.probability,
      dueDate: deal.due_date,
      contactId: deal.contact_id,
      status: deal.status,
      stage: deal.stage,
      priority: deal.priority,
      aiPrediction: deal.ai_prediction,
      description: deal.description,
      notes: deal.notes,
      createdAt: new Date(deal.created_at),
      updatedAt: new Date(deal.updated_at)
    }));
  },

  async create(deal: any): Promise<any> {
    const { data, error } = await supabase
      .from('deals')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      company: data.company,
      value: data.value,
      probability: data.probability,
      dueDate: data.due_date,
      contactId: data.contact_id,
      status: data.status,
      stage: data.stage,
      priority: data.priority,
      aiPrediction: data.ai_prediction,
      description: data.description,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, updates: any): Promise<any> {
    const updateData: any = {};

    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.probability !== undefined) updateData.probability = updates.probability;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.stage !== undefined) updateData.stage = updates.stage;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.aiPrediction !== undefined) updateData.ai_prediction = updates.aiPrediction;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      company: data.company,
      value: data.value,
      probability: data.probability,
      dueDate: data.due_date,
      contactId: data.contact_id,
      status: data.status,
      stage: data.stage,
      priority: data.priority,
      aiPrediction: data.ai_prediction,
      description: data.description,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
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

    return {
      id: data.id,
      company: data.company,
      value: data.value,
      probability: data.probability,
      dueDate: data.due_date,
      contactId: data.contact_id,
      status: data.status,
      stage: data.stage,
      priority: data.priority,
      aiPrediction: data.ai_prediction,
      description: data.description,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
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
  async generateInsights(contacts: Contact[]): Promise<any[]> {
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

  async generateTaskSuggestions(prompt: string, context?: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('generate_task_suggestions', {
      body: { prompt, context }
    });

    if (error) throw error;
    return data;
  },

  async streamTaskSuggestions(prompt: string, onChunk?: (chunk: string) => void): Promise<any> {
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