/**
 * Ours (glue): import events from an .ics file (read in the browser, saved through calendarEventApi). Importing the same
 * file again skips events whose UID is already stored.
 */
import { useRef, useState } from 'react';
import { X } from 'lucide-react';

import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { calendarEventApi } from '../../services/api';
import { parseIcs, ICS_MAX_BYTES, type ParsedIcs } from '../../lib/calendar/ics';
import { parsedIcsToCreateInput } from '../../lib/calendar/icsEvents';
import { CalendarChannelVisibility } from '../../vendor/twenty/calendar/shared/CalendarChannelVisibility';

const PREVIEW_ROWS = 8;
/** File.text() where the browser has it, FileReader otherwise (older browsers). */
const readFileText = (file: File): Promise<string> =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error ?? new Error('read failed'));
        reader.readAsText(file);
      });

/** A duplicate-key error on the UID index (other unique constraints, if any, are real failures). */
const isUidConflict = (error: unknown): boolean => {
  // the error may be the database error itself or wrapped (`error.error`, `cause`)
  const e = error as { code?: string; message?: string; details?: string; error?: unknown; cause?: unknown } | null;
  if (!e) return false;
  const text = `${e.message ?? ''} ${e.details ?? ''}`;
  if (e.code === '23505' && text.includes('calendar_events_ical_uid_key')) return true;
  return (e.error ? isUidConflict(e.error) : false) || (e.cause ? isUidConflict(e.cause) : false);
};

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** called after events were saved (the calendar reloads its range) */
  onImported: () => void;
};

export const ImportCalendarDialog = ({ isOpen, onClose, onImported }: Props) => {
  const [parsed, setParsed] = useState<ParsedIcs | null>(null);
  const [fileName, setFileName] = useState('');
  const [readError, setReadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // a read of an older selection that finishes late must not replace the newest selection's data
  const selection = useRef(0);

  if (!isOpen) return null;

  const reset = () => {
    setParsed(null);
    setFileName('');
    setReadError(null);
    setResult(null);
  };

  const onFile = async (file: File | undefined) => {
    const mine = ++selection.current;
    reset();
    if (!file) return;
    setFileName(file.name);
    if (file.size > ICS_MAX_BYTES) {
      setReadError(`That file is larger than ${Math.round(ICS_MAX_BYTES / 1000)} KB.`);
      return;
    }
    try {
      const text = await readFileText(file);
      if (mine !== selection.current) return;
      const next = parseIcs(text);
      if (next.events.length === 0 && next.warnings.length === 0) setReadError('No events were found in that file.');
      setParsed(next);
    } catch (error) {
      console.error('Could not read the .ics file:', error);
      if (mine === selection.current) setReadError('That file could not be read.');
    }
  };

  const runImport = async () => {
    if (!parsed || parsed.events.length === 0) return;
    setBusy(true);
    setReadError(null);
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    try {
      const existing = await calendarEventApi.existingIcalUids(parsed.events.map((e) => e.uid));
      let visibility = CalendarChannelVisibility.SHARE_EVERYTHING;
      try {
        visibility = (await calendarEventApi.getSettings()).defaultVisibility;
      } catch {
        // the default visibility is only a preference
      }
      const timeZone = browserTimeZone();
      const seenInFile = new Set<string>();
      for (const event of parsed.events) {
        if (event.uid && (existing.has(event.uid) || seenInFile.has(event.uid))) {
          skipped += 1;
          continue;
        }
        if (event.uid) seenInFile.add(event.uid);
        try {
          await calendarEventApi.create(parsedIcsToCreateInput(event, timeZone, visibility));
          imported += 1;
        } catch (error) {
          // another import may have stored this UID after the lookup above: that is a skip, not a failure
          if (event.uid && isUidConflict(error) && (await calendarEventApi.existingIcalUids([event.uid]).catch(() => new Set<string>())).has(event.uid)) {
            skipped += 1;
            continue;
          }
          console.error('Could not import an event:', error);
          failed += 1;
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setReadError('The import could not be completed.');
    } finally {
      setBusy(false);
    }
    setResult({ imported, skipped, failed });
    if (imported > 0) onImported();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <div className="space-y-4 p-6 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import calendar (.ics)</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-gray-700 dark:text-gray-300">Calendar file</span>
            <input
              ref={input}
              type="file"
              accept=".ics,text/calendar"
              aria-label="Calendar file"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0])}
              className="block w-full text-sm text-gray-700 dark:text-gray-300"
            />
          </label>

          {readError && <p className="text-sm text-red-600">{readError}</p>}

          {parsed && parsed.events.length > 0 && !result && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-900 dark:text-gray-100">
                {parsed.events.length} event{parsed.events.length === 1 ? '' : 's'} found in {fileName}.
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-700">
                {parsed.events.slice(0, PREVIEW_ROWS).map((event, i) => (
                  <li key={`${event.uid}-${i}`} className="flex justify-between gap-3 text-gray-700 dark:text-gray-300">
                    <span className="truncate">{event.title}</span>
                    <span className="shrink-0 text-gray-500">{event.start.toLocaleDateString()}{event.rrule ? ' · repeats' : ''}</span>
                  </li>
                ))}
                {parsed.events.length > PREVIEW_ROWS && <li className="text-gray-500">and {parsed.events.length - PREVIEW_ROWS} more</li>}
              </ul>
            </div>
          )}

          {parsed && parsed.warnings.length > 0 && (
            <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
              {parsed.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {result && (
            <p role="status" className="text-sm text-gray-900 dark:text-gray-100">
              Imported {result.imported}
              {result.skipped > 0 ? `, skipped ${result.skipped} already in the calendar` : ''}
              {result.failed > 0 ? `, ${result.failed} could not be saved` : ''}.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {result ? 'Done' : 'Cancel'}
            </Button>
            {!result && (
              <Button size="sm" onClick={() => void runImport()} disabled={busy || !parsed || parsed.events.length === 0}>
                {busy ? 'Importing...' : 'Import'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
