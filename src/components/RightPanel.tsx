import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ListMusic, Music2, Save, X } from 'lucide-react';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { LikeButton } from './LikeButton';
import { LyricsView } from './LyricsView';
import { MoodBadge } from './MoodPicker';
import { useDialogs } from '../context/DialogContext';
import { usePlayer } from '../context/PlayerContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { spring, springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';
import type { RightPanelTab, Track } from '../types';

const TABS: Array<{ id: RightPanelTab; label: string }> = [
  { id: 'now', label: 'Now Playing' },
  { id: 'queue', label: 'Queue' },
  { id: 'lyrics', label: 'Lyrics' },
];

function NowPlayingTab() {
  const { current, isPlaying, queue, index } = usePlayer();
  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
        <Music2 className="h-8 w-8" />
        <p className="text-sm">Nothing is playing</p>
      </div>
    );
  }
  const upcoming = queue[index + 1];
  return (
    <div className="no-scrollbar h-full overflow-y-auto px-5 pb-6">
      <motion.div
        animate={{
          scale: isPlaying ? 1 : 0.93,
          y: isPlaying ? -4 : 6,
          boxShadow: isPlaying
            ? '0 36px 60px -18px rgba(0,0,0,0.75), 0 0 60px -10px var(--c1)'
            : '0 12px 24px -12px rgba(0,0,0,0.6), 0 0 0 0 transparent',
        }}
        transition={spring}
        className="mt-2 overflow-hidden rounded-3xl"
      >
        <Artwork src={current.cover} alt={current.title} className="aspect-square w-full" />
      </motion.div>

      <div className="mt-6 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-2xl font-extrabold tracking-tight">{current.title}</h3>
          <p className="mt-1 truncate text-sm text-white/65">{current.artist}</p>
        </div>
        <LikeButton track={current} size={22} />
      </div>

      <MoodBadge className="mt-4" />

      <div className="glass-thin glass mt-4 rounded-2xl p-4">
        <p className="relative z-10 text-xs font-semibold uppercase tracking-wider text-white/45">Album</p>
        <p className="relative z-10 mt-1 text-sm font-medium">{current.album}</p>
      </div>

      {upcoming && (
        <div className="glass-thin glass mt-3 rounded-2xl p-3">
          <p className="relative z-10 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Next in queue</p>
          <div className="relative z-10 flex items-center gap-3">
            <Artwork src={upcoming.cover} alt="" className="h-11 w-11 rounded-lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{upcoming.title}</p>
              <p className="truncate text-xs text-white/55">{upcoming.artist}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueItem({ track, onPlay, onRemove }: { track: Track; onPlay: () => void; onRemove: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.16)', boxShadow: '0 18px 40px -10px rgba(0,0,0,0.6)' }}
      transition={springSnappy}
      className="group flex items-center gap-2 rounded-2xl p-2 hover:bg-white/[0.07]"
    >
      <span
        aria-label="Drag to reorder"
        onPointerDown={(e) => controls.start(e)}
        className="flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-white/35 group-hover:text-white/70 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </span>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onPlay}>
        <Artwork src={track.cover} alt="" className="h-11 w-11 shrink-0 rounded-lg" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{track.title}</span>
          <span className="block truncate text-xs text-white/55">{track.artist}</span>
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${track.title} from queue`}
        onClick={onRemove}
        className="glass-btn h-8 w-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </Reorder.Item>
  );
}

function QueueTab() {
  const { queue, index, current, contextId, isPlaying, playTracks, reorderUpNext, removeFromQueue, clearUpNext } =
    usePlayer();
  const { openEditor } = useDialogs();
  const upNext = queue.slice(index + 1);

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-3 pb-6">
      {current && (
        <>
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Now playing</p>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-2">
            <Artwork src={current.cover} alt="" className="h-11 w-11 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-emerald-300">{current.title}</p>
              <p className="truncate text-xs text-white/55">{current.artist}</p>
            </div>
            <Equalizer active={isPlaying} className="mr-2 text-emerald-300" />
          </div>
        </>
      )}

      <MoodBadge className="ml-2 mt-4" />

      <div className="mb-2 mt-4 flex items-center justify-between px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Up next · {upNext.length}</p>
        <div className="flex items-center gap-3">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => openEditor({ mode: 'create', tracks: queue })}
              className="flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white"
            >
              <Save className="h-3 w-3" /> Save
            </button>
          )}
          {upNext.length > 0 && (
            <button type="button" onClick={clearUpNext} className="text-xs font-semibold text-white/60 hover:text-white">
              Clear
            </button>
          )}
        </div>
      </div>

      {upNext.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-white/55">
          <ListMusic className="h-8 w-8" />
          <p className="text-sm">Your queue is empty. Add songs from any list.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={upNext} onReorder={reorderUpNext} className="space-y-1">
          {upNext.map((track, i) => (
            <QueueItem
              key={track.id}
              track={track}
              onPlay={() => playTracks(queue, { startIndex: index + 1 + i, contextId })}
              onRemove={() => removeFromQueue(track.id)}
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function PanelContent() {
  const { rightPanel, setRightPanel } = usePlayer();
  return (
    <>
      <div className="relative z-10 flex items-center gap-1 p-3" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={rightPanel === tab.id}
            onClick={() => setRightPanel(tab.id)}
            className={cn(
              'relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              rightPanel === tab.id ? 'text-white' : 'text-white/55 hover:text-white',
            )}
          >
            {rightPanel === tab.id && (
              <motion.span
                layoutId="panel-tab"
                transition={springSnappy}
                className="absolute inset-0 rounded-full bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          aria-label="Close panel"
          onClick={() => setRightPanel(null)}
          className="glass-btn h-8 w-8"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="relative z-10 min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={rightPanel}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {rightPanel === 'now' && <NowPlayingTab />}
            {rightPanel === 'queue' && <QueueTab />}
            {rightPanel === 'lyrics' && <LyricsView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

export function RightPanel() {
  const { rightPanel, setRightPanel } = usePlayer();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const dragControls = useDragControls();

  if (desktop) {
    return (
      <AnimatePresence initial={false}>
        {rightPanel && (
          <motion.aside
            key="right-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring}
            className="shrink-0 overflow-hidden"
            aria-label="Side panel"
          >
            <div className="glass flex h-full w-[360px] flex-col rounded-3xl">
              <PanelContent />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  /* phones and tablets: bottom sheet, drag the handle down to dismiss */
  return (
    <AnimatePresence>
      {rightPanel && (
        <>
          <motion.div
            key="sheet-scrim"
            className="fixed inset-0 z-[55] bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRightPanel(null)}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-label="Player panel"
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) setRightPanel(null);
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
            className="glass glass-thick fixed inset-x-0 bottom-0 top-[9vh] z-[60] flex flex-col rounded-b-none rounded-t-[2rem] pb-[env(safe-area-inset-bottom)]"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="relative z-10 flex h-6 shrink-0 cursor-grab touch-none items-end justify-center pb-1"
              aria-hidden="true"
            >
              <span className="h-1 w-10 rounded-full bg-white/30" />
            </div>
            <PanelContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
