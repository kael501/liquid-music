import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';
import { Artwork } from '../Artwork';
import { Equalizer } from '../Equalizer';
import { useDialogs } from '../../context/DialogContext';
import { useNav } from '../../context/NavContext';
import { usePlayer } from '../../context/PlayerContext';
import { ModeSwitch } from '../ModeSwitch';
import { useSettings } from '../../context/SettingsContext';
import { collectionSubtitle, filtersFor, useLibraryItems, type LibraryFilter } from '../../hooks/useLibraryItems';
import { listContainer, listItem, springSnappy } from '../../lib/motion';
import { cn } from '../../lib/utils';

/** Full-page "Your Library" used on phones, where the sidebar is not available. */
export function LibraryView() {
  const [picked, setFilter] = useState<LibraryFilter>('playlists');
  const { settings } = useSettings();
  const filters = filtersFor(settings.mode);
  const filter = filters.some((f) => f.id === picked) ? picked : 'playlists';
  const items = useLibraryItems(filter);
  const { navigate } = useNav();
  const { contextId, isPlaying, likedTracks } = usePlayer();
  const { openEditor } = useDialogs();

  return (
    <div className="px-4 pb-6 pt-2 sm:px-6">
      <motion.div variants={listItem} className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Library</h1>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => openEditor({ mode: 'create' })}
          aria-label="Create playlist"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-orb"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </motion.div>

      <ModeSwitch className="mb-4" />

      <motion.div variants={listItem} className="mb-3 flex gap-2" role="tablist" aria-label="Library filter">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'relative rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              filter === f.id ? 'text-black' : 'text-white/75',
            )}
          >
            {filter === f.id ? (
              <motion.span layoutId="library-page-tab" transition={springSnappy} className="absolute inset-0 rounded-full bg-white" />
            ) : (
              <span className="absolute inset-0 rounded-full bg-white/10" />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </motion.div>

      <motion.ul variants={listContainer} className="space-y-1">
        {items.length === 0 && (
          <li className="py-16 text-center text-sm text-white/50">Belum ada apa-apa di sini.</li>
        )}
        {items.map((item) => {
          const playingHere = contextId === item.id;
          return (
            <motion.li key={item.id} variants={listItem}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.08)' }}
                onClick={() => navigate({ type: 'collection', id: item.id })}
                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left"
              >
                <Artwork
                  src={item.cover}
                  alt=""
                  fallbackIcon={item.kind === 'liked' ? <Heart className="h-6 w-6" fill="currentColor" /> : undefined}
                  fallbackClassName={
                    item.kind === 'liked' ? 'bg-gradient-to-br from-indigo-500 to-pink-400 text-white' : undefined
                  }
                  className={cn('h-14 w-14 shrink-0 shadow-lg', item.kind === 'artist' ? 'rounded-full' : 'rounded-xl')}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[15px] font-medium', playingHere ? 'text-emerald-300' : 'text-white')}>
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-white/50">{collectionSubtitle(item, likedTracks.length, settings.mode)}</span>
                </span>
                {playingHere && <Equalizer active={isPlaying} className="shrink-0 text-emerald-300" />}
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
