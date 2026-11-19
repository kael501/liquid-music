import { motion } from 'framer-motion';
import { Home, Library, Search, Settings } from 'lucide-react';
import { useNav } from '../context/NavContext';
import { springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';
import type { View } from '../types';

type TabId = 'home' | 'search' | 'library' | 'settings';

const TABS: Array<{ id: TabId; label: string; icon: typeof Home; view: View }> = [
  { id: 'home', label: 'Home', icon: Home, view: { type: 'home' } },
  { id: 'search', label: 'Search', icon: Search, view: { type: 'search', query: '' } },
  { id: 'library', label: 'Library', icon: Library, view: { type: 'library' } },
  { id: 'settings', label: 'Settings', icon: Settings, view: { type: 'settings' } },
];

export function BottomNav() {
  const { view, navigate } = useNav();
  const active: TabId | null =
    view.type === 'home' ? 'home' : view.type === 'search' ? 'search' : view.type === 'settings' ? 'settings' : 'library';

  return (
    <nav
      aria-label="Primary"
      className="glass glass-thick fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid h-16 grid-cols-4 rounded-full px-1.5"
    >
      {TABS.map(({ id, label, icon: Icon, view: target }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => navigate(target)}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold transition-colors',
              selected ? 'text-white' : 'text-white/55',
            )}
          >
            {selected && (
              <motion.span
                layoutId="bottom-nav-pill"
                transition={springSnappy}
                className="absolute inset-x-1 inset-y-1.5 rounded-full bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
              />
            )}
            <motion.span whileTap={{ scale: 0.85 }} className="relative">
              <Icon className="h-[22px] w-[22px]" />
            </motion.span>
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
