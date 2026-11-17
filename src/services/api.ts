import { supabase } from '../lib/supabase';
import type {
  TimelineCalendarEvent,
  TimelineCalendarEventsWithTotal
} from '../vendor/twenty/calendar/types/generated';
import { CalendarChannelVisibility } from '../vendor/twenty/calendar/shared/CalendarChannelVisibility';
import { isEmailBlocklisted } from '../vendor/twenty/calendar-sync/is-email-blocklisted.util';
import { sanitizeCalendarEvent } from '../vendor/twenty/calendar-sync/sanitizeCalendarEvent';
import { resolveCalendarEventTimeZone } from '../vendor/twenty/calendar-sync/resolve-calendar-event-time-zone.util';
import { contactTargetsForGuests, escapeIlike, matchGuestsToContacts, normalizeHandle } from '../lib/calendar/matchGuests';
import { Contact, Task, TaskUpdate, Deal, Activity, AIInsight, CalendarEvent, CalendarEventParticipant } from '../types';
import type { ContactEnrichmentData } from './aiEnrichmentService';

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
  next_follow_up?: string | null;
  position?: number | null;
  created_at: string;
  updated_at: string;
}

interface TaskDB {
  id: string;
  is_favorite?: boolean | null;
  position?: number | null;
  title: string;
  description?: string;
  due_date?: string;
  start_time?: string | null;
  end_time?: string | null;
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
  is_favorite?: boolean | null;
  position?: number | null;
  title?: string | null;
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
  nextFollowUp: contact.next_follow_up ?? undefined,
  position: contact.position ?? undefined,
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
  ai_score: contact.aiScore,
  next_follow_up: contact.nextFollowUp ?? null
});

export const mapTaskFromDB = (task: TaskDB): Task => ({
  id: task.id,
  title: task.title,
  description: task.description,
  dueDate: task.due_date ? new Date(task.due_date) : undefined,
  startTime: task.start_time ? new Date(task.start_time) : undefined,
  endTime: task.end_time ? new Date(task.end_time) : undefined,
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
  relatedTo: task.related_to ?? undefined,
  position: task.position ?? undefined,
  isFavorite: task.is_favorite ?? false,
  notes: task.notes
});

export const mapTaskToDB = (task: Omit<Task, 'id' | 'createdAt'>) => ({
  title: task.title,
  description: task.description,
  due_date: task.dueDate?.toISOString(),
  start_time: task.startTime?.toISOString(),
  end_time: task.endTime?.toISOString(),
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
  is_favorite: task.isFavorite ?? false,
  notes: task.notes
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const mapDealFromDB = (deal: DealDB): Deal => ({
  id: deal.id,
  title: deal.title ?? undefined,
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
  position: deal.position ?? undefined,
  isFavorite: deal.is_favorite ?? false,
  createdAt: new Date(deal.created_at),
  updatedAt: new Date(deal.updated_at)
});

export const mapDealToDB = (deal: any) => ({
  title: deal.title,
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
  is_favorite: deal.isFavorite ?? false,
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

  async update(id: string, updates: TaskUpdate): Promise<Task> {
    const updateData: any = {};

    Object.keys(updates).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (updates[key as keyof TaskUpdate] !== undefined) {
        const value = updates[key as keyof TaskUpdate];
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
const mapActivityFromDB = (activity: any): Activity => ({
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
});

export const activityApi = {
  async getAll(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapActivityFromDB);
  },

  /** Activities of one record (server-side filter; the timelines use this instead of loading everything). */
  async getForEntity(entityId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapActivityFromDB);
  },

  async create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        type: activity.type,
        title: activity.title,
        description: activity.description,
        // activities.user_id is a uuid; the app has no sign-in, so placeholders like 'current-user' are stored as null
        user_id: activity.userId && UUID_RE.test(activity.userId) ? activity.userId : null,
        user_name: activity.userName,
        entity_type: activity.entityType,
        entity_id: activity.entityId,
        metadata: activity.metadata
      })
      .select()
      .single();

    if (error) throw error;

    return mapActivityFromDB(data);
  },

  async update(id: string, updates: Partial<Pick<Activity, 'title' | 'description' | 'metadata'>>): Promise<Activity> {
    const patch: Record<string, unknown> = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.metadata !== undefined) patch.metadata = updates.metadata;
    const { data, error } = await supabase.from('activities').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return mapActivityFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
  }
};


