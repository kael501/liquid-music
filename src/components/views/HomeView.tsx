import { useEffect, useMemo, useState } from 'react';
import { VIDEO_CATEGORIES } from '../../data/catalog';
import { motion } from 'framer-motion';
import { Heart, History, Pause, Play } from 'lucide-react';
import { Artwork } from '../Artwork';
import { Equalizer } from '../Equalizer';
import { MediaCard } from '../MediaCard';
import { ModeSwitch } from '../ModeSwitch';
import { MoodPicker } from '../MoodPicker';
import { Shelf } from '../Shelf';
import { SourceNotice } from '../SourceNotice';
import { TrackMenu } from '../TrackMenu';
import { VideoCard } from '../VideoCard';
import { useLibrary } from '../../context/LibraryContext';
import { useNav } from '../../context/NavContext';
import { usePlayer } from '../../context/PlayerContext';
import { useSettings } from '../../context/SettingsContext';
import { ytMusicService } from '../../services/ytMusicService';
import { sheenHandlers } from '../../lib/sheen';
import { listContainer, listItem, springSnappy } from '../../lib/motion';
import { cn, greeting } from '../../lib/utils';
import type { Collection, Track } from '../../types';

function QuickPickRow({ track, index, list }: { track: Track; index: number; list: Track[] }) {
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();
  const active = current?.id === track.id;
  return (
    <motion.div
      variants={listItem}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={() => (active ? togglePlay() : playTracks(list, { startIndex: index, contextId: 'quickpicks' }))}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (active ? togglePlay() : playTracks(list, { startIndex: index, contextId: 'quickpicks' }));
      }}
      {...sheenHandlers}
      className="glass glass-thin glass-sheen flex cursor-pointer items-center gap-3 rounded-2xl p-2 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <Artwork src={track.cover} alt="" className="relative z-10 h-12 w-12 shrink-0 rounded-xl" />
      <div className="relative z-10 min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', active && 'text-emerald-300')}>{track.title}</p>
        <p className="truncate text-xs text-white/55">{track.artist}</p>
      </div>
      {active && <Equalizer active={isPlaying} className="relative z-10 text-emerald-300" />}
      <TrackMenu track={track} className="relative z-10" />
    </motion.div>
  );
}

