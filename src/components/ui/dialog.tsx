import React, { useEffect, useRef } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

// Open dialogs, oldest first: Escape closes only the top-most one.
const openDialogs: symbol[] = [];

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const id = useRef(Symbol('dialog'));
  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onOpenChange);
  onChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    const dialogId = id.current;
    openDialogs.push(dialogId);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openDialogs[openDialogs.length - 1] === dialogId) onChangeRef.current(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = openDialogs.indexOf(dialogId);
      if (i >= 0) openDialogs.splice(i, 1);
    };
  }, [open]);

  // Name the dialog after its first heading (the shared header component has no id to point aria-labelledby at)
  useEffect(() => {
    if (!open) return;
    const el = rootRef.current;
    const heading = el?.querySelector('h1, h2, h3');
    if (el && heading?.textContent) el.setAttribute('aria-label', heading.textContent.trim());
  });

  if (!open) return null;

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label="Dialog" className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => onOpenChange(false)} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ className = '', children }) => {
  return (
    <div className={`inline-block align-bottom bg-white rounded-2xl shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return (
    <h3 className="text-xl font-semibold text-white">
      {children}
    </h3>
  );
};