import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, SearchX } from 'lucide-react';
import { Artwork } from '../Artwork';
import { ModeSwitch } from '../ModeSwitch';
import { SourceNotice } from '../SourceNotice';
import { TrackRow } from '../TrackRow';
import { VideoCard } from '../VideoCard';
import { useNav } from '../../context/NavContext';
import { usePlayer } from '../../context/PlayerContext';
import { useSettings } from '../../context/SettingsContext';
import { ytMusicService } from '../../services/ytMusicService';
import { sheenHandlers } from '../../lib/sheen';
import { listContainer, listItem, springSnappy } from '../../lib/motion';
import type { Track } from '../../types';

interface SearchViewProps {
  query: string;
}

export function SearchView({ query }: SearchViewProps) {
  const { navigate } = useNav();
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();
  const { settings } = useSettings();
  const mode = settings.mode;
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    ytMusicService
      .search(q, mode)
      .then((tracks) => {
        if (!cancelled) setResults(tracks);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, mode]);

  if (!query.trim()) {
    const categories =
      mode === 'music'
        ? ytMusicService.getCategories()
        : ytMusicService
            .getVideoCategories()
            .filter((c) => c.id !== '')
            .map((c, i) => ({ label: c.label, query: c.label, from: ['#ff4f8b', '#18c1ff', '#ff7a18', '#22c55e', '#a855f7'][i % 5], to: ['#8a2be2', '#3a5bff', '#ff2d55', '#0d9488', '#ec4899'][i % 5] }));
    return (
      <div className="px-4 pb-8 pt-2 sm:px-6">
        <motion.h1 variants={listItem} className="mb-4 text-3xl font-extrabold tracking-tight">
          {mode === 'music' ? 'Jelajahi musik' : 'Jelajahi video'}
        </motion.h1>
        <ModeSwitch className="mb-5" />
        <motion.div variants={listContainer} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <motion.button
              key={c.label}
              type="button"
              variants={listItem}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              onClick={() => navigate({ type: 'search', query: c.query })}
              {...sheenHandlers}
              className="glass glass-sheen relative h-32 overflow-hidden rounded-3xl p-4 text-left"
              style={{ background: `linear-gradient(135deg, ${c.from}cc, ${c.to}99)` }}
            >
              <span className="relative z-10 text-xl font-bold tracking-tight">{c.label}</span>
              <span
                aria-hidden="true"
                className="absolute -bottom-6 -right-6 h-24 w-24 rotate-12 rounded-2xl bg-white/15 backdrop-blur-sm"
              />
            </motion.button>
          ))}
        </motion.div>
        <SourceNotice />
      </div>
    );
  }

  const contextId = `search:${query.trim().toLowerCase()}`;
  const top = results[0];
  const topActive = top ? current?.id === top.id : false;

  return (
    <div className="px-4 pb-8 pt-2 sm:px-6">
      <motion.h1 variants={listItem} className="mb-4 text-3xl font-extrabold tracking-tight">
        Hasil untuk “{query.trim()}”
      </motion.h1>
      <ModeSwitch className="mb-5" />

      {loading && results.length === 0 && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading results">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-2">
              <div className="h-11 w-11 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded-full bg-white/10" />
                <div className="h-3 w-1/5 rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <motion.div variants={listItem} className="flex flex-col items-center gap-3 py-24 text-center">
          <SearchX className="h-10 w-10 text-white/40" />
          <p className="text-lg font-semibold">{mode === 'music' ? 'Lagu tidak ditemukan' : 'Video tidak ditemukan'}</p>
          <p className="max-w-sm text-sm text-white/55">Coba kata kunci lain.</p>
          <SourceNotice />
        </motion.div>
      )}

      {top && mode === 'video' && (
        <motion.div variants={listContainer} className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((track, i) => (
            <VideoCard
              key={track.id}
              track={track}
              active={current?.id === track.id}
              playing={current?.id === track.id && isPlaying}
              onPlay={() => (current?.id === track.id ? togglePlay() : playTracks(results, { startIndex: i, contextId }))}
            />
          ))}
        </motion.div>
      )}

      {top && mode === 'music' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <motion.section variants={listItem}>
            <h2 className="mb-3 text-xl font-bold">Top result</h2>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={springSnappy}
              onClick={() => (topActive ? togglePlay() : playTracks(results, { startIndex: 0, contextId }))}
              {...sheenHandlers}
              className="glass glass-sheen group relative cursor-pointer rounded-3xl p-5"
            >
              <Artwork src={top.cover} alt="" className="relative z-10 h-24 w-24 rounded-2xl shadow-2xl" />
              <p className="relative z-10 mt-5 truncate text-3xl font-extrabold tracking-tight">{top.title}</p>
              <p className="relative z-10 mt-1 truncate text-sm text-white/60">
                Lagu • <span className="text-white">{top.artist}</span>
              </p>
              <motion.button
                type="button"
                aria-label={topActive && isPlaying ? 'Pause top result' : 'Play top result'}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (topActive) togglePlay();
                  else playTracks(results, { startIndex: 0, contextId });
                }}
                className="absolute bottom-5 right-5 z-10 flex h-12 w-12 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-orb transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
              >
                {topActive && isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                )}
              </motion.button>
            </motion.div>
          </motion.section>

          <section>
            <motion.h2 variants={listItem} className="mb-3 text-xl font-bold">
              Lagu
            </motion.h2>
            <motion.div variants={listContainer}>
              {results.slice(0, 20).map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} tracks={results} contextId={contextId} showAlbum={false} />
              ))}
            </motion.div>
          </section>
        </div>
      )}
    </div>
  );
}
