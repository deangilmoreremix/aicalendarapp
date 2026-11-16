import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import '@testing-library/jest-dom';

import { FilterBuilder } from './FilterBuilder';
import { TASK_FIELDS } from '../../lib/recordFilters/fields';
import type { FilterGroup } from '../../lib/recordFilters/types';

const Harness = ({ initial, spy }: { initial?: FilterGroup; spy?: (g: FilterGroup) => void }) => {
  const [g, setG] = useState<FilterGroup>(initial ?? { op: 'and', rules: [] });
  return <FilterBuilder fields={TASK_FIELDS} value={g} onChange={(n) => (spy?.(n), setG(n))} />;
};

describe('FilterBuilder', () => {
  it('adds a rule with the first field and its first operator', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    fireEvent.click(screen.getByRole('button', { name: /Add rule/ }));
    expect(screen.getByLabelText('Rule 1 field')).toHaveValue('title');
    expect(screen.getByLabelText('Rule 1 operator')).toHaveValue('contains');
    expect(spy.mock.calls[0][0].rules[0]).toMatchObject({ field: 'title', operand: 'contains' });
  });

  it('changing the field resets operator and value and offers that type\'s operators', () => {
    render(<Harness initial={{ op: 'and', rules: [{ id: 'a', field: 'title', operand: 'is', value: 'x' }] }} />);
    fireEvent.change(screen.getByLabelText('Rule 1 field'), { target: { value: 'dueDate' } });
    expect(screen.getByLabelText('Rule 1 operator')).toHaveValue('is');
    expect(screen.getByLabelText('Rule 1 value')).toHaveAttribute('type', 'date');
    expect((screen.getByLabelText('Rule 1 value') as HTMLInputElement).value).toBe('');
    const operators = Array.from((screen.getByLabelText('Rule 1 operator') as HTMLSelectElement).options).map((o) => o.value);
    expect(operators).toContain('next_n_days');
    expect(operators).not.toContain('contains');
  });

  it('shows no value box for operators that need none, and two boxes for "between"', () => {
    render(<Harness initial={{ op: 'and', rules: [{ id: 'a', field: 'dueDate', operand: 'today' }] }} />);
    expect(screen.queryByLabelText('Rule 1 value')).toBeNull();
    fireEvent.change(screen.getByLabelText('Rule 1 operator'), { target: { value: 'between' } });
    expect(screen.getByLabelText('Rule 1 value')).toBeInTheDocument();
    expect(screen.getByLabelText('Rule 1 second value')).toBeInTheDocument();
  });

  it('select fields offer their options; "is any of" uses checkboxes', () => {
    render(<Harness initial={{ op: 'and', rules: [{ id: 'a', field: 'status', operand: 'is' }] }} />);
    expect(screen.getByRole('option', { name: 'in progress' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Rule 1 operator'), { target: { value: 'is_any_of' } });
    fireEvent.click(screen.getByLabelText('pending'));
    fireEvent.click(screen.getByLabelText('completed'));
    expect(screen.getByLabelText('pending')).toBeChecked();
  });

  it('AND/OR switch appears with two rules; rules can be removed', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} initial={{ op: 'and', rules: [{ id: 'a', field: 'title', operand: 'contains' }, { id: 'b', field: 'status', operand: 'is' }] }} />);
    fireEvent.change(screen.getByLabelText('Match rules with'), { target: { value: 'or' } });
    expect(spy.mock.calls.at(-1)![0].op).toBe('or');
    fireEvent.click(screen.getByRole('button', { name: 'Remove rule 2' }));
    expect(screen.queryByLabelText('Rule 2 field')).toBeNull();
    expect(screen.queryByLabelText('Match rules with')).toBeNull();
  });
});
