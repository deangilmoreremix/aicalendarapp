import React, { createContext, useContext, useState, useCallback } from 'react';
import { Contact } from '../types';
import { aiApi } from '../services/api';

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
    youtube?: string;
    tiktok?: string;
    snapchat?: string;
    pinterest?: string;
    github?: string;
    medium?: string;
    behance?: string;
    dribbble?: string;
    vimeo?: string;
    twitch?: string;
    discord?: string;
    telegram?: string;
    whatsapp?: string;
    signal?: string;
    skype?: string;
    zoom?: string;
    clubhouse?: string;
    mastodon?: string;
    threads?: string;
    bluesky?: string;
    website?: string;
  };
  avatar?: string;
  bio?: string;
  notes?: string;
  confidence: number;
  aiSearchResults?: {
    platform: string;
    url?: string;
    username?: string;
    verified: boolean;
    followers?: number;
    posts?: number;
    lastActive?: Date;
    confidence: number;
  }[];
}

export interface TaskSuggestion {
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
  searchSocialMediaProfiles: (contactData: Partial<Contact>) => Promise<ContactEnrichmentData>;
  searchAllPlatforms: (contactData: Partial<Contact>) => Promise<ContactEnrichmentData>;
  verifySocialProfiles: (profiles: Record<string, string>) => Promise<Record<string, boolean>>;
  getSocialMediaInsights: (contactId: string) => Promise<any>;
  // New task-related functions
  generateTaskSuggestions: (prompt: string, context?: any) => Promise<TaskSuggestion[]>;
  streamTaskSuggestions: (prompt: string, onChunk?: (chunk: string) => void) => Promise<TaskSuggestion>;
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
      const newInsights = await aiApi.generateInsights(contacts);
      setInsights(prev => [...newInsights, ...prev]);
      return newInsights;
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Fallback to mock data if API fails
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'High-Value Prospects Identified',
          description: `${contacts.filter(c => c.aiScore && c.aiScore > 80).length} contacts show high conversion potential`,
          confidence: 92,
          actionable: true,
          suggestedActions: ['Schedule immediate follow-ups', 'Prepare personalized demos'],
          createdAt: new Date()
        }
      ];
      setInsights(prev => [...mockInsights, ...prev]);
      return mockInsights;
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
    try {
      const dateStrings = await aiApi.optimizeMeetingTime(attendeeIds, duration);
      return dateStrings.map(dateStr => new Date(dateStr));
    } catch (error) {
      console.error('Failed to optimize meeting time:', error);
      // Fallback to mock data
      const now = new Date();
      const suggestions: Date[] = [];
      for (let i = 1; i <= 5; i++) {
        const suggestion = new Date(now);
        suggestion.setDate(now.getDate() + i);
        suggestion.setHours(9 + (i % 3) * 2, 0, 0, 0);
        suggestions.push(suggestion);
      }
      return suggestions;
    }
  }, []);

  const generateMeetingAgenda = useCallback(async (title: string, attendees: string[]): Promise<string[]> => {
    try {
      return await aiApi.generateMeetingAgenda(title, attendees);
    } catch (error) {
      console.error('Failed to generate meeting agenda:', error);
      // Fallback to mock data
      return [
        'Welcome and introductions (5 min)',
        'Agenda review and objectives (5 min)',
        `Discussion: ${title} (30 min)`,
        'Q&A and open discussion (15 min)',
        'Next steps and action items (10 min)',
        'Closing and follow-up planning (5 min)'
      ];
    }
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
    try {
      return await aiApi.predictDealSuccess(contactId, dealValue);
    } catch (error) {
      console.error('Failed to predict deal success:', error);
      // Fallback calculation
      let probability = 50;
      if (dealValue > 100000) probability += 15;
      else if (dealValue > 50000) probability += 10;
      else if (dealValue > 10000) probability += 5;
      probability += (Math.random() - 0.5) * 20;
      return Math.max(10, Math.min(95, Math.round(probability)));
    }
  }, []);

  const searchSocialMediaProfiles = useCallback(async (contactData: Partial<Contact>): Promise<ContactEnrichmentData> => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI processing

      const enrichmentData: ContactEnrichmentData = {
        confidence: 85 + Math.random() * 10,
        aiSearchResults: []
      };

      const fullName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim();
      const company = contactData.company || '';

      // AI-powered social media search simulation
      const platforms = [
        'linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok',
        'github', 'medium', 'behance', 'dribbble', 'twitch', 'discord'
      ];

      for (const platform of platforms) {
        // Simulate AI finding profiles with varying confidence
        const found = Math.random() > 0.4; // 60% chance of finding profile
        if (found) {
          const confidence = 70 + Math.random() * 25;
          const followers = Math.floor(Math.random() * 50000) + 100;

          enrichmentData.aiSearchResults!.push({
            platform,
            username: `${contactData.firstName?.toLowerCase()}${contactData.lastName?.toLowerCase()}`,
            verified: Math.random() > 0.7,
            followers,
            posts: Math.floor(Math.random() * 1000) + 10,
            lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            confidence: Math.round(confidence)
          });

          // Add to social profiles if confidence is high enough
          if (confidence > 80) {
            if (!enrichmentData.socialProfiles) enrichmentData.socialProfiles = {};

            switch (platform) {
              case 'linkedin':
                enrichmentData.socialProfiles.linkedin = `https://linkedin.com/in/${contactData.firstName?.toLowerCase()}-${contactData.lastName?.toLowerCase()}`;
                break;
              case 'twitter':
                enrichmentData.socialProfiles.twitter = `https://twitter.com/${contactData.firstName?.toLowerCase()}${contactData.lastName?.toLowerCase()}`;
                break;
              case 'github':
                enrichmentData.socialProfiles.github = `https://github.com/${contactData.firstName?.toLowerCase()}${contactData.lastName?.toLowerCase()}`;
                break;
              case 'medium':
                enrichmentData.socialProfiles.medium = `https://medium.com/@${contactData.firstName?.toLowerCase()}${contactData.lastName?.toLowerCase()}`;
                break;
            }
          }
        }
      }

      return enrichmentData;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const searchAllPlatforms = useCallback(async (contactData: Partial<Contact>): Promise<ContactEnrichmentData> => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Longer processing for comprehensive search

      const enrichmentData: ContactEnrichmentData = {
        confidence: 90 + Math.random() * 8,
        aiSearchResults: []
      };

      const fullName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim();
      const company = contactData.company || '';

      // Comprehensive AI search across all platforms
      const allPlatforms = [
        'linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok',
        'snapchat', 'pinterest', 'github', 'medium', 'behance', 'dribbble',
        'vimeo', 'twitch', 'discord', 'telegram', 'whatsapp', 'signal',
        'skype', 'zoom', 'clubhouse', 'mastodon', 'threads', 'bluesky'
      ];

      for (const platform of allPlatforms) {
        const found = Math.random() > 0.3; // 70% chance of finding profile
        if (found) {
          const confidence = 75 + Math.random() * 20;
          const followers = Math.floor(Math.random() * 100000) + 50;

          enrichmentData.aiSearchResults!.push({
            platform,
            username: `${contactData.firstName?.toLowerCase()}${contactData.lastName?.toLowerCase()}${platform === 'linkedin' ? '' : Math.floor(Math.random() * 1000)}`,
            verified: Math.random() > 0.6,
            followers,
            posts: Math.floor(Math.random() * 2000) + 5,
            lastActive: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
            confidence: Math.round(confidence)
          });

          // Add to social profiles for high-confidence results
          if (confidence > 85) {
            if (!enrichmentData.socialProfiles) enrichmentData.socialProfiles = {};

            const baseUsername = `${contactData.firstName?.toLowerCase()}-${contactData.lastName?.toLowerCase()}`;

            switch (platform) {
              case 'linkedin':
                enrichmentData.socialProfiles.linkedin = `https://linkedin.com/in/${baseUsername}`;
                break;
              case 'twitter':
                enrichmentData.socialProfiles.twitter = `https://twitter.com/${baseUsername.replace('-', '')}`;
                break;
              case 'instagram':
                enrichmentData.socialProfiles.instagram = `https://instagram.com/${baseUsername.replace('-', '_')}`;
                break;
              case 'github':
                enrichmentData.socialProfiles.github = `https://github.com/${baseUsername}`;
                break;
              case 'medium':
                enrichmentData.socialProfiles.medium = `https://medium.com/@${baseUsername}`;
                break;
              case 'youtube':
                enrichmentData.socialProfiles.youtube = `https://youtube.com/@${baseUsername}`;
                break;
              case 'tiktok':
                enrichmentData.socialProfiles.tiktok = `https://tiktok.com/@${baseUsername.replace('-', '_')}`;
                break;
            }
          }
        }
      }

      // Generate comprehensive bio using AI
      enrichmentData.bio = `${contactData.firstName} ${contactData.lastName} is a ${contactData.title || 'professional'} ${company ? `at ${company}` : 'in their field'}. They are active across multiple social media platforms and have built a strong professional network. Their diverse online presence suggests they are engaged in industry discussions and thought leadership.`;

      return enrichmentData;
    } finally {
      setIsProcessing(false);
    }
  }, [searchSocialMediaProfiles]);

  const verifySocialProfiles = useCallback(async (profiles: Record<string, string>): Promise<Record<string, boolean>> => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const verificationResults: Record<string, boolean> = {};

      for (const [platform, url] of Object.entries(profiles)) {
        // Simulate AI verification with realistic accuracy
        const isValid = Math.random() > 0.15; // 85% accuracy
        verificationResults[platform] = isValid;
      }

      return verificationResults;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getSocialMediaInsights = useCallback(async (contactId: string) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));

      return {
        totalPlatforms: Math.floor(Math.random() * 8) + 3,
        activePlatforms: Math.floor(Math.random() * 6) + 2,
        totalFollowers: Math.floor(Math.random() * 50000) + 1000,
        engagementRate: Math.round((Math.random() * 5 + 1) * 100) / 100,
        postingFrequency: `${Math.floor(Math.random() * 10) + 1} posts/week`,
        topPlatform: ['LinkedIn', 'Twitter', 'Instagram', 'YouTube'][Math.floor(Math.random() * 4)],
        contentThemes: ['Technology', 'Business', 'Industry Insights', 'Personal Branding', 'Networking'],
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        influenceScore: Math.floor(Math.random() * 40) + 60,
        recommendations: [
          'Increase LinkedIn posting frequency',
          'Engage more with industry content',
          'Consider starting a YouTube channel',
          'Build stronger Twitter presence'
        ]
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // New task-related functions
  const generateTaskSuggestions = useCallback(async (prompt: string, context?: any): Promise<TaskSuggestion[]> => {
    setIsProcessing(true);
    try {
      const suggestions = await aiApi.generateTaskSuggestions(prompt, context);
      return suggestions;
    } catch (error) {
      console.error('Failed to generate task suggestions:', error);
      // Fallback: generate mock suggestions based on prompt
      return generateMockTaskSuggestions(prompt);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const streamTaskSuggestions = useCallback(async (prompt: string, onChunk?: (chunk: string) => void): Promise<TaskSuggestion> => {
    setIsProcessing(true);
    try {
      const suggestion = await aiApi.streamTaskSuggestions(prompt, onChunk);
      return suggestion;
    } catch (error) {
      console.error('Failed to stream task suggestions:', error);
      // Fallback: return mock suggestion
      return generateMockTaskSuggestions(prompt)[0];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Mock task suggestion generator for fallback
  const generateMockTaskSuggestions = (prompt: string): TaskSuggestion[] => {
    const suggestions: TaskSuggestion[] = [];

    // Analyze prompt for keywords to determine task characteristics
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const highKeywords = ['important', 'priority', 'key', 'major', 'significant'];
    const meetingKeywords = ['meeting', 'call', 'discussion', 'sync', 'review'];
    const emailKeywords = ['email', 'send', 'write', 'respond', 'follow-up'];
    const researchKeywords = ['research', 'analyze', 'investigate', 'study', 'explore'];

    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    let category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other' = 'other';
    let type: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other' = 'other';

    const lowerPrompt = prompt.toLowerCase();

    if (urgentKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      priority = 'urgent';
    } else if (highKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      priority = 'high';
    }

    if (meetingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      category = 'meeting';
      type = 'meeting';
    } else if (emailKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      category = 'email';
      type = 'email';
    } else if (researchKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      type = 'research';
    }

    // Generate suggested due date based on priority
    let suggestedDueDate: Date | undefined;
    const now = new Date();
    if (priority === 'urgent') {
      suggestedDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    } else if (priority === 'high') {
      suggestedDueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    } else if (priority === 'medium') {
      suggestedDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    }

    // Generate subtasks based on task complexity
    const subtasks = [];
    if (lowerPrompt.includes('project') || lowerPrompt.includes('plan') || lowerPrompt.length > 50) {
      subtasks.push(
        { title: 'Break down requirements', estimatedDuration: 30 },
        { title: 'Identify key milestones', estimatedDuration: 20 },
        { title: 'Assign responsibilities', estimatedDuration: 15 }
      );
    } else if (type === 'meeting') {
      subtasks.push(
        { title: 'Prepare agenda', estimatedDuration: 20 },
        { title: 'Send calendar invite', estimatedDuration: 10 },
        { title: 'Follow up after meeting', estimatedDuration: 15 }
      );
    }

    // Generate relevant tags
    const tags = [];
    if (lowerPrompt.includes('client') || lowerPrompt.includes('customer')) tags.push('client');
    if (lowerPrompt.includes('project')) tags.push('project');
    if (lowerPrompt.includes('sales')) tags.push('sales');
    if (lowerPrompt.includes('marketing')) tags.push('marketing');
    if (lowerPrompt.includes('development') || lowerPrompt.includes('dev')) tags.push('development');

    suggestions.push({
      id: Math.random().toString(36).substr(2, 9),
      title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
      description: `AI-generated task based on: "${prompt}". This task has been analyzed and categorized automatically.`,
      priority,
      suggestedDueDate,
      estimatedDuration: subtasks.reduce((total, subtask) => total + (subtask.estimatedDuration || 0), 30),
      subtasks,
      tags,
      category,
      type,
      reasoning: `Task analyzed for priority "${priority}" based on keywords. Category set to "${category}" due to context. ${subtasks.length > 0 ? `${subtasks.length} subtasks suggested for better task breakdown.` : ''}`,
      confidence: 75 + Math.random() * 20
    });

    return suggestions;
  };

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
    predictDealSuccess,
    searchSocialMediaProfiles,
    searchAllPlatforms,
    verifySocialProfiles,
    getSocialMediaInsights,
    generateTaskSuggestions,
    streamTaskSuggestions
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