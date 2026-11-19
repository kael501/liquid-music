import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { safeStorageGet, safeStorageSet } from '../lib/utils';
import type { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  ambientMotion: true,
  ambientIntensity: 0.55,
  glassBlur: 40,
  reduceMotion: false,
  progressStyle: 'bar',
  autoplay: true,
  playbackRate: 1,
  shortcuts: true,
  mode: 'music',
};

const KEY = 'liquid-music:settings';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...safeStorageGet<Partial<Settings>>(KEY, {}),
  }));

  useEffect(() => {
    safeStorageSet(KEY, settings);
    const root = document.documentElement.style;
    root.setProperty('--glass-blur', `${settings.glassBlur}px`);
    root.setProperty('--orb-opacity', String(settings.ambientIntensity));
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
