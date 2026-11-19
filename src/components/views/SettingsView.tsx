import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, LogOut, Upload } from 'lucide-react';
import { RangeInput, Segmented, SettingRow, SettingSection, Toggle } from '../SettingControls';
import { useAuth } from '../../context/AuthContext';
import { useDialogs } from '../../context/DialogContext';
import { useLibrary, type LibraryData } from '../../context/LibraryContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { SHORTCUT_LIST } from '../../hooks/useShortcuts';
import { REGIONS, getApiConfig, saveApiConfig } from '../../services/config';
import { ytMusicService } from '../../services/ytMusicService';
import { listContainer, listItem } from '../../lib/motion';

const RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 2].map((r) => ({ value: r, label: r === 1 ? '1x' : `${r}x` }));

const btn =
  'inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/20';
const dangerBtn =
  'inline-flex items-center gap-2 rounded-full bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-400/25';

export function SettingsView() {
  const { settings, update, reset } = useSettings();
  const library = useLibrary();
  const { confirm } = useDialogs();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, logout, deleteAccount } = useAuth();
  const [apiKey, setApiKey] = useState(() => getApiConfig().apiKey);
  const [region, setRegion] = useState(() => getApiConfig().region);
  const unit = settings.mode === 'video' ? 'videos' : 'songs';

  const saveSource = () => {
    saveApiConfig({ apiKey, region });
    ytMusicService.clearCache();
    toast('Pengaturan sumber disimpan. Buka Beranda untuk memuat ulang.');
  };

  const removeAccount = () =>
    confirm({
      title: 'Hapus akun ini?',
      message: 'Akun beserta playlist, like, dan riwayatnya akan dihapus dari perangkat ini. Tidak bisa dibatalkan.',
      confirmLabel: 'Lanjut',
      onConfirm: () => {
        const password = window.prompt('Masukkan kata sandi untuk konfirmasi:') ?? '';
        void deleteAccount(password).then((r) => {
          if (!r.ok) toast(r.error);
        });
      },
    });

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ version: 1, library: library.exportData(), settings }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liquid-music-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded');
  };

  const importBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { library?: Partial<LibraryData>; settings?: Partial<typeof settings> };
      if (parsed.library) library.importData(parsed.library);
      if (parsed.settings) update(parsed.settings);
      toast('Backup restored');
    } catch {
      toast('That file is not a valid backup');
    }
  };


  return (
    <div className="px-6 pb-10 pt-2">
      <motion.h1 variants={listItem} className="mb-5 text-4xl font-extrabold tracking-tight">
        Settings
      </motion.h1>

      <motion.div variants={listContainer} className="mx-auto flex max-w-3xl flex-col gap-4">
        <motion.div variants={listItem}>
          <SettingSection title="Akun">
            <SettingRow
              title={user?.guest ? 'Mode tamu' : user?.name ?? ''}
              description={
                user?.guest
                  ? 'Kamu belum masuk. Data tamu disimpan di perangkat ini.'
                  : `${user?.email ?? ''} • data disimpan terpisah di perangkat ini`
              }
            >
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn} onClick={logout}>
                  <LogOut className="h-4 w-4" /> {user?.guest ? 'Masuk / Daftar' : 'Keluar'}
                </button>
                {!user?.guest && (
                  <button type="button" className={dangerBtn} onClick={removeAccount}>
                    Hapus akun
                  </button>
                )}
              </div>
            </SettingRow>
          </SettingSection>
        </motion.div>

        <motion.div variants={listItem}>
          <SettingSection title="Sumber (YouTube)">
            <SettingRow
              title="YouTube Data API key"
              description="Semua lagu dan video diambil dari YouTube, tidak ada yang dibawa aplikasi. Buat key gratis di Google Cloud Console (YouTube Data API v3). Key disimpan hanya di perangkat ini."
            >
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza…"
                aria-label="YouTube Data API key"
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full min-w-[12rem] rounded-full bg-white/10 px-4 text-base text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/40 sm:w-64 sm:text-sm"
              />
            </SettingRow>
            <SettingRow title="Wilayah trending" description="Menentukan daftar Trending dan hasil pencarian.">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                aria-label="Wilayah"
                className="h-10 rounded-full bg-white/10 px-4 text-base text-white outline-none sm:text-sm"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code} className="bg-neutral-900">
                    {r.label}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow
              title="Status"
              description={
                ytMusicService.lastError
                  ? `Terakhir gagal: ${ytMusicService.lastError}`
                  : apiKey.trim()
                    ? 'Key terisi. Tekan Simpan untuk menerapkan.'
                    : 'Belum ada key — daftar lagu akan kosong.'
              }
            >
              <button type="button" className={btn} onClick={saveSource}>
                Simpan
              </button>
            </SettingRow>
          </SettingSection>
        </motion.div>

        <motion.div variants={listItem}>
          <SettingSection title="Appearance">
            <SettingRow title="Animated background" description="Slowly drifting colour orbs behind the interface.">
              <Toggle label="Animated background" checked={settings.ambientMotion} onChange={(v) => update({ ambientMotion: v })} />
            </SettingRow>
            <SettingRow title="Background intensity" description="How strongly the album colours glow.">
              <RangeInput label="Background intensity" value={settings.ambientIntensity} min={0.2} max={1} step={0.05} onChange={(v) => update({ ambientIntensity: v })} />
            </SettingRow>
            <SettingRow title="Glass blur" description="Lower it if the app feels slow on your phone.">
              <RangeInput label="Glass blur" value={settings.glassBlur} min={8} max={64} step={4} onChange={(v) => update({ glassBlur: v })} />
            </SettingRow>
            <SettingRow title="Reduce motion" description="Disable spring and slide animations.">
              <Toggle label="Reduce motion" checked={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
            </SettingRow>
          </SettingSection>
        </motion.div>

        <motion.div variants={listItem}>
          <SettingSection title="Playback">
            <SettingRow title="Autoplay similar songs" description="When your queue ends, keep playing similar songs. With a mood selected, songs always match that mood.">
              <Toggle label="Autoplay" checked={settings.autoplay} onChange={(v) => update({ autoplay: v })} />
            </SettingRow>
            <SettingRow title="Playback speed">
              <Segmented id="rate" value={settings.playbackRate} options={RATE_OPTIONS} onChange={(v) => update({ playbackRate: v })} />
            </SettingRow>
            <SettingRow title="Progress bar style" description="Classic bar or a SoundCloud-style waveform.">
              <Segmented
                id="progress"
                value={settings.progressStyle}
                options={[
                  { value: 'bar', label: 'Bar' },
                  { value: 'waveform', label: 'Waveform' },
                ]}
                onChange={(v) => update({ progressStyle: v })}
              />
            </SettingRow>
          </SettingSection>
        </motion.div>

        <motion.div variants={listItem}>
          <SettingSection title="Keyboard shortcuts">
            <SettingRow title="Enable shortcuts" description="Space always plays and pauses.">
              <Toggle label="Keyboard shortcuts" checked={settings.shortcuts} onChange={(v) => update({ shortcuts: v })} />
            </SettingRow>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 py-4 sm:grid-cols-2">
              {SHORTCUT_LIST.map((s) => (
                <div key={s.keys} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/65">{s.action}</span>
                  <kbd className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </SettingSection>
        </motion.div>

        <motion.div variants={listItem}>
          <SettingSection title="Library & data">
            <SettingRow title="Backup" description="Save or restore your playlists, likes, history and settings.">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn} onClick={exportBackup}>
                  <Download className="h-4 w-4" /> Export
                </button>
                <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Import
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importBackup(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </SettingRow>
            <SettingRow title="Listening history" description={`${library.history.length} ${unit}`}>
              <button
                type="button"
                className={dangerBtn}
                onClick={() =>
                  confirm({
                    title: 'Clear history?',
                    message: 'Your recently played list will be emptied.',
                    confirmLabel: 'Clear',
                    onConfirm: () => {
                      library.clearHistory();
                      toast('History cleared');
                    },
                  })
                }
              >
                Clear history
              </button>
            </SettingRow>
            <SettingRow title={settings.mode === 'video' ? 'Liked Videos' : 'Liked Songs'} description={`${library.likedTracks.length} ${unit}`}>
              <button
                type="button"
                className={dangerBtn}
                onClick={() =>
                  confirm({
                    title: 'Remove all liked songs?',
                    message: 'This cannot be undone. Export a backup first if you want to keep them.',
                    confirmLabel: 'Remove all',
                    onConfirm: () => {
                      library.clearLiked();
                      toast('Liked Songs cleared');
                    },
                  })
                }
              >
                Clear likes
              </button>
            </SettingRow>
            <SettingRow title="Reset settings" description="Restore appearance and playback options to their defaults.">
              <button
                type="button"
                className={btn}
                onClick={() => {
                  reset();
                  toast('Settings reset');
                }}
              >
                Reset
              </button>
            </SettingRow>
            <SettingRow title="Reset everything" description="Delete your playlists, likes, history and followed artists.">
              <button
                type="button"
                className={dangerBtn}
                onClick={() =>
                  confirm({
                    title: 'Reset everything?',
                    message: 'Your library returns to the starting state. This cannot be undone.',
                    confirmLabel: 'Reset all',
                    onConfirm: () => {
                      library.resetAll();
                      reset();
                      toast('Everything was reset');
                    },
                  })
                }
              >
                Reset all
              </button>
            </SettingRow>
          </SettingSection>
        </motion.div>

        <motion.div variants={listItem}>
          <SettingSection title="About">
            <SettingRow title="Audio" description="Audio is streamed through the YouTube player, so an equalizer and crossfade are not available.">
              <span className="text-sm text-white/65">YouTube IFrame</span>
            </SettingRow>
          </SettingSection>
        </motion.div>
      </motion.div>
    </div>
  );
}
