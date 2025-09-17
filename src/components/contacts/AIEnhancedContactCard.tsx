import React, { useState, useEffect } from 'react';
import { Contact } from '../../types';
import { useAI } from '../../contexts/AIContext';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  Linkedin, 
  Twitter, 
  Globe,
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  Zap
} from 'lucide-react';

interface AIEnhancedContactCardProps {
  contact: Contact;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  onAnalyze?: (contact: Contact) => Promise<boolean>;
  isAnalyzing?: boolean;
}

export const AIEnhancedContactCard: React.FC<AIEnhancedContactCardProps> = ({
  contact,
  isSelected = false,
  onSelect,
  onClick,
  onAnalyze,
  isAnalyzing = false
}) => {
  const { scoreContact, analyzeInteractionHistory, predictNextBestAction } = useAI();
  const [aiInsights, setAiInsights] = useState<{
    score?: number;
    nextAction?: string;
    interactionData?: any;
  }>({});
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Load AI insights when contact changes
  useEffect(() => {
    const loadAIInsights = async () => {
      if (!contact.aiScore) {
        setIsLoadingInsights(true);
        try {
          const [score, nextAction, interactionData] = await Promise.all([
            scoreContact(contact),
            predictNextBestAction(contact.id),
            analyzeInteractionHistory(contact.id)
          ]);

          setAiInsights({
            score,
            nextAction,
            interactionData
          });
        } catch (error) {
          console.error('Failed to load AI insights:', error);
        } finally {
          setIsLoadingInsights(false);
        }
      } else {
        setAiInsights({ score: contact.aiScore });
      }
    };

    loadAIInsights();
  }, [contact, scoreContact, predictNextBestAction, analyzeInteractionHistory]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getInterestLevelLabel = (level: string) => {
    switch (level) {
      case 'hot': return 'Hot Lead';
      case 'medium': return 'Warm Lead';
      case 'low': return 'Cold Lead';
      default: return 'Unknown';
    }
  };

  const handleAnalyzeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAnalyze) {
      const success = await onAnalyze(contact);
      if (success) {
        // Refresh insights after analysis
        const newScore = await scoreContact(contact);
        setAiInsights(prev => ({ ...prev, score: newScore }));
      }
    }
  };

  const displayScore = aiInsights.score || contact.aiScore || 0;

  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 cursor-pointer
        hover:shadow-lg hover:-translate-y-1 group
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-100 hover:border-blue-200'}
        ${isAnalyzing ? 'animate-pulse' : ''}
      `}
      onClick={onClick}
    >
      {/* Header with Avatar and Score */}
      <div className="relative p-4 pb-2">
        <div className="absolute top-3 right-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={contact.avatarSrc || contact.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'}
              alt={contact.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getInterestLevelColor(contact.interestLevel)} border-2 border-white`} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
            <p className="text-xs text-gray-500 truncate">{contact.title}</p>
            <p className="text-xs text-gray-600 font-medium truncate">{contact.company}</p>
          </div>

          {/* AI Score Badge */}
          {(displayScore > 0 || isLoadingInsights) && (
            <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${getScoreColor(displayScore)}`}>
              {isLoadingInsights ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Brain className="w-3 h-3" />
                  <span>{displayScore}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-4 pb-2">
        <div className="space-y-1">
          {contact.email && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Phone className="w-3 h-3" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}
        </div>

        {/* Interest Level and Status */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getInterestLevelColor(contact.interestLevel)}`}>
              {getInterestLevelLabel(contact.interestLevel)}
            </span>
            {contact.status && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {contact.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      {(aiInsights.nextAction || aiInsights.interactionData) && (
        <div className="px-4 pb-2">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">AI Insights</span>
            </div>
            
            {aiInsights.nextAction && (
              <div className="text-xs text-purple-800 mb-1">
                <span className="font-medium">Next Action:</span> {aiInsights.nextAction}
              </div>
            )}
            
            {aiInsights.interactionData && (
              <div className="flex justify-between text-xs text-purple-700">
                <span>Interactions: {aiInsights.interactionData.totalInteractions}</span>
                <span>Trend: {aiInsights.interactionData.engagementTrend}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Links */}
      {contact.socialProfiles && Object.keys(contact.socialProfiles).length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex space-x-2">
            {contact.socialProfiles.linkedin && (
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Linkedin className="w-3 h-3 text-white" />
              </div>
            )}
            {contact.socialProfiles.twitter && (
              <div className="w-6 h-6 bg-blue-400 rounded flex items-center justify-center">
                <Twitter className="w-3 h-3 text-white" />
              </div>
            )}
            {contact.socialProfiles.website && (
              <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                <Globe className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {contact.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{contact.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-gray-50 flex justify-between items-center">
        {displayScore === 0 && onAnalyze && (
          <button
            onClick={handleAnalyzeClick}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Score'}</span>
          </button>
        )}

        <div className="flex items-center space-x-2">
          {contact.isFavorite && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
          
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{new Date(contact.updatedAt).toLocaleDateString()}</span>
          </div>
          
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </div>
  );
};