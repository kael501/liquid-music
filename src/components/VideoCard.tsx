import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Equalizer } from './Equalizer';
import { TrackMenu } from './TrackMenu';
import { listItem, springSnappy } from '../lib/motion';
import { cn, formatTime } from '../lib/utils';
import type { Track } from '../types';

interface VideoCardProps {
  track: Track;
  active: boolean;
  playing: boolean;
  onPlay: () => void;
  className?: string;
}

/** 16:9 thumbnail card for videos (music uses square MediaCard / TrackRow instead). */
export function VideoCard({ track, active, playing, onPlay, className }: VideoCardProps) {
  return (
    <motion.div
      variants={listItem}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPlay();
      }}
      className={cn('group cursor-pointer outline-none', className)}
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/10 shadow-lg">
        <img src={track.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-orb transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-0">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          </span>
        </div>
        {track.duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold">
            {formatTime(track.duration)}
          </span>
        )}
        {active && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-emerald-300">
            <Equalizer active={playing} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-start gap-1 px-0.5">
        <div className="min-w-0 flex-1">
          <p className={cn('line-clamp-2 text-sm font-semibold leading-snug', active && 'text-emerald-300')}>{track.title}</p>
          <p className="mt-0.5 truncate text-xs text-white/55">{track.artist}</p>
        </div>
        <TrackMenu track={track} className="-mr-1 shrink-0" />
      </div>
    </motion.div>
  );
}
