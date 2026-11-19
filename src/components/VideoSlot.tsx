import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';

/**
 * A 16:9 placeholder. The single YouTube player is moved over it while it is mounted
 * (so audio keeps playing without a restart), and goes back off-screen when it unmounts.
 */
export function VideoSlot({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { setVideoRect, togglePlay, current } = usePlayer();

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setVideoRect({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
      raf = window.requestAnimationFrame(loop);
    };
    loop();
    return () => {
      window.cancelAnimationFrame(raf);
      setVideoRect(null);
    };
  }, [setVideoRect]);

  return (
    <div
      ref={ref}
      onClick={togglePlay}
      role="button"
      aria-label="Putar atau jeda video"
      className={cn('aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-black/70 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]', className)}
      style={current ? { backgroundImage: `url(${current.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    />
  );
}
