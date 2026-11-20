/**
 * Matching event guests to contacts by email.
 *
 * Ours (glue). Twenty does this in its server (`calendar-event-participant-manager` hands the handles to the generic
 * person/workspace-member matcher, which runs on its workspace schema and is not portable). The rule is the same:
 * a guest handle equal to a contact's email, ignoring case and surrounding spaces, is that contact.
 */
export interface GuestLike {
  handle: string;
  displayName?: string;
  contactId?: string;
}

export interface MatchableContact {
  id: string;
  email?: string | null;
}

export const normalizeHandle = (handle: string): string => handle.trim().toLowerCase();

/** `ilike` treats `_` and `%` as wildcards; escape them so an address only matches itself. */
export const escapeIlike = (value: string): string => value.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Fill in `contactId` for guests whose email is a contact's email. Guests that already have one keep it. */
export const matchGuestsToContacts = <G extends GuestLike>(guests: G[], contacts: MatchableContact[]): (G & { contactId?: string })[] => {
  const byEmail = new Map<string, string>();
  for (const contact of contacts) {
    const email = contact.email ? normalizeHandle(contact.email) : '';
    if (email && !byEmail.has(email)) byEmail.set(email, contact.id);
  }
  return guests.map((guest) => {
    if (guest.contactId) return guest;
    const id = byEmail.get(normalizeHandle(guest.handle));
    return id ? { ...guest, contactId: id } : guest;
  });
};

export interface RecordTarget {
  type: 'contact' | 'deal' | 'task';
  id: string;
}

/** The contact targets to add for matched guests, without repeating targets the event already has. */
export const contactTargetsForGuests = (guests: GuestLike[], existing: RecordTarget[]): RecordTarget[] => {
  const seen = new Set(existing.map((t) => `${t.type}:${t.id}`));
  const added: RecordTarget[] = [];
  for (const guest of guests) {
    if (!guest.contactId) continue;
    const key = `contact:${guest.contactId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    added.push({ type: 'contact', id: guest.contactId });
  }
  return added;
};
