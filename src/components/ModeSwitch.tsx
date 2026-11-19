import { motion } from 'framer-motion';
import { Music2, Clapperboard } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';
import type { ContentMode } from '../types';

const OPTIONS: Array<{ id: ContentMode; label: string; icon: typeof Music2 }> = [
  { id: 'music', label: 'Musik', icon: Music2 },
  { id: 'video', label: 'Video', icon: Clapperboard },
];

/** Switches the whole app between music and video, so the two are never mixed in one list. */
export function ModeSwitch({ className }: { className?: string }) {
  const { settings, update } = useSettings();
  return (
    <div role="tablist" aria-label="Jenis konten" className={cn('glass glass-thin inline-flex rounded-full p-1', className)}>
      {OPTIONS.map((o) => {
        const active = settings.mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => update({ mode: o.id })}
            className={cn(
              'relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors',
              active ? 'text-black' : 'text-white/75 hover:text-white',
            )}
          >
            {active && (
              <motion.span layoutId="mode-switch" transition={springSnappy} className="absolute inset-0 rounded-full bg-white" />
            )}
            <o.icon className="relative h-4 w-4" />
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
