import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp, cn } from '../lib/utils';

interface SliderProps {
  /** 0..1 */
  value: number;
  /** 0..1 — secondary (buffered) fill */
  buffered?: number;
  /** fires continuously while dragging */
  onChange?: (value: number) => void;
  /** fires once when the user releases / clicks / uses the keyboard */
  onCommit?: (value: number) => void;
  /** renders a hover tooltip above the pointer */
  formatTooltip?: (value: number) => string;
  label: string;
  className?: string;
  step?: number;
}

/**
 * Pointer-driven slider used for both the scrubbable progress bar (with hover time preview)
 * and the volume control. While dragging it shows the local value so the thumb never jitters
 * against the 5Hz player clock.
 */
export function Slider({
  value,
  buffered,
  onChange,
  onCommit,
  formatTooltip,
  label,
  className,
  step = 0.02,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const fromEvent = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clamp((e.clientX - rect.left) / rect.width, 0, 1);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const v = fromEvent(e);
    setDragValue(v);
    onChange?.(v);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const v = fromEvent(e);
    setHover(v);
    if (dragValue !== null) {
      setDragValue(v);
      onChange?.(v);
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragValue === null) return;
    const v = fromEvent(e);
    setDragValue(null);
    onCommit?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamp(value + step, 0, 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamp(value - step, 0, 1);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = 1;
    if (next === null) return;
    e.preventDefault();
    onChange?.(next);
    onCommit?.(next);
  };

  const shown = dragValue ?? value;
  const dragging = dragValue !== null;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerEnter={onPointerMove}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKeyDown}
      className={cn('group relative flex h-4 cursor-pointer touch-none items-center outline-none', className)}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15 transition-[height] duration-200 group-hover:h-1.5 group-focus-visible:h-1.5">
        {buffered !== undefined && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/20"
            style={{ width: `${clamp(buffered, 0, 1) * 100}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/80 to-white"
          style={{
            width: `${shown * 100}%`,
            transition: dragging ? 'none' : 'width 220ms linear',
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${shown * 100}%` }}
      >
        <div
          className={cn(
            'h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] transition-transform duration-200 group-hover:scale-100 group-focus-visible:scale-100',
            dragging ? 'scale-125' : 'scale-0',
          )}
        />
      </div>

      {formatTooltip && (hover !== null || dragging) && (
        <div
          className="glass-thick pointer-events-none absolute -top-9 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums text-white"
          style={{ left: `${(dragValue ?? hover ?? 0) * 100}%` }}
        >
          {formatTooltip(dragValue ?? hover ?? 0)}
        </div>
      )}
    </div>
  );
}
