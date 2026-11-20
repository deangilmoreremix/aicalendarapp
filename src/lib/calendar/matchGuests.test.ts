import { describe, it, expect } from 'vitest';
import { contactTargetsForGuests, escapeIlike, matchGuestsToContacts, normalizeHandle } from './matchGuests';

describe('matchGuestsToContacts', () => {
  const contacts = [
    { id: 'c1', email: 'Ada@Example.com ' },
    { id: 'c2', email: 'grace@example.com' },
    { id: 'c3', email: null }
  ];

  it('matches by email ignoring case and spaces', () => {
    const out = matchGuestsToContacts([{ handle: ' ada@example.COM' }, { handle: 'grace@example.com', displayName: 'Grace' }], contacts);
    expect(out.map((g) => g.contactId)).toEqual(['c1', 'c2']);
    expect(out[1].displayName).toBe('Grace');
  });

  it('leaves unknown guests and already linked guests alone', () => {
    const out = matchGuestsToContacts([{ handle: 'nobody@x.io' }, { handle: 'ada@example.com', contactId: 'keep' }], contacts);
    expect(out[0].contactId).toBeUndefined();
    expect(out[1].contactId).toBe('keep');
  });

  it('uses the first contact when two share an email', () => {
    const out = matchGuestsToContacts([{ handle: 'dup@x.io' }], [{ id: 'a', email: 'dup@x.io' }, { id: 'b', email: 'dup@x.io' }]);
    expect(out[0].contactId).toBe('a');
  });
});

describe('contactTargetsForGuests', () => {
  it('adds each matched contact once and skips targets the event already has', () => {
    const guests = [{ handle: 'a', contactId: 'c1' }, { handle: 'b', contactId: 'c1' }, { handle: 'c', contactId: 'c2' }, { handle: 'd' }];
    expect(contactTargetsForGuests(guests, [{ type: 'contact', id: 'c2' }, { type: 'deal', id: 'c1' }])).toEqual([{ type: 'contact', id: 'c1' }]);
  });
});

describe('helpers', () => {
  it('normalises handles and escapes ilike wildcards', () => {
    expect(normalizeHandle('  A@B.io ')).toBe('a@b.io');
    expect(escapeIlike('a_b%c\\d@x.io')).toBe('a\\_b\\%c\\\\d@x.io');
  });
});
