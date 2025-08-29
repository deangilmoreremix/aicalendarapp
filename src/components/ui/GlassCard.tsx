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
        bg-white/10 
        border border-white/20 
        rounded-2xl 
        shadow-xl 
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