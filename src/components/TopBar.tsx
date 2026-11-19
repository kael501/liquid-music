import { useEffect, useRef, useState, type RefObject } from 'react';
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, Search, Settings, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MenuDivider, MenuItem, MenuLabel, Popover } from './Popover';
import { useNav } from '../context/NavContext';
import { useDebounce } from '../hooks/useDebounce';

interface TopBarProps {
  scrollRef: RefObject<HTMLElement>;
}

export function TopBar({ scrollRef }: TopBarProps) {
  const { view, canGoBack, canGoForward, back, forward, navigate, replace } = useNav();
  const { user, logout } = useAuth();
  const { scrollY } = useScroll({ container: scrollRef });

  const blur = useTransform(scrollY, [0, 140], [0, 32]);
  const bg = useTransform(scrollY, [0, 140], [0, 0.5]);
  const border = useTransform(scrollY, [0, 140], [0, 0.12]);
  const backdropFilter = useMotionTemplate`blur(${blur}px) saturate(1.5)`;
  const background = useMotionTemplate`rgba(10, 10, 18, ${bg})`;
  const borderColor = useMotionTemplate`rgba(255, 255, 255, ${border})`;

  const [text, setText] = useState('');
  const debounced = useDebounce(text, 300);
  const lastPushed = useRef('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* view → input (category tiles, history navigation) */
  useEffect(() => {
    if (view.type !== 'search') return;
    if (view.query !== lastPushed.current) {
      lastPushed.current = view.query;
      setText(view.query);
    }
    if (view.query === '') inputRef.current?.focus();
  }, [view]);

  /* input → view (debounced, instant results) */
  useEffect(() => {
    const q = debounced.trim();
    if (q === lastPushed.current) return;
    lastPushed.current = q;
    if (view.type === 'search') replace({ type: 'search', query: q });
    else if (q !== '') navigate({ type: 'search', query: q });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.header
      style={{ backdropFilter, WebkitBackdropFilter: backdropFilter, background, borderBottomColor: borderColor }}
      className="sticky top-0 z-30 flex items-center gap-2 border-b border-b-transparent px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5"
    >
      <div className="hidden gap-2 sm:flex">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={back}
          disabled={!canGoBack}
          aria-label="Go back"
          className="glass-btn h-9 w-9 bg-black/30 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={forward}
          disabled={!canGoForward}
          aria-label="Go forward"
          className="glass-btn h-9 w-9 bg-black/30 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <label
        className="glass glass-thin group relative flex h-11 w-full max-w-md items-center gap-3 rounded-full px-4 transition-shadow focus-within:shadow-[0_0_0_2px_rgba(255,255,255,0.35),0_10px_40px_-10px_rgba(0,0,0,0.45)]"
      >
        <Search className="relative z-10 h-[18px] w-[18px] shrink-0 text-white/60" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you want to play?"
          aria-label="Search songs, artists and albums"
          className="relative z-10 h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40 sm:text-sm"
        />
        {text && (
          <motion.button
            type="button"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setText('')}
            aria-label="Clear search"
            className="glass-btn relative z-10 h-6 w-6"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </label>

      <div className="flex-1" />

      <Popover
        width={248}
        trigger={({ ref, toggle }) => (
          <motion.button
            ref={ref}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="glass glass-thin flex items-center gap-2 rounded-full py-1 pl-1 pr-4 text-sm font-semibold max-md:pr-1"
            aria-label="Akun"
          >
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--c1)] to-[var(--c2)] text-sm font-bold">
              {user && !user.guest ? user.name.slice(0, 1).toUpperCase() : <User className="h-4 w-4" />}
            </span>
            <span className="relative z-10 hidden max-w-[120px] truncate sm:inline">{user?.name ?? 'Tamu'}</span>
          </motion.button>
        )}
      >
        {(close) => (
          <>
            <MenuLabel>{user?.guest ? 'Mode tamu' : user?.email ?? ''}</MenuLabel>
            <MenuItem
              icon={<Settings className="h-4 w-4" />}
              label="Pengaturan"
              onSelect={() => {
                close();
                navigate({ type: 'settings' });
              }}
            />
            <MenuDivider />
            <MenuItem
              icon={<LogOut className="h-4 w-4" />}
              label={user?.guest ? 'Masuk / Daftar' : 'Keluar'}
              onSelect={() => {
                close();
                logout();
              }}
            />
          </>
        )}
      </Popover>
    </motion.header>
  );
}
