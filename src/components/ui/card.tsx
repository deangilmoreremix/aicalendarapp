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

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className = '', children, ...props }, ref) => {
  return (
    <div ref={ref} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm dark:shadow-gray-900/20 ${className}`} {...props}>
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

export const CardTitle: React.FC<CardTitleProps> = ({ className = '', children }) => {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};