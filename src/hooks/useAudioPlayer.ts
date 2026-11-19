import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { EngineStatus } from '../types';

/* ------------------------------------------------------------------ */
/* Minimal typings for the YouTube IFrame Player API                    */
/* ------------------------------------------------------------------ */

interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  setPlaybackRate(rate: number): void;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  setSize(width: number, height: number): void;
  destroy(): void;
}

interface YTPlayerEvent {
  data: number;
  target: YTPlayer;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (e: YTPlayerEvent) => void;
        onStateChange: (e: YTPlayerEvent) => void;
        onError: (e: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Failed to load the YouTube IFrame API'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

/* ------------------------------------------------------------------ */
/* High-frequency time store (keeps 5Hz progress out of React context)  */
/* ------------------------------------------------------------------ */

export interface TimeSnapshot {
  current: number;
  duration: number;
  buffered: number;
}

export interface TimeStore {
  get: () => TimeSnapshot;
  set: (next: Partial<TimeSnapshot>) => void;
  subscribe: (listener: () => void) => () => void;
}

function createTimeStore(): TimeStore {
  let snapshot: TimeSnapshot = { current: 0, duration: 0, buffered: 0 };
  const listeners = new Set<() => void>();
  return {
    get: () => snapshot,
    set: (next) => {
      const merged = { ...snapshot, ...next };
      if (
        merged.current === snapshot.current &&
        merged.duration === snapshot.duration &&
        merged.buffered === snapshot.buffered
      ) {
        return;
      }
      snapshot = merged;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function usePlaybackTime(store: TimeStore): TimeSnapshot {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export interface VideoRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const HIDDEN_CSS =
  'position:fixed;left:-9999px;top:0;width:200px;height:200px;opacity:0;pointer-events:none;overflow:hidden;';

interface EngineOptions {
  onEnded: () => void;
  onError: (code: number) => void;
}

export interface AudioEngine {
  status: EngineStatus;
  ready: boolean;
  timeStore: TimeStore;
  load: (videoId: string, autoplay?: boolean) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume01: number) => void;
  setMuted: (muted: boolean) => void;
  setRate: (rate: number) => void;
  /** Show the player over a screen rectangle (video), or null to hide it off-screen again (audio). */
  setVideoRect: (rect: VideoRect | null) => void;
}

export function useAudioPlayer(options: EngineOptions): AudioEngine {
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [ready, setReady] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const pendingRef = useRef<{ videoId: string; autoplay: boolean } | null>(null);
  const volumeRef = useRef(80);
  const mutedRef = useRef(false);
  const rateRef = useRef(1);
  const statusRef = useRef<EngineStatus>('idle');
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const hostRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<VideoRect | null>(null);

  const applyRect = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const rect = rectRef.current;
    if (!rect || rect.width < 2) {
      host.style.cssText = HIDDEN_CSS;
      playerRef.current?.setSize(200, 200);
      return;
    }
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    host.style.cssText = `position:fixed;left:${Math.round(rect.left)}px;top:${Math.round(rect.top)}px;width:${w}px;height:${h}px;opacity:1;pointer-events:none;overflow:hidden;z-index:52;border-radius:16px;`;
    playerRef.current?.setSize(w, h);
  }, []);

  const setVideoRect = useCallback(
    (rect: VideoRect | null) => {
      const prev = rectRef.current;
      if (
        prev && rect &&
        prev.left === rect.left && prev.top === rect.top && prev.width === rect.width && prev.height === rect.height
      ) {
        return;
      }
      rectRef.current = rect;
      applyRect();
    },
    [applyRect],
  );

  const timeStore = useMemo(createTimeStore, []);

  const updateStatus = useCallback((next: EngineStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let poll: number | undefined;
    const host = document.createElement('div');
    // Off-screen but still laid out at a legal embed size so playback is never throttled.
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = HIDDEN_CSS;
    hostRef.current = host;
    const mount = document.createElement('div');
    host.appendChild(mount);
    document.body.appendChild(host);

    const applyVolume = (p: YTPlayer) => {
      p.setVolume(volumeRef.current);
      if (mutedRef.current) p.mute();
      else p.unMute();
    };

    const tick = () => {
      const p = playerRef.current;
      if (!p) return;
      const duration = p.getDuration();
      timeStore.set({
        current: p.getCurrentTime() || 0,
        duration: Number.isFinite(duration) && duration > 0 ? duration : timeStore.get().duration,
        buffered: (p.getVideoLoadedFraction() || 0) * (duration || 0),
      });
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          width: '200',
          height: '200',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              applyVolume(e.target);
              applyRect();
              setReady(true);
              const pending = pendingRef.current;
              if (pending) {
                pendingRef.current = null;
                e.target.loadVideoById(pending.videoId);
                if (!pending.autoplay) e.target.pauseVideo();
              }
            },
            onStateChange: (e) => {
              switch (e.data) {
                case STATE.PLAYING:
                  updateStatus('playing');
                  if (rateRef.current !== 1) e.target.setPlaybackRate(rateRef.current);
                  tick();
                  break;
                case STATE.PAUSED:
                  updateStatus('paused');
                  tick();
                  break;
                case STATE.BUFFERING:
                  updateStatus('buffering');
                  break;
                case STATE.ENDED:
                  updateStatus('ended');
                  optionsRef.current.onEnded();
                  break;
                case STATE.UNSTARTED:
                case STATE.CUED:
                  if (statusRef.current !== 'error') updateStatus('loading');
                  break;
                default:
                  break;
              }
            },
            onError: (e) => {
              updateStatus('error');
              optionsRef.current.onError(e.data);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) updateStatus('error');
      });

    poll = window.setInterval(tick, 200);

    return () => {
      cancelled = true;
      if (poll) window.clearInterval(poll);
      playerRef.current?.destroy();
      playerRef.current = null;
      host.remove();
      hostRef.current = null;
      setReady(false);
    };
  }, [timeStore, updateStatus, applyRect]);

  const load = useCallback(
    (videoId: string, autoplay = true) => {
      timeStore.set({ current: 0, duration: 0, buffered: 0 });
      updateStatus('loading');
      const p = playerRef.current;
      if (!p || !ready) {
        pendingRef.current = { videoId, autoplay };
        return;
      }
      p.loadVideoById(videoId);
      if (!autoplay) p.pauseVideo();
    },
    [ready, timeStore, updateStatus],
  );

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState() === STATE.PLAYING || p.getPlayerState() === STATE.BUFFERING) p.pauseVideo();
    else p.playVideo();
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const p = playerRef.current;
      if (!p) return;
      p.seekTo(seconds, true);
      timeStore.set({ current: seconds });
    },
    [timeStore],
  );

  const setVolume = useCallback((volume01: number) => {
    volumeRef.current = Math.round(volume01 * 100);
    playerRef.current?.setVolume(volumeRef.current);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    mutedRef.current = muted;
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.mute();
    else p.unMute();
  }, []);

  const setRate = useCallback((rate: number) => {
    rateRef.current = rate;
    playerRef.current?.setPlaybackRate(rate);
  }, []);

  return { status, ready, timeStore, load, play, pause, toggle, seek, setVolume, setMuted, setRate, setVideoRect };
}
