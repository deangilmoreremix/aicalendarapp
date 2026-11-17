/** Field registries: which fields each record type can be filtered and sorted by, and how to read them. */
import type { Contact, Deal, Task } from '../../types';
import type { UnifiedCalendarRecord } from '../../components/calendar/unifiedCalendarRecords';
import type { FieldDef } from './types';

const opts = (values: string[]) => values.map((v) => ({ value: v, label: v.replace(/-/g, ' ') }));
const toMap = <T>(defs: FieldDef<T>[]) => Object.fromEntries(defs.map((d) => [d.key, d])) as Record<string, FieldDef<T>>;

export const CONTACT_FIELDS: FieldDef<Contact>[] = [
  { key: 'name', label: 'Name', type: 'text', get: (c) => c.name },
  { key: 'email', label: 'Email', type: 'text', get: (c) => c.email },
  { key: 'company', label: 'Company', type: 'text', get: (c) => c.company },
  { key: 'title', label: 'Title', type: 'text', get: (c) => c.title },
  { key: 'phone', label: 'Phone', type: 'text', get: (c) => c.phone },
  { key: 'industry', label: 'Industry', type: 'text', get: (c) => c.industry },
  { key: 'status', label: 'Status', type: 'select', get: (c) => c.status, options: opts(['lead', 'prospect', 'customer', 'churned', 'active', 'pending', 'inactive']) },
  { key: 'interestLevel', label: 'Interest', type: 'select', get: (c) => c.interestLevel, options: opts(['hot', 'warm', 'medium', 'cold']) },
  { key: 'aiScore', label: 'AI score', type: 'number', get: (c) => c.aiScore },
  { key: 'tags', label: 'Tags', type: 'multiselect', get: (c) => c.tags },
  { key: 'nextFollowUp', label: 'Next follow-up', type: 'date', get: (c) => c.nextFollowUp },
  { key: 'createdAt', label: 'Created', type: 'date', get: (c) => c.createdAt },
  { key: 'isFavorite', label: 'Favorite', type: 'boolean', get: (c) => c.isFavorite }
];

export const DEAL_FIELDS: FieldDef<Deal>[] = [
  { key: 'company', label: 'Company', type: 'text', get: (d) => d.company },
  { key: 'title', label: 'Name', type: 'text', get: (d) => d.title },
  { key: 'value', label: 'Value', type: 'number', get: (d) => d.value },
  { key: 'probability', label: 'Probability', type: 'number', get: (d) => d.probability },
  { key: 'stage', label: 'Stage', type: 'select', get: (d) => d.stage, options: opts(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']) },
  { key: 'priority', label: 'Priority', type: 'select', get: (d) => d.priority, options: opts(['low', 'medium', 'high']) },
  { key: 'status', label: 'Status', type: 'select', get: (d) => d.status, options: opts(['online', 'offline']) },
  { key: 'dueDate', label: 'Due date', type: 'date', get: (d) => d.dueDate },
  { key: 'createdAt', label: 'Created', type: 'date', get: (d) => d.createdAt },
  { key: 'isFavorite', label: 'Favorite', type: 'boolean', get: (d) => !!d.isFavorite }
];

export const TASK_FIELDS: FieldDef<Task>[] = [
  { key: 'title', label: 'Title', type: 'text', get: (t) => t.title },
  { key: 'description', label: 'Description', type: 'text', get: (t) => t.description },
  { key: 'status', label: 'Status', type: 'select', get: (t) => t.status, options: opts(['pending', 'in-progress', 'on-hold', 'completed', 'cancelled', 'overdue']) },
  { key: 'priority', label: 'Priority', type: 'select', get: (t) => t.priority, options: opts(['low', 'medium', 'high', 'urgent']) },
  { key: 'type', label: 'Type', type: 'select', get: (t) => t.type, options: opts(['follow-up', 'meeting', 'call', 'email', 'proposal', 'research', 'administrative', 'other']) },
  { key: 'assignedUserName', label: 'Assignee', type: 'text', get: (t) => t.assignedUserName },
  { key: 'dueDate', label: 'Due date', type: 'date', get: (t) => t.dueDate },
  { key: 'tags', label: 'Tags', type: 'multiselect', get: (t) => t.tags },
  { key: 'completed', label: 'Completed', type: 'boolean', get: (t) => t.completed },
  { key: 'isFavorite', label: 'Favorite', type: 'boolean', get: (t) => !!t.isFavorite }
];

/** Fields shared by every calendar entry (tasks, deals, contacts, events). */
export const CALENDAR_FIELDS: FieldDef<UnifiedCalendarRecord>[] = [
  { key: 'title', label: 'Title', type: 'text', get: (r) => r.title },
  { key: 'subtitle', label: 'Details', type: 'text', get: (r) => r.subtitle },
  { key: 'type', label: 'Record type', type: 'select', get: (r) => r.type, options: opts(['task', 'deal', 'contact', 'event']) },
  { key: 'status', label: 'Status', type: 'text', get: (r) => r.status },
  { key: 'ownerName', label: 'Owner', type: 'text', get: (r) => r.ownerName },
  { key: 'start', label: 'Date', type: 'date', get: (r) => r.start },
  { key: 'allDay', label: 'All day', type: 'boolean', get: (r) => r.allDay },
  { key: 'isFavorite', label: 'Favorite', type: 'boolean', get: (r) => r.isFavorite }
];

export type TableObject = 'contact' | 'deal' | 'task';
export const FIELDS_BY_OBJECT = { contact: CONTACT_FIELDS, deal: DEAL_FIELDS, task: TASK_FIELDS } as const;
export const FIELD_MAPS = {
  contact: toMap(CONTACT_FIELDS),
  deal: toMap(DEAL_FIELDS),
  task: toMap(TASK_FIELDS),
  calendar: toMap(CALENDAR_FIELDS)
};
