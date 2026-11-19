import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';
import type { Track } from '../types';

interface LikeButtonProps {
  track: Track;
  className?: string;
  size?: number;
}

export function LikeButton({ track, className, size = 18 }: LikeButtonProps) {
  const { isLiked, toggleLike } = usePlayer();
  const liked = isLiked(track.id);

  return (
    <motion.button
      type="button"
      aria-label={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
      aria-pressed={liked}
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(track);
      }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full p-1.5 transition-colors',
        liked ? 'text-pink-400' : 'text-white/60 hover:text-white',
        className,
      )}
    >
      <motion.span
        key={liked ? 'on' : 'off'}
        initial={liked ? { scale: 0.4, rotate: -20 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 14, mass: 0.8 }}
        className="inline-flex"
      >
        <Heart width={size} height={size} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
      </motion.span>
      <AnimatePresence>
        {liked && (
          <motion.span
            key="ring"
            className="pointer-events-none absolute inset-0 rounded-full border border-pink-300/70"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
