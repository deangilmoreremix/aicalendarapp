import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Textarea } from './textarea';
import { useContactStore } from '../../store/contactStore';
import { useAI } from '../../contexts/AIContext';
import { Contact } from '../../types';
import { UniversalAIAssistant, AIAssistantConfig } from './UniversalAIAssistant';
import { Mail, Brain } from 'lucide-react';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  Plus,
  User,
  Paperclip,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: (email: any) => void;
  preselectedContacts?: string[];
  prefilledSubject?: string;
  prefilledBody?: string;
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
  priority: 'low' | 'normal' | 'high';
  aiGenerated: boolean;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  onEmailSent,
  preselectedContacts = [],
  prefilledSubject = '',
  prefilledBody = ''
}) => {
  const { contacts } = useContactStore();
  const { isProcessing } = useAI();

  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    subject?: string;
    body?: string;
  } | null>(null);

  const [formData, setFormData] = useState<EmailData>({
    to: preselectedContacts,
    cc: [],
    bcc: [],
    subject: prefilledSubject,
    body: prefilledBody,
    attachments: [],
    priority: 'normal',
    aiGenerated: false
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'to' | 'cc' | 'bcc'>('to');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const emailAIConfig: AIAssistantConfig = {
    mode: 'email',
    title: 'AI Email Assistant',
    placeholder: 'Describe the email you want to compose...',
    examplePrompts: [
      'Write a follow-up email to a client',
      'Compose a meeting request email',
      'Create a thank you email after demo'
    ],
    icon: Mail
  };

  const handleApplyAISuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      subject: suggestion.subject || prev.subject,
      body: suggestion.body || prev.body,
      priority: suggestion.priority || prev.priority
    }));
    setShowAIAssistant(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        to: preselectedContacts,
        cc: [],
        bcc: [],
        subject: prefilledSubject,
        body: prefilledBody,
        attachments: [],
        priority: 'normal',
        aiGenerated: false
      });
      setAiSuggestions(null);
      setShowPreview(false);
      setErrors({});
      setNewRecipient('');
    }
  }, [isOpen, preselectedContacts, prefilledSubject, prefilledBody]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.to.length === 0) {
      newErrors.to = 'At least one recipient is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Email body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAIGenerate = async () => {
    if (formData.to.length === 0) {
      alert('Please select recipients first');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate AI email generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const recipientNames = formData.to.map(id => {
        const contact = contacts[id];
        return contact ? contact.name : 'Valued Contact';
      });

      const generatedSubject = `Follow-up: ${recipientNames.join(', ')}`;
      const generatedBody = `Dear ${recipientNames.join(', ')},

I hope this email finds you well. I wanted to follow up on our recent conversation and discuss how we can work together to achieve your goals.

Please let me know if you'd like to schedule a call or if you have any questions in the meantime.

Best regards,
Your Name
Contact Information`;

      setAiSuggestions({ subject: generatedSubject, body: generatedBody });
      setFormData(prev => ({ ...prev, aiGenerated: true }));
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('AI generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestions) {
      setFormData(prev => ({
        ...prev,
        subject: aiSuggestions.subject || prev.subject,
        body: aiSuggestions.body || prev.body
      }));
    }
  };

  const addRecipient = () => {
    if (newRecipient.trim()) {
      // Check if it's a contact ID or email
      const contact = Object.values(contacts).find(c => c.id === newRecipient || c.email === newRecipient);
      const recipientId = contact ? contact.id : newRecipient.trim();

      setFormData(prev => ({
        ...prev,
        [recipientType]: [...prev[recipientType], recipientId]
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (type: 'to' | 'cc' | 'bcc', recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(id => id !== recipientId)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500));

      const email = {
        id: `email_${Date.now()}`,
        ...formData,
        sentAt: new Date(),
        status: 'sent'
      };

      onEmailSent?.(email);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientDisplay = (recipientId: string) => {
    const contact = contacts[recipientId];
    if (contact) {
      return `${contact.name} <${contact.email}>`;
    }
    // If it's not a contact ID, treat it as an email
    return recipientId.includes('@') ? recipientId : `${recipientId} <unknown@email.com>`;
  };

  const contactsArray = Object.values(contacts);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold">Compose Email</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                <Brain size={16} />
                <span>AI Help</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
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
          {/* Recipients */}
          <div className="space-y-4">
            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.to.map(recipientId => (
                  <Badge key={recipientId} variant="secondary" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {getRecipientDisplay(recipientId)}
                    <button
                      type="button"
                      onClick={() => removeRecipient('to', recipientId)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value as 'to' | 'cc' | 'bcc')}
                  className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="to">To</option>
                  <option value="cc">CC</option>
                  <option value="bcc">BCC</option>
                </select>
                <Input
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Add recipient..."
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  className="flex-1 rounded-l-none"
                />
                <Button type="button" onClick={addRecipient} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {errors.to && (
                <p className="text-red-500 text-xs mt-1">{errors.to}</p>
              )}
            </div>

            {/* CC */}
            {formData.cc.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CC
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.cc.map(recipientId => (
                    <Badge key={recipientId} variant="secondary" className="flex items-center gap-1">
                      {getRecipientDisplay(recipientId)}
                      <button
                        type="button"
                        onClick={() => removeRecipient('cc', recipientId)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* BCC */}
            {formData.bcc.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BCC
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.bcc.map(recipientId => (
                    <Badge key={recipientId} variant="secondary" className="flex items-center gap-1">
                      {getRecipientDisplay(recipientId)}
                      <button
                        type="button"
                        onClick={() => removeRecipient('bcc', recipientId)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email subject..."
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
            )}
          </div>

          {/* AI Generation */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">AI Email Assistant</span>
                {formData.aiGenerated && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                onClick={handleAIGenerate}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>

            {/* AI Suggestions */}
            {aiSuggestions && (
              <div className="space-y-3">
                {aiSuggestions.subject && (
                  <div>
                    <h5 className="text-sm font-medium text-purple-800 mb-1">Suggested Subject:</h5>
                    <div className="bg-white/50 p-2 rounded text-sm text-purple-700">
                      {aiSuggestions.subject}
                    </div>
                  </div>
                )}
                {aiSuggestions.body && (
                  <div>
                    <h5 className="text-sm font-medium text-purple-800 mb-1">Suggested Body:</h5>
                    <div className="bg-white/50 p-2 rounded text-sm text-purple-700 whitespace-pre-line">
                      {aiSuggestions.body}
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={applyAISuggestion}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Apply AI Suggestions
                </Button>
              </div>
            )}
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Compose your email..."
              rows={8}
              className={errors.body ? 'border-red-500' : ''}
            />
            {errors.body && (
              <p className="text-red-500 text-xs mt-1">{errors.body}</p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add Attachment
                </label>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
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
                <Send className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Sending...' : 'Send Email'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* AI Email Assistant */}
      <UniversalAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplySuggestion={handleApplyAISuggestion}
        currentData={formData}
        config={emailAIConfig}
      />
    </Dialog>
  );
};