import { AnimatePresence, motion } from 'framer-motion';
import {
  ListMusic,
  Loader2,
  Maximize2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Artwork } from './Artwork';
import { LikeButton } from './LikeButton';
import { PlaybackMenu } from './PlaybackMenu';
import { Slider } from './Slider';
import { TrackMenu } from './TrackMenu';
import { Waveform } from './Waveform';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';
import { usePlaybackTime } from '../hooks/useAudioPlayer';
import { spring, springSnappy } from '../lib/motion';
import { cn, formatTime } from '../lib/utils';

export function TransportControls({ size = 'md', showAll = false }: { size?: 'md' | 'lg'; showAll?: boolean }) {
  const { shuffle, repeat, isPlaying, isBuffering, toggleShuffle, cycleRepeat, prev, next, togglePlay } = usePlayer();
  const orb = size === 'lg' ? 'h-16 w-16' : 'h-11 w-11';
  const icon = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';
  const side = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const sideIcon = size === 'lg' ? 'h-6 w-6' : 'h-[18px] w-[18px]';
  const extra = showAll ? 'inline-flex' : 'hidden lg:inline-flex';

  return (
    <div className={cn('flex items-center', size === 'lg' ? 'gap-3 sm:gap-5' : 'gap-2 lg:gap-3')}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={toggleShuffle}
        aria-label="Shuffle"
        aria-pressed={shuffle}
        data-active={shuffle}
        className={cn('glass-btn', extra, side)}
      >
        <Shuffle className={sideIcon} />
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={prev}
        aria-label="Previous track"
        className={cn('glass-btn', side)}
      >
        <SkipBack className={sideIcon} fill="currentColor" />
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.92 }}
        transition={springSnappy}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={cn('relative flex items-center justify-center rounded-full bg-white text-black shadow-orb', orb)}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isBuffering ? (
            <motion.span
              key="spin"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.12 }}
            >
              <Loader2 className={cn(icon, 'animate-spin')} />
            </motion.span>
          ) : (
            <motion.span
              key={isPlaying ? 'pause' : 'play'}
              initial={{ opacity: 0, scale: 0.4, rotate: -40 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.4, rotate: 40 }}
              transition={{ duration: 0.16 }}
            >
              {isPlaying ? (
                <Pause className={icon} fill="currentColor" />
              ) : (
                <Play className={cn(icon, 'ml-0.5')} fill="currentColor" />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={next}
        aria-label="Next track"
        className={cn('glass-btn', side)}
      >
        <SkipForward className={sideIcon} fill="currentColor" />
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={cycleRepeat}
        aria-label={`Repeat: ${repeat}`}
        data-active={repeat !== 'off'}
        className={cn('glass-btn', extra, side)}
      >
        {repeat === 'one' ? <Repeat1 className={sideIcon} /> : <Repeat className={sideIcon} />}
      </motion.button>
    </div>
  );
}

export function ProgressBar({ className }: { className?: string }) {
  const { current, timeStore, seek } = usePlayer();
  const { current: time, duration, buffered } = usePlaybackTime(timeStore);
  const total = duration || current?.duration || 0;
  const { settings } = useSettings();
  const progress = total ? Math.min(time / total, 1) : 0;

  return (
    <div className={cn('flex w-full items-center gap-3 text-[11px] tabular-nums text-white/55', className)}>
      <span className="w-9 text-right">{formatTime(time)}</span>
      {settings.progressStyle === 'waveform' && current ? (
        <div className="min-w-0 flex-1">
          <Waveform
            seed={current.id}
            progress={progress}
            bars={56}
            onCommit={(v) => seek(v * total)}
            formatTooltip={(v) => formatTime(v * total)}
          />
        </div>
      ) : (
        <Slider
          label="Seek"
          className="flex-1"
          value={progress}
          buffered={total ? buffered / total : 0}
          onCommit={(v) => seek(v * total)}
          formatTooltip={(v) => formatTime(v * total)}
          step={total ? Math.min(5 / total, 0.1) : 0.02}
        />
      )}
      <span className="w-9">{formatTime(total)}</span>
    </div>
  );
}

export function VolumeControl({ className }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="glass-btn h-9 w-9"
      >
        <Icon className="h-[18px] w-[18px]" />
      </motion.button>
      <Slider label="Volume" className="w-24" value={level} onChange={setVolume} step={0.05} />
    </div>
  );
}

export function PlayerDock() {
  const { current, isPlaying, playbackError, rightPanel, fullscreen, toggleRightPanel, setFullscreen } = usePlayer();

  return (
    <motion.footer
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
      className="glass glass-thick fixed inset-x-3 bottom-3 z-40 mx-auto h-[84px] max-w-[1180px] rounded-full px-4 sm:inset-x-4 sm:bottom-4 sm:px-5"
      aria-label="Player"
    >
      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* left: now playing */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl blur-xl"
              style={{ background: 'var(--c1)' }}
              animate={isPlaying ? { opacity: [0.35, 0.8, 0.35], scale: [1, 1.3, 1] } : { opacity: 0, scale: 1 }}
              transition={isPlaying ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
            />
            {!fullscreen ? (
              <motion.button
                layoutId="player-art"
                type="button"
                onClick={() => setFullscreen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open full-screen player"
                className="relative block h-14 w-14 overflow-hidden rounded-2xl shadow-lg"
                style={{ borderRadius: 16 }}
              >
                <Artwork src={current?.cover ?? ''} alt="" className="h-full w-full" />
              </motion.button>
            ) : (
              <div className="relative h-14 w-14 rounded-2xl bg-white/10" />
            )}
          </div>
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current?.id ?? 'none'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
              >
                <p className="truncate text-sm font-semibold">{current?.title ?? 'Nothing playing'}</p>
                <p className={cn('truncate text-xs', playbackError ? 'text-amber-300' : 'text-white/55')}>
                  {playbackError ?? current?.artist ?? 'Pick something to play'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          {current && <LikeButton track={current} className="hidden sm:inline-flex" />}
          {current && <TrackMenu track={current} className="hidden xl:inline-flex" />}
        </div>

        {/* center: transport + scrubber */}
        <div className="flex flex-col items-center gap-0.5">
          <TransportControls />
          <ProgressBar className="hidden lg:flex" />
        </div>

        {/* right: panels + volume */}
        <div className="hidden items-center justify-end gap-1 lg:flex">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleRightPanel('lyrics')}
            aria-label="Lyrics"
            aria-pressed={rightPanel === 'lyrics'}
            data-active={rightPanel === 'lyrics'}
            className="glass-btn h-9 w-9"
          >
            <Mic2 className="h-[18px] w-[18px]" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleRightPanel('queue')}
            aria-label="Queue"
            aria-pressed={rightPanel === 'queue'}
            data-active={rightPanel === 'queue'}
            className="glass-btn h-9 w-9"
          >
            <ListMusic className="h-[18px] w-[18px]" />
          </motion.button>
          <PlaybackMenu />
          <VolumeControl />
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setFullscreen(true)}
            aria-label="Full-screen player"
            className="glass-btn h-9 w-9"
          >
            <Maximize2 className="h-[18px] w-[18px]" />
          </motion.button>
        </div>
      </div>
    </motion.footer>
  );
}
