import React, { createContext, useContext, useState, useCallback } from 'react';
import { Contact } from '../types';

export interface AIInsight {
  id: string;
  type: 'engagement' | 'conversion' | 'risk' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  createdAt: Date;
}

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

interface AIContextType {
  isProcessing: boolean;
  insights: AIInsight[];
  scoreContact: (contact: Contact) => Promise<number>;
  enrichContact: (contactData: Partial<Contact>) => Promise<ContactEnrichmentData>;
  generateInsights: (contacts: Contact[]) => Promise<AIInsight[]>;
  analyzeInteractionHistory: (contactId: string) => Promise<any>;
  predictNextBestAction: (contactId: string) => Promise<string>;
  scoreBulkContacts: (contacts: Contact[]) => Promise<void>;
  generateBulkInsights: (contacts: Contact[]) => Promise<void>;
  optimizeMeetingTime: (attendeeIds: string[], duration: number) => Promise<Date[]>;
  generateMeetingAgenda: (title: string, attendees: string[]) => Promise<string[]>;
  analyzeContactNetwork: (contactId: string) => Promise<any>;
  predictDealSuccess: (contactId: string, dealValue: number) => Promise<number>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const scoreContact = useCallback(async (contact: Contact): Promise<number> => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Advanced AI scoring algorithm simulation
      let score = 50; // Base score
      
      // Title-based scoring
      const seniorTitles = ['ceo', 'cto', 'founder', 'president', 'director', 'vp'];
      const midTitles = ['manager', 'lead', 'senior', 'principal'];
      
      const titleLower = contact.title?.toLowerCase() || '';
      if (seniorTitles.some(title => titleLower.includes(title))) {
        score += 25;
      } else if (midTitles.some(title => titleLower.includes(title))) {
        score += 15;
      }
      
      // Company size and industry scoring
      const enterpriseKeywords = ['corp', 'corporation', 'inc', 'ltd', 'group'];
      if (enterpriseKeywords.some(keyword => contact.company?.toLowerCase().includes(keyword))) {
        score += 15;
      }
      
      // Engagement and activity scoring
      if (contact.interestLevel === 'hot') score += 20;
      else if (contact.interestLevel === 'medium') score += 10;
      else if (contact.interestLevel === 'cold') score -= 10;
      
      // Industry-specific adjustments
      const highValueIndustries = ['technology', 'finance', 'healthcare', 'enterprise'];
      if (highValueIndustries.includes(contact.industry?.toLowerCase() || '')) {
        score += 10;
      }
      
      // Source quality scoring
      if (contact.sources?.includes('Referral')) score += 15;
      else if (contact.sources?.includes('LinkedIn')) score += 10;
      else if (contact.sources?.includes('Website')) score += 8;
      
      // Social presence scoring
      if (contact.socialProfiles?.linkedin) score += 8;
      if (contact.socialProfiles?.website) score += 5;
      
      // Random AI confidence factor
      score += (Math.random() - 0.5) * 10;
      
      return Math.max(0, Math.min(100, Math.round(score)));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const enrichContact = useCallback(async (contactData: Partial<Contact>): Promise<ContactEnrichmentData> => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI enrichment with realistic data
      const enrichmentData: ContactEnrichmentData = {
        confidence: 75 + Math.random() * 20,
      };

      // Enrich based on email domain
      if (contactData.email) {
        const domain = contactData.email.split('@')[1];
        const companyName = domain?.split('.')[0];
        
        if (!contactData.company && companyName) {
          enrichmentData.company = companyName.charAt(0).toUpperCase() + companyName.slice(1) + ' Inc.';
        }
        
        enrichmentData.socialProfiles = {
          linkedin: `https://linkedin.com/in/${contactData.firstName?.toLowerCase()}-${contactData.lastName?.toLowerCase()}`,
          website: `https://${domain}`
        };
      }

      // Add professional avatar
      if (!contactData.avatarSrc) {
        const avatars = [
          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
        ];
        enrichmentData.avatar = avatars[Math.floor(Math.random() * avatars.length)];
      }

      // Generate professional bio
      enrichmentData.bio = `${contactData.firstName} ${contactData.lastName} is a ${contactData.title || 'professional'} at ${contactData.company || 'their company'}. ${contactData.firstName} has extensive experience in their field and is known for driving results and innovation.`;
      
      return enrichmentData;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateInsights = useCallback(async (contacts: Contact[]): Promise<AIInsight[]> => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newInsights: AIInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'High-Value Prospects Identified',
          description: `${contacts.filter(c => c.aiScore && c.aiScore > 80).length} contacts show high conversion potential`,
          confidence: 92,
          actionable: true,
          suggestedActions: ['Schedule immediate follow-ups', 'Prepare personalized demos'],
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'engagement',
          title: 'Engagement Pattern Analysis',
          description: 'Wednesday 2-4 PM shows 40% higher response rates',
          confidence: 87,
          actionable: true,
          suggestedActions: ['Schedule calls during optimal times', 'Adjust outreach timing'],
          createdAt: new Date()
        },
        {
          id: '3',
          type: 'risk',
          title: 'At-Risk Contacts Detected',
          description: `${contacts.filter(c => c.interestLevel === 'cold').length} contacts showing declining engagement`,
          confidence: 89,
          actionable: true,
          suggestedActions: ['Re-engagement campaign', 'Personal outreach'],
          createdAt: new Date()
        }
      ];
      
      setInsights(prev => [...newInsights, ...prev]);
      return newInsights;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const analyzeInteractionHistory = useCallback(async (contactId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      totalInteractions: Math.floor(Math.random() * 20) + 5,
      lastInteraction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      averageResponseTime: '4.2 hours',
      preferredChannel: 'email',
      engagementTrend: 'increasing',
      meetingCount: Math.floor(Math.random() * 10) + 1,
      dealStage: 'qualification'
    };
  }, []);

