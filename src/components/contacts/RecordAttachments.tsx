/**
 * Files on a record (Twenty: attachments). Pick or drop files; they are stored in the private Supabase Storage bucket
 * and downloaded through short-lived signed links. Uploads and removals show up in the record timeline.
 */
import { useEffect, useRef, useState } from 'react';
import { Download, File as FileIcon, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

import { activityApi, attachmentApi, MAX_ATTACHMENT_BYTES, type Attachment } from '../../services/api';
import { useActivityVersionStore } from '../../store/activityVersionStore';

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export const RecordAttachments = ({ entityType, entityId }: { entityType: Attachment['entityType']; entityId: string }) => {
  const bump = useActivityVersionStore((s) => s.bump);
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = () =>
    attachmentApi
      .list(entityId)
      .then(setItems)
      .catch(() => setError('Could not load files.'));

  useEffect(() => {
    setItems(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    const failures: string[] = [];
    for (const file of list) {
      setBusy(file.name);
      try {
        const saved = await attachmentApi.upload(entityType, entityId, file);
        // the timeline entry is a convenience; a failure there must not undo the upload
        await activityApi
          .create({ type: 'file_uploaded', title: `File added: ${saved.name}`, description: formatBytes(saved.size), userId: 'current-user', userName: 'You', entityType, entityId, metadata: { attachmentId: saved.id } })
          .then(bump)
          .catch(() => undefined);
      } catch (err) {
        failures.push(err instanceof Error ? err.message : `Could not upload "${file.name}".`);
      }
    }
    setBusy(null);
    if (failures.length) setError(failures.join(' '));
    await load();
  };

  const download = async (a: Attachment) => {
    setError(null);
    try {
      const url = await attachmentApi.getDownloadUrl(a.storagePath, a.name);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError(`Could not download "${a.name}".`);
    }
  };

  const remove = async (a: Attachment) => {
    if (!window.confirm(`Delete "${a.name}"?`)) return;
    setError(null);
    try {
      await attachmentApi.remove(a);
      setItems((cur) => cur?.filter((x) => x.id !== a.id) ?? null);
    } catch {
      setError(`Could not delete "${a.name}".`);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Files {items && items.length > 0 && <span className="text-sm font-normal text-gray-500">({items.length})</span>}
      </h3>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 dark:border-gray-600'}`}
      >
        <Upload className="h-5 w-5 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-300">Drop files here or</p>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => input.current?.click()}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Choose files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          aria-label="Choose files to attach"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-xs text-gray-400">Up to {formatBytes(MAX_ATTACHMENT_BYTES)} each</p>
        {busy && <p role="status" className="text-xs text-gray-500">Uploading {busy}…</p>}
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {items === null && !error && <p className="text-sm text-gray-500">Loading...</p>}
      {items && items.length === 0 && <p className="text-sm text-gray-500">No files yet.</p>}

      <ul className="space-y-2">
        {items?.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            {a.mimeType?.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-blue-600" /> : <FileIcon className="h-4 w-4 text-blue-600" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{a.name}</p>
              <p className="text-xs text-gray-500">
                {formatBytes(a.size)} · {a.createdAt.toLocaleDateString()}
              </p>
            </div>
            <button type="button" aria-label={`Download ${a.name}`} onClick={() => void download(a)} className="p-1 text-gray-400 hover:text-gray-700">
              <Download className="h-4 w-4" />
            </button>
            <button type="button" aria-label={`Delete ${a.name}`} onClick={() => void remove(a)} className="p-1 text-gray-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
