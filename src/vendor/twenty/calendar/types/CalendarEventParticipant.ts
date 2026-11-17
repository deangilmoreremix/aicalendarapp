/**
 * Ported from twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/types/CalendarEventParticipant.ts
 * Changes: Person/WorkspaceMember imports replaced by local structural types.
 */
type Person = { id: string; avatarUrl?: string; name?: { firstName?: string; lastName?: string } };
type WorkspaceMember = { id: string; avatarUrl?: string; name: { firstName: string; lastName: string } };

export type CalendarEventParticipant = {
  id: string;
  handle: string;
  isOrganizer: boolean;
  displayName: string;
  person?: Person;
  workspaceMember?: WorkspaceMember;
  responseStatus: 'ACCEPTED' | 'DECLINED' | 'NEEDS_ACTION' | 'TENTATIVE';
};
