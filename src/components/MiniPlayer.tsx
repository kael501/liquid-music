import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pause, Play, SkipForward } from 'lucide-react';
import { Artwork } from './Artwork';
import { LikeButton } from './LikeButton';
import { usePlayer } from '../context/PlayerContext';
import { usePlaybackTime } from '../hooks/useAudioPlayer';
import { spring, springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';

/** Compact player that floats above the bottom navigation on phones. */
export function MiniPlayer() {
  const { current, isPlaying, isBuffering, fullscreen, setFullscreen, togglePlay, next, playbackError, timeStore } =
    usePlayer();
  const { current: time, duration } = usePlaybackTime(timeStore);
  const total = duration || current?.duration || 0;
  const progress = total ? Math.min(time / total, 1) : 0;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
      className="glass glass-thick fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)] z-40 h-[62px] overflow-hidden rounded-3xl"
    >
      <div className="relative z-10 flex h-full items-center gap-3 pl-2 pr-2">
        <div className="relative shrink-0">
          {!fullscreen ? (
            <motion.button
              layoutId="player-art"
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="Open full-screen player"
              className="relative block h-11 w-11 overflow-hidden shadow-lg"
              style={{ borderRadius: 14 }}
            >
              <Artwork src={current?.cover ?? ''} alt="" className="h-full w-full" />
            </motion.button>
          ) : (
            <div className="h-11 w-11 rounded-2xl bg-white/10" />
          )}
        </div>

        <button type="button" onClick={() => setFullscreen(true)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold">{current?.title ?? 'Nothing playing'}</p>
          <p className={cn('truncate text-xs', playbackError ? 'text-amber-300' : 'text-white/55')}>
            {playbackError ?? current?.artist ?? 'Pick something to play'}
          </p>
        </button>

        {current && <LikeButton track={current} />}

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-orb"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isBuffering ? 'spin' : isPlaying ? 'pause' : 'play'}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.12 }}
            >
              {isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={next}
          aria-label="Next track"
          className="glass-btn h-9 w-9 shrink-0"
        >
          <SkipForward className="h-5 w-5" fill="currentColor" />
        </motion.button>
      </div>

      <div className="absolute inset-x-3 bottom-1 z-10 h-[3px] overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%`, transition: 'width 220ms linear' }} />
      </div>
    </motion.div>
  );
}
