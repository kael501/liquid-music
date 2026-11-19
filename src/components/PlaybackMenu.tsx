import { useEffect, useState } from 'react';
import { Gauge, Moon, SlidersHorizontal, TimerOff } from 'lucide-react';
import { MenuDivider, MenuItem, MenuLabel, Popover } from './Popover';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SLEEP_MINUTES = [15, 30, 45, 60];

function useRemaining(endsAt: number | null): string | null {
  const [, tick] = useState(0);
  useEffect(() => {
    if (endsAt === null) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (endsAt === null) return null;
  const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

export function PlaybackMenu({ className }: { className?: string }) {
  const { playbackRate, setPlaybackRate, sleepTimer, setSleepTimer } = usePlayer();
  const remaining = useRemaining(sleepTimer?.mode === 'time' ? sleepTimer.endsAt : null);
  const active = playbackRate !== 1 || sleepTimer !== null;

  return (
    <Popover
      width={236}
      trigger={({ ref, toggle, open }) => (
        <button
          ref={ref}
          type="button"
          aria-label="Playback speed and sleep timer"
          aria-expanded={open}
          onClick={toggle}
          data-active={active || open}
          className={cn('glass-btn relative h-9 w-9', className)}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
          {active && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-300" />}
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Playback speed</MenuLabel>
          {RATES.map((rate) => (
            <MenuItem
              key={rate}
              icon={<Gauge className="h-4 w-4" />}
              label={rate === 1 ? 'Normal' : `${rate}x`}
              checked={playbackRate === rate}
              onSelect={() => setPlaybackRate(rate)}
            />
          ))}
          <MenuDivider />
          <MenuLabel>Sleep timer{remaining ? ` · ${remaining}` : ''}</MenuLabel>
          {SLEEP_MINUTES.map((m) => (
            <MenuItem
              key={m}
              icon={<Moon className="h-4 w-4" />}
              label={`${m} minutes`}
              checked={sleepTimer?.mode === 'time' && Math.abs(sleepTimer.endsAt - Date.now() - m * 60_000) < 2000}
              onSelect={() => {
                setSleepTimer(m);
                close();
              }}
            />
          ))}
          <MenuItem
            icon={<Moon className="h-4 w-4" />}
            label="End of track"
            checked={sleepTimer?.mode === 'track'}
            onSelect={() => {
              setSleepTimer('track');
              close();
            }}
          />
          {sleepTimer && (
            <MenuItem
              danger
              icon={<TimerOff className="h-4 w-4" />}
              label="Turn off timer"
              onSelect={() => {
                setSleepTimer(null);
                close();
              }}
            />
          )}
        </>
      )}
    </Popover>
  );
}
