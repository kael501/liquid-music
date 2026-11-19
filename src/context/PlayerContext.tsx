import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAudioPlayer, type TimeStore } from '../hooks/useAudioPlayer';
import { ytMusicService } from '../services/ytMusicService';
import { useLibrary } from './LibraryContext';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';
import { safeStorageGet, safeStorageSet, shuffled } from '../lib/utils';
import type { EngineStatus, MoodId, RepeatMode, RightPanelTab, SleepTimer, Track } from '../types';

interface PlayOptions {
  startIndex?: number;
  contextId?: string | null;
  shuffle?: boolean;
  /** keep mood radio active (used by playMood itself) */
  keepMood?: boolean;
}

interface PlayerContextValue {
  queue: Track[];
  index: number;
  current: Track | null;
  contextId: string | null;
  status: EngineStatus;
  isPlaying: boolean;
  isBuffering: boolean;
  timeStore: TimeStore;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  likedTracks: Track[];
  playbackError: string | null;
  mood: MoodId | null;
  sleepTimer: SleepTimer;
  playbackRate: number;

  rightPanel: RightPanelTab | null;
  fullscreen: boolean;
  sidebarCollapsed: boolean;

  playTracks: (tracks: Track[], options?: PlayOptions) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  reorderUpNext: (upNext: Track[]) => void;
  clearUpNext: () => void;

  isLiked: (id: string) => boolean;
  toggleLike: (track: Track) => void;

