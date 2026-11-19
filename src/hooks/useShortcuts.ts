import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';

export const SHORTCUT_LIST: Array<{ keys: string; action: string }> = [
  { keys: 'Space', action: 'Play / pause' },
  { keys: '← / →', action: 'Seek 5 seconds' },
  { keys: 'Shift + ← / →', action: 'Previous / next track' },
  { keys: '↑ / ↓', action: 'Volume up / down' },
  { keys: 'M', action: 'Mute' },
  { keys: 'L', action: 'Like current track' },
  { keys: 'S', action: 'Shuffle' },
  { keys: 'R', action: 'Cycle repeat' },
  { keys: 'Q', action: 'Toggle queue' },
  { keys: 'Y', action: 'Toggle lyrics' },
  { keys: 'F', action: 'Full-screen player' },
];

/** Global keyboard shortcuts (Space is handled by the player itself and always works). */
export function useShortcuts(): void {
  const { settings } = useSettings();
  const p = usePlayer();

  useEffect(() => {
    if (!settings.shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.closest('input, textarea, select, [role="slider"], [role="dialog"]') !== null || el.isContentEditable)) {
        return;
      }
      const time = p.timeStore.get();
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) p.next();
          else p.seek(Math.min(time.current + 5, time.duration || Infinity));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) p.prev();
          else p.seek(Math.max(time.current - 5, 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          p.setVolume(Math.min((p.muted ? 0 : p.volume) + 0.05, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          p.setVolume(Math.max((p.muted ? 0 : p.volume) - 0.05, 0));
          break;
        case 'm':
        case 'M':
          p.toggleMute();
          break;
        case 'l':
        case 'L':
          if (p.current) p.toggleLike(p.current);
          break;
        case 's':
        case 'S':
          p.toggleShuffle();
          break;
        case 'r':
        case 'R':
          p.cycleRepeat();
          break;
        case 'q':
        case 'Q':
          p.toggleRightPanel('queue');
          break;
        case 'y':
        case 'Y':
          p.toggleRightPanel('lyrics');
          break;
        case 'f':
        case 'F':
          p.setFullscreen(!p.fullscreen);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings.shortcuts, p]);
}
