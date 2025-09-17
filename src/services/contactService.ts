import { Contact } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ContactService {
  private static instance: ContactService;

  static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  validateContactData(contact: Partial<Contact>): ValidationResult {
    const errors: string[] = [];

    if (!contact.firstName && !contact.name) {
      errors.push('First name or full name is required');
    }

    if (!contact.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(contact.email)) {
      errors.push('Invalid email format');
    }

    if (!contact.company) {
      errors.push('Company is required');
    }

    if (!contact.title) {
      errors.push('Job title is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would make an API call
    const updatedContact = {
      ...updates,
      id,
      updatedAt: new Date()
    } as Contact;

    return updatedContact;
  }

  async addContactActivity(contactId: string, type: string, description: string, metadata?: any): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));

    // In a real app, this would log the activity
    console.log(`Activity logged: ${type} - ${description}`, metadata);
  }

  async getContactActivities(contactId: string): Promise<any[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return mock activities
    return [
      {
        id: '1',
        type: 'contact_created',
        description: 'Contact was created',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        metadata: {}
      },
      {
        id: '2',
        type: 'email_sent',
        description: 'Email sent to contact',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        metadata: { subject: 'Follow-up meeting' }
      }
    ];
  }

  async searchContacts(query: string): Promise<Contact[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));

    // In a real app, this would search the database
    return [];
  }

  async exportContacts(contactIds: string[]): Promise<string> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return CSV data
    return 'id,name,email,company\n1,John Doe,john@example.com,Company A\n2,Jane Smith,jane@example.com,Company B';
  }
}

export const contactService = ContactService.getInstance();