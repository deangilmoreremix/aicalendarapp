import React, { useState, useEffect } from 'react';
import { ThinkingIndicator, WebResearchIndicator } from './ThinkingIndicator';
import { StreamingTextWithCitations, Citation } from './StreamingTextWithCitations';
import { useStreamingAI } from '../../hooks/useStreamingAI';

export interface StreamingContainerProps {
  operationType?: 'task-suggestion' | 'contact-enrichment' | 'email-composition' | 'meeting-planning' | 'web-research';
  className?: string;
  showProgress?: boolean;
  enableCancellation?: boolean;
  onComplete?: (result: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}

export const StreamingContainer: React.FC<StreamingContainerProps> = ({
  operationType = 'task-suggestion',
  className = '',
  showProgress = true,
  enableCancellation = true,
  onComplete,
  onError,
  onCancel,
  children
}) => {
  const streamingAI = useStreamingAI();
  const [citations, setCitations] = useState<Citation[]>([]);
  const researchStats = { sourcesFound: 0, citationsCollected: 0, currentSource: 'OpenAI web search' };

  // Handle streaming completion
  useEffect(() => {
    if (!streamingAI.isStreaming && !streamingAI.isThinking && streamingAI.fullResponse && !streamingAI.error) {
      onComplete?.(streamingAI.fullResponse);
    }
  }, [streamingAI.isStreaming, streamingAI.isThinking, streamingAI.fullResponse, streamingAI.error, onComplete]);

  // Handle errors
  useEffect(() => {
    if (streamingAI.error) {
      onError?.(streamingAI.error);
    }
  }, [streamingAI.error, onError]);

  const handleCancel = () => {
    streamingAI.cancelOperation();
    onCancel?.();
  };

  const renderThinkingPhase = () => {
    if (!streamingAI.isThinking) return null;

    if (operationType === 'web-research') {
      return (
        <WebResearchIndicator
          currentSource={researchStats.currentSource}
          sourcesFound={researchStats.sourcesFound}
          citationsCollected={researchStats.citationsCollected}
          className="mb-4"
        />
      );
    }

    return (
      <ThinkingIndicator
        type="dots"
        size="md"
        color="purple"
        showProgress={showProgress}
        progress={streamingAI.progress}
        className="mb-4"
      />
    );
  };

  const renderStreamingPhase = () => {
    if (!streamingAI.isStreaming && !streamingAI.fullResponse) return null;

    return (
      <div className="space-y-4">
        <StreamingTextWithCitations
          text={streamingAI.fullResponse}
          citations={citations}
          isStreaming={streamingAI.isStreaming}
          onCitationClick={(citation) => {
            // Handle citation click - could open in new tab or show modal
            window.open(citation.url, '_blank');
          }}
          className="text-gray-900 dark:text-gray-100"
        />

        {streamingAI.isStreaming && showProgress && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${streamingAI.progress}%` }}
              />
            </div>
            <span>{Math.round(streamingAI.progress)}%</span>
          </div>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (!streamingAI.canCancel || !enableCancellation) return null;

    return (
      <div className="flex justify-end mt-4">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  };

  return (
    <div className={`streaming-container ${className}`}>
      {renderThinkingPhase()}
      {renderStreamingPhase()}
      {renderActions()}

      {/* Render children when not actively streaming */}
      {!streamingAI.isStreaming && !streamingAI.isThinking && children}
    </div>
  );
};

// Specialized container for web research with enhanced citation handling
export const WebResearchContainer: React.FC<{
  query: string;
  onResult?: (result: string, citations: Citation[]) => void;
  className?: string;
}> = ({ query, onResult, className = '' }) => {
  const streamingAI = useStreamingAI();
  const [citations, setCitations] = useState<Citation[]>([]);

  useEffect(() => {
    if (!streamingAI.isStreaming && !streamingAI.isThinking && streamingAI.fullResponse && !streamingAI.error) {
      // Real citations returned by the research_web edge function (OpenAI web search).
      const realCitations: Citation[] = streamingAI.citations.map((c, idx) => {
        let host = c.url;
        try { host = new URL(c.url).hostname; } catch { /* keep url */ }
        return { id: String(idx + 1), title: c.title, url: c.url, source: host, relevanceScore: 1 };
      });

      setCitations(realCitations);
      onResult?.(streamingAI.fullResponse, realCitations);
    }
  }, [streamingAI.isStreaming, streamingAI.isThinking, streamingAI.fullResponse, streamingAI.error, streamingAI.citations, onResult]);

  return (
    <StreamingContainer
      operationType="web-research"
      className={className}
      onComplete={(result) => {
        // Citations will be set in useEffect above
      }}
    >
      <StreamingTextWithCitations
        text={streamingAI.fullResponse}
        citations={citations}
        isStreaming={streamingAI.isStreaming}
        onCitationClick={(citation) => {
          window.open(citation.url, '_blank');
        }}
      />
    </StreamingContainer>
  );
};