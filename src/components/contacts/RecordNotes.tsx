/**
 * Notes on a record (Twenty: notes on any record). Stored as `activities` rows of type `note_added` (body in
 * `description`, `metadata.pinned`), so they also show in the timeline. Markdown-lite formatting; no block editor.
 */
import { useEffect, useState } from 'react';
import { Pencil, Pin, Trash2 } from 'lucide-react';

import { activityApi } from '../../services/api';
import { useActivityVersionStore } from '../../store/activityVersionStore';
import { MarkdownLite } from '../../lib/timeline/markdownLite';
import type { Activity } from '../../types';

export type NoteEntityType = Activity['entityType'];

export const noteTitle = (body: string) => {
  const first = body.trim().split('\n')[0].replace(/[*`#\[\]()]/g, '').trim();
  return first.length > 60 ? `${first.slice(0, 57)}…` : first || 'Note';
};

export const RecordNotes = ({ entityType, entityId }: { entityType: NoteEntityType; entityId: string }) => {
  const version = useActivityVersionStore((s) => s.version);
  const bump = useActivityVersionStore((s) => s.bump);
  const [notes, setNotes] = useState<Activity[] | null>(null);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    activityApi
      .getForEntity(entityId)
      .then((all) => {
        if (cancelled) return;
        const mine = all.filter((a) => a.type === 'note_added');
        // pinned first, then newest
        mine.sort((a, b) => Number(!!b.metadata?.pinned) - Number(!!a.metadata?.pinned) || +b.createdAt - +a.createdAt);
        setNotes(mine);
      })
      .catch(() => !cancelled && setError('Could not load notes.'));
    return () => {
      cancelled = true;
    };
  }, [entityId, version]);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setError(null);
    try {
      await action();
      bump();
    } catch (err) {
      console.error(failure, err);
      setError(failure);
    }
  };

  const add = () =>
    draft.trim() &&
    run(async () => {
      await activityApi.create({
        type: 'note_added',
        title: noteTitle(draft),
        description: draft.trim(),
        userId: 'current-user',
        userName: 'You',
        entityType,
        entityId,
        metadata: {}
      });
      setDraft('');
    }, 'Could not save the note.');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Notes {notes && notes.length > 0 && <span className="text-sm font-normal text-gray-500">({notes.length})</span>}
      </h3>

      <div>
        <label htmlFor={`note-${entityId}`} className="sr-only">
          New note
        </label>
        <textarea
          id={`note-${entityId}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Write a note… (**bold**, *italic*, - lists, [links](https://…))"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => void add()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add note
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {notes === null && !error && <p className="text-sm text-gray-500">Loading...</p>}
      {notes && notes.length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>}

      <ul className="space-y-2">
        {notes?.map((note) => (
          <li key={note.id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            {editingId === note.id ? (
              <div>
                <textarea
                  aria-label="Edit note"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-gray-300 px-3 py-1 text-sm">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!editText.trim()}
                    onClick={() =>
                      void run(async () => {
                        await activityApi.update(note.id, { title: noteTitle(editText), description: editText.trim() });
                        setEditingId(null);
                      }, 'Could not save the note.')
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {note.metadata?.pinned && <Pin className="mr-1 inline h-3 w-3 text-amber-500" aria-label="Pinned" />}
                    <MarkdownLite text={note.description ?? note.title} />
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-gray-400">
                    <button
                      type="button"
                      aria-label={note.metadata?.pinned ? 'Unpin note' : 'Pin note'}
                      onClick={() => void run(() => activityApi.update(note.id, { metadata: { ...note.metadata, pinned: !note.metadata?.pinned } }), 'Could not update the note.')}
                      className="p-1 hover:text-amber-500"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Edit note"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditText(note.description ?? note.title);
                      }}
                      className="p-1 hover:text-gray-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete note"
                      onClick={() => {
                        if (window.confirm('Delete this note?')) void run(() => activityApi.delete(note.id), 'Could not delete the note.');
                      }}
                      className="p-1 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {note.userName} · {note.createdAt.toLocaleString()}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
