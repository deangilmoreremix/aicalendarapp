import React, { useState, useEffect, useRef } from 'react';

export interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
  typingSpeed?: number;
  showCursor?: boolean;
  onComplete?: () => void;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming = false,
  className = '',
  typingSpeed = 50,
  showCursor = true,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursorBlink, setShowCursorBlink] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cursorTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle cursor blinking
  useEffect(() => {
    if (showCursor && (isStreaming || displayedText.length < text.length)) {
      cursorTimeoutRef.current = setInterval(() => {
        setShowCursorBlink(prev => !prev);
      }, 500);
    } else {
      setShowCursorBlink(false);
    }

    return () => {
      if (cursorTimeoutRef.current) {
        clearInterval(cursorTimeoutRef.current);
      }
    };
  }, [showCursor, isStreaming, displayedText.length, text.length]);

  // Handle text streaming
  useEffect(() => {
    if (text !== displayedText) {
      if (isStreaming && currentIndex < text.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayedText(text.slice(0, currentIndex + 1));
          setCurrentIndex(prev => prev + 1);
        }, typingSpeed);
      } else {
        // If not streaming or text changed completely, show full text immediately
        setDisplayedText(text);
        setCurrentIndex(text.length);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, displayedText, currentIndex, isStreaming, typingSpeed]);

  // Handle completion
  useEffect(() => {
    if (displayedText === text && displayedText.length > 0 && !isStreaming) {
      onComplete?.();
    }
  }, [displayedText, text, isStreaming, onComplete]);

  const renderCursor = () => {
    if (!showCursor || (!isStreaming && displayedText === text)) {
      return null;
    }

    return (
      <span
        className={`inline-block w-0.5 h-5 bg-purple-500 ml-0.5 ${
          showCursorBlink ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-100`}
        style={{ verticalAlign: 'baseline' }}
      />
    );
  };

  return (
    <span className={className}>
      {displayedText}
      {renderCursor()}
    </span>
  );
};

// Hook for managing streaming text state
export const useStreamingText = (initialText = '') => {
  const [text, setText] = useState(initialText);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startStreaming = (newText: string) => {
    setText('');
    setIsStreaming(true);
    setIsComplete(false);
    // Simulate streaming by setting text gradually
    let index = 0;
    const streamInterval = setInterval(() => {
      if (index < newText.length) {
        setText(prev => prev + newText[index]);
        index++;
      } else {
        setIsStreaming(false);
        setIsComplete(true);
        clearInterval(streamInterval);
      }
    }, 50);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
  };

  const reset = () => {
    setText('');
    setIsStreaming(false);
    setIsComplete(false);
  };

  return {
    text,
    isStreaming,
    isComplete,
    startStreaming,
    stopStreaming,
    reset,
    setText: (newText: string) => {
      setText(newText);
      setIsComplete(true);
    }
  };
};