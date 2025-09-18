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
  const [researchStats, setResearchStats] = useState({
    sourcesFound: 0,
    citationsCollected: 0,
    currentSource: ''
  });

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

  // Simulate research stats for web research
  useEffect(() => {
    if (operationType === 'web-research' && streamingAI.isStreaming) {
      const interval = setInterval(() => {
        setResearchStats(prev => ({
          sourcesFound: Math.min(prev.sourcesFound + Math.floor(Math.random() * 3), 15),
          citationsCollected: Math.min(prev.citationsCollected + Math.floor(Math.random() * 2), 8),
          currentSource: ['Google Scholar', 'ResearchGate', 'PubMed', 'ArXiv', 'Semantic Scholar'][Math.floor(Math.random() * 5)]
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [operationType, streamingAI.isStreaming]);

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
      // Parse citations from the response (in a real implementation, this would come from the API)
      const mockCitations: Citation[] = [
        {
          id: '1',
          title: 'Advanced AI Techniques in Task Management',
          url: 'https://example.com/ai-task-management',
          source: 'Journal of AI Research',
          publishDate: '2024-01-15',
          relevanceScore: 0.95,
          excerpt: 'This paper explores various AI techniques for optimizing task management workflows...'
        },
        {
          id: '2',
          title: 'Machine Learning Applications in Productivity',
          url: 'https://example.com/ml-productivity',
          source: 'Tech Review',
          publishDate: '2024-02-20',
          relevanceScore: 0.88,
          excerpt: 'Recent studies show significant productivity improvements through ML integration...'
        }
      ];

      setCitations(mockCitations);
      onResult?.(streamingAI.fullResponse, mockCitations);
    }
  }, [streamingAI.isStreaming, streamingAI.isThinking, streamingAI.fullResponse, streamingAI.error, onResult]);

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