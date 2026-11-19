import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Home, Library, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings as SettingsIcon, Waves } from 'lucide-react';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { useDialogs } from '../context/DialogContext';
import { useNav } from '../context/NavContext';
import { usePlayer } from '../context/PlayerContext';
import { spring, springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { collectionSubtitle, filtersFor, useLibraryItems, type LibraryFilter } from '../hooks/useLibraryItems';

const fade = { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -6 } };

export function Sidebar() {
  const { view, navigate } = useNav();
  const { sidebarCollapsed: collapsed, toggleSidebar, contextId, isPlaying, likedTracks } = usePlayer();
  const [picked, setFilter] = useState<LibraryFilter>('playlists');
  const { openEditor } = useDialogs();
  const { settings } = useSettings();
  const filters = filtersFor(settings.mode);
  const filter = filters.some((f) => f.id === picked) ? picked : 'playlists';

  const items = useLibraryItems(filter);

  const activeNav = view.type === 'home' ? 'home' : view.type === 'search' ? 'search' : view.type === 'settings' ? 'settings' : null;

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home, go: () => navigate({ type: 'home' }) },
    { id: 'search' as const, label: 'Search', icon: Search, go: () => navigate({ type: 'search', query: '' }) },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon, go: () => navigate({ type: 'settings' }) },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 300 }}
      transition={spring}
      className="hidden shrink-0 flex-col gap-3 md:flex"
    >
      <nav className="glass glass-sheen rounded-3xl p-2" aria-label="Primary">
        <div className="relative z-10">
          <div className={cn('flex items-center gap-3 px-3 py-3', collapsed && 'justify-center px-0')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-orb">
              <Waves className="h-5 w-5" />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span {...fade} className="text-lg font-bold tracking-tight">
                  Liquid Music
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {navItems.map(({ id, label, icon: Icon, go }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={go}
                aria-current={active ? 'page' : undefined}
                title={label}
                className={cn(
                  'relative flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                  collapsed && 'justify-center px-0',
                  active ? 'text-white' : 'text-white/60 hover:text-white',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-2xl bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                  />
                )}
                <Icon className="relative h-[22px] w-[22px] shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span {...fade} className="relative">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </nav>

      <section className="glass flex min-h-0 flex-1 flex-col rounded-3xl p-2" aria-label="Your Library">
        <div className={cn('relative z-10 flex items-center gap-3 px-3 py-3', collapsed && 'flex-col px-0')}>
          <Library className="h-[22px] w-[22px] shrink-0 text-white/70" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span {...fade} className="flex-1 text-sm font-semibold text-white/80">
                Your Library
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => openEditor({ mode: 'create' })}
              aria-label="Create playlist"
              title="Create playlist"
              className="glass-btn h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="glass-btn h-8 w-8"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </motion.button>
        </div>

        {!collapsed && (
          <div className="relative z-10 flex gap-1.5 px-2 pb-2" role="tablist" aria-label="Library filter">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'relative rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  filter === f.id ? 'text-black' : 'text-white/70 hover:text-white',
                )}
              >
                {filter === f.id && (
                  <motion.span
                    layoutId="library-tab"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-white"
                  />
                )}
                {filter !== f.id && <span className="absolute inset-0 rounded-full bg-white/10" />}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto px-1 pb-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.ul
              key={filter}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5"
            >
              {items.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-white/45">
                  {collapsed ? '' : 'Belum ada apa-apa di sini.'}
                </li>
              )}
              {items.map((item) => {
                const selected = view.type === 'collection' && view.id === item.id;
                const playingHere = contextId === item.id;
                return (
                  <li key={item.id}>
                    <motion.button
                      type="button"
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate({ type: 'collection', id: item.id })}
                      title={item.title}
                      aria-current={selected ? 'page' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl p-2 text-left',
                        collapsed && 'justify-center',
                        selected && 'bg-white/10',
                      )}
                    >
                      <Artwork
                        src={item.cover}
                        alt=""
                        fallbackIcon={item.kind === 'liked' ? <Heart className="h-5 w-5" fill="currentColor" /> : undefined}
                        fallbackClassName={
                          item.kind === 'liked' ? 'bg-gradient-to-br from-indigo-500 to-pink-400 text-white' : undefined
                        }
                        className={cn(
                          'h-12 w-12 shrink-0 shadow-lg',
                          item.kind === 'artist' ? 'rounded-full' : 'rounded-xl',
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-sm font-medium', playingHere ? 'text-emerald-300' : 'text-white')}>
                              {item.title}
                            </span>
                            <span className="block truncate text-xs text-white/50">
                              {collectionSubtitle(item, likedTracks.length, settings.mode)}
                            </span>
                          </span>
                          {playingHere && <Equalizer active={isPlaying} className="shrink-0 text-emerald-300" />}
                        </>
                      )}
                    </motion.button>
                  </li>
                );
              })}
            </motion.ul>
          </AnimatePresence>
        </div>
      </section>
    </motion.aside>
  );
}
