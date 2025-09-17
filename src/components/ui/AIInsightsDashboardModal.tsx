import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { useAI } from '../../contexts/AIContext';
import { useContactStore } from '../../store/contactStore';
import {
  X,
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Users,
  BarChart3,
  Calendar,
  DollarSign,
  RefreshCw,
  Loader2,
  Sparkles,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface AIInsightsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIInsight {
  id: string;
  type: 'engagement' | 'conversion' | 'risk' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  createdAt: Date;
  category: 'contacts' | 'deals' | 'tasks' | 'general';
  impact: 'high' | 'medium' | 'low';
}

export const AIInsightsDashboardModal: React.FC<AIInsightsDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const { generateInsights, isProcessing } = useAI();
  const { contacts } = useContactStore();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'contacts' | 'deals' | 'tasks' | 'general'>('all');
  const [selectedImpact, setSelectedImpact] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Load AI insights when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInsights();
    }
  }, [isOpen]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      // Generate insights from contacts
      const contactInsights = await generateInsights(Object.values(contacts));

      // Mock additional insights for deals, tasks, and general
      const mockInsights: AIInsight[] = [
        ...contactInsights.map(insight => ({
          ...insight,
          category: 'contacts' as const,
          impact: (insight.confidence > 80 ? 'high' : insight.confidence > 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          createdAt: new Date()
        })),

        // Deal insights
        {
          id: 'deal-1',
          type: 'opportunity',
          title: 'High-Value Deal Opportunity',
          description: 'TechCorp Solutions shows 87% likelihood of closing within 2 weeks',
          confidence: 87,
          actionable: true,
          suggestedActions: ['Schedule final demo', 'Prepare contract', 'Follow up on technical requirements'],
          createdAt: new Date(),
          category: 'deals',
          impact: 'high'
        },
        {
          id: 'deal-2',
          type: 'risk',
          title: 'Deal at Risk',
          description: 'Innovation Labs deal probability dropped to 45%',
          confidence: 78,
          actionable: true,
          suggestedActions: ['Re-engage decision maker', 'Address outstanding concerns', 'Offer additional value'],
          createdAt: new Date(),
          category: 'deals',
          impact: 'high'
        },

        // Task insights
        {
          id: 'task-1',
          type: 'engagement',
          title: 'Task Completion Pattern',
          description: 'Team shows 40% higher productivity on Wednesday mornings',
          confidence: 82,
          actionable: true,
          suggestedActions: ['Schedule important tasks for Wednesday AM', 'Optimize meeting times'],
          createdAt: new Date(),
          category: 'tasks',
          impact: 'medium'
        },

        // General insights
        {
          id: 'general-1',
          type: 'conversion',
          title: 'Lead Conversion Trend',
          description: 'Conversion rate improved by 15% this month',
          confidence: 91,
          actionable: false,
          suggestedActions: ['Continue current strategy', 'Analyze successful patterns'],
          createdAt: new Date(),
          category: 'general',
          impact: 'medium'
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInsights = insights.filter(insight => {
    const matchesCategory = selectedCategory === 'all' || insight.category === selectedCategory;
    const matchesImpact = selectedImpact === 'all' || insight.impact === selectedImpact;
    return matchesCategory && matchesImpact;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-100 text-green-800';
      case 'risk': return 'bg-red-100 text-red-800';
      case 'engagement': return 'bg-blue-100 text-blue-800';
      case 'conversion': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contacts': return <Users className="w-4 h-4" />;
      case 'deals': return <DollarSign className="w-4 h-4" />;
      case 'tasks': return <CheckCircle className="w-4 h-4" />;
      case 'general': return <BarChart3 className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'engagement': return <Target className="w-4 h-4" />;
      case 'conversion': return <BarChart3 className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightsByType = () => {
    const byType = {
      opportunity: insights.filter(i => i.type === 'opportunity').length,
      risk: insights.filter(i => i.type === 'risk').length,
      engagement: insights.filter(i => i.type === 'engagement').length,
      conversion: insights.filter(i => i.type === 'conversion').length
    };
    return byType;
  };

  const getInsightsByCategory = () => {
    const byCategory = {
      contacts: insights.filter(i => i.category === 'contacts').length,
      deals: insights.filter(i => i.category === 'deals').length,
      tasks: insights.filter(i => i.category === 'tasks').length,
      general: insights.filter(i => i.category === 'general').length
    };
    return byCategory;
  };

  const insightsByType = getInsightsByType();
  const insightsByCategory = getInsightsByCategory();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <DialogTitle>AI Insights Dashboard</DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Total Insights</p>
                  <p className="text-2xl font-bold text-purple-900">{insights.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Opportunities</p>
                  <p className="text-2xl font-bold text-green-900">{insightsByType.opportunity}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Risks Identified</p>
                  <p className="text-2xl font-bold text-red-900">{insightsByType.risk}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Actionable Items</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {insights.filter(i => i.actionable).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="contacts">Contacts</option>
                <option value="deals">Deals</option>
                <option value="tasks">Tasks</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="flex-1">
              <select
                value={selectedImpact}
                onChange={(e) => setSelectedImpact(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Impact Levels</option>
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
            </div>

            <Button
              onClick={loadInsights}
              disabled={isLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Refresh</span>
            </Button>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(insightsByCategory).map(([category, count]) => (
              <div key={category} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(category)}
                  <span className="text-sm font-medium capitalize">{category}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-2 text-gray-600">Loading AI insights...</span>
              </div>
            ) : filteredInsights.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No insights found</h3>
                <p className="text-gray-600">Try adjusting your filters or refresh to load new insights.</p>
              </div>
            ) : (
              filteredInsights.map(insight => (
                <div
                  key={insight.id}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getTypeColor(insight.type)}`}>
                      {getTypeIcon(insight.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                        <Badge className={getTypeColor(insight.type)}>
                          {insight.type}
                        </Badge>
                        <Badge className={`bg-gray-100 text-gray-800`}>
                          {insight.category}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className={`w-4 h-4 ${getImpactColor(insight.impact)}`} />
                          <span className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
                            {insight.impact} impact
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{insight.description}</p>

                      {/* Confidence Score */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Confidence</span>
                          <span>{insight.confidence}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                      </div>

                      {/* Suggested Actions */}
                      {insight.actionable && insight.suggestedActions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                            Suggested Actions
                          </h4>
                          <ul className="space-y-1">
                            {insight.suggestedActions.map((action, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-2 text-green-500 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-4 flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {insight.createdAt.toLocaleDateString()} at {insight.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};