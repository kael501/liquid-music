export type ContentMode = 'music' | 'video';

export interface Track {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
  /** seconds */
  duration: number;
  cover: string;
  /** release year, when known */
  year?: number;
  /** undefined means music */
  kind?: ContentMode;
}

export type MoodId = 'sad' | 'chill' | 'energetic' | 'romantic' | 'happy' | 'party';

export interface Mood {
  id: MoodId;
  label: string;
  description: string;
  from: string;
  to: string;
  /** YouTube search queries that fit this mood */
  queries: string[];
}

export type CollectionKind = 'playlist' | 'album' | 'artist' | 'mix' | 'liked' | 'history';

export interface Collection {
  id: string;
  kind: CollectionKind;
  title: string;
  subtitle: string;
  description?: string;
  cover: string;
  tracks: Track[];
  /** user-owned playlist that can be renamed, deleted and edited */
  editable?: boolean;
}

export type View =
  | { type: 'home' }
  | { type: 'search'; query: string }
  | { type: 'collection'; id: string }
  | { type: 'library' }
  | { type: 'settings' };

export type RepeatMode = 'off' | 'all' | 'one';
export type RightPanelTab = 'now' | 'queue' | 'lyrics';
export type EngineStatus = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'ended' | 'error';

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsResult {
  synced: boolean;
  lines: LyricLine[];
}

export interface UserPlaylist {
  id: string;
  title: string;
  description: string;
  tracks: Track[];
  createdAt: number;
  /** undefined means music */
  kind?: ContentMode;
}

export type ProgressStyle = 'bar' | 'waveform';

export interface Settings {
  ambientMotion: boolean;
  /** 0.2 – 1 */
  ambientIntensity: number;
  /** backdrop blur in px */
  glassBlur: number;
  reduceMotion: boolean;
  progressStyle: ProgressStyle;
  autoplay: boolean;
  playbackRate: number;
  shortcuts: boolean;
  /** which side of the app is shown: music or video */
  mode: ContentMode;
}

export type SleepTimer = { mode: 'time'; endsAt: number } | { mode: 'track' } | null;
