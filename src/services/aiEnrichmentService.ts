import { Contact } from '../types';

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
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const domain = email.split('@')[1];
      const localPart = email.split('@')[0];
      const nameParts = localPart.split(/[._-]/);
      
      // Generate realistic enrichment data
      const enrichmentData: ContactEnrichmentData = {
        firstName: nameParts[0] ? this.capitalizeFirst(nameParts[0]) : undefined,
        lastName: nameParts[1] ? this.capitalizeFirst(nameParts[1]) : undefined,
        email: email,
        company: this.generateCompanyName(domain),
        industry: this.predictIndustry(domain),
        location: this.generateLocation(),
        socialProfiles: {
          linkedin: `https://linkedin.com/in/${localPart}`,
          website: `https://${domain}`
        },
        avatar: this.generateAvatar(),
        confidence: 75 + Math.random() * 20
      };
      
      // Generate bio
      if (enrichmentData.firstName && enrichmentData.company) {
        enrichmentData.bio = `${enrichmentData.firstName} is a professional at ${enrichmentData.company}. They have experience in ${enrichmentData.industry} and are known for their expertise in the field.`;
      }
      
      return enrichmentData;
    } catch (error) {
      console.error('Email enrichment failed:', error);
      return null;
    }
  }

  static async enrichContactByLinkedIn(linkedinUrl: string): Promise<ContactEnrichmentData | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Extract username from LinkedIn URL
      const username = linkedinUrl.split('/in/')[1]?.split('/')[0] || '';
      const nameParts = username.split('-');
      
      return {
        firstName: nameParts[0] ? this.capitalizeFirst(nameParts[0]) : undefined,
        lastName: nameParts[1] ? this.capitalizeFirst(nameParts[1]) : undefined,
        title: this.generateJobTitle(),
        company: this.generateCompanyName(),
        industry: this.generateIndustry(),
        location: this.generateLocation(),
        socialProfiles: {
          linkedin: linkedinUrl
        },
        avatar: this.generateAvatar(),
        confidence: 85 + Math.random() * 10
      };
    } catch (error) {
      console.error('LinkedIn enrichment failed:', error);
      return null;
    }
  }

  static async enrichContactByName(firstName: string, lastName: string, company?: string): Promise<ContactEnrichmentData | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      return {
        firstName,
        lastName,
        company: company || this.generateCompanyName(),
        title: this.generateJobTitle(),
        industry: this.generateIndustry(),
        location: this.generateLocation(),
        socialProfiles: {
          linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
        },
        avatar: this.generateAvatar(),
        confidence: 65 + Math.random() * 20
      };
    } catch (error) {
      console.error('Name enrichment failed:', error);
      return null;
    }
  }

  // Helper methods
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private static generateCompanyName(domain?: string): string {
    if (domain) {
      const companyName = domain.split('.')[0];
      return this.capitalizeFirst(companyName) + ' Inc.';
    }
    
    const companies = [
      'TechCorp Solutions', 'Innovation Labs', 'Global Dynamics', 'Future Systems',
      'Digital Ventures', 'Smart Technologies', 'Advanced Analytics', 'Cloud Innovations'
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  private static predictIndustry(domain?: string): string {
    if (domain) {
      if (domain.includes('tech') || domain.includes('software') || domain.includes('ai')) {
        return 'Technology';
      }
      if (domain.includes('health') || domain.includes('medical') || domain.includes('pharma')) {
        return 'Healthcare';
      }
      if (domain.includes('finance') || domain.includes('bank') || domain.includes('invest')) {
        return 'Finance';
      }
    }
    
    const industries = [
      'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
      'Education', 'Consulting', 'Media', 'Real Estate', 'Energy'
    ];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private static generateIndustry(): string {
    const industries = [
      'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
      'Education', 'Consulting', 'Media', 'Real Estate', 'Energy'
    ];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private static generateJobTitle(): string {
    const titles = [
      'Marketing Director', 'Sales Manager', 'VP of Sales', 'Account Executive',
      'Business Development Manager', 'Product Manager', 'Operations Director',
      'Chief Technology Officer', 'Senior Consultant', 'Project Manager'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private static generateLocation(): { city: string; state: string; country: string } {
    const locations = [
      { city: 'San Francisco', state: 'CA', country: 'USA' },
      { city: 'New York', state: 'NY', country: 'USA' },
      { city: 'London', state: '', country: 'UK' },
      { city: 'Toronto', state: 'ON', country: 'Canada' },
      { city: 'Sydney', state: 'NSW', country: 'Australia' },
      { city: 'Berlin', state: '', country: 'Germany' }
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private static generateAvatar(): string {
    const avatars = [
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }
}

export class aiEnrichmentService {
  static async enrichContactByEmail(email: string): Promise<ContactEnrichmentData> {
    return AIEnrichmentService.enrichContactByEmail(email) as Promise<ContactEnrichmentData>;
  }

  static async enrichContactByLinkedIn(linkedinUrl: string): Promise<ContactEnrichmentData> {
    return AIEnrichmentService.enrichContactByLinkedIn(linkedinUrl) as Promise<ContactEnrichmentData>;
  }

  static async enrichContactByName(firstName: string, lastName: string, company?: string): Promise<ContactEnrichmentData> {
    return AIEnrichmentService.enrichContactByName(firstName, lastName, company) as Promise<ContactEnrichmentData>;
  }

  static async findContactImage(name: string, company?: string): Promise<string> {
    // Simulate image search
    await new Promise(resolve => setTimeout(resolve, 1000));
    return AIEnrichmentService['generateAvatar']();
  }
}