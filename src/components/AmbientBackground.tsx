import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';
import { useDominantColor } from '../hooks/useDominantColor';

/**
 * Living canvas behind the whole UI. The palette comes from the current artwork and is
 * written to --c1/--c2/--c3 (registered with @property, so the browser interpolates them over 1.5s).
 */
export function AmbientBackground() {
  const { current } = usePlayer();
  const { settings } = useSettings();
  const motion = settings.ambientMotion;
  const { colors, primaryRgb } = useDominantColor(current?.cover, current?.id ?? 'idle');

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--c1', colors[0]);
    root.setProperty('--c2', colors[1]);
    root.setProperty('--c3', colors[2]);
    root.setProperty('--accent-rgb', primaryRgb);
  }, [colors, primaryRgb]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07070c]" aria-hidden="true">
      <div
        className="orb -left-[10%] -top-[15%] h-[65vmax] w-[65vmax]"
        style={{ background: 'var(--c1)', animation: motion ? 'drift-a 26s ease-in-out infinite' : 'none' }}
      />
      <div
        className="orb -right-[15%] top-[5%] h-[55vmax] w-[55vmax]"
        style={{ background: 'var(--c2)', animation: motion ? 'drift-b 32s ease-in-out infinite' : 'none' }}
      />
      <div
        className="orb -bottom-[25%] left-[20%] h-[60vmax] w-[60vmax]"
        style={{ background: 'var(--c3)', animation: motion ? 'drift-c 38s ease-in-out infinite' : 'none' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_0%,rgba(7,7,12,0.55)_75%)]" />
      <div className="absolute inset-0 bg-[#07070c]/40" />
    </div>
  );
}
