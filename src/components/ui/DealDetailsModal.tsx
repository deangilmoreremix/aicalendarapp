import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { useContactStore } from '../../store/contactStore';
import { useAI } from '../../contexts/AIContext';
import { Contact } from '../../types';
import {
  X,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Loader2,
  Edit,
  Archive,
  Trash2,
  Mail,
  FileText
} from 'lucide-react';

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: number;
  onDealUpdated?: (deal: any) => void;
}

interface Deal {
  id: number;
  company: string;
  value: string;
  probability: string;
  dueDate: string;
  contactId: string;
  status: 'online' | 'offline';
  description?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high';
  aiPrediction?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  activities: DealActivity[];
}

interface DealActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description: string;
  date: string;
  user: string;
}

export const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  isOpen,
  onClose,
  dealId,
  onDealUpdated
}) => {
  const { contacts } = useContactStore();
  const { predictDealSuccess, isProcessing } = useAI();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<number | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Mock deal data - in a real app, this would come from an API
  const mockDeals: Record<number, Deal> = {
    1: {
      id: 1,
      company: 'TechCorp Solutions',
      value: '$85,000',
      probability: '85%',
      dueDate: 'Tomorrow',
      contactId: '1',
      status: 'online',
      description: 'Enterprise software implementation project for TechCorp Solutions. This is a high-value deal involving custom development and integration services.',
      stage: 'negotiation',
      priority: 'high',
      aiPrediction: 87,
      createdAt: '2024-01-15',
      updatedAt: '2024-12-20',
      notes: 'Client is very interested in our AI capabilities. Key decision maker is the CTO. Follow up on technical requirements.',
      activities: [
        {
          id: '1',
          type: 'meeting',
          title: 'Product Demo',
          description: 'Demonstrated AI capabilities and integration options',
          date: '2024-12-18',
          user: 'John Doe'
        },
        {
          id: '2',
          type: 'email',
          title: 'Proposal Sent',
          description: 'Sent detailed technical proposal and pricing',
          date: '2024-12-16',
          user: 'Jane Smith'
        },
        {
          id: '3',
          type: 'call',
          title: 'Follow-up Call',
          description: 'Discussed implementation timeline and next steps',
          date: '2024-12-14',
          user: 'John Doe'
        }
      ]
    },
    2: {
      id: 2,
      company: 'Innovation Labs',
      value: '$120,000',
      probability: '60%',
      dueDate: 'Friday',
      contactId: '2',
      status: 'offline',
      description: 'AI-powered analytics platform implementation for Innovation Labs. Focus on data integration and custom reporting features.',
      stage: 'proposal',
      priority: 'medium',
      aiPrediction: 72,
      createdAt: '2024-02-10',
      updatedAt: '2024-12-18',
      notes: 'Client needs extensive customization. Budget approval pending from CFO.',
      activities: [
        {
          id: '1',
          type: 'meeting',
          title: 'Requirements Gathering',
          description: 'Detailed discussion of analytics requirements',
          date: '2024-12-15',
          user: 'Jane Smith'
        },
        {
          id: '2',
          type: 'task',
          title: 'Custom Proposal',
          description: 'Prepared customized proposal with specific features',
          date: '2024-12-12',
          user: 'Mike Johnson'
        }
      ]
    },
    3: {
      id: 3,
      company: 'Global Dynamics',
      value: '$95,500',
      probability: '75%',
      dueDate: 'Next Week',
      contactId: '3',
      status: 'online',
      description: 'Cloud migration and modernization project for Global Dynamics. Includes legacy system migration and new feature development.',
      stage: 'qualification',
      priority: 'high',
      aiPrediction: 81,
      createdAt: '2024-03-05',
      updatedAt: '2024-12-19',
      notes: 'Strong technical fit. Client has urgent timeline requirements.',
      activities: [
        {
          id: '1',
          type: 'call',
          title: 'Initial Consultation',
          description: 'Discussed migration requirements and timeline',
          date: '2024-12-19',
          user: 'John Doe'
        },
        {
          id: '2',
          type: 'email',
          title: 'Technical Assessment',
          description: 'Sent detailed technical assessment report',
          date: '2024-12-17',
          user: 'Mike Johnson'
        }
      ]
    }
  };

  // Load deal data when modal opens
  useEffect(() => {
    if (isOpen && dealId) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const dealData = mockDeals[dealId];
        setDeal(dealData || null);
        setAiPrediction(dealData?.aiPrediction || null);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, dealId]);

  const handleAIPrediction = async () => {
    if (!deal) return;

    setIsLoadingAI(true);
    try {
      const dealValue = parseInt(deal.value.replace(/[$,]/g, ''));
      const prediction = await predictDealSuccess(deal.contactId, dealValue);
      setAiPrediction(prediction);
    } catch (error) {
      console.error('AI prediction failed:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-gray-100 text-gray-800';
      case 'qualification': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <User className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  const contact = deal ? contacts[deal.contactId] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <DialogTitle>Deal Details</DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading deal details...</span>
          </div>
        ) : deal ? (
          <div className="space-y-6">
            {/* Deal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{deal.company}</h2>
                    <Badge className={getStageColor(deal.stage)}>
                      {deal.stage.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-lg text-green-600">{deal.value}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{deal.probability} probability</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due {deal.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* AI Prediction */}
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">AI Prediction</span>
                  </div>
                  {aiPrediction !== null ? (
                    <div className="text-2xl font-bold text-purple-600">
                      {aiPrediction}%
                    </div>
                  ) : (
                    <Button
                      onClick={handleAIPrediction}
                      disabled={isLoadingAI}
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-200"
                    >
                      {isLoadingAI ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Get Prediction'
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Deal Progress</span>
                  <span>{deal.probability}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${deal.probability}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {contact && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Contact Information
                </h3>
                <div className="flex items-center space-x-3">
                  <img
                    src={contact.avatarSrc || contact.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{contact.name}</h4>
                    <p className="text-sm text-gray-600">{contact.title} at {contact.company}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Deal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Deal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <AlertTriangle className={`w-4 h-4 ${getPriorityColor(deal.priority)}`} />
                      <span className="text-sm capitalize">{deal.priority}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-600 mt-1">{new Date(deal.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-sm text-gray-600 mt-1">{new Date(deal.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-600">{deal.description}</p>

                {deal.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                      {deal.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recent Activities</h3>
              <div className="space-y-3">
                {deal.activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg border">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.date}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{activity.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Deal</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Deal Not Found</h3>
            <p className="text-gray-600">The requested deal could not be found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};