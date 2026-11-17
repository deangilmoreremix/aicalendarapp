import type { ReactNode } from 'react';

/**
 * Content wrapper for the calendar dropdown menus. The shared DropdownMenuContent injects a `setIsOpen` prop into its
 * direct children; a plain <div> would leak it onto the DOM, so this component absorbs it.
 */
export const MenuPanel = ({ className, children }: { className?: string; children: ReactNode; setIsOpen?: unknown }) => (
  <div className={className}>{children}</div>
);
