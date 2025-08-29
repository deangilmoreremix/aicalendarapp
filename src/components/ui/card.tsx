import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className = '', children, ...props }, ref) => {
  return (
    <div ref={ref} className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardContent: React.FC<CardContentProps> = ({ className = '', children }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children }) => {
  return <div className={`p-6 pb-4 ${className}`}>{children}</div>;
};