export interface ContactScoreResult {
  score: number;
  reasoning: string;
  nextBestAction: string;
  fitScore: number;
  engagementScore: number;
  conversionProbability: number;
  urgencyScore: number;
}

const CONTACT_SCORE_TTL_MS = 10 * 60 * 1000;
const contactScoreCache = new Map<string, { at: number; promise: Promise<ContactScoreResult> }>();
const contactScoreKey = (c: Partial<Contact>) =>
  JSON.stringify([c.id, c.firstName, c.lastName, c.name, c.email, c.title, c.company, c.industry, c.interestLevel, c.status, c.sources, c.tags, c.socialProfiles, c.notes]);
/** Test helper: forget cached scores. */
export const clearContactScoreCache = () => contactScoreCache.clear();

// AI API (Edge Functions)
export const aiApi = {
  async enrichContact(contact: Partial<Contact>): Promise<ContactEnrichmentData> {
    const { data, error } = await supabase.functions.invoke('contacts_enrich', {
      body: { contact, format: 'structured' }
    });
    if (error) throw error;
    const nz = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);
    const hasLocation = data.city || data.state || data.country;
    return {
      firstName: nz(data.firstName),
      lastName: nz(data.lastName),
      title: nz(data.title),
      company: nz(data.company),
      industry: nz(data.industry),
      location: hasLocation ? { city: nz(data.city), state: nz(data.state), country: nz(data.country) } : undefined,
      socialProfiles: {
        linkedin: nz(data.linkedin),
        twitter: nz(data.twitter),
        facebook: nz(data.facebook),
        instagram: nz(data.instagram),
        website: nz(data.website)
      },
      bio: nz(data.bio),
      summary: nz(data.summary),
      sources: Array.isArray(data.sources) ? data.sources.filter((x: { url?: string }) => x?.url) : [],
      confidence: Number(data.confidence) || 0
    };
  },

  async generateContactImage(contact: Partial<Contact>): Promise<string> {
    const { data, error } = await supabase.functions.invoke('contacts_image', { body: { contact } });
    if (error) throw error;
    return data.url as string;
  },

  async composeEmail(recipient: Partial<Contact>, context: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('email_compose', { body: { recipient, context } });
    if (error) throw error;
    return data.text;
  },

  /**
   * Scores a contact with the OpenAI-backed `contacts_score` function. Results are cached per contact content for
   * 10 minutes and concurrent callers share one request: several components ask for a score, a next best action
   * and sub-scores for the same contact, and each used to cost a separate OpenAI call (one per contact card, on every open).
   */
  scoreContact(contact: Partial<Contact>): Promise<ContactScoreResult> {
    const key = contactScoreKey(contact);
    const cached = contactScoreCache.get(key);
    if (cached && Date.now() - cached.at < CONTACT_SCORE_TTL_MS) return cached.promise;

    const promise = (async () => {
      const { data, error } = await supabase.functions.invoke('contacts_score', { body: { contact } });
      if (error) throw error;
      return data as ContactScoreResult;
    })();
    contactScoreCache.set(key, { at: Date.now(), promise });
    // failures are not cached
    promise.catch(() => contactScoreCache.delete(key));
    return promise;
  },

  async generateInsights(contacts: Contact[], extra: { deals?: Deal[]; tasks?: Task[] } = {}): Promise<AIInsight[]> {
    const { data, error } = await supabase.functions.invoke('generate_ai_insights', {
      body: { contacts, deals: extra.deals, tasks: extra.tasks }
    });

    if (error) throw error;
    return (data as Array<AIInsight & { createdAt: string | Date }>).map((insight) => ({
      ...insight,
      createdAt: new Date(insight.createdAt)
    }));
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
    // Structured result in one call (token streaming lives in useStreamingAI -> ai_stream).
    const suggestions = await aiApi.generateTaskSuggestions(prompt);
    const first = suggestions[0];
    if (first) onChunk?.(`${first.title}${first.description ? ` - ${first.description}` : ''}`);
    return first;
  }
};
// ---------------------------------------------------------------------------
// Calendar events (timeline, composer, blocklist, visibility)
// Data model/behaviour follows twentyhq/twenty's calendar module (AGPL-3.0, used with permission).
// ---------------------------------------------------------------------------

