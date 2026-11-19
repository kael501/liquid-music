import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AmbientBackground } from './components/AmbientBackground';
import { BottomNav } from './components/BottomNav';
import { Dialogs } from './components/Dialogs';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { MiniPlayer } from './components/MiniPlayer';
import { PlayerDock } from './components/PlayerDock';
import { RightPanel } from './components/RightPanel';
import { Sidebar } from './components/Sidebar';
import { ToastHost } from './components/ToastHost';
import { TopBar } from './components/TopBar';
import { CollectionView } from './components/views/CollectionView';
import { HomeView } from './components/views/HomeView';
import { LibraryView } from './components/views/LibraryView';
import { SearchView } from './components/views/SearchView';
import { SettingsView } from './components/views/SettingsView';
import { useNav, viewKey } from './context/NavContext';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useShortcuts } from './hooks/useShortcuts';
import { pageVariants } from './lib/motion';

export default function App() {
  const { view } = useNav();
  const scrollRef = useRef<HTMLElement>(null);
  const key = viewKey(view);
  useShortcuts();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [key]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AmbientBackground />

      <div className="relative z-10 flex h-full gap-3 p-0 md:p-3 md:pb-[116px]">
        <Sidebar />

        <main
          ref={scrollRef}
          className="glass relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-none border-0 max-md:!bg-black/25 max-md:!shadow-none max-md:!backdrop-blur-none md:rounded-3xl md:border"
          aria-label="Content"
        >
          <TopBar scrollRef={scrollRef} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 pb-44 md:pb-0"
            >
              {view.type === 'home' && <HomeView />}
              {view.type === 'search' && <SearchView query={view.query} />}
              {view.type === 'collection' && <CollectionView id={view.id} />}
              {view.type === 'library' && <LibraryView />}
              {view.type === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>

        <RightPanel />
      </div>

      {isDesktop ? (
        <PlayerDock />
      ) : (
        <>
          <MiniPlayer />
          <BottomNav />
        </>
      )}
      <FullScreenPlayer />
      <Dialogs />
      <ToastHost />
    </div>
  );
}
