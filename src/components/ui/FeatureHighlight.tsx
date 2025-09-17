import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface FeatureHighlightProps {
  children: React.ReactNode;
  tooltipContent: string;
  isAIFeature?: boolean;
  tourId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  children,
  tooltipContent,
  isAIFeature = false,
  tourId,
  position = 'top'
}) => {
  const [showHighlight, setShowHighlight] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if this feature has been highlighted before
    const highlightedKey = `feature_highlight_${tourId || 'default'}`;
    const hasBeenHighlighted = localStorage.getItem(highlightedKey);

    if (!hasBeenHighlighted) {
      // Show highlight after a short delay
      const timer = setTimeout(() => {
        setShowHighlight(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setHasBeenShown(true);
    }
  }, [tourId]);

  const dismissHighlight = () => {
    setShowHighlight(false);
    setHasBeenShown(true);

    // Mark as shown in localStorage
    if (tourId) {
      localStorage.setItem(`feature_highlight_${tourId}`, 'true');
    }
  };

  return (
    <div className="relative">
      {children}

      {showHighlight && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={dismissHighlight}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={dismissHighlight}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* AI Feature Badge */}
            {isAIFeature && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-purple-700">AI-Powered Feature</span>
              </div>
            )}

            {/* Content */}
            <div className="text-gray-700 mb-6">
              {tooltipContent}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={dismissHighlight}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Got it!
              </button>
              <button
                onClick={() => {
                  dismissHighlight();
                  // Mark as don't show again
                  if (tourId) {
                    localStorage.setItem(`feature_highlight_${tourId}_dismissed`, 'true');
                  }
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Don't show again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle indicator for previously highlighted features */}
      {hasBeenShown && isAIFeature && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse opacity-60" />
      )}
    </div>
  );
};