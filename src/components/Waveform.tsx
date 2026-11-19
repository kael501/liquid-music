import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { clamp, hashString } from '../lib/utils';

interface WaveformProps {
  seed: string;
  /** 0..1 */
  progress: number;
  onCommit: (value: number) => void;
  formatTooltip?: (value: number) => string;
  bars?: number;
}

/** SoundCloud-style waveform scrubber. Bars are generated deterministically from the track id. */
export function Waveform({ seed, progress, onCommit, formatTooltip, bars = 72 }: WaveformProps) {
  const heights = useMemo(() => {
    let state = hashString(seed) || 1;
    const rand = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return ((state >>> 0) % 1000) / 1000;
    };
    const out: number[] = [];
    let smooth = 0.5;
    for (let i = 0; i < bars; i++) {
      smooth = smooth * 0.55 + rand() * 0.45;
      const envelope = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI);
      out.push(clamp(0.18 + smooth * envelope * 0.9, 0.12, 1));
    }
    return out;
  }, [seed, bars]);

  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const read = (e: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect && rect.width ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0;
  };

  const shown = drag ?? progress;

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(read(e));
      }}
      onPointerMove={(e) => {
        const v = read(e);
        setHover(v);
        if (drag !== null) setDrag(v);
      }}
      onPointerUp={(e) => {
        if (drag === null) return;
        const v = read(e);
        setDrag(null);
        onCommit(v);
      }}
      onPointerLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onCommit(clamp(progress + 0.02, 0, 1));
        if (e.key === 'ArrowLeft') onCommit(clamp(progress - 0.02, 0, 1));
      }}
      className="group relative flex h-10 w-full cursor-pointer touch-none items-center gap-[2px] outline-none"
    >
      {heights.map((h, i) => {
        const played = (i + 0.5) / bars <= shown;
        return (
          <span
            key={i}
            className="flex-1 rounded-full transition-colors duration-150"
            style={{
              height: `${h * 100}%`,
              background: played ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
            }}
          />
        );
      })}
      {formatTooltip && hover !== null && (
        <div
          className="glass-thick pointer-events-none absolute -top-9 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums"
          style={{ left: `${hover * 100}%` }}
        >
          {formatTooltip(hover)}
        </div>
      )}
    </div>
  );
}
