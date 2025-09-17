import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAI } from '../contexts/AIContext';
import { useContactStore } from '../store/contactStore';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, ArrowRight, Brain, Sparkles, Loader2, Zap } from 'lucide-react';
import Avatar from './ui/Avatar';
import { getInitials } from '../utils/avatars';
import { Contact } from '../types';
import { DealDetailsModal } from './ui/DealDetailsModal';
import { DealsManagementModal } from './ui/DealsManagementModal';
import { AIInsightsDashboardModal } from './ui/AIInsightsDashboardModal';

const RecentActivity: React.FC = () => {
  const { isDark } = useTheme();
  const { generateInsights, predictDealSuccess, isProcessing } = useAI();
  const { contacts } = useContactStore();
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [dealPredictions, setDealPredictions] = useState<Record<string, number>>({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Modal states
  const [showDealDetailsModal, setShowDealDetailsModal] = useState(false);
  const [showDealsManagementModal, setShowDealsManagementModal] = useState(false);
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<number | undefined>();

  const handleViewAllDeals = () => {
    setShowDealsManagementModal(true);
  };

  const handleDealClick = (dealId: number) => {
    setSelectedDealId(dealId);
    setShowDealDetailsModal(true);
  };

  const handleViewAllInsights = () => {
    setShowAIInsightsModal(true);
  };
  
  // Load AI-driven insights and alerts
  useEffect(() => {
    loadAIInsights();
  }, [contacts]);

  const loadAIInsights = async () => {
    const contactsArray = Object.values(contacts);
    if (contactsArray.length === 0) return;

    setIsLoadingAI(true);
    try {
      // Generate AI insights for risk and opportunity detection
      const insights = await generateInsights(contactsArray);
      setAiAlerts(insights);
      
      // Generate deal predictions for upcoming deals
      const predictions: Record<string, number> = {};
      for (const deal of upcomingDeals) {
        const contactId = deal.contactId;
        const dealValue = parseInt(deal.value.replace(/[$,]/g, ''));
        const prediction = await predictDealSuccess(contactId, dealValue);
        predictions[deal.id.toString()] = prediction;
      }
      setDealPredictions(predictions);
      
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Updated upcomingDeals with contactId instead of direct avatar
  const upcomingDeals = [
    {
      id: 1,
      company: 'TechCorp Solutions',
      value: '$85,000',
      probability: '85%',
      dueDate: 'Tomorrow',
      contactId: '1', // Changed from contact+avatar to contactId
      status: 'online'
    },
    {
      id: 2,
      company: 'Innovation Labs',
      value: '$120,000',
      probability: '60%',
      dueDate: 'Friday',
      contactId: '2',
      status: 'offline'
    },
    {
      id: 3,
      company: 'Global Dynamics',
      value: '$95,500',
      probability: '75%',
      dueDate: 'Next Week',
      contactId: '3',
      status: 'online'
    }
  ];

  // Combine regular activities with AI-generated alerts
  const baseActivities = [
    {
      type: 'deal',
      icon: TrendingUp,
      title: 'Deal moved to negotiation',
      description: 'TechCorp Solutions - $85,000',
      time: '2 hours ago',
      color: 'text-blue-600'
    },
    {
      type: 'task',
      icon: CheckCircle,
      title: 'Task completed',
      description: 'Follow-up call with Innovation Labs',
      time: '4 hours ago',
      color: 'text-green-600'
    },
    {
      type: 'meeting',
      icon: Calendar,
      title: 'Meeting scheduled',
      description: 'Product demo with Global Dynamics',
      time: '6 hours ago',
      color: 'text-purple-600'
    }
  ];

  // Merge AI alerts with regular activities
  const recentActivities = [
    ...aiAlerts.slice(0, 2).map(alert => ({
      type: 'ai-alert',
      icon: alert.type === 'risk' ? AlertCircle : alert.type === 'opportunity' ? TrendingUp : Brain,
      title: `AI Alert: ${alert.title}`,
      description: alert.description,
      time: 'AI Generated',
      color: alert.type === 'risk' ? 'text-red-600' : 
             alert.type === 'opportunity' ? 'text-green-600' : 
             'text-purple-600'
    })),
    ...baseActivities
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Upcoming Deals Section */}
      <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
            Upcoming Deals
            {isLoadingAI && <Loader2 className="w-4 h-4 ml-2 animate-spin text-purple-500" />}
          </h3>
          <button 
            className={`flex items-center space-x-1 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
            onClick={() => console.log('Navigate to deals')}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="space-y-4">
          {upcomingDeals.map((deal) => {
            // Get contact data using contactId
            const contact = contacts[deal.contactId];
            
            return (
              <div 
                key={deal.id} 
                className={`flex items-center justify-between p-4 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50/80 hover:bg-gray-100/80'} rounded-xl transition-colors cursor-pointer`}
                onClick={() => console.log(`Navigate to deal ${deal.id}`)}
              >
                <div className="flex items-center space-x-3">
                  {contact && (
                    <Avatar
                      src={contact.avatarSrc || contact.avatar}
                      alt={contact.name}
                      size="sm"
                      status={deal.status as 'online' | 'offline' | 'away'}
                    />
                  )}
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{deal.company}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact ? contact.name : 'Unknown Contact'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{deal.value}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{deal.probability} • {deal.dueDate}</p>
                  {/* AI Deal Success Prediction */}
                  {dealPredictions[deal.id.toString()] && (
                    <div className="mt-1 flex items-center space-x-1">
                      <Brain className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-purple-600 font-medium">
                        AI: {dealPredictions[deal.id.toString()]}% success
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
            Recent Activity
            {aiAlerts.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                {aiAlerts.length} AI
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>24 completed</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>•</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>8 pending</span>
            {isLoadingAI && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
          </div>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const Icon = activity.icon;
            const isAIAlert = activity.type === 'ai-alert';
            return (
              <div 
                key={index} 
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/80'
                } ${isAIAlert ? 'bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-200/50' : ''}`}
              >
                <div className={`p-2 rounded-lg ${activity.color} ${isDark ? 'bg-opacity-10' : 'bg-opacity-10'} ${isAIAlert ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : ''}`}>
                  <Icon className={`w-4 h-4 ${isDark ? activity.color : activity.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{activity.title}</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{activity.description}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{activity.time}</p>
                  {isAIAlert && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Zap className="w-3 h-3 text-purple-600" />
                      <span className="text-xs text-purple-700 font-medium">AI-Generated Alert</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights Summary */}
        {aiAlerts.length > 2 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  {aiAlerts.length - 2} more AI insights available
                </span>
              </div>
              <button className="text-xs text-purple-600 hover:text-purple-800 underline">
                View All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DealDetailsModal
        isOpen={showDealDetailsModal}
        onClose={() => setShowDealDetailsModal(false)}
        dealId={selectedDealId}
      />

      <DealsManagementModal
        isOpen={showDealsManagementModal}
        onClose={() => setShowDealsManagementModal(false)}
        onDealClick={handleDealClick}
        onNewDeal={() => {
          setShowDealsManagementModal(false);
          // Could open a new deal modal here
          alert('New Deal Modal would open here');
        }}
      />

      <AIInsightsDashboardModal
        isOpen={showAIInsightsModal}
        onClose={() => setShowAIInsightsModal(false)}
      />
    </div>
  );
};

export default RecentActivity;