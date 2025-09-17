import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';
import { Contact } from '../../types';
import { UniversalAIAssistant, AIAssistantConfig } from './UniversalAIAssistant';
import { Target, Brain } from 'lucide-react';
import {
  X,
  DollarSign,
  Calendar,
  User,
  Building,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Tag
} from 'lucide-react';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated?: (deal: any) => void;
}

interface DealData {
  title: string;
  value: number;
  currency: string;
  contactId: string;
  company: string;
  description: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedCloseDate: string;
  probability: number;
  tags: string[];
  notes: string;
}

const dealStages = [
  { value: 'prospecting', label: 'Prospecting', color: 'bg-gray-100 text-gray-800' },
  { value: 'qualification', label: 'Qualification', color: 'bg-blue-100 text-blue-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' }
];

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export const NewDealModal: React.FC<NewDealModalProps> = ({
  isOpen,
  onClose,
  onDealCreated
}) => {
  const { contacts } = useContactStore();
  const { createTask } = useTaskStore();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DealData>({
    title: '',
    value: 0,
    currency: 'USD',
    contactId: '',
    company: '',
    description: '',
    stage: 'prospecting',
    priority: 'medium',
    expectedCloseDate: '',
    probability: 25,
    tags: [],
    notes: ''
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const dealAIConfig: AIAssistantConfig = {
    mode: 'deal',
    title: 'AI Deal Assistant',
    placeholder: 'Describe the deal you want to create...',
    examplePrompts: [
      'Enterprise software deal with TechCorp',
      'Consulting project for $50k',
      'New client onboarding package'
    ],
    icon: Target
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title || prev.title,
      value: suggestion.value || prev.value,
      description: suggestion.description || prev.description,
      priority: suggestion.priority || prev.priority,
      expectedCloseDate: suggestion.expectedCloseDate ?
        new Date(suggestion.expectedCloseDate).toISOString().split('T')[0] :
        prev.expectedCloseDate,
      tags: suggestion.tags || prev.tags,
      probability: suggestion.confidence || prev.probability
    }));
    setShowAIAssistant(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        value: 0,
        currency: 'USD',
        contactId: '',
        company: '',
        description: '',
        stage: 'prospecting',
        priority: 'medium',
        expectedCloseDate: '',
        probability: 25,
        tags: [],
        notes: ''
      });
      setErrors({});
      setNewTag('');
    }
  }, [isOpen]);

  // Auto-fill company when contact is selected
  useEffect(() => {
    if (formData.contactId && contacts[formData.contactId]) {
      const contact = contacts[formData.contactId];
      setFormData(prev => ({
        ...prev,
        company: contact.company || ''
      }));
    }
  }, [formData.contactId, contacts]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Deal title is required';
    }

    if (formData.value <= 0) {
      newErrors.value = 'Deal value must be greater than 0';
    }

    if (!formData.contactId) {
      newErrors.contactId = 'Please select a contact';
    }

    if (!formData.expectedCloseDate) {
      newErrors.expectedCloseDate = 'Expected close date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Create the deal object
      const deal = {
        id: `deal_${Date.now()}`,
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      // Create a follow-up task automatically
      if (formData.contactId) {
        const contact = contacts[formData.contactId];
        await createTask({
          title: `Follow up on ${formData.title}`,
          description: `Follow up on the ${formData.title} deal with ${contact?.name || 'contact'}`,
          dueDate: new Date(formData.expectedCloseDate),
          priority: formData.priority,
          type: 'follow-up',
          relatedTo: {
            type: 'contact',
            id: formData.contactId,
            name: contact?.name || 'Contact'
          }
        });
      }

      onDealCreated?.(deal);
      onClose();
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStageColor = (stage: string) => {
    return dealStages.find(s => s.value === stage)?.color || 'bg-gray-100 text-gray-800';
  };

  const contactsArray = Object.values(contacts);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold">Create New Deal</span>
            </div>
            <button
              onClick={() => setShowAIAssistant(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              <Brain size={16} />
              <span>AI Help</span>
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deal Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deal Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter deal title..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Value and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Value *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className={`pl-10 ${errors.value ? 'border-red-500' : ''}`}
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.value && (
                <p className="text-red-500 text-xs mt-1">{errors.value}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact *
            </label>
            <Select
              value={formData.contactId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value }))}
            >
              <SelectTrigger className={errors.contactId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a contact..." />
              </SelectTrigger>
              <SelectContent>
                {contactsArray.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{contact.name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{contact.company}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contactId && (
              <p className="text-red-500 text-xs mt-1">{errors.contactId}</p>
            )}
          </div>

          {/* Company (auto-filled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Company name..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Stage and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage
              </label>
              <Select
                value={formData.stage}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, stage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dealStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      <Badge className={stage.color}>
                        {stage.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge className="bg-green-100 text-green-800">Low</Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge className="bg-orange-100 text-orange-800">High</Badge>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expected Close Date and Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Close Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                  className={`pl-10 ${errors.expectedCloseDate ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.expectedCloseDate && (
                <p className="text-red-500 text-xs mt-1">{errors.expectedCloseDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Win Probability (%)
              </label>
              <Input
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the deal..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Creating...' : 'Create Deal'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* AI Deal Assistant */}
      <UniversalAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplySuggestion={handleApplyAISuggestion}
        currentData={formData}
        config={dealAIConfig}
      />
    </Dialog>
  );
};