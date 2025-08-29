import React, { useState, useEffect } from 'react';
import { GlassCard } from './ui/GlassCard';
import { AvatarWithStatus } from './ui/AvatarWithStatus';
import { ModernButton } from './ui/ModernButton';
import { useAI } from '../contexts/AIContext';
import { useContactStore } from '../store/contactStore';
import { 
  Edit, 
  Mail, 
  Phone, 
  Plus, 
  MessageSquare,
  FileText,
  Calendar,
  MoreHorizontal,
  User,
  Globe,
  Clock,
  Brain,
  Target,
  TrendingUp,
  Zap,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const socialPlatforms = [
  { icon: MessageSquare, color: 'bg-green-500', name: 'WhatsApp' },
  { icon: Globe, color: 'bg-blue-500', name: 'LinkedIn' },
  { icon: Mail, color: 'bg-blue-600', name: 'Email' },
  { icon: MessageSquare, color: 'bg-purple-500', name: 'Discord' },
];

export const CustomerProfile: React.FC = () => {
  const { predictNextBestAction, analyzeInteractionHistory, isProcessing } = useAI();
  const { contacts } = useContactStore();
  const [selectedContact, setSelectedContact] = useState(contacts[0] || null);
  const [nextBestAction, setNextBestAction] = useState<string | null>(null);
  const [interactionData, setInteractionData] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  // Load AI insights for the selected contact
  useEffect(() => {
    if (selectedContact) {
      loadAIInsights();
    }
  }, [selectedContact]);

  const loadAIInsights = async () => {
    if (!selectedContact) return;
    
    setIsLoadingInsights(true);
    try {
      const [nextAction, interactionHistory] = await Promise.all([
        predictNextBestAction(selectedContact.id),
        analyzeInteractionHistory(selectedContact.id)
      ]);
      
      setNextBestAction(nextAction);
      setInteractionData(interactionHistory);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const refreshInsights = async () => {
    await loadAIInsights();
  };

  if (!selectedContact) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No Contact Selected</h3>
          <p className="text-gray-400">Select a contact to view their profile</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          Customer Profile
          {selectedContact.aiScore && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
              <Brain className="w-3 h-3 mr-1" />
              {selectedContact.aiScore}
            </span>
          )}
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={refreshInsights}
            disabled={isLoadingInsights}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh AI Insights"
          >
            {isLoadingInsights ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="relative inline-block mb-4">
          <AvatarWithStatus
            src={selectedContact.avatarSrc || selectedContact.avatar || "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"}
            alt={selectedContact.name}
            size="xl"
            status="active"
          />
        </div>
        <h4 className="text-xl font-semibold text-gray-900 mb-1">{selectedContact.name}</h4>
        <p className="text-gray-600 text-sm">{selectedContact.title}, {selectedContact.company}</p>
        
        {/* AI Score Display */}
        {selectedContact.aiScore && (
          <div className="mt-3 flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedContact.aiScore}</div>
              <div className="text-xs text-gray-500">AI Score</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-green-600">
                {selectedContact.interestLevel?.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">Interest Level</div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Section */}
      {(nextBestAction || interactionData) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
          <h5 className="font-semibold text-purple-900 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights & Recommendations
          </h5>
          
          {nextBestAction && (
            <div className="mb-3 p-3 bg-white/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Next Best Action:</span>
              </div>
              <p className="text-sm text-green-800">{nextBestAction}</p>
            </div>
          )}
          
          {interactionData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{interactionData.totalInteractions}</div>
                <div className="text-xs text-blue-700">Total Interactions</div>
              </div>
              <div className="text-center p-2 bg-white/50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{interactionData.engagementTrend}</div>
                <div className="text-xs text-purple-700">Engagement Trend</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center space-x-3 mb-8">
        <ModernButton variant="outline" size="sm" className="p-2">
          <Edit className="w-4 h-4" />
        </ModernButton>
        <ModernButton variant="outline" size="sm" className="p-2">
          <Mail className="w-4 h-4" />
        </ModernButton>
        <ModernButton variant="outline" size="sm" className="p-2">
          <Phone className="w-4 h-4" />
        </ModernButton>
        <ModernButton variant="outline" size="sm" className="p-2">
          <Plus className="w-4 h-4" />
        </ModernButton>
        <ModernButton variant="outline" size="sm" className="p-2">
          <FileText className="w-4 h-4" />
        </ModernButton>
        <ModernButton variant="outline" size="sm" className="p-2">
          <Calendar className="w-4 h-4" />
        </ModernButton>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold text-gray-900">Detailed Information</h5>
            <div className="flex space-x-2">
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">First Name</p>
                  <p className="text-sm text-gray-600">Eva</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Name</p>
                  <p className="text-sm text-gray-600">Robinson</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{selectedContact.email}</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Number</p>
                  <p className="text-sm text-gray-600">{selectedContact.phone || 'Not provided'}</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Socials</p>
                  <div className="flex space-x-2 mt-2">
                    {socialPlatforms.map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <div 
                          key={index} 
                          className={`${social.color} p-1.5 rounded-lg text-white hover:opacity-80 transition-opacity cursor-pointer`}
                          title={social.name}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Connected</p>
                  <p className="text-sm text-gray-600">{selectedContact.updatedAt.toLocaleDateString()} at {selectedContact.updatedAt.toLocaleTimeString()}</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Contact Selector */}
        {contacts.length > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-3">Switch Contact</h5>
            <div className="flex space-x-2 overflow-x-auto">
              {contacts.slice(0, 5).map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                    selectedContact?.id === contact.id 
                      ? 'bg-blue-100 border-2 border-blue-500' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <AvatarWithStatus
                    src={contact.avatarSrc || contact.avatar || ""}
                    alt={contact.name}
                    size="sm"
                    status="active"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};