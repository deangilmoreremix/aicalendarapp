import { Contact } from '../types';
import { aiApi } from './api';

export interface ContactEnrichmentData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  avatar?: string;
  bio?: string;
  notes?: string;
  confidence: number;
}

export interface AISearchQuery {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  linkedinUrl?: string;
}

export class AIEnrichmentService {
  static async enrichContactByEmail(email: string): Promise<ContactEnrichmentData | null> {
    return this.enrich({ email });
  }

  static async enrichContactByLinkedIn(linkedinUrl: string): Promise<ContactEnrichmentData | null> {
    return this.enrich({ socialProfiles: { linkedin: linkedinUrl } });
  }

  static async enrichContactByName(firstName: string, lastName: string, company?: string): Promise<ContactEnrichmentData | null> {
    return this.enrich({ firstName, lastName, company });
  }

  /** Deterministic initials avatar (no image search backend is available). */
  static async findContactImage(name: string, company?: string): Promise<string> {
    const label = encodeURIComponent((name || company || '?').trim());
    return `https://ui-avatars.com/api/?name=${label}&size=150&background=random`;
  }

  /** Backed by the `contacts_enrich` edge function (OpenAI Responses API + web search). */
  private static async enrich(contact: Partial<Contact>): Promise<ContactEnrichmentData | null> {
    try {
      return await aiApi.enrichContact(contact);
    } catch (error) {
      console.error('Contact enrichment failed:', error);
      return null;
    }
  }
}

export const aiEnrichmentService = AIEnrichmentService;
