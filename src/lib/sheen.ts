import type { PointerEvent } from 'react';

/** Spread onto any element with the `glass-sheen` class so the light follows the pointer. */
export const sheenHandlers = {
  onPointerMove: (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  },
};
