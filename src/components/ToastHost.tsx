import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

export function ToastHost() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[11.5rem] z-[90] flex flex-col items-center gap-2 px-4 md:bottom-[124px]"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={() => dismiss(t.id)}
            className="glass glass-thick pointer-events-auto max-w-[90vw] rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <span className="relative z-10">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
