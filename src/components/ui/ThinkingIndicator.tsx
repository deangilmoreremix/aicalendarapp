import React, { useState, useEffect } from 'react';

export interface ThinkingIndicatorProps {
  message?: string;
  type?: 'dots' | 'pulse' | 'spinner' | 'wave';
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green' | 'orange';
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

const thinkingMessages = {
  'task-suggestion': [
    'Analyzing your tasks...',
    'Finding optimal task order...',
    'Generating smart suggestions...',
    'Considering your priorities...'
  ],
  'contact-enrichment': [
    'Searching social profiles...',
    'Analyzing contact data...',
    'Finding additional information...',
    'Building comprehensive profile...'
  ],
  'email-composition': [
    'Crafting the perfect message...',
    'Analyzing recipient preferences...',
    'Optimizing tone and content...',
    'Adding personal touches...'
  ],
  'meeting-planning': [
    'Finding optimal time slots...',
    'Checking availability...',
    'Analyzing participant schedules...',
    'Creating agenda structure...'
  ],
  'web-research': [
    'Searching the web...',
    'Analyzing sources...',
    'Gathering citations...',
    'Synthesizing information...'
  ],
  'default': [
    'Thinking...',
    'Processing...',
    'Analyzing...',
    'Working on it...'
  ]
};

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  message,
  type = 'dots',
  size = 'md',
  color = 'purple',
  className = '',
  showProgress = false,
  progress = 0
}) => {
  const [currentMessage, setCurrentMessage] = useState(message || 'Thinking...');
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through messages if no specific message provided
  useEffect(() => {
    if (!message) {
      const messages = thinkingMessages.default;
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % messages.length);
        setCurrentMessage(messages[messageIndex]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [message, messageIndex]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-purple-500';
    }
  };

  const renderIndicator = () => {
    switch (type) {
      case 'pulse':
        return (
          <div className={`${getSizeClasses()} rounded-full ${getColorClasses()} animate-pulse`} />
        );

      case 'spinner':
        return (
          <div className={`${getSizeClasses()} border-2 border-gray-300 border-t-${color}-500 rounded-full animate-spin`} />
        );

      case 'wave':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`${getSizeClasses()} rounded-full ${getColorClasses()}`}
                style={{
                  animation: `wave 1.5s ease-in-out ${i * 0.1}s infinite`
                }}
              />
            ))}
          </div>
        );

      default: // dots
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${getColorClasses()}`}
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {renderIndicator()}
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {currentMessage}
        </span>
      </div>

      {showProgress && (
        <div className="w-full max-w-xs">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getColorClasses()}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {Math.round(progress)}% complete
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes wave {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-10px);
            }
          }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `
      }} />
    </div>
  );
};

// Specialized thinking indicator for web research
export const WebResearchIndicator: React.FC<{
  currentSource?: string;
  sourcesFound?: number;
  citationsCollected?: number;
  className?: string;
}> = ({
  currentSource = '',
  sourcesFound = 0,
  citationsCollected = 0,
  className = ''
}) => {
  return (
    <div className={`flex flex-col space-y-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-green-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Researching the web...
          </span>
          {currentSource && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Searching: {currentSource}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>Sources found: {sourcesFound}</span>
        <span>Citations: {citationsCollected}</span>
      </div>
    </div>
  );
};