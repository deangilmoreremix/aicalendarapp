import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { AIEnrichmentService, ContactEnrichmentData } from '../../services/aiEnrichmentService.ts';

interface AIAutoFillButtonProps {
  formData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    socialProfiles?: {
      linkedin?: string;
    };
  };
  onAutoFill: (data: ContactEnrichmentData) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline';
  className?: string;
}

export const AIAutoFillButton: React.FC<AIAutoFillButtonProps> = ({
  formData,
  onAutoFill,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [lastEnrichment, setLastEnrichment] = useState<Date | null>(null);

  const handleEnrichment = async () => {
    if (!canEnrich()) return;

    setIsEnriching(true);
    try {
      let enrichmentData: ContactEnrichmentData | null = null;

      // Try different enrichment methods in order of preference
      if (formData.email) {
        enrichmentData = await AIEnrichmentService.enrichContactByEmail(formData.email);
      } else if (formData.socialProfiles?.linkedin) {
        enrichmentData = await AIEnrichmentService.enrichContactByLinkedIn(formData.socialProfiles.linkedin);
      } else if (formData.firstName && formData.lastName) {
        enrichmentData = await AIEnrichmentService.enrichContactByName(
          formData.firstName,
          formData.lastName
        );
      }

      if (enrichmentData) {
        onAutoFill(enrichmentData);
        setLastEnrichment(new Date());
      }
    } catch (error) {
      console.error('Auto-fill failed:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const canEnrich = (): boolean => {
    return !!(formData.email || formData.socialProfiles?.linkedin || 
             (formData.firstName && formData.lastName));
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300';
      default:
        return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700';
    }
  };

  if (!canEnrich()) {
    return (
      <div className="text-xs text-gray-500 flex items-center space-x-1">
        <Sparkles className="w-3 h-3" />
        <span>Enter email or name for AI auto-fill</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnrichment}
      disabled={isEnriching}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
        flex items-center space-x-2 font-medium rounded-xl transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md transform hover:scale-105
      `}
    >
      {isEnriching ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>AI Processing...</span>
        </>
      ) : (
        <>
          <Wand2 className="w-4 h-4" />
          <span>AI Auto-Fill</span>
          <Sparkles className="w-3 h-3 text-yellow-300" />
        </>
      )}
    </button>
  );
};