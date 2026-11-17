import { useDetailLayout, type DetailLayoutKind } from '../../store/detailLayoutStore';

/** Compact / Full switch for a details view; the choice is remembered per record type. */
export const LayoutToggle = ({ kind, onDark = false }: { kind: DetailLayoutKind; onDark?: boolean }) => {
  const [layout, setLayout] = useDetailLayout(kind);
  const base = 'px-2.5 py-1 text-xs font-medium transition-colors';
  const on = onDark ? 'bg-white text-gray-900' : 'bg-blue-600 text-white';
  const off = onDark ? 'text-white/80 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100';
  return (
    <div
      role="group"
      aria-label="Details layout"
      className={`inline-flex overflow-hidden rounded-md border ${onDark ? 'border-white/40' : 'border-gray-300'}`}
    >
      {(['compact', 'full'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={layout === value}
          onClick={() => setLayout(value)}
          className={`${base} ${layout === value ? on : off}`}
        >
          {value === 'compact' ? 'Compact' : 'Full'}
        </button>
      ))}
    </div>
  );
};
