import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface DarkModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch';
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  size = 'md',
  variant = 'button',
  className = ''
}) => {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isDark ? 'bg-blue-600' : 'bg-gray-200'}
          ${className}
        `}
      >
        <span className="sr-only">Toggle dark mode</span>
        <span
          className={`
            inline-block w-4 h-4 transform rounded-full bg-white transition-transform flex items-center justify-center
            ${isDark ? 'translate-x-6' : 'translate-x-1'}
          `}
        >
          {isDark ? (
            <Moon className="w-2 h-2 text-blue-600" />
          ) : (
            <Sun className="w-2 h-2 text-yellow-600" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        ${className}
        flex items-center justify-center rounded-xl transition-all duration-200
        ${isDark
          ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
          : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun size={iconSizes[size]} />
      ) : (
        <Moon size={iconSizes[size]} />
      )}
    </button>
  );
};