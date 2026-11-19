import type { Transition, Variants } from 'framer-motion';

export const spring: Transition = { type: 'spring', stiffness: 280, damping: 28, mass: 0.9 };
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 };
export const springSoft: Transition = { type: 'spring', stiffness: 180, damping: 26, mass: 1 };

export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...spring, staggerChildren: 0.04 } },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.16 } },
};
