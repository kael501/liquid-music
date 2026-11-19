import { BROWSE_CATEGORIES, MOODS, VIDEO_CATEGORIES, artUrl } from '../data/catalog';
import { shuffled } from '../lib/utils';
import type { ContentMode, Mood, MoodId, Track } from '../types';
import { getApiConfig } from './config';

const YT_API = 'https://www.googleapis.com/youtube/v3';
const MUSIC_CATEGORY = '10';

/* All songs and videos come from the YouTube Data API. Nothing is bundled with the app. */

const cache = new Map<string, { at: number; tracks: Track[] }>();
const TTL = 10 * 60_000;
let lastError = '';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

export function primaryArtist(artist: string): string {
  return artist.split(/\s*(?:&|,|\bft\.?\b|\bfeat\.?\b)\s*/i)[0].trim() || artist;
}

function parseIsoDuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function decodeEntities(value: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = value;
  return el.value;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[(\[](official|lyric|lyrics|music|audio|video|hd|hq|visualizer|mv)[^)\]]*[)\]]/gi, '')
    .replace(/\s*\|\s*.*$/, '')
    .trim();
}

function splitArtistTitle(rawTitle: string, channel: string): { title: string; artist: string } {
  const title = cleanTitle(decodeEntities(rawTitle));
  const channelName = decodeEntities(channel).replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  const dash = title.split(/\s+[-–]\s+/);
  if (dash.length >= 2) return { artist: dash[0].trim(), title: dash.slice(1).join(' - ').trim() };
  return { artist: channelName, title };
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((tr) => (seen.has(tr.id) ? false : (seen.add(tr.id), true)));
}

interface YtVideo {
  id: string;
  snippet: { title: string; channelTitle: string; categoryId?: string; publishedAt?: string };
  contentDetails?: { duration: string };
  status?: { embeddable?: boolean };
}

function toTrack(item: YtVideo): Track {
  const isMusic = item.snippet.categoryId === MUSIC_CATEGORY;
  const duration = parseIsoDuration(item.contentDetails?.duration ?? '');
  const year = item.snippet.publishedAt ? Number(item.snippet.publishedAt.slice(0, 4)) : undefined;
  if (isMusic) {
    const { artist, title } = splitArtistTitle(item.snippet.title, item.snippet.channelTitle);
    return { id: item.id, videoId: item.id, title, artist, album: 'Single', duration, cover: artUrl(item.id), year, kind: 'music' };
  }
  return {
    id: item.id,
    videoId: item.id,
    title: decodeEntities(item.snippet.title),
    artist: decodeEntities(item.snippet.channelTitle),
    album: 'Video',
    duration,
    cover: artUrl(item.id),
    year,
    kind: 'video',
  };
}