export function HomeView() {
  const { navigate } = useNav();
  const { contextId, current, isPlaying, playTracks, togglePlay } = usePlayer();
  const library = useLibrary();
  const { settings } = useSettings();
  const mode = settings.mode;

  const [trending, setTrending] = useState<Track[]>([]);
  const [releases, setReleases] = useState<Track[]>([]);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTrending([]);
    if (mode === 'music') {
      void Promise.all([
        ytMusicService.getTrending('music'),
        ytMusicService.getNewReleases(),
        /* picked once per visit so the list does not reshuffle every time a song starts */
        ytMusicService.getQuickPicks(library.likedTracks, library.history),
      ]).then(([t, r, q]) => {
        if (cancelled) return;
        setTrending(t);
        setReleases(r);
        setQuickPicks(q);
        setLoading(false);
      });
    } else {
      void ytMusicService.getTrending('video', category).then((t) => {
        if (cancelled) return;
        setTrending(t);
        setLoading(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [mode, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const quickAccess = useMemo(() => {
    const ids = ['liked', 'history', ...library.playlists.slice(0, 4).map((p) => p.id)];
    return ids.map((id) => library.getCollection(id)).filter((c): c is Collection => c !== null);
  }, [library]);

  const yourPlaylists = useMemo(
    () => library.playlists.map((p) => library.getCollection(p.id)).filter((c): c is Collection => c !== null),
    [library],
  );

  const playCollection = (c: Collection) => {
    if (contextId === c.id) togglePlay();
    else playTracks(c.tracks, { contextId: c.id });
  };
  const openCollection = (c: Collection) => navigate({ type: 'collection', id: c.id });

  const trackCards = (tracks: Track[], ctx: string) =>
    tracks.map((track, i) => (
      <MediaCard
        key={`${ctx}-${track.id}`}
        title={track.title}
        subtitle={track.artist}
        cover={track.cover}
        active={current?.id === track.id}
        playing={current?.id === track.id && isPlaying}
        onOpen={() => playTracks(tracks, { startIndex: i, contextId: ctx })}
        onPlay={() => (current?.id === track.id ? togglePlay() : playTracks(tracks, { startIndex: i, contextId: ctx }))}
      />
    ));

  const videoCards = (tracks: Track[], ctx: string, className?: string) =>
    tracks.map((track, i) => (
      <VideoCard
        key={`${ctx}-${track.id}`}
        track={track}
        className={className}
        active={current?.id === track.id}
        playing={current?.id === track.id && isPlaying}
        onPlay={() => (current?.id === track.id ? togglePlay() : playTracks(tracks, { startIndex: i, contextId: ctx }))}
      />
    ));

  const frequentTitle = mode === 'video' ? 'Sering Kamu Tonton' : 'Sering Kamu Putar';
  const historyTitle = mode === 'video' ? 'Terakhir Ditonton' : 'Recently Played';

  return (
    <div className="relative px-4 pb-8 pt-2 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--c1) 38%, transparent), transparent)' }}
      />

      <motion.h1 variants={listItem} className="mb-4 text-4xl font-extrabold tracking-tight">
        {greeting()}
      </motion.h1>
      <ModeSwitch className="mb-5" />

      <motion.div variants={listContainer} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickAccess.map((c) => {
          const active = contextId === c.id;
          const playing = active && isPlaying;
          return (
            <motion.div
              key={c.id}
              variants={listItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springSnappy}
              onClick={() => openCollection(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openCollection(c);
              }}
              {...sheenHandlers}
              className="glass glass-thin glass-sheen group flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl pr-4 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Artwork
                src={c.cover}
                alt=""
                fallbackIcon={
                  c.kind === 'liked' ? (
                    <Heart className="h-6 w-6" fill="currentColor" />
                  ) : c.kind === 'history' ? (
                    <History className="h-6 w-6" />
                  ) : undefined
                }
                fallbackClassName={
                  c.kind === 'liked' ? 'bg-gradient-to-br from-indigo-500 to-pink-400 text-white' : undefined
                }
                className="relative z-10 h-16 w-16 shrink-0"
              />
              <span className={cn('relative z-10 flex-1 truncate text-sm font-semibold', active && 'text-emerald-300')}>
                {c.title}
              </span>
              {active && <Equalizer active={playing} className="relative z-10 text-emerald-300 group-hover:hidden" />}
              <motion.button
                type="button"
                aria-label={playing ? `Pause ${c.title}` : `Play ${c.title}`}
                whileTap={{ scale: 0.9 }}
                disabled={c.tracks.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  playCollection(c);
                }}
                className="relative z-10 flex h-10 w-10 shrink-0 translate-x-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-orb transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 disabled:hidden [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100"
              >
                {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>

      {!loading && trending.length === 0 && <SourceNotice />}

      {mode === 'music' ? (
        <>
          <MoodPicker />

          {quickPicks.length > 0 && (
            <motion.section variants={listItem} className="mt-10">
              <div className="mb-3 px-1">
                <h2 className="text-2xl font-bold tracking-tight">Pilihan Cepat</h2>
                <p className="mt-0.5 text-sm text-white/55">
                  {library.history.length + library.likedTracks.length > 0
                    ? 'Berdasarkan artis yang sering kamu dengar'
                    : 'Lagu untuk mulai mendengarkan'}
                </p>
              </div>
              <motion.div variants={listContainer} className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {quickPicks.map((track, i) => (
                  <QuickPickRow key={track.id} track={track} index={i} list={quickPicks} />
                ))}
              </motion.div>
            </motion.section>
          )}

          {trending.length > 0 && (
            <Shelf title="Trending" subtitle="Musik paling ramai di YouTube saat ini">
              {trackCards(trending, 'trending')}
            </Shelf>
          )}

          {releases.length > 0 && (
            <Shelf title="Baru Rilis" subtitle="Rilisan terbaru 45 hari terakhir">
              {trackCards(releases, 'new-releases')}
            </Shelf>
          )}
        </>
      ) : (
        <motion.section variants={listItem} className="mt-8">
          <div className="mb-3 px-1">
            <h2 className="text-2xl font-bold tracking-tight">Video Trending</h2>
            <p className="mt-0.5 text-sm text-white/55">Video non-musik yang sedang ramai di YouTube.</p>
          </div>
          <div className="no-scrollbar -mx-2 mb-4 flex gap-2 overflow-x-auto px-2 pb-1" role="tablist" aria-label="Kategori video">
            {VIDEO_CATEGORIES.map((c) => (
              <button
                key={c.id || 'all'}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  category === c.id ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          {loading && <p className="py-10 text-center text-sm text-white/50">Memuat video…</p>}
          <motion.div variants={listContainer} className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
            {videoCards(trending, `video-trending-${category}`)}
          </motion.div>
        </motion.section>
      )}

      {library.frequentTracks.length > 0 && (
        <Shelf title={frequentTitle} subtitle={mode === 'video' ? 'Video yang kamu tonton berulang kali' : 'Lagu yang kamu putar berulang kali'}>
          {mode === 'video'
            ? videoCards(library.frequentTracks, 'frequent', 'w-64 shrink-0 snap-start')
            : trackCards(library.frequentTracks, 'frequent')}
        </Shelf>
      )}

      {library.history.length > 0 && (
        <Shelf title={historyTitle}>
          {mode === 'video'
            ? videoCards(library.history.slice(0, 12), 'history', 'w-64 shrink-0 snap-start')
            : trackCards(library.history.slice(0, 12), 'history')}
        </Shelf>
      )}

      {yourPlaylists.length > 0 && (
        <Shelf title="Your Playlists">
          {yourPlaylists.map((c) => (
            <MediaCard
              key={c.id}
              title={c.title}
              subtitle={`${c.tracks.length} ${mode === 'video' ? 'videos' : 'songs'}`}
              cover={c.cover}
              active={contextId === c.id}
              playing={contextId === c.id && isPlaying}
              onOpen={() => openCollection(c)}
              onPlay={() => playCollection(c)}
            />
          ))}
        </Shelf>
      )}
    </div>
  );
}
