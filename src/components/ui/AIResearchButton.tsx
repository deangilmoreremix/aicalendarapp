import React, { useState } from 'react';
import { Brain, Loader2, Search, Linkedin, Globe } from 'lucide-react';
import { AIEnrichmentService, ContactEnrichmentData } from '../../services/aiEnrichmentService.ts';

interface AIResearchButtonProps {
  searchType: 'email' | 'linkedin' | 'auto';
  searchQuery: {
    email?: string;
    linkedinUrl?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };
  onDataFound: (data: ContactEnrichmentData) => void;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AIResearchButton: React.FC<AIResearchButtonProps> = ({
  searchType,
  searchQuery,
  onDataFound,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleResearch = async () => {
    if (!canResearch()) return;

    setIsResearching(true);
    setProgress(0);

    try {
      // Simulate research progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      let enrichmentData: ContactEnrichmentData | null = null;

      switch (searchType) {
        case 'email':
          if (searchQuery.email) {
            enrichmentData = await AIEnrichmentService.enrichContactByEmail(searchQuery.email);
          }
          break;
        case 'linkedin':
          if (searchQuery.linkedinUrl) {
            enrichmentData = await AIEnrichmentService.enrichContactByLinkedIn(searchQuery.linkedinUrl);
          }
          break;
        case 'auto':
          if (searchQuery.email) {
            enrichmentData = await AIEnrichmentService.enrichContactByEmail(searchQuery.email);
          } else if (searchQuery.linkedinUrl) {
            enrichmentData = await AIEnrichmentService.enrichContactByLinkedIn(searchQuery.linkedinUrl);
          } else if (searchQuery.firstName && searchQuery.lastName) {
            enrichmentData = await AIEnrichmentService.enrichContactByName(
              searchQuery.firstName,
              searchQuery.lastName,
              searchQuery.company
            );
          }
          break;
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (enrichmentData) {
        onDataFound(enrichmentData);
      }
    } catch (error) {
      console.error('AI research failed:', error);
    } finally {
      setTimeout(() => {
        setIsResearching(false);
        setProgress(0);
      }, 500);
    }
  };

  const canResearch = (): boolean => {
    switch (searchType) {
      case 'email': return !!searchQuery.email;
      case 'linkedin': return !!searchQuery.linkedinUrl;
      case 'auto': return !!(searchQuery.email || searchQuery.linkedinUrl || 
                            (searchQuery.firstName && searchQuery.lastName));
      default: return false;
    }
  };

  const getIcon = () => {
    switch (searchType) {
      case 'email': return <Search className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (searchType) {
      case 'email': return 'Research Email';
      case 'linkedin': return 'LinkedIn Research';
      default: return 'AI Research';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-xs';
      case 'lg': return 'px-6 py-3 text-base';
      default: return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700';
    }
  };

  if (!canResearch()) {
    return null;
  }

  return (
    <button
      onClick={handleResearch}
      disabled={isResearching}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
        flex items-center space-x-2 font-medium rounded-xl transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md transform hover:scale-105
        relative overflow-hidden
      `}
    >
      {isResearching && (
        <div 
          className="absolute inset-0 bg-white bg-opacity-20 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
      
      <div className="relative z-10 flex items-center space-x-2">
        {isResearching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Researching... {progress}%</span>
          </>
        ) : (
          <>
            {getIcon()}
            <span>{getLabel()}</span>
          </>
        )}
      </div>
    </button>
  );
};