import { create } from 'zustand';
import { Contact } from '../types';
import { generateId } from '../utils';

interface ContactState {
  contacts: Record<string, Contact>;
  isLoading: boolean;
  error: string | null;
}

interface ContactActions {
  getContact: (id: string) => Contact | undefined;
  createContact: (contactData: Partial<Contact>) => Promise<void>;
  updateContact: (id: string, contactData: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  importContacts: (contacts: Partial<Contact>[]) => Promise<void>;
  loadContacts: () => Promise<void>;
}

type ContactStore = ContactState & ContactActions;

// Sample contact data
const sampleContacts: Contact[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1-555-0123',
    title: 'Marketing Director',
    company: 'TechCorp Solutions',
    industry: 'Technology',
    avatarSrc: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    sources: ['LinkedIn', 'Website'],
    interestLevel: 'hot',
    status: 'customer',
    tags: ['VIP', 'Enterprise'],
    notes: 'Key decision maker for technology purchases',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/sarah-johnson',
      website: 'https://techcorp.com'
    },
    customFields: {},
    isFavorite: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-20'),
    aiScore: 92
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    name: 'Michael Chen',
    email: 'michael.chen@startup.io',
    phone: '+1-555-0124',
    title: 'CEO',
    company: 'Innovation Labs',
    industry: 'Technology',
    avatarSrc: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    sources: ['Referral', 'Conference'],
    interestLevel: 'warm',
    status: 'prospect',
    tags: ['Startup', 'AI'],
    notes: 'Interested in AI solutions for startup growth',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/michael-chen',
      twitter: 'https://twitter.com/mchen'
    },
    customFields: {},
    isFavorite: false,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-12-18'),
    aiScore: 78
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@enterprise.com',
    phone: '+1-555-0125',
    title: 'VP of Operations',
    company: 'Global Dynamics',
    industry: 'Manufacturing',
    avatarSrc: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    sources: ['Cold Call', 'Email'],
    interestLevel: 'medium',
    status: 'lead',
    tags: ['Enterprise', 'Operations'],
    notes: 'Looking for operational efficiency solutions',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/emma-rodriguez'
    },
    customFields: {},
    isFavorite: false,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-12-15'),
    aiScore: 65
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Kim',
    name: 'David Kim',
    email: 'david.kim@techcorp.com',
    phone: '+1-555-0126',
    title: 'Software Engineer',
    company: 'TechCorp Inc',
    industry: 'Technology',
    avatarSrc: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    sources: ['LinkedIn', 'GitHub'],
    interestLevel: 'cold',
    status: 'inactive',
    tags: ['Developer', 'Backend'],
    notes: 'Technical contact, not decision maker',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/david-kim',
      website: 'https://davidkim.dev'
    },
    customFields: {},
    isFavorite: false,
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-12-10'),
    aiScore: 35
  },
  {
    id: '5',
    firstName: 'Lisa',
    lastName: 'Thompson',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@innovation.com',
    phone: '+1-555-0127',
    title: 'Product Manager',
    company: 'Innovation Co',
    industry: 'Technology',
    avatarSrc: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    sources: ['Website', 'Demo Request'],
    interestLevel: 'hot',
    status: 'customer',
    tags: ['Product', 'Innovation'],
    notes: 'Very interested in product roadmap',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/lisa-thompson'
    },
    customFields: {},
    isFavorite: true,
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-12-22'),
    aiScore: 88
  },
];

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: sampleContacts,
  isLoading: false,
  error: null,

  getContact: (id) => {
    return get().contacts.find(contact => contact.id === id);
  },

  createContact: async (contactData) => {
    set({ isLoading: true, error: null });
    try {
      const newContact: Contact = {
        id: generateId(),
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        name: contactData.name || `${contactData.firstName} ${contactData.lastName}`,
        email: contactData.email || '',
        phone: contactData.phone,
        title: contactData.title || '',
        company: contactData.company || '',
        industry: contactData.industry,
        avatarSrc: contactData.avatarSrc,
        sources: contactData.sources || ['Manual Entry'],
        interestLevel: contactData.interestLevel || 'medium',
        status: contactData.status || 'lead',
        tags: contactData.tags || [],
        notes: contactData.notes,
        socialProfiles: contactData.socialProfiles || {},
        customFields: contactData.customFields || {},
        isFavorite: contactData.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiScore: contactData.aiScore || 0,
        ...contactData,
      };

      set((state) => ({
        contacts: [...state.contacts, newContact],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create contact', isLoading: false });
    }
  },

  updateContact: async (id, contactData) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        contacts: state.contacts.map(contact =>
          contact.id === id
            ? { ...contact, ...contactData, updatedAt: new Date() }
            : contact
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update contact', isLoading: false });
    }
  },

  deleteContact: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        contacts: state.contacts.filter(contact => contact.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete contact', isLoading: false });
    }
  },

  importContacts: async (contactsData) => {
    set({ isLoading: true, error: null });
    try {
      const newContacts: Contact[] = contactsData.map(contactData => ({
        id: generateId(),
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        name: contactData.name || `${contactData.firstName} ${contactData.lastName}`,
        email: contactData.email || '',
        phone: contactData.phone,
        title: contactData.title || '',
        company: contactData.company || '',
        industry: contactData.industry,
        avatarSrc: contactData.avatarSrc,
        sources: contactData.sources || ['Import'],
        interestLevel: contactData.interestLevel || 'medium',
        status: contactData.status || 'lead',
        tags: contactData.tags || [],
        notes: contactData.notes,
        socialProfiles: contactData.socialProfiles || {},
        customFields: contactData.customFields || {},
        isFavorite: contactData.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiScore: contactData.aiScore || 0,
        ...contactData,
      }));

      set((state) => ({
        contacts: [...state.contacts, ...newContacts],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to import contacts', isLoading: false });
    }
  },

  loadContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would fetch from an API
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load contacts', isLoading: false });
    }
  },
}));