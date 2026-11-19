import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { useNav } from '../context/NavContext';
import { ytMusicService } from '../services/ytMusicService';

/** Explains why a list is empty: no API key yet, or YouTube returned an error. Renders nothing otherwise. */
export function SourceNotice() {
  const { navigate } = useNav();
  const error = ytMusicService.lastError;
  if (ytMusicService.hasKey && !error) return null;
  return (
    <motion.div className="glass glass-thin mt-6 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center">
      <KeyRound className="relative z-10 h-6 w-6 shrink-0 text-amber-300" />
      <div className="relative z-10 min-w-0 flex-1 text-sm">
        <p className="font-semibold">{ytMusicService.hasKey ? 'YouTube menolak permintaan' : 'Butuh API key YouTube'}</p>
        <p className="mt-0.5 text-white/65">
          {ytMusicService.hasKey
            ? error
            : 'Aplikasi ini tidak membawa lagu bawaan. Masukkan YouTube Data API key di Pengaturan → Sumber untuk memuat lagu dan video.'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate({ type: 'settings' })}
        className="relative z-10 shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-black"
      >
        Buka Pengaturan
      </button>
    </motion.div>
  );
}
