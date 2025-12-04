import { describe, it, expect } from 'vitest';
import { mapContactFromDB, mapContactToDB, mapTaskFromDB, mapTaskToDB, mapDealFromDB, mapDealToDB } from './api';

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
      completed_at: null,
      assigned_user_id: 'user1',
      assigned_user_name: 'John Doe',
      estimated_duration: 60,
      actual_duration: null,
      tags: ['urgent'],
      attachments: [],
      subtasks: [],
      related_to: null,
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
      value: 50000,
      probability: 75,
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
      expect(result.value).toBe(50000);
      expect(result.probability).toBe(75);
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('maps deal to database format', () => {
      const frontendDeal = {
        company: 'Tech Corp',
        value: 50000,
        probability: 75,
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
      expect(result.value).toBe(50000);
      expect(result.contact_id).toBe('contact1');
    });
  });
});