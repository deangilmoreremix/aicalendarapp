import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommandMenuButton } from './CommandMenu';

describe('accessible names', () => {
  it('command menu button name contains its visible text', () => {
    render(<CommandMenuButton isDark={false} />);
    const btn = screen.getByRole('button', { name: /Open command menu/ });
    expect(btn.textContent).toContain('Ctrl K');
    expect(btn.getAttribute('aria-label')).toBeNull();
  });
});
