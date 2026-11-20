// Ours: upstream has no unit test for this util; these cover the rules written in it.
import { describe, it, expect } from 'vitest';
import { hasCalendarEventChanged, type ComparableCalendarEvent } from '../has-calendar-event-changed.util';

const base: ComparableCalendarEvent = {
  id: 'e1',
  iCalUid: 'uid',
  title: 'Weekly sync',
  description: 'Agenda',
  startsAt: '2030-03-01T10:00:00+02:00',
  endsAt: '2030-03-01T11:00:00+02:00',
  location: '',
  isFullDay: false,
  isCanceled: false,
  conferenceSolution: 'meet',
  conferenceLink: { primaryLinkLabel: 'Meet', primaryLinkUrl: 'https://meet.example.com/a', secondaryLinks: [] }
};
const { id: _id, ...fetched } = base;

describe('hasCalendarEventChanged', () => {
  it('is false for the same event, even when the same instant is written differently', () => {
    expect(hasCalendarEventChanged({ existingCalendarEvent: base, calendarEvent: fetched })).toBe(false);
    expect(hasCalendarEventChanged({ existingCalendarEvent: { ...base, startsAt: new Date('2030-03-01T08:00:00Z') }, calendarEvent: fetched })).toBe(false);
  });

  it('treats null and empty text as equal', () => {
    expect(hasCalendarEventChanged({ existingCalendarEvent: { ...base, location: null }, calendarEvent: { ...fetched, location: '' } })).toBe(false);
  });

  it('is true when text, time, flags or the conference link change', () => {
    expect(hasCalendarEventChanged({ existingCalendarEvent: base, calendarEvent: { ...fetched, title: 'Renamed' } })).toBe(true);
    expect(hasCalendarEventChanged({ existingCalendarEvent: base, calendarEvent: { ...fetched, endsAt: '2030-03-01T12:00:00+02:00' } })).toBe(true);
    expect(hasCalendarEventChanged({ existingCalendarEvent: base, calendarEvent: { ...fetched, isCanceled: true } })).toBe(true);
    expect(hasCalendarEventChanged({ existingCalendarEvent: base, calendarEvent: { ...fetched, conferenceLink: { primaryLinkLabel: 'Meet', primaryLinkUrl: 'https://other' } } })).toBe(true);
  });

  it('is true when the stored event has extra conference links (they get cleared)', () => {
    expect(hasCalendarEventChanged({ existingCalendarEvent: { ...base, conferenceLink: { ...base.conferenceLink, secondaryLinks: [{}] } }, calendarEvent: fetched })).toBe(true);
  });
});
