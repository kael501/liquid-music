import type { LyricLine, LyricsResult, Track } from '../types';

interface LrcLibEntry {
  trackName: string;
  artistName: string;
  duration: number;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

const cache = new Map<string, LyricsResult | null>();

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split('\n')) {
    const stamps = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (stamps.length === 0) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const s of stamps) {
      const frac = s[3] ? Number(`0.${s[3]}`) : 0;
      lines.push({ time: Number(s[1]) * 60 + Number(s[2]) + frac, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

function cleanQuery(value: string): string {
  return value
    .replace(/\s*[(\[].*?[)\]]/g, '')
    .replace(/\s*(?:&|,|ft\.?|feat\.?).*$/i, '')
    .trim();
}

/**
 * Synced lyrics are fetched at runtime from LRCLIB (https://lrclib.net), a community lyrics database.
 * Nothing is bundled with the app; if a song has no entry the panel degrades gracefully.
 */
export async function fetchLyrics(track: Track, signal?: AbortSignal): Promise<LyricsResult | null> {
  const key = track.id;
  if (cache.has(key)) return cache.get(key) ?? null;

  const params = new URLSearchParams({
    track_name: cleanQuery(track.title),
    artist_name: cleanQuery(track.artist),
  });
  try {
    const res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`LRCLIB ${res.status}`);
    const entries = (await res.json()) as LrcLibEntry[];
    const ranked = entries
      .filter((e) => e.syncedLyrics || e.plainLyrics)
      .sort((a, b) => {
        const syncedDelta = Number(Boolean(b.syncedLyrics)) - Number(Boolean(a.syncedLyrics));
        if (syncedDelta !== 0) return syncedDelta;
        return Math.abs(a.duration - track.duration) - Math.abs(b.duration - track.duration);
      });
    const best = ranked[0];
    let result: LyricsResult | null = null;
    if (best?.syncedLyrics) {
      result = { synced: true, lines: parseLrc(best.syncedLyrics) };
    } else if (best?.plainLyrics) {
      result = {
        synced: false,
        lines: best.plainLyrics.split('\n').map((text) => ({ time: 0, text: text.trim() })),
      };
    }
    cache.set(key, result);
    return result;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return null;
  }
}
