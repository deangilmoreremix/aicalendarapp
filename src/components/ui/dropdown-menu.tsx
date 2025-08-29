import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  align?: 'start' | 'end' | 'center';
  className?: string;
  children: React.ReactNode;
}

interface DropdownMenuItemProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

interface DropdownMenuCheckboxItemProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return (
    <div className="relative">
      {React.Children.map(children, child => 
        React.cloneElement(child as React.ReactElement, { 
          isOpen, 
          setIsOpen 
        })
      )}
    </div>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  children, 
  isOpen, 
  setIsOpen 
}) => {
  return (
    <div onClick={() => setIsOpen?.(!isOpen)}>
      {children}
    </div>
  );
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps & { isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  align = 'start', 
  className = '', 
  children, 
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

  const alignmentClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div 
      ref={ref}
      className={`absolute top-full mt-2 min-w-[160px] rounded-xl bg-white border border-gray-200 shadow-lg z-50 py-1 ${alignmentClasses[align]} ${className}`}
    >
      {React.Children.map(children, child => 
        React.cloneElement(child as React.ReactElement, { setIsOpen })
      )}
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps & { setIsOpen?: (open: boolean) => void }> = ({ 
  onClick, 
  className = '', 
  children, 
  setIsOpen 
}) => {
  const handleClick = () => {
    onClick?.();
    setIsOpen?.(false);
  };

  return (
    <button
      className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({ 
  checked, 
  onCheckedChange, 
  children 
}) => {
  return (
    <button
      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
      onClick={() => onCheckedChange?.(!checked)}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{children}</span>
    </button>
  );
};

export const DropdownMenuSeparator: React.FC = () => {
  return <div className="my-1 h-px bg-gray-200" />;
};