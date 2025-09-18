import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import { StreamingContainer } from './StreamingContainer';
import { ThinkingIndicator } from './ThinkingIndicator';
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
  Zap
} from 'lucide-react';
import { useAI, TaskSuggestion } from '../../contexts/AIContext';
import { useStreamingAI } from '../../hooks/useStreamingAI';
import { Task } from '../../types';

interface AITaskAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: Partial<Task>) => void;
  currentTaskData?: Partial<Task>;
}


export const AITaskAssistant: React.FC<AITaskAssistantProps> = ({
  isOpen,
  onClose,
  onApplySuggestion,
  currentTaskData
}) => {
  const { generateTaskSuggestions } = useAI();
  const streamingAI = useStreamingAI();
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TaskSuggestion | null>(null);

  useEffect(() => {
    // Auto-populate prompt with current task data if available
    if (currentTaskData?.title || currentTaskData?.description) {
      const autoPrompt = [
        currentTaskData.title && `Title: ${currentTaskData.title}`,
        currentTaskData.description && `Description: ${currentTaskData.description}`
      ].filter(Boolean).join('. ');

      if (autoPrompt && !prompt) {
        setPrompt(autoPrompt);
      }
    }
  }, [currentTaskData, prompt]);

  const handleGenerateSuggestions = async () => {
    if (!prompt.trim()) return;

    setSuggestions([]);

    try {
      // Use the new streaming AI hook
      const result = await streamingAI.generateTaskSuggestions(prompt, currentTaskData);

      // Parse the result (in a real implementation, this would be properly structured)
      // For now, create a mock suggestion based on the result
      const mockSuggestion: TaskSuggestion = {
        id: Math.random().toString(36).substr(2, 9),
        title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
        description: `AI-generated task based on: "${prompt}". ${result}`,
        priority: 'medium',
        suggestedDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        estimatedDuration: 60,
        subtasks: [
          { title: 'Initial planning', estimatedDuration: 15 },
          { title: 'Execute main task', estimatedDuration: 30 },
          { title: 'Review and finalize', estimatedDuration: 15 }
        ],
        tags: ['ai-generated', 'task'],
        category: 'other',
        type: 'other',
        reasoning: result,
        confidence: 85
      };

      setSuggestions([mockSuggestion]);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const handleApplySuggestion = (suggestion: TaskSuggestion) => {
    const taskData: Partial<Task> = {
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      dueDate: suggestion.suggestedDueDate,
      estimatedDuration: suggestion.estimatedDuration,
      tags: suggestion.tags,
      category: suggestion.category,
      type: suggestion.type,
      subtasks: suggestion.subtasks.map(subtask => ({
        id: Math.random().toString(36).substr(2, 9),
        title: subtask.title,
        completed: false,
        status: 'pending' as const,
        createdAt: new Date(),
        completedAt: undefined
      }))
    };

    onApplySuggestion(taskData);
    setSelectedSuggestion(suggestion);
  };

  const handleFeedback = (suggestionId: string, isPositive: boolean) => {
    // In a real implementation, this would send feedback to the AI service
    console.log(`Feedback for suggestion ${suggestionId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  const getPriorityColor = (priority: TaskSuggestion['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Task Assistant</h2>
              <p className="text-sm text-gray-600">Get intelligent help creating and refining your tasks</p>
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
                  placeholder="Describe your task or what you need help with..."
                  className="text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateSuggestions()}
                />
              </div>
              <Button
                onClick={handleGenerateSuggestions}
                disabled={!prompt.trim() || streamingAI.isStreaming || streamingAI.isThinking}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {streamingAI.isStreaming || streamingAI.isThinking ? (
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
            {(streamingAI.isStreaming || streamingAI.isThinking) && (
              <div className="mb-6">
                <ThinkingIndicator
                  type="dots"
                  size="md"
                  color="purple"
                  showProgress={true}
                  progress={streamingAI.progress}
                  className="mb-4"
                />
                {streamingAI.fullResponse && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-purple-800 text-sm">
                      {streamingAI.fullResponse}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  AI Suggestions
                </h3>

                {suggestions.map((suggestion) => (
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
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {Math.round(suggestion.confidence)}% confidence
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Task Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {suggestion.suggestedDueDate && (
                          <div className="flex items-center space-x-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span>Due: {suggestion.suggestedDueDate.toLocaleDateString()}</span>
                          </div>
                        )}
                        {suggestion.estimatedDuration && (
                          <div className="flex items-center space-x-2">
                            <Clock size={14} className="text-gray-400" />
                            <span>{suggestion.estimatedDuration}min</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Target size={14} className="text-gray-400" />
                          <span>{suggestion.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Tag size={14} className="text-gray-400" />
                          <span>{suggestion.type}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {suggestion.tags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Tags:</h4>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subtasks */}
                      {suggestion.subtasks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Subtasks:</h4>
                          <div className="space-y-2">
                            {suggestion.subtasks.map((subtask, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm">
                                <CheckCircle2 size={14} className="text-gray-400" />
                                <span>{subtask.title}</span>
                                {subtask.estimatedDuration && (
                                  <span className="text-gray-500 text-xs">({subtask.estimatedDuration}min)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reasoning */}
                      {suggestion.reasoning && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">AI Reasoning:</h4>
                          <p className="text-sm text-blue-800">{suggestion.reasoning}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFeedback(suggestion.id, true)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ThumbsUp size={14} className="mr-1" />
                            Good
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFeedback(suggestion.id, false)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <ThumbsDown size={14} className="mr-1" />
                            Not helpful
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Zap size={14} className="mr-2" />
                          Apply Suggestion
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && !streamingAI.isStreaming && !streamingAI.isThinking && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to help!</h3>
                <p className="text-gray-600 mb-6">
                  Describe your task above and I'll provide intelligent suggestions to help you create better tasks.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Try prompts like:</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <Badge>Scheduler a client meeting for next week</Badge>
                    <Badge>Create a project plan for website redesign</Badge>
                    <Badge>Follow up with sales prospect</Badge>
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

export default AITaskAssistant;