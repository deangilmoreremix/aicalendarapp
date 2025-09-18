import React, { useState, useEffect, useRef } from 'react';
import { StreamingText } from './StreamingText';

export interface Citation {
  id: string;
  title: string;
  url: string;
  source: string;
  publishDate?: string;
  relevanceScore: number;
  excerpt?: string;
}

export interface StreamingTextWithCitationsProps {
  text: string;
  citations?: Citation[];
  isStreaming?: boolean;
  className?: string;
  onCitationClick?: (citation: Citation) => void;
  showCitationsInline?: boolean;
  citationAnimationDelay?: number;
}

export const StreamingTextWithCitations: React.FC<StreamingTextWithCitationsProps> = ({
  text,
  citations = [],
  isStreaming = false,
  className = '',
  onCitationClick,
  showCitationsInline = true,
  citationAnimationDelay = 1000
}) => {
  const [visibleCitations, setVisibleCitations] = useState<Citation[]>([]);
  const [animatingCitations, setAnimatingCitations] = useState<Set<string>>(new Set());
  const citationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Animate citations appearing one by one
  useEffect(() => {
    if (!isStreaming && citations.length > 0) {
      citationTimeoutsRef.current.forEach(clearTimeout);
      citationTimeoutsRef.current = [];

      citations.forEach((citation, index) => {
        const timeout = setTimeout(() => {
          setVisibleCitations(prev => [...prev, citation]);
          setAnimatingCitations(prev => new Set([...prev, citation.id]));

          // Remove animation class after animation completes
          setTimeout(() => {
            setAnimatingCitations(prev => {
              const newSet = new Set(prev);
              newSet.delete(citation.id);
              return newSet;
            });
          }, 500);
        }, citationAnimationDelay * (index + 1));

        citationTimeoutsRef.current.push(timeout);
      });
    }

    return () => {
      citationTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [citations, isStreaming, citationAnimationDelay]);

  // Reset when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setVisibleCitations([]);
      setAnimatingCitations(new Set());
      citationTimeoutsRef.current.forEach(clearTimeout);
    }
  }, [isStreaming]);

  const renderCitation = (citation: Citation, index: number) => {
    const isAnimating = animatingCitations.has(citation.id);

    return (
      <span
        key={citation.id}
        className={`inline-flex items-center mx-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 cursor-pointer ${
          isAnimating
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 scale-110 shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        onClick={() => onCitationClick?.(citation)}
        title={`${citation.title} - ${citation.source}`}
      >
        <span className="mr-1">[{index + 1}]</span>
        <span className="truncate max-w-32">{citation.source}</span>
        {citation.relevanceScore > 0.8 && (
          <span className="ml-1 text-green-600 dark:text-green-400">★</span>
        )}
      </span>
    );
  };

  const renderCitationsList = () => {
    if (!showCitationsInline || visibleCitations.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Sources & Citations
        </h4>
        <div className="grid gap-2">
          {visibleCitations.map((citation, index) => {
            const isAnimating = animatingCitations.has(citation.id);

            return (
              <div
                key={citation.id}
                className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                  isAnimating
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md scale-105'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onCitationClick?.(citation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        [{index + 1}]
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {citation.source}
                      </span>
                      {citation.publishDate && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(citation.publishDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                      {citation.title}
                    </h5>
                    {citation.excerpt && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {citation.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            i < Math.round(citation.relevanceScore * 5)
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(citation.relevanceScore * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <StreamingText
        text={text}
        isStreaming={isStreaming}
        className="text-gray-900 dark:text-gray-100 leading-relaxed"
      />

      {renderCitationsList()}

      {/* Inline citation numbers in text would go here if we had citation markers */}
      {/* For now, citations are shown in a separate list below */}
    </div>
  );
};

// Hook for managing streaming text with citations
export const useStreamingTextWithCitations = () => {
  const [text, setText] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startStreaming = (newText: string, newCitations: Citation[] = []) => {
    setText('');
    setCitations([]);
    setIsStreaming(true);
    setIsComplete(false);

    // Simulate streaming text
    let textIndex = 0;
    const textInterval = setInterval(() => {
      if (textIndex < newText.length) {
        setText(prev => prev + newText[textIndex]);
        textIndex++;
      } else {
        clearInterval(textInterval);
        // Add citations after text is complete
        setTimeout(() => {
          setCitations(newCitations);
          setIsStreaming(false);
          setIsComplete(true);
        }, 500);
      }
    }, 30); // Faster typing for research content
  };

  const addCitation = (citation: Citation) => {
    setCitations(prev => [...prev, citation]);
  };

  const reset = () => {
    setText('');
    setCitations([]);
    setIsStreaming(false);
    setIsComplete(false);
  };

  return {
    text,
    citations,
    isStreaming,
    isComplete,
    startStreaming,
    addCitation,
    reset
  };
};