  const predictNextBestAction = useCallback(async (contactId: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const actions = [
      'Schedule discovery call within 48 hours',
      'Send personalized case study',
      'Invite to product demo',
      'Connect on LinkedIn with personal note',
      'Follow up with pricing information'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }, []);

  const scoreBulkContacts = useCallback(async (contacts: Contact[]): Promise<void> => {
    setIsProcessing(true);
    try {
      // Simulate bulk processing
      for (let i = 0; i < contacts.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const score = await scoreContact(contacts[i]);
        // In real implementation, this would update the contact store
      }
    } finally {
      setIsProcessing(false);
    }
  }, [scoreContact]);

  const generateBulkInsights = useCallback(async (contacts: Contact[]): Promise<void> => {
    await generateInsights(contacts);
  }, [generateInsights]);

  const optimizeMeetingTime = useCallback(async (attendeeIds: string[], duration: number): Promise<Date[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const now = new Date();
    const suggestions: Date[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const suggestion = new Date(now);
      suggestion.setDate(now.getDate() + i);
      suggestion.setHours(9 + (i % 3) * 2, 0, 0, 0);
      suggestions.push(suggestion);
    }
    
    return suggestions;
  }, []);

  const generateMeetingAgenda = useCallback(async (title: string, attendees: string[]): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      'Welcome and introductions (5 min)',
      'Agenda review and objectives (5 min)',
      `Discussion: ${title} (30 min)`,
      'Q&A and open discussion (15 min)',
      'Next steps and action items (10 min)',
      'Closing and follow-up planning (5 min)'
    ];
  }, []);

  const analyzeContactNetwork = useCallback(async (contactId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      networkSize: Math.floor(Math.random() * 500) + 100,
      mutualConnections: Math.floor(Math.random() * 50) + 10,
      influenceScore: Math.floor(Math.random() * 40) + 60,
      keyConnectors: [
        { name: 'John Smith', title: 'VP Sales', mutual: true },
        { name: 'Sarah Johnson', title: 'Marketing Director', mutual: false }
      ]
    };
  }, []);

  const predictDealSuccess = useCallback(async (contactId: string, dealValue: number): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // AI-based deal success prediction
    let probability = 50; // Base probability
    
    // Adjust based on deal size
    if (dealValue > 100000) probability += 15;
    else if (dealValue > 50000) probability += 10;
    else if (dealValue > 10000) probability += 5;
    
    // Random AI factors
    probability += (Math.random() - 0.5) * 20;
    
    return Math.max(10, Math.min(95, Math.round(probability)));
  }, []);

  const contextValue: AIContextType = {
    isProcessing,
    insights,
    scoreContact,
    enrichContact,
    generateInsights,
    analyzeInteractionHistory,
    predictNextBestAction,
    scoreBulkContacts,
    generateBulkInsights,
    optimizeMeetingTime,
    generateMeetingAgenda,
    analyzeContactNetwork,
    predictDealSuccess
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};