/** Keeps the two worlds apart: music tracks have kind 'music' (or none), videos have kind 'video'. */
function ofMode(tracks: Track[], mode: ContentMode): Track[] {
  return tracks.filter((t) => (mode === 'video' ? t.kind === 'video' : t.kind !== 'video'));
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const { apiKey } = getApiConfig();
  if (!apiKey) throw new Error('NO_KEY');
  const qs = new URLSearchParams({ ...params, key: apiKey });
  const res = await fetch(`${YT_API}/${path}?${qs.toString()}`);
  if (!res.ok) {
    let reason = `YouTube API ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) reason = body.error.message.replace(/<[^>]+>/g, '');
    } catch {
      /* keep the status text */
    }
    throw new Error(reason);
  }
  return (await res.json()) as T;
}

async function hydrate(ids: string[]): Promise<Track[]> {
  if (ids.length === 0) return [];
  const json = await ytFetch<{ items: YtVideo[] }>('videos', {
    part: 'snippet,contentDetails,status',
    id: ids.join(','),
    maxResults: '50',
  });
  return json.items.filter((v) => v.status?.embeddable !== false).map(toTrack);
}

async function cached(key: string, load: () => Promise<Track[]>): Promise<Track[]> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.tracks;
  try {
    const tracks = await load();
    lastError = '';
    if (tracks.length > 0) cache.set(key, { at: Date.now(), tracks });
    return tracks;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    lastError = message === 'NO_KEY' ? '' : message;
    return [];
  }
}

async function searchIds(query: string, mode: ContentMode, extra: Record<string, string> = {}, max = 25): Promise<string[]> {
  const json = await ytFetch<{ items: Array<{ id: { videoId: string } }> }>('search', {
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: String(max),
    q: query,
    regionCode: getApiConfig().region,
    ...(mode === 'music' ? { videoCategoryId: MUSIC_CATEGORY } : {}),
    ...extra,
  });
  return json.items.map((i) => i.id.videoId);
}

async function searchTracks(query: string, mode: ContentMode, extra: Record<string, string> = {}, max = 25): Promise<Track[]> {
  return ofMode(await hydrate(await searchIds(query, mode, extra, max)), mode);
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */

export const ytMusicService = {
  /** True when an API key is available. Without it every list is empty and the UI explains how to add one. */
  get hasKey(): boolean {
    return Boolean(getApiConfig().apiKey);
  },

  /** Last error message from YouTube (quota, invalid key...), or ''. */
  get lastError(): string {
    return lastError;
  },

  clearCache(): void {
    cache.clear();
    lastError = '';
  },

  search(query: string, mode: ContentMode): Promise<Track[]> {
    const q = query.trim();
    if (!q) return Promise.resolve([]);
    return cached(`search:${mode}:${q.toLowerCase()}`, () => searchTracks(q, mode, {}, 30));
  },

  /** Music: most popular music videos. Video: most popular videos, optionally in one YouTube category. */
  getTrending(mode: ContentMode, categoryId = ''): Promise<Track[]> {
    const { region } = getApiConfig();
    return cached(`trending:${mode}:${categoryId}:${region}`, async () => {
      const json = await ytFetch<{ items: YtVideo[] }>('videos', {
        part: 'snippet,contentDetails,status',
        chart: 'mostPopular',
        regionCode: region,
        maxResults: '40',
        ...(mode === 'music' ? { videoCategoryId: MUSIC_CATEGORY } : categoryId ? { videoCategoryId: categoryId } : {}),
      });
      return ofMode(json.items.filter((v) => v.status?.embeddable !== false).map(toTrack), mode);
    });
  },

  /** "Baru Rilis": music videos published in the last 45 days. */
  getNewReleases(): Promise<Track[]> {
    return cached(`new:${getApiConfig().region}`, async () => {
      const since = new Date(Date.now() - 45 * 86_400_000).toISOString();
      const tracks = await searchTracks('official music video', 'music', { order: 'date', publishedAfter: since }, 30);
      return tracks.filter((t) => t.duration >= 90 && t.duration <= 600);
    });
  },

  getCategories() {
    return BROWSE_CATEGORIES;
  },

  getVideoCategories() {
    return VIDEO_CATEGORIES;
  },

  getMoods(): Mood[] {
    return MOODS;
  },

  /** Music that fits a mood (used by mood radio). Always music, never videos. */
  async getMoodTracks(id: MoodId): Promise<Track[]> {
    const mood = MOODS.find((m) => m.id === id);
    if (!mood) return [];
    const lists = await Promise.all(
      mood.queries.map((q) => cached(`mood:${q}`, () => searchTracks(q, 'music', {}, 20))),
    );
    return shuffled(dedupe(lists.flat()).filter((t) => t.duration >= 90 && t.duration <= 480));
  },

  /** "Pilihan Cepat": music related to the artists you play and like most; trending music when you have no taste yet. */
  async getQuickPicks(liked: Track[], history: Track[], limit = 9): Promise<Track[]> {
    const weights = new Map<string, number>();
    for (const t of [...history.slice(0, 15), ...liked.slice(0, 15)]) {
      const a = primaryArtist(t.artist);
      weights.set(a, (weights.get(a) ?? 0) + 1);
    }
    const top = [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
    const known = new Set([...history.slice(0, 20), ...liked].map((t) => t.id));
    if (top.length === 0) return (await this.getTrending('music')).slice(0, limit);
    const lists = await Promise.all(top.map((a) => this.getArtistTracks(a)));
    const picks = shuffled(dedupe(lists.flat()).filter((t) => !known.has(t.id)));
    return picks.length >= 3 ? picks.slice(0, limit) : (await this.getTrending('music')).slice(0, limit);
  },

  getArtistTracks(name: string): Promise<Track[]> {
    return cached(`artist:${name.toLowerCase()}`, async () => {
      const tracks = await searchTracks(`${name} official`, 'music', {}, 30);
      return tracks.filter((t) => primaryArtist(t.artist).toLowerCase() === name.toLowerCase() || t.artist.toLowerCase().includes(name.toLowerCase()));
    });
  },

  /** Music (or videos) similar to `track`, for autoplay. Stays in the same mode as the track. */
  async getRelated(track: Track, excludeIds: Set<string>, limit = 8): Promise<Track[]> {
    const mode: ContentMode = track.kind === 'video' ? 'video' : 'music';
    const query = mode === 'music' ? `${primaryArtist(track.artist)} songs` : track.artist;
    const list = await cached(`related:${mode}:${query.toLowerCase()}`, () => searchTracks(query, mode, {}, 25));
    return shuffled(list.filter((t) => !excludeIds.has(t.id))).slice(0, limit);
  },
};
