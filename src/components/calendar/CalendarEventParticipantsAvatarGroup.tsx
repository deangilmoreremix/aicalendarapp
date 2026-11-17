/**
 * Port of twentyhq/twenty (AGPL-3.0, used with permission) @ f5cfa249c9fa
 * Source: packages/twenty-front/src/modules/activities/calendar/components/CalendarEventParticipantsAvatarGroup.tsx
 * Logic follows upstream; styling uses this app's Tailwind design instead of Linaria/twenty-ui.
 */
import { isNonEmptyString } from '@sniptt/guards';

import { type CalendarEventParticipant } from '../../vendor/twenty/calendar/types/CalendarEventParticipant';
import { isTimelineCalendarEventParticipant } from '../../vendor/twenty/calendar/types/guards/IsTimelineCalendarEventParticipant';
import { type TimelineCalendarEventParticipant } from '../../vendor/twenty/calendar/types/generated';
import { initialsAvatar } from '../../utils/avatars';

type CalendarEventParticipantsAvatarGroupProps = {
  participants: CalendarEventParticipant[] | TimelineCalendarEventParticipant[];
};

const MAX_VISIBLE_AVATARS = 4;

export const CalendarEventParticipantsAvatarGroup = ({
  participants
}: CalendarEventParticipantsAvatarGroupProps) => {
  // Same participant normalisation as upstream
  const timelineParticipants: TimelineCalendarEventParticipant[] = participants.map((participant) => {
    if (isTimelineCalendarEventParticipant(participant)) {
      return participant;
    }
    return {
      personId: participant.person?.id ?? null,
      workspaceMemberId: participant.workspaceMember?.id ?? null,
      firstName: participant.person?.name?.firstName || participant.workspaceMember?.name.firstName || '',
      lastName: participant.person?.name?.lastName || participant.workspaceMember?.name.lastName || '',
      displayName:
        participant.person?.name?.firstName ||
        participant.person?.name?.lastName ||
        participant.workspaceMember?.name.firstName ||
        participant.workspaceMember?.name.lastName ||
        participant.displayName ||
        participant.handle ||
        '',
      avatarUrl: participant.person?.avatarUrl || participant.workspaceMember?.avatarUrl || '',
      handle: participant.handle
    };
  });

  const visible = timelineParticipants.slice(0, MAX_VISIBLE_AVATARS);
  const hidden = timelineParticipants.length - visible.length;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((participant) => {
        const participantName =
          isNonEmptyString(participant.firstName) && isNonEmptyString(participant.lastName)
            ? `${participant.firstName} ${participant.lastName}`
            : participant.displayName;

        return (
          <img
            key={[participant.workspaceMemberId, participant.personId, participant.handle, participant.displayName]
              .filter(Boolean)
              .join('-')}
            src={participant.avatarUrl || initialsAvatar(participantName || participant.handle, 48)}
            alt={participantName}
            title={participantName}
            className="h-6 w-6 rounded-full border-2 border-white object-cover dark:border-gray-900"
          />
        );
      })}
      {hidden > 0 && (
        <span className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs text-gray-600 dark:border-gray-900 dark:bg-gray-700 dark:text-gray-200">
          +{hidden}
        </span>
      )}
    </div>
  );
};
