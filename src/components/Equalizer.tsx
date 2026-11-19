import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface EqualizerProps {
  active: boolean;
  className?: string;
}

const BARS = [
  { heights: ['30%', '100%', '45%', '85%', '30%'], duration: 0.9 },
  { heights: ['80%', '35%', '100%', '40%', '80%'], duration: 1.1 },
  { heights: ['50%', '90%', '30%', '100%', '50%'], duration: 0.8 },
];

/** Three-bar animated equalizer; settles into low static bars when paused. */
export function Equalizer({ active, className }: EqualizerProps) {
  return (
    <span className={cn('inline-flex h-3.5 w-4 items-end gap-[2px]', className)} aria-hidden="true">
      {BARS.map((bar, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-current"
          style={{ height: '30%' }}
          animate={active ? { height: bar.heights } : { height: '30%' }}
          transition={
            active
              ? { duration: bar.duration, repeat: Infinity, ease: 'easeInOut' }
              : { type: 'spring', stiffness: 280, damping: 28 }
          }
        />
      ))}
    </span>
  );
}
