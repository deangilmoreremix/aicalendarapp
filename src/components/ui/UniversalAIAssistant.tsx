import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import {
  Brain,
  Sparkles,
  Clock,
  Tag,
  Calendar,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  X,
  Lightbulb,
  Target,
  Zap,
  DollarSign,
  Users,
  Mail,
  TrendingUp
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

export interface AIAssistantConfig {
  mode: 'deal' | 'meeting' | 'email' | 'task' | 'contact';
  title: string;
  placeholder: string;
  examplePrompts: string[];
  icon: React.ComponentType<any>;
}

interface UniversalAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: any) => void;
  currentData?: any;
  config: AIAssistantConfig;
}

interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  completedText: string;
}

export const UniversalAIAssistant: React.FC<UniversalAIAssistantProps> = ({
  isOpen,
  onClose,
  onApplySuggestion,
  currentData,
  config
}) => {
  const { generateTaskSuggestions, streamTaskSuggestions, isProcessing } = useAI();
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    completedText: ''
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-populate prompt with current data if available
    if (currentData && Object.keys(currentData).length > 0) {
      const autoPrompt = generateAutoPrompt(currentData, config.mode);
      if (autoPrompt && !prompt) {
        setPrompt(autoPrompt);
      }
    }
  }, [currentData, config.mode, prompt]);

  const generateAutoPrompt = (data: any, mode: string): string => {
    switch (mode) {
      case 'deal':
        return data.title ? `Create a deal for: ${data.title}` :
               data.company ? `Create a deal with ${data.company}` : '';
      case 'meeting':
        return data.title ? `Schedule a meeting: ${data.title}` :
               data.attendees?.length ? `Schedule meeting with ${data.attendees.length} attendees` : '';
      case 'email':
        return data.subject ? `Write email about: ${data.subject}` :
               data.to?.length ? `Write email to ${data.to.length} recipients` : '';
      case 'task':
        return data.title ? `Create task: ${data.title}` : '';
      case 'contact':
        return data.firstName && data.lastName ?
               `Add contact: ${data.firstName} ${data.lastName}${data.company ? ` from ${data.company}` : ''}` :
               data.email ? `Add contact with email: ${data.email}` :
               data.company ? `Add contact from ${data.company}` : '';
      default:
        return '';
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!prompt.trim()) return;

    setSuggestions([]);
    setStreamingState({
      isStreaming: true,
      currentText: '',
      completedText: ''
    });

    try {
      // For now, use task suggestions as a fallback - in production this would be mode-specific
      const suggestion = await streamTaskSuggestions(prompt, (chunk) => {
        setStreamingState(prev => ({
          ...prev,
          currentText: prev.currentText + chunk
        }));
      });

      // Transform suggestion based on mode
      const transformedSuggestion = transformSuggestionForMode(suggestion, config.mode);
      setSuggestions([transformedSuggestion]);

      setStreamingState({
        isStreaming: false,
        currentText: '',
        completedText: suggestion.reasoning || ''
      });
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setStreamingState(prev => ({ ...prev, isStreaming: false }));
    }
  };

  const transformSuggestionForMode = (suggestion: any, mode: string): any => {
    switch (mode) {
      case 'deal':
        return {
          ...suggestion,
          value: suggestion.estimatedDuration ? suggestion.estimatedDuration * 1000 : 10000,
          priority: suggestion.priority,
          expectedCloseDate: suggestion.suggestedDueDate,
          tags: suggestion.tags,
          description: suggestion.description
        };
      case 'meeting':
        return {
          ...suggestion,
          duration: suggestion.estimatedDuration || 60,
          agenda: suggestion.subtasks?.map((s: any) => s.title) || [],
          notes: suggestion.description
        };
      case 'email':
        return {
          subject: suggestion.title,
          body: suggestion.description,
          priority: suggestion.priority === 'urgent' ? 'high' : 'normal'
        };
      case 'contact':
        return {
          ...suggestion,
          firstName: suggestion.firstName || suggestion.title?.split(' ')[0] || '',
          lastName: suggestion.lastName || suggestion.title?.split(' ').slice(1).join(' ') || '',
          email: suggestion.email || '',
          phone: suggestion.phone || '',
          title: suggestion.jobTitle || suggestion.title || '',
          company: suggestion.company || '',
          industry: suggestion.industry || '',
          notes: suggestion.description || suggestion.notes || '',
          tags: suggestion.tags || [],
          socialProfiles: suggestion.socialProfiles || {},
          interestLevel: suggestion.interestLevel || 'medium',
          status: suggestion.status || 'lead'
        };
      default:
        return suggestion;
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    onApplySuggestion(suggestion);
    setSelectedSuggestion(suggestion);
  };

  const handleFeedback = (suggestionId: string, isPositive: boolean) => {
    console.log(`Feedback for suggestion ${suggestionId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  const renderSuggestionCard = (suggestion: any) => {
    const Icon = config.icon;

    switch (config.mode) {
      case 'deal':
        return (
          <Card key={suggestion.id} className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{suggestion.title}</h3>
                  {suggestion.description && (
                    <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    ${suggestion.value?.toLocaleString()}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    {suggestion.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {suggestion.expectedCloseDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Close: {suggestion.expectedCloseDate.toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <TrendingUp size={14} className="text-gray-400" />
                  <span>{suggestion.confidence}% confidence</span>
                </div>
              </div>
              {suggestion.reasoning && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</h4>
                  <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, true)}>
                    <ThumbsUp size={14} className="mr-1" />
                    Good
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, false)}>
                    <ThumbsDown size={14} className="mr-1" />
                    Not helpful
                  </Button>
                </div>
                <Button onClick={() => handleApplySuggestion(suggestion)}>
                  <Zap size={14} className="mr-2" />
                  Apply Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'meeting':
        return (
          <Card key={suggestion.id} className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{suggestion.title}</h3>
                  {suggestion.description && (
                    <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {suggestion.duration}min
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestion.agenda?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Agenda:</h4>
                  <div className="space-y-1">
                    {suggestion.agenda.map((item: string, index: number) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {index + 1}. {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {suggestion.reasoning && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</h4>
                  <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, true)}>
                    <ThumbsUp size={14} className="mr-1" />
                    Good
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, false)}>
                    <ThumbsDown size={14} className="mr-1" />
                    Not helpful
                  </Button>
                </div>
                <Button onClick={() => handleApplySuggestion(suggestion)}>
                  <Zap size={14} className="mr-2" />
                  Apply Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'email':
        return (
          <Card key={suggestion.id} className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{suggestion.subject}</h3>
                  {suggestion.body && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{suggestion.body}</p>
                  )}
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {suggestion.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestion.reasoning && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</h4>
                  <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, true)}>
                    <ThumbsUp size={14} className="mr-1" />
                    Good
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, false)}>
                    <ThumbsDown size={14} className="mr-1" />
                    Not helpful
                  </Button>
                </div>
                <Button onClick={() => handleApplySuggestion(suggestion)}>
                  <Zap size={14} className="mr-2" />
                  Apply Email
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'contact':
        return (
          <Card key={suggestion.id} className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {suggestion.firstName} {suggestion.lastName}
                  </h3>
                  {suggestion.title && suggestion.company && (
                    <p className="text-gray-600 text-sm mb-1">{suggestion.title} at {suggestion.company}</p>
                  )}
                  {suggestion.email && (
                    <p className="text-gray-600 text-sm">{suggestion.email}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    {suggestion.status}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    {suggestion.interestLevel}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {suggestion.phone && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📞</span>
                    <span>{suggestion.phone}</span>
                  </div>
                )}
                {suggestion.industry && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">🏢</span>
                    <span>{suggestion.industry}</span>
                  </div>
                )}
              </div>

              {suggestion.tags?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.notes && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Notes:</h4>
                  <p className="text-sm text-gray-700">{suggestion.notes}</p>
                </div>
              )}

              {suggestion.reasoning && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</h4>
                  <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, true)}>
                    <ThumbsUp size={14} className="mr-1" />
                    Good
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFeedback(suggestion.id, false)}>
                    <ThumbsDown size={14} className="mr-1" />
                    Not helpful
                  </Button>
                </div>
                <Button onClick={() => handleApplySuggestion(suggestion)}>
                  <Zap size={14} className="mr-2" />
                  Apply Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
              <p className="text-sm text-gray-600">Get intelligent help creating and refining your content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(90vh-80px)]">
          {/* Input Section */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={config.placeholder}
                  className="text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateSuggestions()}
                />
              </div>
              <Button
                onClick={handleGenerateSuggestions}
                disabled={!prompt.trim() || isProcessing || streamingState.isStreaming}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing || streamingState.isStreaming ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Thinking Animation */}
            {streamingState.isStreaming && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-blue-700 font-medium">AI is analyzing your request...</span>
                </div>
                <div className="text-blue-600 text-sm">
                  {streamingState.completedText}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  AI Suggestions
                </h3>

                {suggestions.map((suggestion) => renderSuggestionCard(suggestion))}
              </div>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && !streamingState.isStreaming && !isProcessing && (
              <div className="text-center py-12">
                <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to help!</h3>
                <p className="text-gray-600 mb-6">
                  Describe what you need help with and I'll provide intelligent suggestions.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Try prompts like:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {config.examplePrompts.map((prompt, index) => (
                      <Badge key={index}>{prompt}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalAIAssistant;