/** Home block: starred tasks, deals and contacts, in the same card style as the other home blocks. */
import { useEffect } from 'react';
import { Handshake, ListChecks, Star, User } from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';
import { useTaskStore } from '../store/taskStore';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useOpenRecordStore, type OpenableRecordType } from '../store/openRecordStore';

type Fav = { type: OpenableRecordType; id: string; title: string; hint: string };

export const useFavorites = (): Fav[] => {
  const tasks = useTaskStore((s) => s.tasks);
  const deals = useDealStore((s) => s.deals);
  const contacts = useContactStore((s) => s.contacts);
  const out: Fav[] = [];
  for (const t of Object.values(tasks)) if (t.isFavorite) out.push({ type: 'task', id: t.id, title: t.title, hint: t.status });
  for (const d of Object.values(deals)) if (d.isFavorite) out.push({ type: 'deal', id: d.id, title: d.company, hint: d.stage });
  for (const c of Object.values(contacts)) if (c.isFavorite) out.push({ type: 'contact', id: c.id, title: c.name, hint: c.company });
  return out;
};

const ICON = { task: ListChecks, deal: Handshake, contact: User, event: Star };

export const FavoritesPanel = () => {
  const { isDark } = useTheme();
  const favorites = useFavorites();
  const open = useOpenRecordStore((s) => s.open);
  const loadDeals = useDealStore((s) => s.loadDeals);
  useEffect(() => {
    if (Object.keys(useDealStore.getState().deals).length === 0) void loadDeals();
  }, [loadDeals]);
  if (favorites.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className={`mb-4 flex items-center gap-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <Star className="h-5 w-5 fill-current text-amber-500" /> Favorites
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((f) => {
          const Icon = ICON[f.type];
          return (
            <li key={`${f.type}:${f.id}`}>
              <button
                type="button"
                onClick={() => open(f.type, f.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left shadow-sm transition-colors ${
                  isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-100 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{f.title}</span>
                  <span className={`block truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {f.type} · {f.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
