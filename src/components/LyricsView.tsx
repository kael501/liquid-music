import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Minus, MicOff, Plus } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { usePlaybackTime } from '../hooks/useAudioPlayer';
import { useLyrics } from '../hooks/useLyrics';
import { cn } from '../lib/utils';

interface LyricsViewProps {
  large?: boolean;
}

/** Synced lyrics with active-line highlighting, click-to-seek and a manual sync offset. */
export function LyricsView({ large = false }: LyricsViewProps) {
  const { current, timeStore, seek } = usePlayer();
  const { current: time } = usePlaybackTime(timeStore);
  const { loading, lyrics } = useLyrics(current, true);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => setOffset(0), [current?.id]);

  const lines = lyrics?.lines ?? [];
  const synced = Boolean(lyrics?.synced);

  const activeIndex = useMemo(() => {
    if (!synced) return -1;
    const t = time + offset;
    let found = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= t) found = i;
      else break;
    }
    return found;
  }, [lines, synced, time, offset]);

  useEffect(() => {
    const container = containerRef.current;
    const el = lineRefs.current[activeIndex];
    if (!container || !el) return;
    container.scrollTo({
      top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading lyrics" />
      </div>
    );
  }

  if (!lyrics || lines.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white/60">
        <MicOff className="h-8 w-8" />
        <p className="text-base font-semibold text-white">No lyrics found</p>
        <p className="text-sm">We could not find lyrics for this track.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {synced && (
        <div className="flex items-center justify-between px-5 pb-2 text-[11px] text-white/45">
          <span>Synced lyrics · LRCLIB</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Lyrics earlier"
              onClick={() => setOffset((o) => Math.round((o - 0.5) * 10) / 10)}
              className="glass-btn h-6 w-6"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-10 text-center tabular-nums">{offset > 0 ? '+' : ''}{offset.toFixed(1)}s</span>
            <button
              type="button"
              aria-label="Lyrics later"
              onClick={() => setOffset((o) => Math.round((o + 0.5) * 10) / 10)}
              className="glass-btn h-6 w-6"
            >
              <Plus className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-5 py-[30%]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        }}
      >
        {lines.map((line, i) => {
          const distance = synced ? Math.abs(i - activeIndex) : 0;
          const active = synced && i === activeIndex;
          return (
            <motion.button
              key={`${i}-${line.time}`}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              type="button"
              disabled={!synced || !line.text}
              onClick={() => seek(Math.max(0, line.time - offset))}
              animate={{
                opacity: synced ? (active ? 1 : Math.max(0.18, 0.6 - distance * 0.1)) : 0.85,
                scale: active ? 1.03 : 1,
                filter: `blur(${synced && !active ? Math.min(distance * 0.5, 2.5) : 0}px)`,
              }}
              style={{ transformOrigin: 'left center' }}
              className={cn(
                'block w-full py-1.5 text-left font-bold leading-snug tracking-tight text-white',
                large ? 'text-3xl xl:text-4xl' : 'text-xl',
                !synced && '!text-base !font-medium',
                !line.text && 'h-4',
              )}
            >
              {line.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
