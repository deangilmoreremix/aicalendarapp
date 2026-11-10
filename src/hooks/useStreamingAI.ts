import { useState, useCallback, useRef } from 'react';
import { StreamingClient, StreamingOptions } from '../services/streamingClient';

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
  citations: { title: string; url: string }[];
}

type Json = Record<string, unknown>;

// Streaming operations map to the `ai_stream` edge function (OpenAI Responses API, SSE).
type OperationSpec = {
  buildBody: (...args: never[]) => Json;
};

const OPERATIONS: Record<string, OperationSpec> = {
  'task-suggestion': {
    buildBody: (prompt: string, context?: Json) => ({ operation: 'task-suggestion', prompt, context }),
  },
  'contact-enrichment': {
    buildBody: (contactData: Json) => ({ operation: 'contact-enrichment', contact: contactData }),
  },
  'email-composition': {
    buildBody: (recipient: Json, context: string) => ({ operation: 'email-composition', recipient, context }),
  },
  'meeting-planning': {
    buildBody: (attendees: string[], duration: number, topic: string) => ({ operation: 'meeting-planning', attendees, duration, topic }),
  },
  'web-research': {
    buildBody: (query: string, depth: 'basic' | 'comprehensive' = 'basic') => ({ operation: 'web-research', query, depth }),
  },
};

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai_stream`;

export const useStreamingAI = () => {
  const [state, setState] = useState<StreamingAIState>({
    isStreaming: false,
    isThinking: false,
    progress: 0,
    currentOperation: null,
    chunks: [],
    fullResponse: '',
    error: null,
    canCancel: false,
    citations: [],
  });

  const clientRef = useRef<StreamingClient | null>(null);

  const startOperation = useCallback((operationType: string, showThinking = true) => {
    setState((prev) => ({
      ...prev,
      isThinking: showThinking,
      currentOperation: operationType,
      progress: 0,
      error: null,
      canCancel: true,
    }));
  }, []);

  const runOperation = useCallback(
    async (operationType: string, args: unknown[], options: StreamingAIOptions = {}): Promise<string> => {
      const { showThinking = true, enableCancellation = true, ...streamOptions } = options;
      const spec = OPERATIONS[operationType];
      if (!spec) {
        throw new Error(`Unknown streaming operation: ${operationType}`);
      }

      startOperation(operationType, showThinking);
      const client = new StreamingClient();
      clientRef.current = client;

      let acc = '';
      try {
        await client.streamAIResponse(
          STREAM_URL,
          spec.buildBody(...(args as never[])),
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            onChunk: (chunk) => {
              acc += chunk;
              setState((prev) => ({
                ...prev,
                isThinking: false,
                isStreaming: true,
                canCancel: enableCancellation,
                chunks: [...prev.chunks, chunk],
                fullResponse: acc,
                progress: Math.min(prev.progress + 1, 95),
              }));
              streamOptions.onChunk?.(chunk);
            },
            onCitations: (citations) => setState((prev) => ({ ...prev, citations })),
          }
        );
        setState((prev) => ({ ...prev, isThinking: false, isStreaming: false, progress: 100, canCancel: false }));
        streamOptions.onComplete?.(acc);
        return acc;
      } catch (err) {
        const error = (err as Error).name === 'AbortError' ? new Error('Operation cancelled by user') : (err as Error);
        setState((prev) => ({ ...prev, isThinking: false, isStreaming: false, error, canCancel: false }));
        streamOptions.onError?.(error);
        throw error;
      }
    },
    [startOperation]
  );

  const cancelOperation = useCallback(() => {
    clientRef.current?.cancel();
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      isThinking: false,
      canCancel: false,
      error: new Error('Operation cancelled by user'),
    }));
  }, []);

  const reset = useCallback(() => {
    clientRef.current?.cancel();
    setState({
      isStreaming: false,
      isThinking: false,
      progress: 0,
      currentOperation: null,
      chunks: [],
      fullResponse: '',
      error: null,
      canCancel: false,
      citations: [],
    });
  }, []);

  const generateTaskSuggestions = useCallback(
    (prompt: string, context?: Json) =>
      runOperation('task-suggestion', [prompt, context], { operationType: 'task-suggestion' }),
    [runOperation]
  );

  const enrichContact = useCallback(
    (contactData: Json) => runOperation('contact-enrichment', [contactData], { operationType: 'contact-enrichment' }),
    [runOperation]
  );

  const composeEmail = useCallback(
    (recipient: Json, context: string) =>
      runOperation('email-composition', [recipient, context], { operationType: 'email-composition' }),
    [runOperation]
  );

  const planMeeting = useCallback(
    (attendees: string[], duration: number, topic: string) =>
      runOperation('meeting-planning', [attendees, duration, topic], { operationType: 'meeting-planning' }),
    [runOperation]
  );

  const researchWeb = useCallback(
    (query: string, depth: 'basic' | 'comprehensive' = 'basic') =>
      runOperation('web-research', [query, depth], { operationType: 'web-research' }),
    [runOperation]
  );

  return {
    ...state,
    streamAIResponse: runOperation,
    cancelOperation,
    reset,
    generateTaskSuggestions,
    enrichContact,
    composeEmail,
    planMeeting,
    researchWeb,
    startOperation,
  };
};
