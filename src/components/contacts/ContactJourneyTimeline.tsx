import React from 'react';
import type { Contact } from '../../types';

import { RecordTimeline } from './RecordTimeline';
import type { CalendarTargetType } from '../../services/api';

/** Real activity timeline for any record (contact, deal, task): see RecordTimeline. */
export const RecordActivityTimeline: React.FC<{ entityId: string; title?: string; entityType?: CalendarTargetType }> = ({ entityId, title = 'Activity', entityType }) => (
  <RecordTimeline entityId={entityId} entityType={entityType} title={title} />
);

export const ContactJourneyTimeline: React.FC<{ contact: Contact }> = ({ contact }) => (
  <RecordActivityTimeline entityId={contact.id} entityType="contact" title="Contact Journey Timeline" />
);
