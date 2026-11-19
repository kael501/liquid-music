import { motion } from 'framer-motion';
import { Radio, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { ytMusicService } from '../services/ytMusicService';
import { listContainer, listItem, springSnappy } from '../lib/motion';
import { sheenHandlers } from '../lib/sheen';
import { cn } from '../lib/utils';

/** Pick a mood once; every following song is chosen at random from that mood. */
export function MoodPicker() {
  const { mood, playMood, clearMood } = usePlayer();
  const moods = ytMusicService.getMoods();

  return (
    <motion.section variants={listItem} className="mt-8" aria-label="Pilih suasana">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pilih suasana</h2>
          <p className="mt-0.5 text-sm text-white/55">Lagu berikutnya otomatis dipilih acak sesuai suasana.</p>
        </div>
        {mood && (
          <button
            type="button"
            onClick={clearMood}
            className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20"
          >
            Matikan
          </button>
        )}
      </div>

      <motion.div variants={listContainer} className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 pb-2 pt-1">
        {moods.map((m) => {
          const active = mood === m.id;
          return (
            <motion.button
              key={m.id}
              type="button"
              variants={listItem}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={() => (active ? clearMood() : playMood(m.id))}
              aria-pressed={active}
              {...sheenHandlers}
              className={cn(
                'glass glass-sheen relative h-24 w-36 shrink-0 overflow-hidden rounded-3xl p-3.5 text-left',
                active && 'ring-2 ring-white/80',
              )}
              style={{ background: `linear-gradient(135deg, ${m.from}d9, ${m.to}b3)` }}
            >
              <span className="relative z-10 block text-lg font-bold tracking-tight">{m.label}</span>
              <span className="relative z-10 mt-0.5 block text-xs text-white/75">{m.description}</span>
              {active && (
                <span className="absolute bottom-2.5 right-3 z-10 flex items-center gap-1 text-[11px] font-semibold">
                  <Radio className="h-3.5 w-3.5" /> Aktif
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

/** Small pill that shows the active mood with a stop button. Renders nothing when no mood is active. */
export function MoodBadge({ className }: { className?: string }) {
  const { mood, clearMood } = usePlayer();
  if (!mood) return null;
  const label = ytMusicService.getMoods().find((m) => m.id === mood)?.label ?? mood;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white/12 py-1 pl-2.5 pr-1.5 text-xs font-semibold',
        className,
      )}
    >
      <Radio className="h-3.5 w-3.5 text-emerald-300" />
      Suasana {label}
      <button
        type="button"
        aria-label="Matikan mode suasana"
        onClick={clearMood}
        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
