import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { sheenHandlers } from '../lib/sheen';
import { listItem, springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';

interface MediaCardProps {
  title: string;
  subtitle: string;
  cover: string;
  active?: boolean;
  playing?: boolean;
  round?: boolean;
  onOpen: () => void;
  onPlay: () => void;
}

export function MediaCard({ title, subtitle, cover, active, playing, round, onOpen, onPlay }: MediaCardProps) {
  return (
    <motion.div
      variants={listItem}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      {...sheenHandlers}
      className="glass glass-thin glass-sheen group w-[168px] shrink-0 cursor-pointer snap-start rounded-3xl p-3 outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:w-[184px]"
    >
      <div className="relative z-10">
        <Artwork
          src={cover}
          alt=""
          className={cn(
            'aspect-square w-full shadow-[0_12px_30px_-8px_rgba(0,0,0,0.6)]',
            round ? 'rounded-full' : 'rounded-2xl',
          )}
        />
        <motion.button
          type="button"
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          initial={false}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-orb transition-all duration-300',
            active ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100',
          )}
        >
          {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </motion.button>
      </div>
      <div className="relative z-10 mt-3 min-w-0 px-1">
        <div className="flex items-center gap-2">
          {active && <Equalizer active={Boolean(playing)} className="shrink-0 text-emerald-300" />}
          <p className="truncate text-sm font-semibold text-white">{title}</p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/55">{subtitle}</p>
      </div>
    </motion.div>
  );
}
