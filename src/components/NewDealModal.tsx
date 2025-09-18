import React, { useState } from 'react';
import { ModernButton } from './ui/ModernButton';
import { AIAutoFillButton } from './ui/AIAutoFillButton';
import { AIResearchButton } from './ui/AIResearchButton';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { Deal, Contact } from '../types';
import {
  X,
  DollarSign,
  Building,
  Target,
  Tag,
  Calendar,
  TrendingUp,
  Save,
  User,
  AlertCircle,
  CheckCircle,
  Heart,
  Percent,
  Clock,
  Star,
  Briefcase,
  Brain,
  Sparkles,
  Wand2,
  RefreshCw,
  Users,
  Plus
} from 'lucide-react';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContactId?: string;
}

const dealStages = [
  { value: 'prospecting', label: 'Prospecting', color: 'bg-blue-500' },
  { value: 'qualification', label: 'Qualification', color: 'bg-yellow-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-500' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500' }
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' }
];

export const NewDealModal: React.FC<NewDealModalProps> = ({
  isOpen,
  onClose,
  preselectedContactId
}) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    value: '',
    probability: '50',
    dueDate: '',
    contactId: preselectedContactId || '',
    stage: 'prospecting' as const,
    priority: 'medium' as const,
    status: 'online' as const,
    description: '',
    notes: '',
    tags: '',
    isFavorite: false,
    customFields: {} as Record<string, string>
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { createDeal } = useDealStore();
  const { contacts, getContact } = useContactStore();

  React.useEffect(() => {
    if (preselectedContactId) {
      const contact = getContact(preselectedContactId);
      if (contact) {
        setSelectedContact(contact);
        setFormData(prev => ({
          ...prev,
          contactId: preselectedContactId,
          company: contact.company || prev.company
        }));
      }
    }
  }, [preselectedContactId, getContact]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Deal title is required';
    if (!formData.company) newErrors.company = 'Company is required';
    if (!formData.contactId) newErrors.contactId = 'Contact is required';
    if (!formData.value || isNaN(Number(formData.value))) newErrors.value = 'Valid deal value is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContactChange = (contactId: string) => {
    const contact = getContact(contactId);
    setSelectedContact(contact || null);
    setFormData(prev => ({
      ...prev,
      contactId,
      company: contact?.company || prev.company
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dealData = {
        title: formData.title,
        company: formData.company,
        value: formData.value,
        probability: formData.probability,
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contactId: formData.contactId,
        stage: formData.stage,
        priority: formData.priority,
        status: formData.status,
        description: formData.description || undefined,
        notes: formData.notes || undefined
      };

      await createDeal(dealData);
      setIsSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to create deal:', error);
      setErrors({ submit: 'Failed to create deal. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '', company: '', value: '', probability: '50', dueDate: '',
      contactId: preselectedContactId || '', stage: 'prospecting', priority: 'medium',
      status: 'online', description: '', notes: '', tags: '', isFavorite: false,
      customFields: {}
    });
    setErrors({});
    setIsSubmitting(false);
    setIsSuccess(false);
    setSelectedContact(null);
    onClose();
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">Deal Created!</h3>
          <p className="text-green-700 mb-4">
            {formData.title} has been added to your deals pipeline.
          </p>
          <ModernButton variant="primary" onClick={handleClose}>
            Close
          </ModernButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-green-500 via-blue-600 to-purple-600 rounded-xl text-white">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                New Deal
                <Sparkles className="w-5 h-5 ml-2 text-yellow-500" />
              </h2>
              <p className="text-gray-600">Create a deal with AI-powered insights</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Deal Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Deal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter deal title"
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.company ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.company && <p className="text-sm text-red-600 mt-1">{errors.company}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Value *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => handleInputChange('value', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.value ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="100000"
                      min="0"
                      step="1000"
                    />
                  </div>
                  {errors.value && <p className="text-sm text-red-600 mt-1">{errors.value}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Associated Contact *
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => handleContactChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.contactId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a contact</option>
                    {Object.values(contacts).map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} - {contact.company}
                      </option>
                    ))}
                  </select>
                  {errors.contactId && <p className="text-sm text-red-600 mt-1">{errors.contactId}</p>}
                  {selectedContact && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-900">
                          {selectedContact.firstName} {selectedContact.lastName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probability
                  </label>
                  <select
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="10">10%</option>
                    <option value="25">25%</option>
                    <option value="50">50%</option>
                    <option value="75">75%</option>
                    <option value="90">90%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Deal Stage & Priority */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                Deal Stage & Priority
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Deal Stage
                  </label>
                  <div className="space-y-3">
                    {dealStages.map((stage) => (
                      <label key={stage.value} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="stage"
                          value={stage.value}
                          checked={formData.stage === stage.value}
                          onChange={(e) => handleInputChange('stage', e.target.value)}
                          className="text-green-600"
                        />
                        <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Priority
                  </label>
                  <div className="space-y-3">
                    {priorities.map((priority) => (
                      <label key={priority.value} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="priority"
                          value={priority.value}
                          checked={formData.priority === priority.value}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="text-green-600"
                        />
                        <div className={`w-3 h-3 rounded-full ${priority.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{priority.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Notes */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-yellow-500" />
                Description & Notes
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the deal, requirements, and next steps..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Internal notes, strategy, concerns, etc."
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Brain className="w-4 h-4 text-purple-500" />
                <span>Powered by AI</span>
              </div>

              <div className="flex items-center space-x-4">
                <ModernButton
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Create Deal</span>
                </ModernButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewDealModal;