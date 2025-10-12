import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAI } from '../contexts/AIContext';
import { AIProvider } from '../contexts/AIContext';
import { useStreamingAI } from '../hooks/useStreamingAI';
import { AIEnrichmentService } from '../services/aiEnrichmentService';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AIProvider>{children}</AIProvider>
);

describe('AI Features', () => {
  describe('AIContext and Provider', () => {
    it('should provide AI context with all methods', () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      expect(result.current).toHaveProperty('scoreContact');
      expect(result.current).toHaveProperty('enrichContact');
      expect(result.current).toHaveProperty('generateInsights');
      expect(result.current).toHaveProperty('analyzeInteractionHistory');
      expect(result.current).toHaveProperty('predictNextBestAction');
      expect(result.current).toHaveProperty('scoreBulkContacts');
      expect(result.current).toHaveProperty('generateBulkInsights');
      expect(result.current).toHaveProperty('optimizeMeetingTime');
      expect(result.current).toHaveProperty('generateMeetingAgenda');
      expect(result.current).toHaveProperty('analyzeContactNetwork');
      expect(result.current).toHaveProperty('predictDealSuccess');
      expect(result.current).toHaveProperty('searchSocialMediaProfiles');
      expect(result.current).toHaveProperty('searchAllPlatforms');
      expect(result.current).toHaveProperty('verifySocialProfiles');
      expect(result.current).toHaveProperty('getSocialMediaInsights');
      expect(result.current).toHaveProperty('generateTaskSuggestions');
      expect(result.current).toHaveProperty('streamTaskSuggestions');
    });

    it('should track processing state', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      expect(result.current.isProcessing).toBe(false);

      const mockContact = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        title: 'CEO',
        company: 'Acme Corp',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const scorePromise = result.current.scoreContact(mockContact);

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      await scorePromise;

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('Contact AI Features', () => {
    it('should score contacts based on title and company', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const seniorContact = {
        id: '1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        title: 'CEO',
        company: 'Tech Corp Inc',
        interestLevel: 'hot' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const score = await result.current.scoreContact(seniorContact);

      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should enrich contact data', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const enriched = await result.current.enrichContact(contactData);

      expect(enriched).toHaveProperty('confidence');
      expect(enriched.confidence).toBeGreaterThan(0);
      expect(enriched.confidence).toBeLessThanOrEqual(100);
    });

    it('should search social media profiles', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        company: 'Tech Corp'
      };

      const enriched = await result.current.searchSocialMediaProfiles(contactData);

      expect(enriched).toHaveProperty('confidence');
      expect(enriched).toHaveProperty('aiSearchResults');
      expect(Array.isArray(enriched.aiSearchResults)).toBe(true);
    });

    it('should verify social profiles', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const profiles = {
        linkedin: 'https://linkedin.com/in/johndoe',
        twitter: 'https://twitter.com/johndoe'
      };

      const verification = await result.current.verifySocialProfiles(profiles);

      expect(verification).toHaveProperty('linkedin');
      expect(verification).toHaveProperty('twitter');
      expect(typeof verification.linkedin).toBe('boolean');
      expect(typeof verification.twitter).toBe('boolean');
    });
  });

  describe('Task AI Features', () => {
    it('should generate task suggestions from prompt', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const suggestions = await result.current.generateTaskSuggestions(
        'Schedule a client meeting next week'
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      const suggestion = suggestions[0];
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('priority');
      expect(suggestion).toHaveProperty('category');
      expect(suggestion).toHaveProperty('confidence');
    });

    it('should categorize urgent tasks correctly', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const suggestions = await result.current.generateTaskSuggestions(
        'URGENT: Fix critical bug immediately'
      );

      expect(suggestions[0].priority).toBe('urgent');
    });

    it('should generate subtasks for complex tasks', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const suggestions = await result.current.generateTaskSuggestions(
        'Plan and implement a new project management system for the company'
      );

      expect(suggestions[0].subtasks).toBeDefined();
      expect(suggestions[0].subtasks.length).toBeGreaterThan(0);
    });
  });

  describe('Deal AI Features', () => {
    it('should predict deal success probability', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const probability = await result.current.predictDealSuccess('contact-1', 50000);

      expect(typeof probability).toBe('number');
      expect(probability).toBeGreaterThanOrEqual(10);
      expect(probability).toBeLessThanOrEqual(95);
    });
  });

  describe('Meeting AI Features', () => {
    it('should optimize meeting times', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const times = await result.current.optimizeMeetingTime(['user1', 'user2'], 60);

      expect(Array.isArray(times)).toBe(true);
      expect(times.length).toBeGreaterThan(0);
      expect(times[0]).toBeInstanceOf(Date);
    });

    it('should generate meeting agenda', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const agenda = await result.current.generateMeetingAgenda(
        'Product Strategy Review',
        ['john@example.com', 'jane@example.com']
      );

      expect(Array.isArray(agenda)).toBe(true);
      expect(agenda.length).toBeGreaterThan(0);
    });
  });

  describe('Streaming AI Features', () => {
    it('should provide streaming state', () => {
      const { result } = renderHook(() => useStreamingAI());

      expect(result.current).toHaveProperty('isStreaming');
      expect(result.current).toHaveProperty('isThinking');
      expect(result.current).toHaveProperty('progress');
      expect(result.current).toHaveProperty('fullResponse');
      expect(result.current).toHaveProperty('cancelOperation');
      expect(result.current).toHaveProperty('reset');
    });

    it('should track streaming progress', async () => {
      const { result } = renderHook(() => useStreamingAI());

      expect(result.current.progress).toBe(0);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('AI Enrichment Service', () => {
    it('should enrich contact by email', async () => {
      const enriched = await AIEnrichmentService.enrichContactByEmail('john@techcorp.com');

      expect(enriched).not.toBeNull();
      if (enriched) {
        expect(enriched).toHaveProperty('confidence');
        expect(enriched).toHaveProperty('email');
        expect(enriched.email).toBe('john@techcorp.com');
      }
    });

    it('should enrich contact by LinkedIn', async () => {
      const enriched = await AIEnrichmentService.enrichContactByLinkedIn(
        'https://linkedin.com/in/john-doe'
      );

      expect(enriched).not.toBeNull();
      if (enriched) {
        expect(enriched).toHaveProperty('confidence');
        expect(enriched).toHaveProperty('socialProfiles');
      }
    });

    it('should enrich contact by name', async () => {
      const enriched = await AIEnrichmentService.enrichContactByName('John', 'Doe', 'Tech Corp');

      expect(enriched).not.toBeNull();
      if (enriched) {
        expect(enriched.firstName).toBe('John');
        expect(enriched.lastName).toBe('Doe');
        expect(enriched).toHaveProperty('confidence');
      }
    });
  });

  describe('AI Insights Generation', () => {
    it('should generate insights from contacts', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const mockContacts = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          title: 'CEO',
          company: 'Acme Corp',
          aiScore: 85,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const insights = await result.current.generateInsights(mockContacts);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      if (insights.length > 0) {
        expect(insights[0]).toHaveProperty('type');
        expect(insights[0]).toHaveProperty('title');
        expect(insights[0]).toHaveProperty('confidence');
        expect(insights[0]).toHaveProperty('actionable');
      }
    });
  });

  describe('AI Analytics', () => {
    it('should analyze interaction history', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const analysis = await result.current.analyzeInteractionHistory('contact-1');

      expect(analysis).toHaveProperty('totalInteractions');
      expect(analysis).toHaveProperty('lastInteraction');
      expect(analysis).toHaveProperty('preferredChannel');
      expect(analysis).toHaveProperty('engagementTrend');
    });

    it('should predict next best action', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const action = await result.current.predictNextBestAction('contact-1');

      expect(typeof action).toBe('string');
      expect(action.length).toBeGreaterThan(0);
    });

    it('should analyze contact network', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const network = await result.current.analyzeContactNetwork('contact-1');

      expect(network).toHaveProperty('networkSize');
      expect(network).toHaveProperty('mutualConnections');
      expect(network).toHaveProperty('influenceScore');
    });

    it('should get social media insights', async () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      const insights = await result.current.getSocialMediaInsights('contact-1');

      expect(insights).toHaveProperty('totalPlatforms');
      expect(insights).toHaveProperty('activePlatforms');
      expect(insights).toHaveProperty('totalFollowers');
      expect(insights).toHaveProperty('engagementRate');
      expect(insights).toHaveProperty('topPlatform');
    });
  });
});
