import { create } from 'zustand';
import { Contact } from '../types';
import { contactApi, calendarEventApi } from '../services/api';
import { CALENDAR_DATA_CHANGED } from '../lib/calendarPreferences';

/** Tells open Calendar cards (a linked contact's included) to reload their timeline. */
export const notifyCalendarDataChanged = () => window.dispatchEvent(new Event(CALENDAR_DATA_CHANGED));

/**
 * Guests with this contact's email become the contact (best effort; never blocks saving the contact). Resolves to
 * true when events were linked. A batch (import) passes `notify: false` and calls `notifyCalendarDataChanged` once.
 */
export const linkGuests = async (contact: Contact, options: { notify?: boolean } = {}): Promise<boolean> => {
  try {
    const linked = await calendarEventApi.linkGuestsToContact(contact);
    if (linked > 0) {
      if (options.notify !== false) notifyCalendarDataChanged();
      return true;
    }
  } catch (error) {
    console.error('Failed to link calendar guests to the contact:', error);
  }
  return false;
};

interface ContactState {
  contacts: Record<string, Contact>;
  isLoading: boolean;
  error: string | null;
}

interface ContactActions {
  getContact: (id: string) => Contact | undefined;
  createContact: (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, contactData: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  importContacts: (contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  loadContacts: () => Promise<void>;
}

type ContactStore = ContactState & ContactActions;

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: {},
  isLoading: false,
  error: null,

  getContact: (id) => {
    return get().contacts[id];
  },

  createContact: async (contactData) => {
    set({ isLoading: true, error: null });
    try {
      const newContact = await contactApi.create(contactData);
      set((state) => ({
        contacts: { ...state.contacts, [newContact.id]: newContact },
        isLoading: false,
      }));
      void linkGuests(newContact);
    } catch (error) {
      console.error('Failed to create contact:', error);
      set({ error: 'Failed to create contact', isLoading: false });
    }
  },

  updateContact: async (id, contactData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedContact = await contactApi.update(id, contactData);
      set((state) => ({
        contacts: { ...state.contacts, [id]: updatedContact },
        isLoading: false,
      }));
      if (contactData.email !== undefined) void linkGuests(updatedContact);
    } catch (error) {
      console.error('Failed to update contact:', error);
      set({ error: 'Failed to update contact', isLoading: false });
    }
  },

  deleteContact: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await contactApi.delete(id);
      set((state) => {
        const { [id]: deleted, ...remainingContacts } = state.contacts;
        return {
          contacts: remainingContacts,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      set({ error: 'Failed to delete contact', isLoading: false });
    }
  },

  importContacts: async (contactsData) => {
    set({ isLoading: true, error: null });
    try {
      const newContacts = await Promise.all(
        contactsData.map(contactData => contactApi.create(contactData))
      );

      const contactsMap = newContacts.reduce((acc, contact) => {
        acc[contact.id] = contact;
        return acc;
      }, {} as Record<string, Contact>);

      set((state) => ({
        contacts: { ...state.contacts, ...contactsMap },
        isLoading: false,
      }));
      // imported contacts whose email matches an existing event guest get that guest's events too (best effort)
      // one notification for the whole batch, not one per contact
      void Promise.all(newContacts.map((contact) => linkGuests(contact, { notify: false }))).then((results) => {
        if (results.some(Boolean)) notifyCalendarDataChanged();
      });
    } catch (error) {
      console.error('Failed to import contacts:', error);
      set({ error: 'Failed to import contacts', isLoading: false });
    }
  },

  loadContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const contacts = await contactApi.getAll();
      const contactsMap = contacts.reduce((acc, contact) => {
        acc[contact.id] = contact;
        return acc;
      }, {} as Record<string, Contact>);

      set({
        contacts: contactsMap,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      set({ error: 'Failed to load contacts', isLoading: false });
    }
  },
}));