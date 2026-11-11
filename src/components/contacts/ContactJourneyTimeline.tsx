import React, { useEffect, useState } from 'react';
import { Mail, Phone, Calendar, FileText, CheckCircle, Clock, Brain } from 'lucide-react';
import { activityApi } from '../../services/api';
import type { Activity, Contact } from '../../types';

const iconFor = (type: string) => {
  if (/email/.test(type)) return <Mail className="w-4 h-4" />;
  if (/call/.test(type)) return <Phone className="w-4 h-4" />;
  if (/meeting/.test(type)) return <Calendar className="w-4 h-4" />;
  if (/note|comment/.test(type)) return <FileText className="w-4 h-4" />;
  if (/task/.test(type)) return <CheckCircle className="w-4 h-4" />;
  if (/ai_/.test(type)) return <Brain className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
};

/** Real activity timeline for any record (contact, deal, task) from the Supabase `activities` table. */
export const RecordActivityTimeline: React.FC<{ entityId: string; title?: string }> = ({ entityId, title = 'Activity' }) => {
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    activityApi
      .getAll()
      .then(all => {
        if (cancelled) return;
        setItems(
          all
            .filter(a => a.entityId === entityId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        );
      })
      .catch(err => {
        console.error('Failed to load timeline:', err);
        if (!cancelled) setError('Could not load activity.');
      });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && items === null && <p className="text-sm text-gray-500">Loading...</p>}
      {items && items.length === 0 && <p className="text-sm text-gray-600">No activity recorded yet.</p>}
      {items && items.length > 0 && (
        <ol className="space-y-3">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-700">{iconFor(item.type)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                {item.description && <p className="text-sm text-gray-600 whitespace-pre-line">{item.description}</p>}
                <p className="text-xs text-gray-500">
                  {item.userName} · {item.createdAt.toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export const ContactJourneyTimeline: React.FC<{ contact: Contact }> = ({ contact }) => (
  <RecordActivityTimeline entityId={contact.id} title="Contact Journey Timeline" />
);
