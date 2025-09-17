import React from 'react';

interface AIToolModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const AIToolModal: React.FC<AIToolModalProps> = ({
  isOpen = false,
  onClose,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Tool</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>
        <div>
          {children || <p className="text-gray-600">AI Tool Modal - implementation needed</p>}
        </div>
      </div>
    </div>
  );
};

export default AIToolModal;