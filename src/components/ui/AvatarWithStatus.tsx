import React from 'react';

interface AvatarWithStatusProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'active' | 'inactive' | 'pending' | 'success' | 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  fallback?: string;
}

export const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  src,
  alt,
  size = 'md',
  status,
  className = '',
  fallback
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusColors = {
    active: 'bg-green-400',
    online: 'bg-green-400',
    success: 'bg-green-400',
    inactive: 'bg-gray-400',
    offline: 'bg-gray-400',
    pending: 'bg-yellow-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400',
  };

  const statusSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm overflow-hidden`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.textContent = fallback || getInitials(alt);
              }
            }}
          />
        ) : (
          <span>{fallback || getInitials(alt)}</span>
        )}
      </div>
      
      {status && (
        <div
          className={`absolute bottom-0 right-0 ${statusSize[size]} ${statusColors[status]} border-2 border-white rounded-full`}
        />
      )}
    </div>
  );
};