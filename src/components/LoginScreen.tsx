import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Lock, Mail, Music2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { spring } from '../lib/motion';
import { cn } from '../lib/utils';

const field =
  'relative z-10 h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40';

export function LoginScreen() {
  const { login, register, continueAsGuest } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const result = tab === 'login' ? await login(email, password) : await register(name, email, password);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070d] px-4 py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/25 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring}
        className="glass glass-thick relative w-full max-w-sm rounded-[2rem] p-6 sm:p-8"
      >
        <div className="relative z-10 mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 shadow-orb">
            <Music2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Liquid Music</h1>
          <p className="mt-1 text-sm text-white/60">Masuk agar library, playlist, dan riwayatmu tersimpan terpisah.</p>
        </div>

        <div className="relative z-10 mb-5 grid grid-cols-2 gap-1 rounded-full bg-white/10 p-1">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError('');
              }}
              className={cn(
                'rounded-full py-2 text-sm font-semibold transition-colors',
                tab === t ? 'bg-white text-black' : 'text-white/70 hover:text-white',
              )}
            >
              {t === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="relative z-10 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {tab === 'register' && (
              <motion.label
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 48 }}
                exit={{ opacity: 0, height: 0 }}
                className="glass glass-thin flex items-center gap-3 overflow-hidden rounded-full px-4"
              >
                <User className="relative z-10 h-4 w-4 shrink-0 text-white/60" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama"
                  autoComplete="name"
                  aria-label="Nama"
                  className={field}
                />
              </motion.label>
            )}
          </AnimatePresence>

          <label className="glass glass-thin flex h-12 items-center gap-3 rounded-full px-4">
            <Mail className="relative z-10 h-4 w-4 shrink-0 text-white/60" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              className={field}
            />
          </label>

          <label className="glass glass-thin flex h-12 items-center gap-3 rounded-full px-4">
            <Lock className="relative z-10 h-4 w-4 shrink-0 text-white/60" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Kata sandi"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              aria-label="Kata sandi"
              className={field}
            />
          </label>

          {error && (
            <p role="alert" className="px-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={busy}
            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-black disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === 'login' ? 'Masuk' : 'Buat akun'}
          </motion.button>
        </form>

        <button
          type="button"
          onClick={continueAsGuest}
          className="relative z-10 mt-4 w-full rounded-full py-2 text-sm font-semibold text-white/70 hover:text-white"
        >
          Lanjut sebagai tamu
        </button>
        <p className="relative z-10 mt-3 text-center text-xs text-white/40">
          Akun disimpan di perangkat ini saja (tanpa server), jadi tidak tersinkron antar perangkat.
        </p>
      </motion.div>
    </div>
  );
}
