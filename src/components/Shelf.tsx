import { useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listContainer, listItem } from '../lib/motion';

interface ShelfProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Shelf({ title, subtitle, children }: ShelfProps) {
  const scroller = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <motion.section variants={listItem} className="mt-10">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-white/55">{subtitle}</p>}
        </div>
        <div className="hidden gap-1.5 sm:flex">
          <motion.button
            type="button"
            aria-label={`Scroll ${title} left`}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollBy(-1)}
            className="glass-btn h-8 w-8 bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
          <motion.button
            type="button"
            aria-label={`Scroll ${title} right`}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollBy(1)}
            className="glass-btn h-8 w-8 bg-white/5"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
      <motion.div
        ref={scroller}
        variants={listContainer}
        className="no-scrollbar -mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-4 pt-1"
      >
        {children}
      </motion.div>
    </motion.section>
  );
}
