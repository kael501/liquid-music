import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { safeStorageGet, safeStorageSet } from '../lib/utils';
import type { Collection, ContentMode, Track, UserPlaylist } from '../types';

const LIKED_KEY = 'liquid-music:liked';
const PLAYLISTS_KEY = 'liquid-music:playlists';
const HISTORY_KEY = 'liquid-music:history';
const FOLLOW_KEY = 'liquid-music:following';
const PLAYS_KEY = 'liquid-music:plays';
const NO_SEED_KEY = 'liquid-music:no-seed-playlists';
const HISTORY_LIMIT = 50;

const DEFAULT_FOLLOWING: string[] = [];

const inMode = (t: Track, mode: ContentMode) => (mode === 'video' ? t.kind === 'video' : t.kind !== 'video');

/** Playlists that older versions created for every user; removed once from existing installs. */
const LEGACY_SEED_IDS = ['pl:chill', 'pl:workout', 'pl:night', 'pl:throwback', 'pl:singalong'];

function loadPlaylists(): UserPlaylist[] {
  const stored = safeStorageGet<UserPlaylist[]>(PLAYLISTS_KEY, []);
  if (safeStorageGet<boolean>(NO_SEED_KEY, false)) return stored;
  const cleaned = stored.filter((p) => !LEGACY_SEED_IDS.includes(p.id));
  safeStorageSet(PLAYLISTS_KEY, cleaned);
  safeStorageSet(NO_SEED_KEY, true);
  return cleaned;
}

export interface PlayStat {
  track: Track;
  count: number;
  last: number;
}

export interface LibraryData {
  liked: Track[];
  playlists: UserPlaylist[];
  history: Track[];
  following: string[];
  plays: Record<string, PlayStat>;
}

interface LibraryContextValue {
  likedTracks: Track[];
  playlists: UserPlaylist[];
  history: Track[];
  following: string[];

  isLiked: (id: string) => boolean;
  toggleLike: (track: Track) => boolean;
  clearLiked: () => void;

  createPlaylist: (title: string, tracks?: Track[], description?: string, kind?: ContentMode) => string;
  renamePlaylist: (id: string, title: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, tracks: Track[]) => number;
  removeFromPlaylist: (id: string, trackId: string) => void;

  addToHistory: (track: Track) => void;
  clearHistory: () => void;
  frequentTracks: Track[];
  recordPlay: (track: Track) => void;

  isFollowing: (artist: string) => boolean;
  toggleFollow: (artist: string) => boolean;

  getCollection: (id: string) => Collection | null;
  exportData: () => LibraryData;
  importData: (data: Partial<LibraryData>) => void;
  resetAll: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [likedAll, setLiked] = useState<Track[]>(() => safeStorageGet<Track[]>(LIKED_KEY, []));
  const [playlistsAll, setPlaylists] = useState<UserPlaylist[]>(loadPlaylists);
  const [historyAll, setHistory] = useState<Track[]>(() => safeStorageGet<Track[]>(HISTORY_KEY, []));
  const [following, setFollowing] = useState<string[]>(() =>
    safeStorageGet<string[]>(FOLLOW_KEY, DEFAULT_FOLLOWING),
  );

  const { settings } = useSettings();
  const mode = settings.mode;

  const [plays, setPlays] = useState<Record<string, PlayStat>>(() => safeStorageGet<Record<string, PlayStat>>(PLAYS_KEY, {}));

  /* Everything the UI sees is limited to the current mode, so music and video never mix. */
  const likedTracks = useMemo(() => likedAll.filter((t) => inMode(t, mode)), [likedAll, mode]);
  const history = useMemo(() => historyAll.filter((t) => inMode(t, mode)), [historyAll, mode]);
  const playlists = useMemo(
    () => playlistsAll.filter((p) => (p.kind === 'video' ? 'video' : 'music') === mode),
    [playlistsAll, mode],
  );

