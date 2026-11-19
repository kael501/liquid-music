import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ListMusic, Mic2, Music2 } from 'lucide-react';
import { Artwork } from './Artwork';
import { LikeButton } from './LikeButton';
import { LyricsView } from './LyricsView';
import { MoodBadge } from './MoodPicker';
import { PlaybackMenu } from './PlaybackMenu';
import { VideoSlot } from './VideoSlot';
import { ProgressBar, TransportControls, VolumeControl } from './PlayerDock';
import { usePlayer } from '../context/PlayerContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { spring } from '../lib/motion';

export function FullScreenPlayer() {
  const { current, fullscreen, setFullscreen, isPlaying, toggleRightPanel } = usePlayer();
  const wide = useMediaQuery('(min-width: 1024px)');
  const [lyricsOpen, setLyricsOpen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, setFullscreen]);

  const isVideo = current?.kind === 'video';
  const showLyricsPane = !isVideo && (wide || lyricsOpen);
  const showArtPane = isVideo || wide || !lyricsOpen;
  const colWidth = isVideo ? 'max-w-3xl' : 'max-w-md';

  return (
    <AnimatePresence>
      {fullscreen && current && (
        <motion.div
          key="fullscreen-player"
          role="dialog"
          aria-modal="true"
          aria-label="Now playing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 overflow-hidden bg-[#07070c]/55 backdrop-blur-3xl backdrop-saturate-150"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 60% at 25% 30%, color-mix(in srgb, var(--c1) 40%, transparent), transparent), radial-gradient(50% 50% at 80% 80%, color-mix(in srgb, var(--c2) 35%, transparent), transparent)',
            }}
          />

          <div className="relative z-10 flex h-full flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
            <div className="flex items-center justify-between">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setFullscreen(false)}
                aria-label="Close full-screen player"
                className="glass glass-thin flex h-11 w-11 items-center justify-center rounded-full"
              >
                <ChevronDown className="relative z-10 h-6 w-6" />
              </motion.button>
              <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-white/60 sm:block">Now playing</p>
              <div className="flex items-center gap-2">
                <PlaybackMenu className="glass glass-thin !h-11 !w-11" />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setLyricsOpen((o) => !o)}
                  aria-label="Toggle lyrics"
                  aria-pressed={lyricsOpen}
                  className="glass glass-thin flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
                >
                  <Mic2 className="relative z-10 h-5 w-5" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleRightPanel('queue')}
                  aria-label="Queue"
                  className="glass glass-thin flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
                >
                  <ListMusic className="relative z-10 h-5 w-5" />
                </motion.button>
              </div>
            </div>

            <div className={`no-scrollbar mx-auto mt-3 grid min-h-0 w-full max-w-6xl flex-1 gap-6 overflow-y-auto lg:mt-0 lg:gap-10 ${isVideo ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} lg:overflow-visible`}>
              {showArtPane && (
                <div className="flex flex-col items-center gap-5 py-2 lg:justify-center lg:gap-6">
                  {isVideo ? (
                    <VideoSlot className="max-w-3xl" />
                  ) : (
                  <div className="relative w-[min(72vw,38vh,440px)] lg:w-[min(72vw,46vh,440px)]">
                    {/* vinyl slides out from behind the artwork while audio plays */}
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full"
                      initial={false}
                      animate={{ x: isPlaying ? '24%' : '0%', opacity: isPlaying ? 1 : 0 }}
                      transition={spring}
                    >
                      <div
                        className="relative h-full w-full rounded-full shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]"
                        style={{
                          background:
                            'repeating-radial-gradient(circle at center, #0c0c10 0 2px, #17171d 2px 3px)',
                          animation: 'vinyl-spin 6s linear infinite',
                          animationPlayState: isPlaying ? 'running' : 'paused',
                        }}
                      >
                        <div className="absolute inset-[33%] overflow-hidden rounded-full">
                          <Artwork src={current.cover} alt="" className="h-full w-full" />
                        </div>
                        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#07070c]" />
                      </div>
                    </motion.div>

                    <motion.div
                      layoutId="player-art"
                      className="relative aspect-square w-full overflow-hidden"
                      style={{ borderRadius: 28 }}
                    >
                      <motion.div
                        className="h-full w-full"
                        animate={{
                          scale: isPlaying ? 1 : 0.9,
                          boxShadow: isPlaying
                            ? '0 40px 80px -20px rgba(0,0,0,0.8)'
                            : '0 10px 20px -10px rgba(0,0,0,0.6)',
                        }}
                        transition={spring}
                        style={{ borderRadius: 28, overflow: 'hidden' }}
                      >
                        <Artwork src={current.cover} alt={current.title} className="h-full w-full" />
                      </motion.div>
                    </motion.div>
                  </div>
                  )}

                  <div className={`flex w-full ${colWidth} items-center gap-3`}>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{current.title}</h2>
                      <p className="mt-1 truncate text-base text-white/65">{current.artist}</p>
                      <MoodBadge className="mt-2" />
                    </div>
                    <LikeButton track={current} size={26} />
                  </div>

                  <div className={`flex w-full ${colWidth} flex-col items-center gap-4`}>
                    <ProgressBar />
                    <TransportControls size="lg" showAll />
                    <VolumeControl className="mt-1 hidden md:flex" />
                  </div>
                </div>
              )}

              {showLyricsPane && (
                <div className="glass glass-thin min-h-[55vh] rounded-[2rem] py-3 lg:min-h-0">
                  <div className="relative z-10 h-full min-h-[320px]">
                    {current ? <LyricsView large /> : <Music2 className="mx-auto mt-24 h-8 w-8 text-white/40" />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
