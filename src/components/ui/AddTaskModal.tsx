import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Badge } from './badge';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';
import { Contact } from '../../types';
import { UniversalAIAssistant, AIAssistantConfig } from './UniversalAIAssistant';
import {
  X,
  Plus,
  Calendar,
  Clock,
  User,
  Tag,
  Flag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Sparkles,
  Wand2
} from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: any) => void;
  preselectedAssignee?: string;
  prefilledProject?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  type: 'follow-up' | 'meeting' | 'call' | 'email' | 'proposal' | 'research' | 'administrative' | 'other';
  assigneeId: string;
  estimatedDuration: number;
  tags: string[];
  relatedTo?: {
    type: 'contact' | 'deal' | 'project';
    id: string;
    name: string;
  };
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  preselectedAssignee = '',
  prefilledProject = ''
}) => {
  const { contacts } = useContactStore();
  const { createTask } = useTaskStore();

  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiWritingLoading, setAiWritingLoading] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: 'other',
    type: 'other',
    assigneeId: preselectedAssignee,
    estimatedDuration: 60,
    tags: [],
    relatedTo: prefilledProject ? {
      type: 'project',
      id: prefilledProject,
      name: prefilledProject
    } : undefined
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        category: 'other',
        type: 'other',
        assigneeId: preselectedAssignee,
        estimatedDuration: 60,
        tags: [],
        relatedTo: prefilledProject ? {
          type: 'project',
          id: prefilledProject,
          name: prefilledProject
        } : undefined
      });
      setNewTag('');
      setErrors({});
    }
  }, [isOpen, preselectedAssignee, prefilledProject]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!formData.assigneeId) {
      newErrors.assigneeId = 'Please assign this task to someone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleAIWriting = async (field: 'title' | 'description', context?: string) => {
    setAiWritingLoading(field);

    try {
      // Simulate AI writing assistance
      await new Promise(resolve => setTimeout(resolve, 1500));

      let aiSuggestion = '';

      if (field === 'title') {
        const titlePrompts = [
          'Schedule client discovery call for Q4 planning',
          'Prepare project proposal presentation',
          'Follow up on outstanding invoice payment',
          'Review and update team performance metrics',
          'Organize quarterly business review meeting'
        ];
        aiSuggestion = titlePrompts[Math.floor(Math.random() * titlePrompts.length)];
      } else {
        const descPrompts = [
          'Conduct a comprehensive discovery call to understand client needs, pain points, and goals for Q4. Prepare agenda covering current challenges, future objectives, and potential solutions.',
          'Create a compelling project proposal presentation highlighting our unique value proposition, implementation timeline, and expected ROI. Include case studies and testimonials.',
          'Follow up on the outstanding invoice from the recent project delivery. Review payment terms, send friendly reminder, and explore any potential issues preventing payment.',
          'Review team performance metrics for the current quarter, identify areas for improvement, and develop action plans for enhancing productivity and achieving targets.',
          'Organize a comprehensive quarterly business review meeting with key stakeholders to discuss progress, challenges, and strategic direction for the next quarter.'
        ];
        aiSuggestion = descPrompts[Math.floor(Math.random() * descPrompts.length)];
      }

      setFormData(prev => ({
        ...prev,
        [field]: aiSuggestion
      }));

      // Clear any existing errors for this field
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }

    } catch (error) {
      console.error(`AI writing failed for ${field}:`, error);
      alert(`Failed to generate AI content for ${field}. Please try again.`);
    } finally {
      setAiWritingLoading(null);
    }
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    // Apply the AI suggestion to the form
    setFormData(prev => ({
      ...prev,
      title: suggestion.title || prev.title,
      description: suggestion.description || prev.description,
      priority: suggestion.priority || prev.priority,
      category: suggestion.category || prev.category,
      type: suggestion.type || prev.type,
      estimatedDuration: suggestion.estimatedDuration || prev.estimatedDuration,
      tags: suggestion.tags || prev.tags
    }));
    setShowAIAssistant(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        ...formData,
        dueDate: new Date(formData.dueDate),
        completed: false,
        createdAt: new Date(),
        tags: formData.tags,
        attachments: [],
        subtasks: []
      };

      const newTask = await createTask(taskData);
      onTaskCreated?.(newTask);
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const contactsArray = Object.values(contacts);
  const selectedAssignee = contacts[formData.assigneeId];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold">Create New Task</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                title="AI Task Assistant"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI Assistant</span>
              </button>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <div className="relative">
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title..."
                className={`pr-12 ${errors.title ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => handleAIWriting('title')}
                disabled={aiWritingLoading === 'title'}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
                title="AI writing assistant for task title"
              >
                {aiWritingLoading === 'title' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task..."
                rows={3}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => handleAIWriting('description')}
                disabled={aiWritingLoading === 'description'}
                className="absolute right-2 top-3 p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
                title="AI writing assistant for task description"
              >
                {aiWritingLoading === 'description' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Date, Priority, Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className={errors.dueDate ? 'border-red-500' : ''}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
              )}
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <Select
                value={formData.estimatedDuration.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To *
            </label>
            <Select
              value={formData.assigneeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
            >
              <SelectTrigger className={errors.assigneeId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select assignee..." />
              </SelectTrigger>
              <SelectContent>
                {contactsArray.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{contact.name}</div>
                        <div className="text-xs text-gray-500">{contact.title} at {contact.company}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigneeId && (
              <p className="text-red-500 text-xs mt-1">{errors.assigneeId}</p>
            )}

            {/* Selected Assignee Display */}
            {selectedAssignee && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {selectedAssignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-900">{selectedAssignee.name}</div>
                  <div className="text-xs text-blue-700">{selectedAssignee.title} at {selectedAssignee.company}</div>
                </div>
              </div>
            )}
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
                    <X size={12} />
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
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Related Project/Contact */}
          {formData.relatedTo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related To
              </label>
              <div className="p-2 bg-gray-50 rounded-lg flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {formData.relatedTo.type}
                </Badge>
                <span className="text-sm text-gray-700">{formData.relatedTo.name}</span>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

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
                <Plus className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Creating...' : 'Create Task'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* AI Task Assistant Modal */}
      <UniversalAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplySuggestion={handleApplyAISuggestion}
        currentData={formData}
        config={{
          mode: 'task',
          title: "AI Task Assistant",
          placeholder: "Describe your task or what you need help with...",
          examplePrompts: [
            "Schedule client discovery call for next week",
            "Create project proposal presentation",
            "Follow up on outstanding invoice",
            "Review team performance metrics",
            "Organize quarterly business review"
          ],
          icon: Plus
        }}
      />
    </Dialog>
  );
};