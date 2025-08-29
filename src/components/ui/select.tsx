import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      {React.Children.map(children, child => 
        React.cloneElement(child as React.ReactElement, { 
          value, 
          onValueChange, 
          isOpen, 
          setIsOpen 
        })
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps & { value?: string; isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  className = '', 
  children, 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      onClick={() => setIsOpen?.(!isOpen)}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps & { value?: string; onValueChange?: (value: string) => void; isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  children, 
  value, 
  onValueChange, 
  isOpen, 
  setIsOpen 
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div 
      ref={ref}
      className="absolute top-full mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white border border-gray-200 shadow-lg z-50 py-1"
    >
      {React.Children.map(children, child => 
        React.cloneElement(child as React.ReactElement, { 
          value, 
          onValueChange, 
          setIsOpen 
        })
      )}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & { onValueChange?: (value: string) => void; setIsOpen?: (open: boolean) => void }> = ({ 
  value, 
  children, 
  onValueChange, 
  setIsOpen 
}) => {
  const handleClick = () => {
    onValueChange?.(value);
    setIsOpen?.(false);
  };

  return (
    <button
      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps & { value?: string }> = ({ placeholder, value }) => {
  return <span>{value || placeholder}</span>;
};