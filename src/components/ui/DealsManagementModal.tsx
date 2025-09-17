import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useContactStore } from '../../store/contactStore';
import { useAI } from '../../contexts/AIContext';
import { Contact } from '../../types';
import {
  X,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Brain,
  Loader2,
  Plus,
  Download,
  Upload,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface DealsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealClick?: (dealId: number) => void;
  onNewDeal?: () => void;
}

interface Deal {
  id: number;
  company: string;
  value: string;
  probability: string;
  dueDate: string;
  contactId: string;
  status: 'online' | 'offline';
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high';
  aiPrediction?: number;
  createdAt: string;
  updatedAt: string;
}

export const DealsManagementModal: React.FC<DealsManagementModalProps> = ({
  isOpen,
  onClose,
  onDealClick,
  onNewDeal
}) => {
  const { contacts } = useContactStore();
  const { predictDealSuccess, isProcessing } = useAI();

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'probability' | 'dueDate' | 'company'>('probability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiPredictions, setAiPredictions] = useState<Record<number, number>>({});

  // Mock deals data - in a real app, this would come from an API
  const mockDeals: Deal[] = [
    {
      id: 1,
      company: 'TechCorp Solutions',
      value: '$85,000',
      probability: '85%',
      dueDate: 'Tomorrow',
      contactId: '1',
      status: 'online',
      stage: 'negotiation',
      priority: 'high',
      aiPrediction: 87,
      createdAt: '2024-01-15',
      updatedAt: '2024-12-20'
    },
    {
      id: 2,
      company: 'Innovation Labs',
      value: '$120,000',
      probability: '60%',
      dueDate: 'Friday',
      contactId: '2',
      status: 'offline',
      stage: 'proposal',
      priority: 'medium',
      aiPrediction: 72,
      createdAt: '2024-02-10',
      updatedAt: '2024-12-18'
    },
    {
      id: 3,
      company: 'Global Dynamics',
      value: '$95,500',
      probability: '75%',
      dueDate: 'Next Week',
      contactId: '3',
      status: 'online',
      stage: 'qualification',
      priority: 'high',
      aiPrediction: 81,
      createdAt: '2024-03-05',
      updatedAt: '2024-12-19'
    },
    {
      id: 4,
      company: 'StartupXYZ',
      value: '$45,000',
      probability: '30%',
      dueDate: 'Next Month',
      contactId: '4',
      status: 'online',
      stage: 'prospecting',
      priority: 'low',
      aiPrediction: 35,
      createdAt: '2024-04-12',
      updatedAt: '2024-12-15'
    },
    {
      id: 5,
      company: 'Enterprise Corp',
      value: '$250,000',
      probability: '90%',
      dueDate: 'This Week',
      contactId: '5',
      status: 'online',
      stage: 'negotiation',
      priority: 'high',
      aiPrediction: 94,
      createdAt: '2024-05-20',
      updatedAt: '2024-12-22'
    }
  ];

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let filtered = mockDeals.filter(deal => {
      const contact = contacts[deal.contactId];
      const matchesSearch = deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (contact && contact.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
      const matchesPriority = priorityFilter === 'all' || deal.priority === priorityFilter;

      return matchesSearch && matchesStage && matchesPriority;
    });

    // Sort deals
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'value':
          aValue = parseInt(a.value.replace(/[$,]/g, ''));
          bValue = parseInt(b.value.replace(/[$,]/g, ''));
          break;
        case 'probability':
          aValue = parseInt(a.probability);
          bValue = parseInt(b.probability);
          break;
        case 'dueDate':
          const dateOrder = { 'Tomorrow': 1, 'This Week': 2, 'Next Week': 3, 'Next Month': 4 };
          aValue = dateOrder[a.dueDate as keyof typeof dateOrder] || 5;
          bValue = dateOrder[b.dueDate as keyof typeof dateOrder] || 5;
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [mockDeals, searchTerm, stageFilter, priorityFilter, sortBy, sortOrder, contacts]);

  const handleAIPredictions = async () => {
    setIsLoadingAI(true);
    try {
      const predictions: Record<number, number> = {};

      for (const deal of filteredDeals) {
        if (!deal.aiPrediction) {
          const dealValue = parseInt(deal.value.replace(/[$,]/g, ''));
          const prediction = await predictDealSuccess(deal.contactId, dealValue);
          predictions[deal.id] = prediction;
        }
      }

      setAiPredictions(prev => ({ ...prev, ...predictions }));
    } catch (error) {
      console.error('AI predictions failed:', error);
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

  const getTotalValue = () => {
    return filteredDeals.reduce((total, deal) => {
      return total + parseInt(deal.value.replace(/[$,]/g, ''));
    }, 0);
  };

  const getAverageProbability = () => {
    if (filteredDeals.length === 0) return 0;
    const total = filteredDeals.reduce((sum, deal) => {
      return sum + parseInt(deal.probability);
    }, 0);
    return Math.round(total / filteredDeals.length);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <DialogTitle>Deals Management</DialogTitle>
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
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Deals</p>
                  <p className="text-2xl font-bold text-blue-900">{filteredDeals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-900">${getTotalValue().toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Avg Probability</p>
                  <p className="text-2xl font-bold text-purple-900">{getAverageProbability()}%</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">Due This Week</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {filteredDeals.filter(d => d.dueDate === 'This Week' || d.dueDate === 'Tomorrow').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search deals by company or contact..."
                className="pl-10"
              />
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="prospecting">Prospecting</SelectItem>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed-won">Closed Won</SelectItem>
                <SelectItem value="closed-lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="probability-desc">Highest Probability</SelectItem>
                <SelectItem value="probability-asc">Lowest Probability</SelectItem>
                <SelectItem value="value-desc">Highest Value</SelectItem>
                <SelectItem value="value-asc">Lowest Value</SelectItem>
                <SelectItem value="dueDate-asc">Due Date (Soonest)</SelectItem>
                <SelectItem value="company-asc">Company A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Predictions Button */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handleAIPredictions}
              disabled={isLoadingAI}
              variant="outline"
              className="flex items-center space-x-2 bg-purple-50 text-purple-700 border-purple-200"
            >
              {isLoadingAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>Get AI Predictions</span>
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button onClick={onNewDeal} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Deal</span>
              </Button>
            </div>
          </div>

          {/* Deals Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Value</div>
                <div className="col-span-1">Probability</div>
                <div className="col-span-2">Stage</div>
                <div className="col-span-1">AI Prediction</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            <div className="divide-y">
              {filteredDeals.map(deal => {
                const contact = contacts[deal.contactId];
                const aiPrediction = aiPredictions[deal.id] || deal.aiPrediction;

                return (
                  <div
                    key={deal.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onDealClick?.(deal.id)}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-900">{deal.company}</div>
                          <AlertTriangle className={`w-4 h-4 ${getPriorityColor(deal.priority)}`} />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          {contact && (
                            <img
                              src={contact.avatarSrc || contact.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'}
                              alt={contact.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="text-sm text-gray-600">
                            {contact ? contact.name : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="font-semibold text-green-600">{deal.value}</span>
                      </div>

                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{deal.probability}</span>
                          <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: deal.probability }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="col-span-1">
                        {aiPrediction ? (
                          <div className="flex items-center space-x-1">
                            <Brain className="w-3 h-3 text-purple-600" />
                            <span className="text-sm font-medium text-purple-600">
                              {aiPrediction}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not analyzed</span>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDeals.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || stageFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by creating your first deal'}
                </p>
                <Button onClick={onNewDeal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Deal
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};