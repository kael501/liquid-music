import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListMusic, Plus, X } from 'lucide-react';
import { Artwork } from './Artwork';
import { useDialogs } from '../context/DialogContext';
import { useLibrary } from '../context/LibraryContext';
import { useNav } from '../context/NavContext';
import { useToast } from '../context/ToastContext';
import { spring } from '../lib/motion';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="glass glass-thick w-full max-w-md rounded-3xl p-6"
      >
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="glass-btn h-8 w-8">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PlaylistPicker() {
  const { pickerTracks, closePicker, openEditor } = useDialogs();
  const { playlists, addToPlaylist } = useLibrary();
  const { toast } = useToast();
  if (!pickerTracks) return null;

  const label = pickerTracks.length === 1 ? `“${pickerTracks[0].title}”` : `${pickerTracks.length} songs`;

  return (
    <Modal title="Add to playlist" onClose={closePicker}>
      <button
        type="button"
        onClick={() => {
          const tracks = pickerTracks;
          closePicker();
          openEditor({ mode: 'create', tracks });
        }}
        className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-white/10 p-3 text-left text-sm font-semibold hover:bg-white/15"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
          <Plus className="h-5 w-5" />
        </span>
        New playlist
      </button>
      <ul className="no-scrollbar max-h-[46vh] space-y-1 overflow-y-auto">
        {playlists.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => {
                const added = addToPlaylist(p.id, pickerTracks);
                toast(added > 0 ? `Added ${label} to ${p.title}` : `Already in ${p.title}`);
                closePicker();
              }}
              className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-white/10"
            >
              <Artwork src={p.tracks[0]?.cover ?? ''} alt="" fallbackIcon={<ListMusic className="h-5 w-5" />} className="h-11 w-11 shrink-0 rounded-xl" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.title}</span>
                <span className="block text-xs text-white/50">{p.tracks.length} songs</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function PlaylistEditor() {
  const { editor, closeEditor } = useDialogs();
  const { createPlaylist, renamePlaylist } = useLibrary();
  const { navigate } = useNav();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editor?.mode === 'rename') {
      setTitle(editor.title);
      setDescription(editor.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [editor]);

  if (!editor) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (editor.mode === 'create') {
      const id = createPlaylist(title || 'My Playlist', editor.tracks ?? [], description.trim());
      toast(`Created “${title.trim() || 'My Playlist'}”`);
      editor.onCreated?.(id);
      closeEditor();
      navigate({ type: 'collection', id });
    } else {
      renamePlaylist(editor.id, title, description.trim());
      toast('Playlist updated');
      closeEditor();
    }
  };

  return (
    <Modal title={editor.mode === 'create' ? 'Create playlist' : 'Edit playlist'} onClose={closeEditor}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Name</span>
          <input
            autoFocus
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Playlist"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none ring-white/30 placeholder:text-white/35 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Description</span>
          <input
            value={description}
            maxLength={120}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none ring-white/30 placeholder:text-white/35 focus:ring-2"
          />
        </label>
        {editor.mode === 'create' && editor.tracks && editor.tracks.length > 0 && (
          <p className="text-xs text-white/50">{editor.tracks.length} song(s) will be added.</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={closeEditor} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white">
            Cancel
          </button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black shadow-orb"
          >
            {editor.mode === 'create' ? 'Create' : 'Save'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDialog() {
  const { confirmSpec, closeConfirm } = useDialogs();
  if (!confirmSpec) return null;
  return (
    <Modal title={confirmSpec.title} onClose={closeConfirm}>
      <p className="text-sm text-white/65">{confirmSpec.message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={closeConfirm} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white">
          Cancel
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            confirmSpec.onConfirm();
            closeConfirm();
          }}
          className="rounded-full bg-red-400 px-6 py-2.5 text-sm font-bold text-black"
        >
          {confirmSpec.confirmLabel}
        </motion.button>
      </div>
    </Modal>
  );
}

export function Dialogs() {
  const { pickerTracks, editor, confirmSpec } = useDialogs();
  return (
    <>
      <AnimatePresence>{pickerTracks && <PlaylistPicker key="picker" />}</AnimatePresence>
      <AnimatePresence>{editor && <PlaylistEditor key="editor" />}</AnimatePresence>
      <AnimatePresence>{confirmSpec && <ConfirmDialog key="confirm" />}</AnimatePresence>
    </>
  );
}
