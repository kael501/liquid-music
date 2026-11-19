import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock3, Heart, ListPlus, Pause, Pencil, Play, Shuffle, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { Artwork } from '../Artwork';
import { TrackRow } from '../TrackRow';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary } from '../../context/LibraryContext';
import { useNav } from '../../context/NavContext';
import { usePlayer } from '../../context/PlayerContext';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { ytMusicService } from '../../services/ytMusicService';
import { useDominantColor } from '../../hooks/useDominantColor';
import { listContainer, listItem, springSnappy } from '../../lib/motion';
import { cn, formatTotal } from '../../lib/utils';
import type { Collection, Track } from '../../types';

interface CollectionViewProps {
  id: string;
}

const KIND_LABEL = {
  playlist: 'Playlist',
  mix: 'Made for you',
  album: 'Album',
  artist: 'Artist',
  liked: 'Playlist',
  history: 'History',
} as const;

const pill =
  'glass glass-thick glass-sheen flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-40';

export function CollectionView({ id }: CollectionViewProps) {
  const { contextId, isPlaying, playTracks, togglePlay } = usePlayer();
  const library = useLibrary();
  const { openEditor, openPicker, confirm } = useDialogs();
  const { navigate } = useNav();
  const { toast } = useToast();
  const { settings } = useSettings();
  const artistName = id.startsWith('artist:') ? id.slice(7) : null;
  const [artist, setArtist] = useState<{ name: string; tracks: Track[] } | null>(null);

  /* artist pages are loaded from YouTube on demand */
  useEffect(() => {
    if (!artistName) return;
    let cancelled = false;
    setArtist(null);
    void ytMusicService.getArtistTracks(artistName).then((tracks) => {
      if (!cancelled) setArtist({ name: artistName, tracks });
    });
    return () => {
      cancelled = true;
    };
  }, [artistName]);

  const collection = useMemo<Collection | null>(() => {
    if (artistName) {
      const tracks = artist?.name === artistName ? artist.tracks : [];
      return {
        id,
        kind: 'artist',
        title: artistName,
        subtitle: 'Artist',
        description: `Lagu populer dari ${artistName}`,
        cover: tracks[0]?.cover ?? '',
        tracks,
      };
    }
    return library.getCollection(id);
  }, [id, library, artistName, artist]);
  const loadingArtist = artistName !== null && artist?.name !== artistName;
  const unit = settings.mode === 'video' ? 'video' : 'song';
  const { colors } = useDominantColor(collection?.cover, collection?.id ?? id);

  if (!collection) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-white/60">
        <p className="text-lg font-semibold text-white">Nothing here</p>
        <p className="text-sm">We could not find that collection.</p>
      </div>
    );
  }

  const isThis = contextId === collection.id;
  const playingHere = isThis && isPlaying;
  const total = collection.tracks.reduce((sum, track) => sum + track.duration, 0);
  const empty = collection.tracks.length === 0;

  return (
    <div className="relative pb-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] transition-[background] duration-1000"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, ${colors[0]} 55%, transparent), color-mix(in srgb, ${colors[1]} 12%, transparent) 70%, transparent)`,
        }}
      />

      <motion.header variants={listItem} className="flex flex-col items-center gap-6 px-6 pb-6 pt-4 sm:flex-row sm:items-end">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springSnappy}
          className="shrink-0"
        >
          <Artwork
            src={collection.cover}
            alt={collection.title}
            fallbackIcon={collection.kind === 'liked' ? <Heart className="h-20 w-20" fill="currentColor" /> : undefined}
            fallbackClassName={
              collection.kind === 'liked' ? 'bg-gradient-to-br from-indigo-500 to-pink-400 text-white' : undefined
            }
            className={cn(
              'h-52 w-52 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.75)] sm:h-60 sm:w-60',
              collection.kind === 'artist' ? 'rounded-full' : 'rounded-3xl',
            )}
          />
        </motion.div>
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{KIND_LABEL[collection.kind]}</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{collection.title}</h1>
          {collection.description && <p className="mt-3 text-sm text-white/65">{collection.description}</p>}
          <p className="mt-2 text-sm text-white/55">
            {collection.subtitle} • {collection.tracks.length} {collection.tracks.length === 1 ? unit : `${unit}s`}
            {total > 0 && `, ${formatTotal(total)}`}
          </p>
        </div>
      </motion.header>

      <motion.div variants={listItem} className="flex items-center gap-4 px-6 py-4">
        <motion.button
          type="button"
          aria-label={playingHere ? `Pause ${collection.title}` : `Play ${collection.title}`}
          disabled={empty}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          onClick={() => (isThis ? togglePlay() : playTracks(collection.tracks, { contextId: collection.id }))}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-orb disabled:opacity-40"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={playingHere ? 'pause' : 'play'}
              initial={{ scale: 0.4, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, rotate: 45, opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              {playingHere ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="ml-1 h-7 w-7" fill="currentColor" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          aria-label={`Shuffle play ${collection.title}`}
          disabled={empty}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          onClick={() => playTracks(collection.tracks, { contextId: collection.id, shuffle: true })}
          className="glass glass-thick glass-sheen flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-40"
        >
          <Shuffle className="relative z-10 h-[18px] w-[18px]" />
          <span className="relative z-10">Shuffle</span>
        </motion.button>

        {collection.kind === 'artist' && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              const nowFollowing = library.toggleFollow(collection.title);
              toast(nowFollowing ? `Following ${collection.title}` : `Unfollowed ${collection.title}`);
            }}
            className={pill}
          >
            {library.isFollowing(collection.title) ? (
              <UserCheck className="relative z-10 h-[18px] w-[18px] text-emerald-300" />
            ) : (
              <UserPlus className="relative z-10 h-[18px] w-[18px]" />
            )}
            <span className="relative z-10">{library.isFollowing(collection.title) ? 'Following' : 'Follow'}</span>
          </motion.button>
        )}

        {!collection.editable && !empty && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => openPicker(collection.tracks)}
            className={pill}
            aria-label="Add all songs to a playlist"
          >
            <ListPlus className="relative z-10 h-[18px] w-[18px]" />
            <span className="relative z-10 hidden sm:inline">Add to playlist</span>
          </motion.button>
        )}

        {collection.editable && (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                openEditor({ mode: 'rename', id: collection.id, title: collection.title, description: collection.description ?? '' })
              }
              className={pill}
              aria-label="Edit playlist"
            >
              <Pencil className="relative z-10 h-[18px] w-[18px]" />
              <span className="relative z-10 hidden sm:inline">Edit</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                confirm({
                  title: `Delete “${collection.title}”?`,
                  message: 'The playlist will be removed from your library. The songs themselves are not deleted.',
                  confirmLabel: 'Delete',
                  onConfirm: () => {
                    library.deletePlaylist(collection.id);
                    toast('Playlist deleted');
                    navigate({ type: 'home' });
                  },
                })
              }
              className={`${pill} text-red-300`}
              aria-label="Delete playlist"
            >
              <Trash2 className="relative z-10 h-[18px] w-[18px]" />
            </motion.button>
          </>
        )}
      </motion.div>

      {empty ? (
        <motion.div variants={listItem} className="mx-6 mt-6 flex flex-col items-center gap-3 rounded-3xl bg-white/5 py-16 text-center">
          <Heart className="h-10 w-10 text-white/40" />
          <p className="text-lg font-semibold">
            {collection.kind === 'artist'
              ? loadingArtist
                ? 'Memuat lagu…'
                : 'Tidak ada lagu ditemukan'
              : collection.kind === 'liked'
              ? (settings.mode === 'video' ? 'Videos you like will appear here' : 'Songs you like will appear here')
              : collection.kind === 'history'
                ? 'Nothing played yet'
                : 'This playlist is empty'}
          </p>
          <p className="text-sm text-white/55">
            {collection.kind === 'artist'
              ? ytMusicService.hasKey
                ? ytMusicService.lastError
                : 'Isi API key YouTube di Pengaturan.'
              : collection.kind === 'liked'
              ? 'Tap the heart on any track to save it.'
              : collection.kind === 'history'
                ? 'Songs you listen to will show up here.'
                : 'Open the ⋯ menu on any song and choose “Add to playlist”.'}
          </p>
        </motion.div>
      ) : (
        <div className="px-3" role="table" aria-label={`${collection.title} tracks`}>
          <div
            role="row"
            className="mb-1 grid grid-cols-[1.75rem_minmax(0,1fr)_auto_2.75rem] items-center gap-2 border-b border-white/10 px-2 pb-2 text-xs font-medium uppercase tracking-wider text-white/45 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_3.5rem] sm:gap-4 sm:px-3 md:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1fr)_auto_3.5rem]"
          >
            <span className="text-center">#</span>
            <span>Title</span>
            <span className="hidden md:block">Album</span>
            <span className="w-[64px] sm:w-[112px]" />
            <Clock3 className="ml-auto h-4 w-4" />
          </div>
          <motion.div variants={listContainer}>
            {collection.tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                tracks={collection.tracks}
                contextId={collection.id}
                showAlbum={collection.kind !== 'album'}
                onRemove={collection.editable ? () => library.removeFromPlaylist(collection.id, track.id) : undefined}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
