import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { ModernButton } from './ModernButton';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  contactName?: string;
  contactId?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onAvatarChange,
  size = 'md',
  contactName,
  contactId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, you would upload to a server
      // For now, we'll create a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onAvatarChange(result);
        setIsUploading(false);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
      setIsUploading(false);
    }
  };

  const handleFindNewImage = async () => {
    setIsUploading(true);
    try {
      // Simulate finding a new image
      // In a real app, this would call an AI service to find a professional image
      const newImageUrl = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`;
      onAvatarChange(newImageUrl);
      setIsUploading(false);
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to find new image:', error);
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange('');
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer relative group`}
        onClick={() => setShowOptions(!showOptions)}
      >
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt={contactName || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {getInitials(contactName)}
          </div>
        )}

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Options menu */}
      {showOptions && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>

            <button
              onClick={handleFindNewImage}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2"
              disabled={isUploading}
            >
              <Camera className="w-4 h-4" />
              <span>Find New Image</span>
            </button>

            {currentAvatar && (
              <button
                onClick={handleRemoveAvatar}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Click outside to close */}
      {showOptions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};