import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Track } from '../types';

export type EditorSpec =
  | { mode: 'create'; tracks?: Track[]; onCreated?: (id: string) => void }
  | { mode: 'rename'; id: string; title: string; description: string };

export interface ConfirmSpec {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

interface DialogContextValue {
  pickerTracks: Track[] | null;
  editor: EditorSpec | null;
  confirmSpec: ConfirmSpec | null;
  openPicker: (tracks: Track[]) => void;
  closePicker: () => void;
  openEditor: (spec: EditorSpec) => void;
  closeEditor: () => void;
  confirm: (spec: ConfirmSpec) => void;
  closeConfirm: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pickerTracks, setPickerTracks] = useState<Track[] | null>(null);
  const [editor, setEditor] = useState<EditorSpec | null>(null);
  const [confirmSpec, setConfirmSpec] = useState<ConfirmSpec | null>(null);

  const openPicker = useCallback((tracks: Track[]) => setPickerTracks(tracks), []);
  const closePicker = useCallback(() => setPickerTracks(null), []);
  const openEditor = useCallback((spec: EditorSpec) => setEditor(spec), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const confirm = useCallback((spec: ConfirmSpec) => setConfirmSpec(spec), []);
  const closeConfirm = useCallback(() => setConfirmSpec(null), []);

  const value = useMemo(
    () => ({
      pickerTracks, editor, confirmSpec, openPicker, closePicker, openEditor, closeEditor, confirm, closeConfirm,
    }),
    [pickerTracks, editor, confirmSpec, openPicker, closePicker, openEditor, closeEditor, confirm, closeConfirm],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function useDialogs(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs must be used inside <DialogProvider>');
  return ctx;
}
