import { useState, useCallback, useRef } from 'react';
import { streamingClient, StreamingOptions } from '../services/streamingClient';

export interface StreamingAIOptions extends StreamingOptions {
  operationType?: 'task-suggestion' | 'contact-enrichment' | 'email-composition' | 'meeting-planning' | 'web-research';
  showThinking?: boolean;
  enableCancellation?: boolean;
}

export interface StreamingAIState {
  isStreaming: boolean;
  isThinking: boolean;
  progress: number;
  currentOperation: string | null;
  chunks: string[];
  fullResponse: string;
  error: Error | null;
  canCancel: boolean;
}

export const useStreamingAI = () => {
  const [state, setState] = useState<StreamingAIState>({
    isStreaming: false,
    isThinking: false,
    progress: 0,
    currentOperation: null,
    chunks: [],
    fullResponse: '',
    error: null,
    canCancel: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startOperation = useCallback((operationType: string, showThinking = true) => {
    setState(prev => ({
      ...prev,
      isThinking: showThinking,
      currentOperation: operationType,
      progress: 0,
      error: null,
      canCancel: true
    }));
  }, []);

  const streamAIResponse = useCallback(async (
    endpoint: string,
    data: any,
    options: StreamingAIOptions = {}
  ): Promise<string> => {
    const { operationType, showThinking = true, enableCancellation = true, ...streamOptions } = options;

    // Start thinking phase
    startOperation(operationType || 'ai-operation', showThinking);

    // Simulate thinking progress
    const thinkingInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + Math.random() * 15, 85)
      }));
    }, 200);

    // Wait for thinking phase
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    clearInterval(thinkingInterval);

    // Start streaming phase
    setState(prev => ({
      ...prev,
      isThinking: false,
      isStreaming: true,
      progress: 85,
      canCancel: enableCancellation
    }));

    try {
      const response = await streamingClient.streamAIResponse(endpoint, data, {
        ...streamOptions,
        onChunk: (chunk) => {
          setState(prev => ({
            ...prev,
            chunks: [...prev.chunks, chunk],
            fullResponse: prev.fullResponse + chunk,
            progress: Math.min(prev.progress + 2, 95)
          }));
          streamOptions.onChunk?.(chunk);
        },
        onComplete: (fullResponse) => {
          setState(prev => ({
            ...prev,
            isStreaming: false,
            progress: 100,
            canCancel: false
          }));
          streamOptions.onComplete?.(fullResponse);
        },
        onError: (error) => {
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error,
            canCancel: false
          }));
          streamOptions.onError?.(error);
        }
      });

      return response;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error as Error,
        canCancel: false
      }));
      throw error;
    }
  }, [startOperation]);

  const cancelOperation = useCallback(() => {
    if (state.canCancel) {
      streamingClient.cancel();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        isThinking: false,
        canCancel: false,
        error: new Error('Operation cancelled by user')
      }));
    }
  }, [state.canCancel]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isStreaming: false,
      isThinking: false,
      progress: 0,
      currentOperation: null,
      chunks: [],
      fullResponse: '',
      error: null,
      canCancel: false
    });
  }, []);

  const generateTaskSuggestions = useCallback(async (prompt: string, context?: any) => {
    return streamAIResponse('/api/ai/tasks/suggest', {
      prompt,
      context,
      stream: true
    }, {
      operationType: 'task-suggestion'
    });
  }, [streamAIResponse]);

  const enrichContact = useCallback(async (contactData: Partial<any>) => {
    return streamAIResponse('/api/ai/contacts/enrich', {
      contact: contactData,
      stream: true
    }, {
      operationType: 'contact-enrichment'
    });
  }, [streamAIResponse]);

  const composeEmail = useCallback(async (recipient: any, context: string) => {
    return streamAIResponse('/api/ai/email/compose', {
      recipient,
      context,
      stream: true
    }, {
      operationType: 'email-composition'
    });
  }, [streamAIResponse]);

  const planMeeting = useCallback(async (attendees: string[], duration: number, topic: string) => {
    return streamAIResponse('/api/ai/meetings/plan', {
      attendees,
      duration,
      topic,
      stream: true
    }, {
      operationType: 'meeting-planning'
    });
  }, [streamAIResponse]);

  const researchWeb = useCallback(async (query: string, depth: 'basic' | 'comprehensive' = 'basic') => {
    return streamAIResponse('/api/ai/research/web', {
      query,
      depth,
      stream: true,
      includeCitations: true
    }, {
      operationType: 'web-research'
    });
  }, [streamAIResponse]);

  return {
    // State
    ...state,

    // Actions
    streamAIResponse,
    cancelOperation,
    reset,

    // Specialized AI operations
    generateTaskSuggestions,
    enrichContact,
    composeEmail,
    planMeeting,
    researchWeb,

    // Utilities
    startOperation
  };
};