import { describe, it, expect } from 'vitest';
import { mapContactFromDB, mapContactToDB, mapTaskFromDB, mapTaskToDB, mapDealFromDB, mapDealToDB, mapCalendarEventFromDB, mapCalendarViewFromDB } from './api';

describe('API Mapping Functions', () => {
  describe('Contact Mapping', () => {
    const dbContact = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      title: 'Developer',
      company: 'Tech Corp',
      industry: 'Technology',
      avatar: 'avatar.jpg',
      avatar_src: 'avatar-src.jpg',
      sources: ['linkedin'],
      interest_level: 'high',
      status: 'active',
      tags: ['developer'],
      notes: 'Good contact',
      social_profiles: { linkedin: 'https://linkedin.com/in/johndoe' },
      custom_fields: { custom: 'value' },
      is_favorite: true,
      ai_score: 85,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    };

    const frontendContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      title: 'Developer',
      company: 'Tech Corp',
      industry: 'Technology',
      avatar: 'avatar.jpg',
      avatarSrc: 'avatar-src.jpg',
      sources: ['linkedin'],
      interestLevel: 'high',
      status: 'active',
      tags: ['developer'],
      notes: 'Good contact',
      socialProfiles: { linkedin: 'https://linkedin.com/in/johndoe' },
      customFields: { custom: 'value' },
      isFavorite: true,
      aiScore: 85,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z')
    };

    it('maps contact from database format', () => {
      const result = mapContactFromDB(dbContact);
      expect(result).toEqual(frontendContact);
    });

    it('maps contact to database format', () => {
      const contactInput = {
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        title: 'Developer',
        company: 'Tech Corp',
        industry: 'Technology',
        avatar: 'avatar.jpg',
        avatarSrc: 'avatar-src.jpg',
        sources: ['linkedin'],
        interestLevel: 'hot' as const,
        status: 'active' as const,
        tags: ['developer'],
        notes: 'Good contact',
        socialProfiles: { linkedin: 'https://linkedin.com/in/johndoe' },
        customFields: { custom: 'value' },
        isFavorite: true,
        aiScore: 85
      };

      const result = mapContactToDB(contactInput);
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('Task Mapping', () => {
    const dbTask = {
      id: '1',
      title: 'Test Task',
      description: 'Test description',
      due_date: '2024-12-25T14:30:00Z',
      priority: 'high',
      status: 'pending',
      category: 'meeting',
      type: 'meeting',
      completed: false,
      created_at: '2024-12-20T00:00:00Z',
      completed_at: undefined,
      assigned_user_id: 'user1',
      assigned_user_name: 'John Doe',
      estimated_duration: 60,
      actual_duration: undefined,
      tags: ['urgent'],
      attachments: [],
      subtasks: [],
      related_to: undefined,
      notes: 'Test notes'
    };

    it('maps task from database format', () => {
      const result = mapTaskFromDB(dbTask);
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Task');
      expect(result.dueDate).toEqual(new Date('2024-12-25T14:30:00Z'));
      expect(result.priority).toBe('high');
      expect(result.completed).toBe(false);
    });

    it('maps task to database format', () => {
      const frontendTask = {
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date('2024-12-25T14:30:00Z'),
        priority: 'high' as const,
        status: 'pending' as const,
        category: 'meeting' as const,
        type: 'meeting' as const,
        completed: false,
        tags: ['urgent'],
        attachments: [],
        subtasks: [],
        notes: 'Test notes'
      };

      const result = mapTaskToDB(frontendTask);
      expect(result.title).toBe('Test Task');
      expect(result.due_date).toBe('2024-12-25T14:30:00.000Z');
      expect(result.priority).toBe('high');
    });
  });

  describe('Deal Mapping', () => {
    const dbDeal = {
      id: '1',
      company: 'Tech Corp',
      value: '50000',
      probability: '75',
      due_date: '2024-12-31',
      contact_id: 'contact1',
      status: 'active',
      stage: 'proposal',
      priority: 'high',
      ai_prediction: 80,
      description: 'Test deal',
      notes: 'Good opportunity',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    };

    it('maps deal from database format', () => {
      const result = mapDealFromDB(dbDeal);
      expect(result.id).toBe('1');
      expect(result.company).toBe('Tech Corp');
      expect(result.value).toBe('50000');
      expect(result.probability).toBe('75');
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('maps deal to database format', () => {
      const frontendDeal = {
        company: 'Tech Corp',
        value: '50000',
        probability: '75',
        dueDate: '2024-12-31',
        contactId: 'contact1',
        status: 'active',
        stage: 'proposal',
        priority: 'high',
        aiPrediction: 80,
        description: 'Test deal',
        notes: 'Good opportunity'
      };

      const result = mapDealToDB(frontendDeal);
      expect(result.company).toBe('Tech Corp');
      expect(result.value).toBe('50000');
      expect(result.contact_id).toBe('contact1');
    });
  });
});
describe('Unified calendar mappers', () => {
  it('round-trips task start/end times (previously dropped: no columns, no mapping)', () => {
    const task = mapTaskFromDB({
      id: 't', title: 'Block', priority: 'low', status: 'pending', category: 'other', type: 'other', completed: false,
      created_at: '2030-01-01T00:00:00Z', tags: [],
      start_time: '2030-03-10T09:00:00Z', end_time: '2030-03-10T10:00:00Z'
    });
    expect(task.startTime).toEqual(new Date('2030-03-10T09:00:00Z'));
    expect(task.endTime).toEqual(new Date('2030-03-10T10:00:00Z'));
    const db = mapTaskToDB(task);
    expect(db.start_time).toBe('2030-03-10T09:00:00.000Z');
    expect(db.end_time).toBe('2030-03-10T10:00:00.000Z');
  });

  it('maps the contact follow-up date both ways', () => {
    const contact = mapContactFromDB({
      id: 'c', first_name: 'A', last_name: 'B', name: 'A B', email: 'a@b.co', title: '', company: '', sources: [],
      interest_level: 'hot', status: 'lead', tags: [], is_favorite: false, created_at: '2030-01-01T00:00:00Z',
      updated_at: '2030-01-01T00:00:00Z', next_follow_up: '2030-03-14'
    });
    expect(contact.nextFollowUp).toBe('2030-03-14');
    expect(mapContactToDB(contact).next_follow_up).toBe('2030-03-14');
    expect(mapContactToDB({ ...contact, nextFollowUp: undefined }).next_follow_up).toBeNull();
  });

  it('maps a stored calendar event and defaults a missing end to the end of its day', () => {
    const event = mapCalendarEventFromDB({ id: 'e', title: 'T', start_date: '2030-03-10T09:00:00Z', end_date: null, is_all_day: false, is_canceled: true });
    expect(event.calendarId).toBe('default');
    expect(event.status).toBe('cancelled');
    expect(event.endDate.getTime()).toBeGreaterThan(event.startDate.getTime());
    expect(event.visibility).toBe('SHARE_EVERYTHING');
  });

  it('maps saved views with defaults', () => {
    const view = mapCalendarViewFromDB({
      id: 'v', name: 'W', calendar_layout: 'WEEK', field_by_type: { contact: 'createdAt' }, filters: {},
      visible_types: ['task'], position: 2, is_default: true
    });
    expect(view).toEqual({ id: 'v', name: 'W', layout: 'WEEK', fieldByType: { contact: 'createdAt' }, filters: {}, visibleTypes: ['task'], position: 2, isDefault: true });
  });
});

describe('Deal title', () => {
  it('is stored and read back (the New Deal form requires it)', () => {
    const db = mapDealToDB({ title: 'Big renewal', company: 'Acme', value: '1', probability: '50', dueDate: '2030-01-01', contactId: 'c', stage: 'prospecting', priority: 'low', status: 'online' });
    expect(db.title).toBe('Big renewal');
    expect(mapDealFromDB({ id: 'd', title: 'Big renewal', company: 'Acme', value: '1', probability: '50', due_date: '', contact_id: 'c', status: 'online', stage: 'prospecting', priority: 'low', created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z' }).title).toBe('Big renewal');
  });
});
