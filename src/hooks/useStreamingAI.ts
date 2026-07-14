import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { StreamingOptions } from '../services/streamingClient';

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

type Json = Record<string, unknown>;

// Map a streaming operation to its Supabase Edge Function + request body.
type OperationSpec = {
  functionName: string;
  buildBody: (...args: unknown[]) => Json;
  extract: (data: unknown) => string;
};

const OPERATIONS: Record<string, OperationSpec> = {
  'task-suggestion': {
    functionName: 'generate_task_suggestions',
    buildBody: (prompt: string, context?: Json) => ({ prompt, context, stream: true }),
    extract: (data: unknown) =>
      Array.isArray(data)
        ? data
            .map((s: Json) => `• ${String(s.title ?? '')} — ${String(s.description ?? '')} (priority: ${String(s.priority ?? '')})`)
            .join('\n')
        : JSON.stringify(data),
  },
  'contact-enrichment': {
    functionName: 'contacts_enrich',
    buildBody: (contactData: Json) => ({ contact: contactData }),
    extract: (data: unknown) => ((data as Json)?.text != null ? String((data as Json).text) : JSON.stringify(data)),
  },
  'email-composition': {
    functionName: 'email_compose',
    buildBody: (recipient: Json, context: string) => ({ recipient, context }),
    extract: (data: unknown) => ((data as Json)?.text != null ? String((data as Json).text) : JSON.stringify(data)),
  },
  'meeting-planning': {
    functionName: 'meetings_plan',
    buildBody: (attendees: string[], duration: number, topic: string) => ({ attendees, duration, topic }),
    extract: (data: unknown) => ((data as Json)?.text != null ? String((data as Json).text) : JSON.stringify(data)),
  },
  'web-research': {
    functionName: 'research_web',
    buildBody: (query: string, depth: 'basic' | 'comprehensive' = 'basic') => ({
      query,
      depth,
      includeCitations: true,
    }),
    extract: (data: unknown) => ((data as Json)?.text != null ? String((data as Json).text) : JSON.stringify(data)),
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  });

  const abortRef = useRef(false);

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

      abortRef.current = false;
      startOperation(operationType, showThinking);

      // Simulated "thinking" phase for a natural UX.
      const thinkingInterval = setInterval(() => {
        setState((prev) => ({ ...prev, progress: Math.min(prev.progress + Math.random() * 15, 85) }));
      }, 200);
      await sleep(1500 + Math.random() * 1000);
      clearInterval(thinkingInterval);

      setState((prev) => ({ ...prev, isThinking: false, isStreaming: true, progress: 85, canCancel: enableCancellation }));

      try {
        const { data, error } = await supabase.functions.invoke(spec.functionName, {
          body: spec.buildBody(...args),
        });

        if (error) {
          throw new Error(error.message || `Edge function ${spec.functionName} failed`);
        }

        const fullText = spec.extract(data);

        // Simulate token streaming for a natural UX.
        const tokens = fullText.split(/(\s+)/);
        let acc = '';
        for (const token of tokens) {
          if (abortRef.current) {
            throw new Error('Operation cancelled by user');
          }
          acc += token;
          setState((prev) => ({
            ...prev,
            chunks: [...prev.chunks, token],
            fullResponse: acc,
            progress: Math.min(prev.progress + 1, 98),
          }));
          streamOptions.onChunk?.(token);
          await sleep(20);
        }

        setState((prev) => ({ ...prev, isStreaming: false, progress: 100, canCancel: false }));
        streamOptions.onComplete?.(acc);
        return acc;
      } catch (err) {
        const error = err as Error;
        setState((prev) => ({ ...prev, isStreaming: false, error, canCancel: false }));
        streamOptions.onError?.(error);
        throw error;
      }
    },
    [startOperation]
  );

  const cancelOperation = useCallback(() => {
    abortRef.current = true;
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      isThinking: false,
      canCancel: false,
      error: new Error('Operation cancelled by user'),
    }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({
      isStreaming: false,
      isThinking: false,
      progress: 0,
      currentOperation: null,
      chunks: [],
      fullResponse: '',
      error: null,
      canCancel: false,
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
