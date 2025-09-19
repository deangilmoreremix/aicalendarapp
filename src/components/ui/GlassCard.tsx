import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  blur = 'md',
  opacity = 10 
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <div
      className={`
        ${blurClasses[blur]}
        bg-white/10 dark:bg-gray-800/80
        border border-white/20 dark:border-gray-700/50
        rounded-2xl
        shadow-xl dark:shadow-gray-900/20
        ${className}
      `}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${opacity / 100})`,
      }}
    >
      {children}
    </div>
  );
};