export type CalendarTargetType = 'contact' | 'deal' | 'task';

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  /** ISO instant, or YYYY-MM-DD when isFullDay */
  startsAt: string;
  endsAt: string;
  isFullDay: boolean;
  timeZone: string;
  visibility: CalendarChannelVisibility;
  conferenceLink?: string;
  attendees: { handle: string; displayName?: string; contactId?: string }[];
  targets: { type: CalendarTargetType; id: string }[];
}

const toStorageInstant = (value: string, isFullDay: boolean): string =>
  isFullDay ? new Date(`${value}T00:00:00`).toISOString() : new Date(value).toISOString();

interface CalendarEventDB {
  id: string;
  position?: number | null;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  is_all_day: boolean;
  location?: string | null;
  is_canceled?: boolean | null;
  conference_solution?: string | null;
  conference_link?: string | null;
  visibility?: string | null;
  time_zone?: string | null;
}

export const mapCalendarEventFromDB = (event: CalendarEventDB): CalendarEvent => {
  const startDate = new Date(event.start_date);
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    startDate,
    // events saved without an end last until the end of their start day (same rule as upstream's getCalendarEventEndDate)
    endDate: event.end_date ? new Date(event.end_date) : new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59),
    isAllDay: event.is_all_day,
    location: event.location ?? undefined,
    // calendar_events has no calendar_id column; every stored event belongs to the default calendar
    calendarId: 'default',
    type: 'event',
    status: event.is_canceled ? 'cancelled' : 'scheduled',
    isCanceled: event.is_canceled ?? false,
    conferenceSolution: event.conference_solution ?? undefined,
    conferenceLink: event.conference_link ?? undefined,
    visibility: (event.visibility as CalendarEvent['visibility']) ?? 'SHARE_EVERYTHING',
    position: event.position ?? undefined,
    timeZone: event.time_zone ?? undefined
  };
};

/** Strip the control characters Postgres rejects (Twenty's `sanitizeCalendarEvent`) from the free-text fields. */
const cleanText = (value: string): string => sanitizeCalendarEvent({ value }, ['value']).value;

export const calendarBlocklistApi = {
  async getAll(): Promise<{ id: string; handle: string }[]> {
    const { data, error } = await supabase.from('calendar_blocklist').select('id, handle').order('created_at');
    if (error) throw error;
    return (data ?? []) as { id: string; handle: string }[];
  },

  /** An address ("a@b.com") or a whole domain ("@b.com"). */
  async add(handle: string): Promise<void> {
    const value = handle.trim().toLowerCase();
    if (!value) return;
    const { error } = await supabase.from('calendar_blocklist').upsert({ handle: value }, { onConflict: 'handle', ignoreDuplicates: true });
    if (error) throw error;
    blocklistCache = null;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_blocklist').delete().eq('id', id);
    if (error) throw error;
    blocklistCache = null;
  }
};

let blocklistCache: string[] | null = null;

/** The blocked handles; a failed lookup means "nothing blocked" so the calendar still shows. */
const loadBlocklist = async (): Promise<string[]> => {
  if (blocklistCache) return blocklistCache;
  try {
    blocklistCache = (await calendarBlocklistApi.getAll()).map((entry) => entry.handle).filter(Boolean);
  } catch (error) {
    console.error('Failed to load the calendar blocklist:', error);
    return [];
  }
  return blocklistCache;
};

/** Hide events that involve a blocked address or domain (Twenty's blocklist rule, `isEmailBlocklisted`). */
const hasBlockedGuest = (guestHandles: string[], blocklist: string[]): boolean =>
  blocklist.length > 0 && guestHandles.some((handle) => isEmailBlocklisted([], handle, blocklist));

const GUEST_BATCH_SIZE = 100;

