import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface TriggerProps {
  ref: RefObject<HTMLButtonElement>;
  open: boolean;
  toggle: () => void;
}

interface PopoverProps {
  trigger: (props: TriggerProps) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  width?: number;
}

/** Portal-based menu that flips above its trigger when there is no room below. */
export function Popover({ trigger, children, align = 'right', width = 232 }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const height = menu.offsetHeight;
    let top = anchor.bottom + 8;
    if (top + height > window.innerHeight - 12) top = Math.max(12, anchor.top - 8 - height);
    let left = align === 'right' ? anchor.right - width : anchor.left;
    left = Math.min(Math.max(12, left), window.innerWidth - width - 12);
    setPos({ top, left });
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, close]);

  return (
    <>
      {trigger({ ref: triggerRef, open, toggle })}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, width, zIndex: 80, transformOrigin: 'top right' }}
              className="glass glass-thick max-h-[70vh] overflow-y-auto rounded-2xl p-1.5"
            >
              <div className="relative z-10">{children(close)}</div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
  danger?: boolean;
  checked?: boolean;
  hint?: string;
}

export function MenuItem({ icon, label, onSelect, danger, checked, hint }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-white/10',
        danger ? 'text-red-300' : 'text-white',
      )}
    >
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center text-white/70">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-xs text-white/45">{hint}</span>}
      {checked && <Check className="h-4 w-4 text-emerald-300" />}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">{children}</p>;
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-white/10" />;
}
