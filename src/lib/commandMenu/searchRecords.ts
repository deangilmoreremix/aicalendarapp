/**
 * Record search for the command menu. Ours (glue): scored matching over this app's records. The scoring rules
 * (title beats subtitle; starts-with beats word-start beats contains; every query word must match) are simple on purpose.
 */
export type SearchableType = 'task' | 'deal' | 'contact' | 'event';

export interface Searchable {
  type: SearchableType;
  id: string;
  title: string;
  subtitle?: string;
  favorite?: boolean;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
// split on anything that is not a letter or digit in any script (so 张伟, Иван and Ada all give words)
const words = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Score of one query word against one text (0 = no match). */
const wordScore = (q: string, text: string): number => {
  const t = norm(text);
  if (!t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (words(text).some((w) => w.startsWith(q))) return 60;
  if (t.includes(q)) return 40;
  return 0;
};

export const scoreRecord = (query: string, record: Searchable): number => {
  const qs = words(query);
  if (qs.length === 0) return 0;
  let total = 0;
  for (const q of qs) {
    const inTitle = wordScore(q, record.title);
    const inSub = Math.floor(wordScore(q, record.subtitle ?? '') / 2);
    const best = Math.max(inTitle, inSub);
    if (best === 0) return 0; // every word has to match something
    total += best;
  }
  return total + (record.favorite ? 5 : 0);
};

export const searchRecords = (query: string, records: Searchable[], limit = 8): Searchable[] =>
  records
    .map((record) => ({ record, score: scoreRecord(query, record) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, limit)
    .map((r) => r.record);

export interface CommandDef {
  id: string;
  label: string;
  keywords?: string;
  run: () => void;
}

export const searchCommands = (query: string, commands: CommandDef[], limit = 8): CommandDef[] => {
  const q = query.trim();
  if (!q) return commands.slice(0, limit);
  return commands
    .map((command) => ({ command, score: scoreRecord(q, { type: 'task', id: command.id, title: command.label, subtitle: command.keywords }) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.command);
};

const RECENT_KEY = 'ai-calendar:command-recent';

export const readRecent = (): { type: SearchableType; id: string }[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r.id === 'string' && typeof r.type === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
};

export const rememberRecent = (item: { type: SearchableType; id: string }) => {
  try {
    const next = [item, ...readRecent().filter((r) => !(r.type === item.type && r.id === item.id))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* not remembered */
  }
};