/** Contacts whose email equals one of the handles (case-insensitive). */
const findContactsByEmails = async (handles: string[]): Promise<{ id: string; email: string }[]> => {
  const emails = [...new Set(handles.map(normalizeHandle).filter(Boolean))];
  if (emails.length === 0) return [];
  const { data, error } = await supabase
    .from('contacts')
    .select('id, email')
    .or(emails.map((e) => `email.ilike.${escapeIlike(e)}`).join(','));
  if (error) throw error;
  return (data ?? []) as { id: string; email: string }[];
};

const matchAttendeesToContacts = async <A extends { handle: string; contactId?: string }>(attendees: A[]): Promise<A[]> => {
  const unmatched = attendees.filter((a) => !a.contactId).map((a) => a.handle);
  if (unmatched.length === 0) return attendees;
  try {
    return matchGuestsToContacts(attendees, await findContactsByEmails(unmatched));
  } catch (error) {
    // matching is a convenience: never block saving the event because the lookup failed
    console.error('Failed to match guests to contacts:', error);
    return attendees;
  }
};

const TARGET_CONFLICT = 'calendar_event_id,target_type,target_id';
type GuestRow = { calendar_event_id: string; handle: string; display_name: string | null; contact_id: string | null };

export const calendarEventApi = {
  async getTimeline(
    targetType: CalendarTargetType,
    targetId: string,
    pageSize = 10,
    offset = 0
  ): Promise<TimelineCalendarEventsWithTotal> {
    const { data, error } = await supabase.rpc('get_timeline_calendar_events', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_page_size: pageSize,
      p_offset: offset
    });
    if (error) throw error;

    const result = data as TimelineCalendarEventsWithTotal;
    const blocklist = await loadBlocklist();
    const pageEvents = result.timelineCalendarEvents ?? [];
    const visibleEvents = pageEvents.filter(
      (event: TimelineCalendarEvent) => !hasBlockedGuest((event.participants ?? []).map((p) => p.handle ?? ''), blocklist)
    );
    return {
      // events hidden by the blocklist don't count either
      totalNumberOfCalendarEvents: Math.max(0, Number(result.totalNumberOfCalendarEvents ?? 0) - (pageEvents.length - visibleEvents.length)),
      timelineCalendarEvents: visibleEvents.map((event: TimelineCalendarEvent) => ({
        ...event,
        title: event.title ?? undefined,
        endsAt: event.endsAt ?? undefined,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        conferenceSolution: event.conferenceSolution ?? undefined,
        participants: (event.participants ?? []).map(p => ({ ...p, lastName: p.lastName ?? '' }))
      }))
    };
  },

  async create(input: CreateCalendarEventInput): Promise<string> {
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        title: cleanText(input.title),
        description: input.description ? cleanText(input.description) : null,
        location: input.location ? cleanText(input.location) : null,
        start_date: toStorageInstant(input.startsAt, input.isFullDay),
        end_date: toStorageInstant(input.endsAt, input.isFullDay),
        is_all_day: input.isFullDay,
        time_zone: resolveCalendarEventTimeZone(input.timeZone),
        visibility: input.visibility,
        conference_link: input.conferenceLink || null
      })
      .select('id')
      .single();
    if (error) throw error;

    const eventId = event.id as string;

    // guests whose email is a contact's email are linked to that contact, and the event is linked to the contact too
    const attendees = await matchAttendeesToContacts(input.attendees);
    const targets = [...input.targets, ...contactTargetsForGuests(attendees, input.targets)];

    if (attendees.length > 0) {
      const { error: participantsError } = await supabase.from('calendar_event_participants').insert(
        attendees.map(a => ({
          calendar_event_id: eventId,
          handle: a.handle,
          display_name: a.displayName ?? '',
          contact_id: a.contactId ?? null
        }))
      );
      if (participantsError) throw participantsError;
    }

    if (targets.length > 0) {
      const { error: targetsError } = await supabase.from('calendar_event_targets').insert(
        targets.map(t => ({ calendar_event_id: eventId, target_type: t.type, target_id: t.id }))
      );
      if (targetsError) throw targetsError;
    }

    return eventId;
  },

  /** Events overlapping [from, to] (RLS limits rows to the owner). */
  async getRange(from: Date, to: Date): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .lte('start_date', to.toISOString())
      .or(`end_date.gte.${from.toISOString()},end_date.is.null`)
      .order('start_date');
    if (error) throw error;
    const events = (data ?? []).map(mapCalendarEventFromDB);
    if (events.length === 0) return events;

    // guests live in their own table; load them so events opened from the calendar show who is invited
    // in batches, so a dense range doesn't produce a URL longer than PostgREST accepts
    const ids = events.map((e) => e.id);
    const guests: GuestRow[] = [];
    for (let i = 0; i < ids.length; i += GUEST_BATCH_SIZE) {
      const { data: batch, error: guestsError } = await supabase
        .from('calendar_event_participants')
        .select('calendar_event_id, handle, display_name, contact_id')
        .in('calendar_event_id', ids.slice(i, i + GUEST_BATCH_SIZE));
      if (guestsError) throw guestsError;
      guests.push(...((batch ?? []) as GuestRow[]));
    }
    const byEvent = new Map<string, CalendarEventParticipant[]>();
    for (const g of guests) {
      const list = byEvent.get(g.calendar_event_id) ?? [];
      list.push({ firstName: '', lastName: '', displayName: g.display_name || g.handle, handle: g.handle, personId: g.contact_id ?? undefined });
      byEvent.set(g.calendar_event_id, list);
    }
    const withGuests = events.map((e) => (byEvent.has(e.id) ? { ...e, participants: byEvent.get(e.id) } : e));
    const blocklist = await loadBlocklist();
    return withGuests.filter((e) => !hasBlockedGuest((e.participants ?? []).map((p) => p.handle ?? ''), blocklist));
  },

  /** Link an existing event to a record (contact, deal or task). Linking twice is harmless. */
  async linkToRecord(eventId: string, target: { type: CalendarTargetType; id: string }): Promise<void> {
    const { error } = await supabase
      .from('calendar_event_targets')
      .upsert({ calendar_event_id: eventId, target_type: target.type, target_id: target.id }, { onConflict: TARGET_CONFLICT, ignoreDuplicates: true });
    if (error) throw error;
  },

  async unlinkFromRecord(eventId: string, target: { type: CalendarTargetType; id: string }): Promise<void> {
    const { error } = await supabase
      .from('calendar_event_targets')
      .delete()
      .eq('calendar_event_id', eventId)
      .eq('target_type', target.type)
      .eq('target_id', target.id);
    if (error) throw error;
  },

  /** Recent events (newest first) that are not yet linked to this record, optionally filtered by title. */
  async searchLinkable(target: { type: CalendarTargetType; id: string }, search = '', limit = 20): Promise<CalendarEvent[]> {
    let query = supabase.from('calendar_events').select('*').order('start_date', { ascending: false }).limit(limit * 3);
    const term = search.trim();
    if (term) query = query.ilike('title', `%${escapeIlike(term)}%`);
    const { data, error } = await query;
    if (error) throw error;
    const events = (data ?? []).map(mapCalendarEventFromDB);
    if (events.length === 0) return [];
    const { data: linked, error: linkedError } = await supabase
      .from('calendar_event_targets')
      .select('calendar_event_id')
      .eq('target_type', target.type)
      .eq('target_id', target.id)
      .in('calendar_event_id', events.map((e) => e.id));
    if (linkedError) throw linkedError;
    const linkedIds = new Set((linked ?? []).map((r: { calendar_event_id: string }) => r.calendar_event_id));
    return events.filter((e) => !linkedIds.has(e.id)).slice(0, limit);
  },

  /**
   * A contact was created or its email changed: guests with that email become that contact, and their events are
   * linked to the contact. Returns how many events were linked.
   */
  async linkGuestsToContact(contact: { id: string; email?: string | null }): Promise<number> {
    const email = contact.email ? normalizeHandle(contact.email) : '';
    if (!email) return 0;
    const { data, error } = await supabase
      .from('calendar_event_participants')
      .update({ contact_id: contact.id })
      .ilike('handle', escapeIlike(email))
      .is('contact_id', null)
      .select('calendar_event_id');
    if (error) throw error;
    const eventIds = [...new Set((data ?? []).map((r: { calendar_event_id: string }) => r.calendar_event_id))];
    if (eventIds.length === 0) return 0;
    const { error: targetsError } = await supabase
      .from('calendar_event_targets')
      .upsert(
        eventIds.map((id) => ({ calendar_event_id: id, target_type: 'contact', target_id: contact.id })),
        { onConflict: TARGET_CONFLICT, ignoreDuplicates: true }
      );
    if (targetsError) throw targetsError;
    return eventIds.length;
  },

  async update(id: string, updates: { startDate?: Date; endDate?: Date; title?: string; location?: string; description?: string; isAllDay?: boolean; timeZone?: string; visibility?: CalendarChannelVisibility; conferenceLink?: string; position?: number }): Promise<CalendarEvent> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.startDate) patch.start_date = updates.startDate.toISOString();
    if (updates.endDate) patch.end_date = updates.endDate.toISOString();
    if (updates.title !== undefined) patch.title = cleanText(updates.title);
    if (updates.location !== undefined) patch.location = updates.location ? cleanText(updates.location) : null;
    if (updates.description !== undefined) patch.description = updates.description ? cleanText(updates.description) : null;
    if (updates.isAllDay !== undefined) patch.is_all_day = updates.isAllDay;
    if (updates.timeZone !== undefined) patch.time_zone = resolveCalendarEventTimeZone(updates.timeZone);
    if (updates.visibility !== undefined) patch.visibility = updates.visibility;
    if (updates.position !== undefined) patch.position = updates.position;
    if (updates.conferenceLink !== undefined) patch.conference_link = updates.conferenceLink || null;
    const { data, error } = await supabase.from('calendar_events').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return mapCalendarEventFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) throw error;
  },

  async getSettings(): Promise<{ defaultVisibility: CalendarChannelVisibility }> {
    const { data, error } = await supabase.from('calendar_settings').select('default_visibility').eq('id', 'default').maybeSingle();
    if (error) throw error;
    return {
      defaultVisibility: (data?.default_visibility as CalendarChannelVisibility) ?? CalendarChannelVisibility.SHARE_EVERYTHING
    };
  },

  async setDefaultVisibility(visibility: CalendarChannelVisibility): Promise<void> {
    const { error } = await supabase
      .from('calendar_settings')
      .upsert({ id: 'default', default_visibility: visibility, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
};

// ---------------------------------------------------------------------------
// Saved calendar views (shape follows twentyhq/twenty's View: layout, date field, filters, visibility, position)
// ---------------------------------------------------------------------------
export type CalendarRecordType = 'task' | 'deal' | 'contact' | 'event';

export interface CalendarViewFilters {
  statuses?: string[];
  assigneeIds?: string[];
  dueDateRange?: { from?: string; to?: string };
  searchTerm?: string;
  favoritesOnly?: boolean;
  /** advanced rules with operators (optional, so older saved views keep working) */
  advanced?: import('../lib/recordFilters/types').FilterGroup;
}

export interface CalendarView {
  id: string;
  name: string;
  layout: 'DAY' | 'WEEK' | 'MONTH' | 'AGENDA';
  fieldByType: Partial<Record<CalendarRecordType, string>>;
  filters: CalendarViewFilters;
  visibleTypes: CalendarRecordType[];
  position: number;
  isDefault: boolean;
}

interface CalendarViewDB {
  id: string;
  name: string;
  calendar_layout: CalendarView['layout'];
  field_by_type: CalendarView['fieldByType'];
  filters: CalendarViewFilters;
  visible_types: CalendarRecordType[];
  position: number;
  is_default: boolean;
}

export const mapCalendarViewFromDB = (view: CalendarViewDB): CalendarView => ({
  id: view.id,
  name: view.name,
  layout: view.calendar_layout,
  fieldByType: view.field_by_type ?? {},
  filters: view.filters ?? {},
  visibleTypes: view.visible_types ?? ['task', 'deal', 'contact', 'event'],
  position: view.position,
  isDefault: view.is_default
});

const mapCalendarViewToDB = (view: Partial<Omit<CalendarView, 'id'>>) => ({
  ...(view.name !== undefined && { name: view.name }),
  ...(view.layout !== undefined && { calendar_layout: view.layout }),
  ...(view.fieldByType !== undefined && { field_by_type: view.fieldByType }),
  ...(view.filters !== undefined && { filters: view.filters }),
  ...(view.visibleTypes !== undefined && { visible_types: view.visibleTypes }),
  ...(view.position !== undefined && { position: view.position }),
  ...(view.isDefault !== undefined && { is_default: view.isDefault }),
  updated_at: new Date().toISOString()
});

export const calendarViewApi = {
  async getAll(): Promise<CalendarView[]> {
    const { data, error } = await supabase.from('calendar_views').select('*').order('position').order('created_at');
    if (error) throw error;
    return (data ?? []).map(mapCalendarViewFromDB);
  },

  async create(view: Omit<CalendarView, 'id' | 'position' | 'isDefault'>): Promise<CalendarView> {
    const { data, error } = await supabase
      .from('calendar_views')
      .insert(mapCalendarViewToDB({ ...view, position: 0, isDefault: false }))
      .select()
      .single();
    if (error) throw error;
    return mapCalendarViewFromDB(data);
  },

  async update(id: string, updates: Partial<Omit<CalendarView, 'id'>>): Promise<CalendarView> {
    const { data, error } = await supabase.from('calendar_views').update(mapCalendarViewToDB(updates)).eq('id', id).select().single();
    if (error) throw error;
    return mapCalendarViewFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_views').delete().eq('id', id);
    if (error) throw error;
  }
};

// Sample ("mock") data: rows flagged is_sample = true (migration 20260101000000). The delete button removes exactly those.
export type SampleDataCounts = { tasks: number; calendarEvents: number; activities: number; contacts: number; deals: number };
export type SampleDataIds = { [K in keyof SampleDataCounts]: string[] };

// children before parents, so foreign keys never block a delete
const SAMPLE_TABLES: [keyof SampleDataCounts, string][] = [
  ['tasks', 'tasks'],
  ['calendarEvents', 'calendar_events'],
  ['activities', 'activities'],
  ['deals', 'deals'],
  ['contacts', 'contacts']
];

export const sampleDataApi = {
  async count(): Promise<SampleDataCounts> {
    const counts: SampleDataCounts = { tasks: 0, calendarEvents: 0, activities: 0, contacts: 0, deals: 0 };
    for (const [key, table] of SAMPLE_TABLES) {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('is_sample', true);
      if (error) throw error;
      counts[key] = count ?? 0;
    }
    return counts;
  },

  /** Deletes every row flagged is_sample and returns the ids removed per table. Unflagged rows are never touched. */
  async deleteAll(): Promise<SampleDataIds> {
    const ids: SampleDataIds = { tasks: [], calendarEvents: [], activities: [], contacts: [], deals: [] };
    for (const [key, table] of SAMPLE_TABLES) {
      const { data, error } = await supabase.from(table).delete().eq('is_sample', true).select('id');
      if (error) throw error;
      ids[key] = (data ?? []).map((r: { id: string }) => r.id);
    }
    // files attached to the deleted records go with them
    await attachmentApi.removeForEntities([...ids.tasks, ...ids.calendarEvents, ...ids.deals, ...ids.contacts]);
    return ids;
  }
};

// Saved table views (Contacts / Deals / Tasks), same pattern as calendar views.
export type RecordObjectType = 'contact' | 'deal' | 'task';
export interface RecordView {
  id: string;
  name: string;
  objectType: RecordObjectType;
  filters: import('../lib/recordFilters/types').FilterGroup;
  sort: { key?: string; dir?: 'asc' | 'desc' };
  columns: string[];
  position: number;
}

interface RecordViewDB {
  id: string;
  name: string;
  object_type: RecordObjectType;
  filters: RecordView['filters'] | null;
  sort: RecordView['sort'] | null;
  columns: string[] | null;
  position: number;
}

export const mapRecordViewFromDB = (v: RecordViewDB): RecordView => ({
  id: v.id,
  name: v.name,
  objectType: v.object_type,
  filters: v.filters ?? { op: 'and', rules: [] },
  sort: v.sort ?? {},
  columns: v.columns ?? [],
  position: v.position
});

export const recordViewApi = {
  async getAll(objectType: RecordObjectType): Promise<RecordView[]> {
    const { data, error } = await supabase.from('record_views').select('*').eq('object_type', objectType).order('position').order('created_at');
    if (error) throw error;
    return (data ?? []).map(mapRecordViewFromDB);
  },

  async create(view: Omit<RecordView, 'id' | 'position'>): Promise<RecordView> {
    const { data, error } = await supabase
      .from('record_views')
      .insert({ name: view.name, object_type: view.objectType, filters: view.filters, sort: view.sort, columns: view.columns, position: 0 })
      .select()
      .single();
    if (error) throw error;
    return mapRecordViewFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('record_views').delete().eq('id', id);
    if (error) throw error;
  }
};

// Attachments (files on records): metadata in `attachments`, bytes in the private `attachments` Storage bucket.
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export interface Attachment {
  id: string;
  entityType: 'task' | 'deal' | 'contact' | 'calendar';
  entityId: string;
  name: string;
  size: number;
  mimeType?: string;
  storagePath: string;
  createdAt: Date;
}

interface AttachmentDB {
  id: string;
  entity_type: Attachment['entityType'];
  entity_id: string;
  name: string;
  size: number;
  mime_type?: string | null;
  storage_path: string;
  created_at: string;
}

export const mapAttachmentFromDB = (a: AttachmentDB): Attachment => ({
  id: a.id,
  entityType: a.entity_type,
  entityId: a.entity_id,
  name: a.name,
  size: Number(a.size),
  mimeType: a.mime_type ?? undefined,
  storagePath: a.storage_path,
  createdAt: new Date(a.created_at)
});

/** Storage keys allow only a limited character set; keep the readable name in the table. */
export const safeStorageName = (name: string) =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+/, '').slice(-100) || 'file';

export const attachmentApi = {
  async list(entityId: string): Promise<Attachment[]> {
    const { data, error } = await supabase.from('attachments').select('*').eq('entity_id', entityId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapAttachmentFromDB);
  },

  async upload(entityType: Attachment['entityType'], entityId: string, file: File): Promise<Attachment> {
    if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`"${file.name}" is larger than 25 MB.`);
    if (file.size === 0) throw new Error(`"${file.name}" is empty.`);
    const path = `${entityType}/${entityId}/${crypto.randomUUID()}-${safeStorageName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file, { contentType: file.type || undefined });
    if (uploadError) throw uploadError;
    const { data, error } = await supabase
      .from('attachments')
      .insert({ entity_type: entityType, entity_id: entityId, name: file.name, size: file.size, mime_type: file.type || null, storage_path: path })
      .select()
      .single();
    if (error) {
      // do not leave an orphaned file behind
      await supabase.storage.from('attachments').remove([path]);
      throw error;
    }
    return mapAttachmentFromDB(data);
  },

  /** A link that works for one minute. */
  async getDownloadUrl(storagePath: string, fileName?: string): Promise<string> {
    const { data, error } = await supabase.storage.from('attachments').createSignedUrl(storagePath, 60, fileName ? { download: fileName } : undefined);
    if (error || !data?.signedUrl) throw error ?? new Error('No download link');
    return data.signedUrl;
  },

  async remove(attachment: Pick<Attachment, 'id' | 'storagePath'>): Promise<void> {
    const { error: storageError } = await supabase.storage.from('attachments').remove([attachment.storagePath]);
    if (storageError) throw storageError;
    const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
    if (error) throw error;
  },

  /** Used when records are deleted in bulk (sample data): their files go too. */
  async removeForEntities(entityIds: string[]): Promise<void> {
    if (entityIds.length === 0) return;
    const { data, error } = await supabase.from('attachments').select('id, storage_path').in('entity_id', entityIds);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return;
    const { error: storageError } = await supabase.storage.from('attachments').remove(rows.map((r: { storage_path: string }) => r.storage_path));
    if (storageError) throw storageError;
    const { error: delError } = await supabase.from('attachments').delete().in('id', rows.map((r: { id: string }) => r.id));
    if (delError) throw delError;
  }
};