  const persistPlaylists = useCallback((next: UserPlaylist[]) => {
    safeStorageSet(PLAYLISTS_KEY, next);
    return next;
  }, []);

  /* -------------------------------- likes -------------------------------- */

  const isLiked = useCallback((id: string) => likedAll.some((x) => x.id === id), [likedAll]);

  const toggleLike = useCallback(
    (track: Track): boolean => {
      const nowLiked = !likedAll.some((x) => x.id === track.id);
      const next = nowLiked ? [track, ...likedAll] : likedAll.filter((x) => x.id !== track.id);
      safeStorageSet(LIKED_KEY, next);
      setLiked(next);
      return nowLiked;
    },
    [likedAll],
  );

  const clearLiked = useCallback(() => {
    setLiked((list) => {
      const next = list.filter((t) => !inMode(t, mode));
      safeStorageSet(LIKED_KEY, next);
      return next;
    });
  }, [mode]);

  /* ------------------------------ playlists ------------------------------ */

  const createPlaylist = useCallback(
    (title: string, tracks: Track[] = [], description = '', kind?: ContentMode) => {
      const id = `pl:u-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
      const unique = tracks.filter((t, i) => tracks.findIndex((x) => x.id === t.id) === i);
      setPlaylists((list) =>
        persistPlaylists([{ id, title: title.trim() || 'My Playlist', description, tracks: unique, createdAt: Date.now(), kind: kind ?? (tracks.length > 0 ? (tracks[0].kind === 'video' ? 'video' : 'music') : mode) }, ...list]),
      );
      return id;
    },
    [persistPlaylists, mode],
  );

  const renamePlaylist = useCallback(
    (id: string, title: string, description?: string) =>
      setPlaylists((list) =>
        persistPlaylists(
          list.map((p) =>
            p.id === id ? { ...p, title: title.trim() || p.title, description: description ?? p.description } : p,
          ),
        ),
      ),
    [persistPlaylists],
  );

  const deletePlaylist = useCallback(
    (id: string) => setPlaylists((list) => persistPlaylists(list.filter((p) => p.id !== id))),
    [persistPlaylists],
  );

  const addToPlaylist = useCallback(
    (id: string, tracks: Track[]): number => {
      const target = playlistsAll.find((p) => p.id === id);
      if (!target) return 0;
      const fresh = tracks.filter((t, i) => tracks.findIndex((x) => x.id === t.id) === i && !target.tracks.some((x) => x.id === t.id));
      if (fresh.length === 0) return 0;
      setPlaylists(persistPlaylists(playlistsAll.map((p) => (p.id === id ? { ...p, tracks: [...p.tracks, ...fresh] } : p))));
      return fresh.length;
    },
    [playlistsAll, persistPlaylists],
  );

  const removeFromPlaylist = useCallback(
    (id: string, trackId: string) =>
      setPlaylists((list) =>
        persistPlaylists(list.map((p) => (p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p))),
      ),
    [persistPlaylists],
  );

  /* ------------------------------- history ------------------------------- */

  const addToHistory = useCallback((track: Track) => {
    setHistory((list) => {
      if (list[0]?.id === track.id) return list;
      const next = [track, ...list.filter((t) => t.id !== track.id)].slice(0, HISTORY_LIMIT);
      safeStorageSet(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((list) => {
      const next = list.filter((t) => !inMode(t, mode));
      safeStorageSet(HISTORY_KEY, next);
      return next;
    });
    setPlays((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([, p]) => !inMode(p.track, mode)));
      safeStorageSet(PLAYS_KEY, next);
      return next;
    });
  }, [mode]);

  /** Counts one listen; powers the "Sering Kamu Putar" shelf. */
  const recordPlay = useCallback((track: Track) => {
    setPlays((prev) => {
      const next = { ...prev, [track.id]: { track, count: (prev[track.id]?.count ?? 0) + 1, last: Date.now() } };
      safeStorageSet(PLAYS_KEY, next);
      return next;
    });
  }, []);

  const frequentTracks = useMemo(
    () =>
      Object.values(plays)
        .filter((p) => p.count >= 2 && inMode(p.track, mode))
        .sort((a, b) => b.count - a.count || b.last - a.last)
        .slice(0, 12)
        .map((p) => p.track),
    [plays, mode],
  );

  /* ------------------------------- following ------------------------------ */

  const isFollowing = useCallback((artist: string) => following.includes(artist), [following]);

  const toggleFollow = useCallback(
    (artist: string): boolean => {
      const nowFollowing = !following.includes(artist);
      const next = nowFollowing ? [artist, ...following] : following.filter((a) => a !== artist);
      safeStorageSet(FOLLOW_KEY, next);
      setFollowing(next);
      return nowFollowing;
    },
    [following],
  );

  /* ------------------------------ collections ------------------------------ */

  const getCollection = useCallback(
    (id: string): Collection | null => {
      if (id === 'liked') {
        return {
          id,
          kind: 'liked',
          title: mode === 'video' ? 'Liked Videos' : 'Liked Songs',
          subtitle: 'Playlist',
          description: mode === 'video' ? 'Every video you have hearted' : 'Everything you have hearted',
          cover: likedTracks[0]?.cover ?? '',
          tracks: likedTracks,
        };
      }
      if (id === 'history') {
        return {
          id,
          kind: 'history',
          title: 'Recently Played',
          subtitle: 'Your listening history',
          description: 'The last songs you listened to',
          cover: history[0]?.cover ?? '',
          tracks: history,
        };
      }
      const mine = playlistsAll.find((p) => p.id === id);
      if (mine) {
        return {
          id: mine.id,
          kind: 'playlist',
          title: mine.title,
          subtitle: 'You',
          description: mine.description || undefined,
          cover: mine.tracks[0]?.cover ?? '',
          tracks: mine.tracks,
          editable: true,
        };
      }
      return null;
    },
    [likedTracks, history, playlistsAll, mode],
  );

  /* ------------------------------ backup / reset ----------------------------- */

  const exportData = useCallback(
    (): LibraryData => ({ liked: likedAll, playlists: playlistsAll, history: historyAll, following, plays }),
    [likedAll, playlistsAll, historyAll, following, plays],
  );

  const importData = useCallback((data: Partial<LibraryData>) => {
    if (Array.isArray(data.liked)) {
      safeStorageSet(LIKED_KEY, data.liked);
      setLiked(data.liked);
    }
    if (Array.isArray(data.playlists)) {
      safeStorageSet(PLAYLISTS_KEY, data.playlists);
      setPlaylists(data.playlists);
    }
    if (Array.isArray(data.history)) {
      safeStorageSet(HISTORY_KEY, data.history);
      setHistory(data.history);
    }
    if (Array.isArray(data.following)) {
      safeStorageSet(FOLLOW_KEY, data.following);
      setFollowing(data.following);
    }
    if (data.plays && typeof data.plays === 'object') {
      safeStorageSet(PLAYS_KEY, data.plays);
      setPlays(data.plays);
    }
  }, []);

  const resetAll = useCallback(() => {
    importData({ liked: [], playlists: [], history: [], following: DEFAULT_FOLLOWING, plays: {} });
  }, [importData]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      likedTracks, playlists, history, following,
      isLiked, toggleLike, clearLiked,
      createPlaylist, renamePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
      addToHistory, clearHistory, frequentTracks, recordPlay,
      isFollowing, toggleFollow,
      getCollection, exportData, importData, resetAll,
    }),
    [
      likedTracks, playlists, history, following, isLiked, toggleLike, clearLiked, createPlaylist,
      renamePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, addToHistory, clearHistory,
      frequentTracks, recordPlay, isFollowing, toggleFollow, getCollection, exportData, importData, resetAll,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return ctx;
}
