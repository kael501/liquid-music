import { useEffect, useState } from 'react';
import { fetchLyrics } from '../services/lyricsService';
import type { LyricsResult, Track } from '../types';

export interface LyricsState {
  loading: boolean;
  lyrics: LyricsResult | null;
}

export function useLyrics(track: Track | null, enabled: boolean): LyricsState {
  const [state, setState] = useState<LyricsState>({ loading: false, lyrics: null });

  useEffect(() => {
    if (!track || !enabled || track.kind === 'video') return;
    const controller = new AbortController();
    setState({ loading: true, lyrics: null });
    fetchLyrics(track, controller.signal)
      .then((lyrics) => setState({ loading: false, lyrics }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setState({ loading: false, lyrics: null });
      });
    return () => controller.abort();
  }, [track?.id, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
