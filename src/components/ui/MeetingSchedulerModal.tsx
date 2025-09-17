import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';
import { useAI } from '../../contexts/AIContext';
import { Contact } from '../../types';
import { UniversalAIAssistant, AIAssistantConfig } from './UniversalAIAssistant';
import { Calendar, Brain } from 'lucide-react';
import {
  X,
  Clock,
  Users,
  MapPin,
  Video,
  Phone,
  Mail,
  Sparkles,
  Loader2,
  Plus,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react';

interface MeetingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingScheduled?: (meeting: any) => void;
  preselectedContacts?: string[];
}

interface MeetingData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'call' | 'meeting' | 'demo' | 'presentation';
  location: string;
  meetingLink: string;
  attendees: string[];
  agenda: string[];
  notes: string;
  aiOptimized: boolean;
}

const meetingTypes = [
  { value: 'meeting', label: 'In-Person Meeting', icon: Users },
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'demo', label: 'Product Demo', icon: Video },
  { value: 'presentation', label: 'Presentation', icon: Mail }
];

export const MeetingSchedulerModal: React.FC<MeetingSchedulerModalProps> = ({
  isOpen,
  onClose,
  onMeetingScheduled,
  preselectedContacts = []
}) => {
  const { contacts } = useContactStore();
  const { createTask } = useTaskStore();
  const { optimizeMeetingTime, generateMeetingAgenda, isProcessing } = useAI();

  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    optimalTimes: Date[];
    agenda: string[];
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const [formData, setFormData] = useState<MeetingData>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 60,
    type: 'meeting',
    location: '',
    meetingLink: '',
    attendees: preselectedContacts,
    agenda: [],
    notes: '',
    aiOptimized: false
  });

  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const meetingAIConfig: AIAssistantConfig = {
    mode: 'meeting',
    title: 'AI Meeting Assistant',
    placeholder: 'Describe the meeting you want to schedule...',
    examplePrompts: [
      'Schedule a product demo for next week',
      'Plan a client discovery call',
      'Organize a team standup meeting'
    ],
    icon: Calendar
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title || prev.title,
      description: suggestion.description || prev.description,
      duration: suggestion.duration || prev.duration,
      agenda: suggestion.agenda || prev.agenda,
      notes: suggestion.notes || prev.notes
    }));
    setShowAIAssistant(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: 60,
        type: 'meeting',
        location: '',
        meetingLink: '',
        attendees: preselectedContacts,
        agenda: [],
        notes: '',
        aiOptimized: false
      });
      setAiSuggestions(null);
      setErrors({});
      setNewAgendaItem('');
    }
  }, [isOpen, preselectedContacts]);

  // Auto-generate meeting link for video calls
  useEffect(() => {
    if (formData.type === 'demo' || formData.type === 'presentation') {
      if (!formData.meetingLink) {
        setFormData(prev => ({
          ...prev,
          meetingLink: `https://meet.example.com/${Math.random().toString(36).substr(2, 9)}`
        }));
      }
    }
  }, [formData.type]);

  // Calculate end time based on start time and duration
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes);

      const endDate = new Date(startDate.getTime() + formData.duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      setFormData(prev => ({ ...prev, endTime }));
    }
  }, [formData.startTime, formData.duration]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Meeting title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Meeting date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (formData.attendees.length === 0) {
      newErrors.attendees = 'At least one attendee is required';
    }

    if (formData.type === 'meeting' && !formData.location.trim()) {
      newErrors.location = 'Location is required for in-person meetings';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAIOptimization = async () => {
    if (formData.attendees.length === 0) {
      alert('Please select attendees first');
      return;
    }

    setIsLoadingAI(true);
    try {
      // Get optimal meeting times
      const optimalTimes = await optimizeMeetingTime(formData.attendees, formData.duration);

      // Generate meeting agenda
      const attendeeNames = formData.attendees.map(id => {
        const contact = contacts[id];
        return contact ? contact.name : 'Unknown';
      }).filter(name => name !== 'Unknown');

      const agenda = await generateMeetingAgenda(formData.title, attendeeNames);

      setAiSuggestions({ optimalTimes, agenda });
      setFormData(prev => ({ ...prev, aiOptimized: true }));
    } catch (error) {
      console.error('AI optimization failed:', error);
      alert('AI optimization failed. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const applyAISuggestion = (time: Date) => {
    const dateStr = time.toISOString().split('T')[0];
    const timeStr = time.toTimeString().slice(0, 5);

    setFormData(prev => ({
      ...prev,
      date: dateStr,
      startTime: timeStr,
      agenda: aiSuggestions?.agenda || prev.agenda
    }));
  };

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, newAgendaItem.trim()]
      }));
      setNewAgendaItem('');
    }
  };

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const handleAttendeeToggle = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(contactId)
        ? prev.attendees.filter(id => id !== contactId)
        : [...prev.attendees, contactId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Create meeting object
      const meeting = {
        id: `meeting_${Date.now()}`,
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'scheduled'
      };

      // Create a follow-up task
      if (formData.attendees.length > 0) {
        const primaryContact = contacts[formData.attendees[0]];
        await createTask({
          title: `Follow up on: ${formData.title}`,
          description: `Follow up on the ${formData.title} meeting and send meeting notes`,
          dueDate: new Date(formData.date + 'T' + formData.startTime),
          priority: 'medium',
          type: 'follow-up',
          relatedTo: primaryContact ? {
            type: 'contact',
            id: primaryContact.id,
            name: primaryContact.name
          } : undefined
        });
      }

      onMeetingScheduled?.(meeting);
      onClose();
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const contactsArray = Object.values(contacts);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold">Schedule Meeting</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                <Brain size={16} />
                <span>AI Help</span>
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
          {/* Meeting Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Type
            </label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meetingTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={errors.startTime ? 'border-red-500' : ''}
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (min)
              </label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <Input
                type="time"
                value={formData.endTime}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Location / Meeting Link */}
          {formData.type === 'meeting' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter meeting location..."
                  className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={formData.meetingLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://meet.example.com/..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendees *
            </label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              {contactsArray.map(contact => (
                <div key={contact.id} className="flex items-center space-x-3 py-2">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(contact.id)}
                    onChange={() => handleAttendeeToggle(contact.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.title} at {contact.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.attendees && (
              <p className="text-red-500 text-xs mt-1">{errors.attendees}</p>
            )}
          </div>

          {/* AI Optimization */}
          {formData.attendees.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">AI Meeting Optimization</span>
                  {formData.aiOptimized && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Optimized
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleAIOptimization}
                  disabled={isLoadingAI}
                  variant="outline"
                  size="sm"
                  className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {isLoadingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isLoadingAI ? 'Optimizing...' : 'AI Optimize'}
                </Button>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions && (
                <div className="space-y-4">
                  {/* Optimal Times */}
                  {aiSuggestions.optimalTimes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Suggested Times:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {aiSuggestions.optimalTimes.slice(0, 3).map((time, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => applyAISuggestion(time)}
                            className="p-2 bg-white rounded border border-purple-200 hover:bg-purple-50 text-left"
                          >
                            <div className="text-xs font-medium text-purple-900">
                              {time.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-purple-700">
                              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Agenda */}
                  {aiSuggestions.agenda.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        AI-Generated Agenda:
                      </h5>
                      <div className="space-y-1">
                        {aiSuggestions.agenda.map((item, index) => (
                          <div key={index} className="text-xs text-purple-700 bg-white/50 px-2 py-1 rounded">
                            {index + 1}. {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Agenda
            </label>
            <div className="space-y-2">
              {formData.agenda.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm flex-1">{index + 1}. {item}</span>
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <Input
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  placeholder="Add agenda item..."
                  onKeyPress={(e) => e.key === 'Enter' && addAgendaItem()}
                />
                <Button type="button" onClick={addAgendaItem} size="sm">
                  <Plus size={16} />
                </Button>
              </div>
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
              placeholder="Meeting description and objectives..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or preparation items..."
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
                <Calendar className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Scheduling...' : 'Schedule Meeting'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* AI Meeting Assistant */}
      <UniversalAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplySuggestion={handleApplyAISuggestion}
        currentData={formData}
        config={meetingAIConfig}
      />
    </Dialog>
  );
};