  toggleRightPanel: (tab: RightPanelTab) => void;
  setRightPanel: (tab: RightPanelTab | null) => void;
  setFullscreen: (open: boolean) => void;
  toggleSidebar: () => void;
  /** minutes, 'track' for end of current track, null to cancel */
  setSleepTimer: (input: number | 'track' | null) => void;
  /** Mood radio: play random songs of this mood, and keep picking more of it when a song ends */
  playMood: (id: MoodId) => Promise<void>;
  clearMood: () => void;
  setPlaybackRate: (rate: number) => void;
  /** Show the YouTube player over this screen rectangle (video tracks); null returns it off-screen. */
  setVideoRect: (rect: { left: number; top: number; width: number; height: number } | null) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const VOLUME_KEY = 'liquid-music:volume';

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueueState] = useState<Track[]>([]);
  const [index, setIndexState] = useState(0);
  const [contextId, setContextId] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState(() => safeStorageGet<number>(VOLUME_KEY, 0.8));
  const [muted, setMuted] = useState(false);
  const { likedTracks, isLiked, toggleLike: libraryToggleLike, addToHistory, recordPlay } = useLibrary();
  const { settings, update: updateSettings } = useSettings();
  const { toast } = useToast();
  const [sleepTimer, setSleepTimerState] = useState<SleepTimer>(null);
  const [mood, setMoodState] = useState<MoodId | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const [rightPanel, setRightPanelState] = useState<RightPanelTab | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* Always-fresh mirrors for callbacks fired by the player (ended / error). */
  const stateRef = useRef({ queue, index, shuffle, repeat });
  stateRef.current = { queue, index, shuffle, repeat };
  const loadedIdRef = useRef<string | null>(null);
  const historyRef = useRef<number[]>([]);
  const errorStreakRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const sleepRef = useRef<SleepTimer>(null);
  sleepRef.current = sleepTimer;
  const moodRef = useRef<MoodId | null>(null);
  moodRef.current = mood;

  const commit = useCallback((nextQueue: Track[], nextIndex: number) => {
    stateRef.current = { ...stateRef.current, queue: nextQueue, index: nextIndex };
    setQueueState(nextQueue);
    setIndexState(nextIndex);
  }, []);

  const engineRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);

  const loadIndex = useCallback((nextQueue: Track[], nextIndex: number) => {
    const track = nextQueue[nextIndex];
    if (!track) return;
    commit(nextQueue, nextIndex);
    loadedIdRef.current = track.videoId;
    recordPlay(track);
    engineRef.current?.load(track.videoId, true);
  }, [commit, recordPlay]);

  const advance = useCallback(
    (opts: { auto: boolean; skipRepeatOne?: boolean }) => {
      const { queue: q, index: i, shuffle: sh, repeat: rep } = stateRef.current;
      if (q.length === 0) return;

      if (opts.auto && rep === 'one' && !opts.skipRepeatOne) {
        loadedIdRef.current = q[i].videoId;
        recordPlay(q[i]);
        engineRef.current?.load(q[i].videoId, true);
        return;
      }

      let nextIndex: number;
      if (sh && q.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * q.length);
        } while (nextIndex === i);
      } else if (i + 1 < q.length) {
        nextIndex = i + 1;
      } else if (moodRef.current) {
        /* mood radio: the next song is a random pick from the same mood, avoiding recent repeats */
        const moodId = moodRef.current;
        const recent = new Set(q.slice(-4).map((x) => x.id));
        void ytMusicService.getMoodTracks(moodId).then((pool) => {
          /* ignore the answer if the user changed song or mood while we were fetching */
          if (moodRef.current !== moodId || stateRef.current.queue !== q || stateRef.current.index !== i) return;
          const fresh = shuffled(pool.filter((x) => !recent.has(x.id)));
          const picks = fresh.length > 0 ? fresh : shuffled(pool);
          if (picks.length === 0) return;
          historyRef.current.push(i);
          loadIndex([...q, ...picks], i + 1);
        });
        return;
      } else if (rep === 'all' || !opts.auto) {
        nextIndex = 0;
      } else if (settingsRef.current.autoplay) {
        void ytMusicService.getRelated(q[i], new Set(q.map((x) => x.id))).then((related) => {
          if (related.length === 0 || stateRef.current.queue !== q || stateRef.current.index !== i) return;
          historyRef.current.push(i);
          toast(q[i].kind === 'video' ? 'Autoplay: menambahkan video serupa' : 'Autoplay: menambahkan lagu serupa');
          loadIndex([...q, ...related], i + 1);
        });
        return;
      } else {
        return;
      }
      historyRef.current.push(i);
      if (historyRef.current.length > 100) historyRef.current.shift();
      loadIndex(q, nextIndex);
    },
    [loadIndex, recordPlay, toast],
  );

  const engine = useAudioPlayer({
    onEnded: () => {
      if (sleepRef.current?.mode === 'track') {
        setSleepTimerState(null);
        toast('Sleep timer: playback stopped');
        return;
      }
      advance({ auto: true });
    },
    onError: () => {
      const { queue: q, index: i } = stateRef.current;
      errorStreakRef.current += 1;
      setPlaybackError(`"${q[i]?.title ?? 'Track'}" can't be played here — skipping`);
      if (errorStreakRef.current < q.length) advance({ auto: true, skipRepeatOne: true });
    },
  });
  engineRef.current = engine;

  useEffect(() => {
    if (engine.status === 'playing') {
      errorStreakRef.current = 0;
      setPlaybackError(null);
    }
  }, [engine.status]);

  useEffect(() => {
    engine.setVolume(volume);
    safeStorageSet(VOLUME_KEY, volume);
  }, [volume, engine.setVolume]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engine.setMuted(muted);
  }, [muted, engine.setMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = queue[index] ?? null;

  useEffect(() => {
    engine.setRate(settings.playbackRate);
  }, [settings.playbackRate, engine.setRate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (engine.status === 'playing' && current) addToHistory(current);
  }, [engine.status, current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sleepTimer?.mode !== 'time') return;
    const id = window.setTimeout(() => {
      engineRef.current?.pause();
      setSleepTimerState(null);
      toast('Sleep timer: playback paused');
    }, Math.max(0, sleepTimer.endsAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [sleepTimer, toast]);

  /* ------------------------------ transport ------------------------------ */

  const playTracks = useCallback(
    (tracks: Track[], options: PlayOptions = {}) => {
      if (tracks.length === 0) return;
      const wantsShuffle = options.shuffle ?? false;
      const start = wantsShuffle
        ? Math.floor(Math.random() * tracks.length)
        : Math.min(Math.max(options.startIndex ?? 0, 0), tracks.length - 1);
      if (wantsShuffle) {
        stateRef.current = { ...stateRef.current, shuffle: true };
        setShuffle(true);
      }
      historyRef.current = [];
      if (!options.keepMood) {
        moodRef.current = null;
        setMoodState(null);
      }
      setContextId(options.contextId ?? null);
      loadIndex(tracks, start);
      if (tracks[start].kind === 'video') setFullscreen(true);
    },
    [loadIndex],
  );

  const togglePlay = useCallback(() => {
    const { queue: q, index: i } = stateRef.current;
    const track = q[i];
    if (!track) return;
    if (loadedIdRef.current !== track.videoId) {
      loadIndex(q, i);
    } else {
      engineRef.current?.toggle();
    }
  }, [loadIndex]);

  const next = useCallback(() => advance({ auto: false }), [advance]);

  const prev = useCallback(() => {
    const { queue: q, index: i, repeat: rep } = stateRef.current;
    if (q.length === 0) return;
    const time = engineRef.current?.timeStore.get().current ?? 0;
    if (time > 3) {
      engineRef.current?.seek(0);
      return;
    }
    const previous = historyRef.current.pop();
    if (previous !== undefined && q[previous]) {
      loadIndex(q, previous);
    } else if (i > 0) {
      loadIndex(q, i - 1);
    } else if (rep === 'all') {
      loadIndex(q, q.length - 1);
    } else {
      engineRef.current?.seek(0);
    }
  }, [loadIndex]);

  const seek = useCallback((seconds: number) => engineRef.current?.seek(seconds), []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (m && volume === 0) setVolumeState(0.5);
      return !m;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
    [],
  );

  /* -------------------------------- queue -------------------------------- */

  const addToQueue = useCallback(
    (track: Track) => {
      const { queue: q, index: i } = stateRef.current;
      if (q.some((x) => x.id === track.id)) return;
      commit([...q, track], i);
    },
    [commit],
  );

  const playNext = useCallback(
    (track: Track) => {
      const { queue: q, index: i } = stateRef.current;
      if (q[i]?.id === track.id) return;
      const existing = q.findIndex((x) => x.id === track.id);
      const without = existing === -1 ? q : q.filter((_, n) => n !== existing);
      const currentIndex = existing !== -1 && existing < i ? i - 1 : i;
      const result = [...without.slice(0, currentIndex + 1), track, ...without.slice(currentIndex + 1)];
      commit(result, currentIndex);
    },
    [commit],
  );

  const removeFromQueue = useCallback(
    (id: string) => {
      const { queue: q, index: i } = stateRef.current;
      const at = q.findIndex((x) => x.id === id);
      if (at <= i) return;
      commit(q.filter((_, n) => n !== at), i);
    },
    [commit],
  );

  const reorderUpNext = useCallback(
    (upNext: Track[]) => {
      const { queue: q, index: i } = stateRef.current;
      commit([...q.slice(0, i + 1), ...upNext], i);
    },
    [commit],
  );

  const clearUpNext = useCallback(() => {
    const { queue: q, index: i } = stateRef.current;
    commit(q.slice(0, i + 1), i);
  }, [commit]);

  /* -------------------------------- likes -------------------------------- */

  const toggleLike = useCallback(
    (track: Track) => {
      const liked = libraryToggleLike(track);
      const noun = track.kind === 'video' ? 'Liked Videos' : 'Liked Songs';
      toast(liked ? `Added to ${noun}` : `Removed from ${noun}`);
    },
    [libraryToggleLike, toast],
  );

  /* --------------------------------- ui ---------------------------------- */

  const setRightPanel = useCallback((tab: RightPanelTab | null) => setRightPanelState(tab), []);
  const toggleRightPanel = useCallback(
    (tab: RightPanelTab) => setRightPanelState((cur) => (cur === tab ? null : tab)),
    [],
  );
  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);

  const setSleepTimer = useCallback(
    (input: number | 'track' | null) => {
      if (input === null) {
        setSleepTimerState(null);
        toast('Sleep timer off');
      } else if (input === 'track') {
        setSleepTimerState({ mode: 'track' });
        toast('Playback will stop after this track');
      } else {
        setSleepTimerState({ mode: 'time', endsAt: Date.now() + input * 60_000 });
        toast(`Sleep timer set for ${input} minutes`);
      }
    },
    [toast],
  );

  const setPlaybackRate = useCallback((rate: number) => updateSettings({ playbackRate: rate }), [updateSettings]);

  const playMood = useCallback(
    async (id: MoodId) => {
      const pool = await ytMusicService.getMoodTracks(id);
      if (pool.length === 0) {
        toast(ytMusicService.hasKey ? ytMusicService.lastError || 'Belum ada lagu untuk suasana ini' : 'Isi API key YouTube di Pengaturan dulu');
        return;
      }
      const label = ytMusicService.getMoods().find((m) => m.id === id)?.label ?? id;
      moodRef.current = id;
      setMoodState(id);
      historyRef.current = [];
      setContextId(`mood:${id}`);
      loadIndex(pool, 0);
      toast(`Suasana ${label}: lagu berikutnya dipilih acak sesuai suasana`);
    },
    [loadIndex, toast],
  );

  const clearMood = useCallback(() => {
    moodRef.current = null;
    setMoodState(null);
    toast('Mode suasana dimatikan');
  }, [toast]);

  /* ------------------------ browser integration -------------------------- */

  useEffect(() => {
    document.title = current && engine.status === 'playing' ? `${current.title} · ${current.artist}` : 'Liquid Music';
  }, [current, engine.status]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album,
      artwork: [{ src: current.cover, sizes: '1280x720', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [current, togglePlay, next, prev]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.closest('input, textarea, button, [role="slider"], a') !== null || el.isContentEditable)) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      index,
      current,
      contextId,
      status: engine.status,
      isPlaying: engine.status === 'playing' || engine.status === 'buffering',
      isBuffering: engine.status === 'buffering' || engine.status === 'loading',
      timeStore: engine.timeStore,
      shuffle,
      repeat,
      volume,
      muted,
      likedTracks,
      playbackError,
      mood,
      sleepTimer,
      playbackRate: settings.playbackRate,
      rightPanel,
      fullscreen,
      sidebarCollapsed,
      playTracks,
      togglePlay,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      reorderUpNext,
      clearUpNext,
      isLiked,
      toggleLike,
      toggleRightPanel,
      setRightPanel,
      setFullscreen,
      toggleSidebar,
      setSleepTimer,
      setPlaybackRate,
      playMood,
      clearMood,
      setVideoRect: engine.setVideoRect,
    }),
    [
      queue, index, current, contextId, engine.status, engine.timeStore, shuffle, repeat, volume, muted,
      likedTracks, playbackError, mood, sleepTimer, settings.playbackRate, rightPanel, fullscreen, sidebarCollapsed, playTracks, togglePlay, next,
      prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat, addToQueue, playNext, removeFromQueue,
      reorderUpNext, clearUpNext, isLiked, toggleLike, toggleRightPanel, setRightPanel, toggleSidebar,
      setSleepTimer, setPlaybackRate, playMood, clearMood, engine.setVideoRect,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}
