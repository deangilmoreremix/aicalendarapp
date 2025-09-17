import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const getTooltipPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    switch (position) {
      case 'top':
        return {
          bottom: window.innerHeight - triggerRect.top + 8,
          left: triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2),
        };
      case 'bottom':
        return {
          top: triggerRect.bottom + 8,
          left: triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2),
        };
      case 'left':
        return {
          right: window.innerWidth - triggerRect.left + 8,
          top: triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2),
        };
      case 'right':
        return {
          left: triggerRect.right + 8,
          top: triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2),
        };
      default:
        return {};
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none whitespace-nowrap max-w-xs"
          style={getTooltipPosition()}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' :
              position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' :
              position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' :
              '-left-1 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};