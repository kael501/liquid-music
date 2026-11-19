import { useEffect, useState } from 'react';
import { extractPalette, fallbackPalette, toCss, vivid, type RGB } from '../lib/color';

export interface DominantColors {
  /** three CSS colour strings for the ambient mesh orbs */
  colors: [string, string, string];
  /** primary colour as "r, g, b" for rgba() usage */
  primaryRgb: string;
}

const cache = new Map<string, RGB[]>();

function normalise(palette: RGB[], seed: string): RGB[] {
  const fb = fallbackPalette(seed);
  const vivids = palette.map(vivid);
  while (vivids.length < 3) vivids.push(fb[vivids.length]);
  return vivids.slice(0, 3);
}

function sample(src: string): Promise<RGB[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const w = 64;
        const h = 36;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(extractPalette(ctx.getImageData(0, 0, w, h).data, 3));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

function build(palette: RGB[]): DominantColors {
  return {
    colors: [toCss(palette[0]), toCss(palette[1]), toCss(palette[2])],
    primaryRgb: palette[0].join(', '),
  };
}

/**
 * Extracts a three-colour palette from artwork. Colours persist while the next image
 * is being sampled so the ambient background always crossfades, never flashes.
 * If the image host blocks canvas reads (CORS) a deterministic palette derived from `seed` is used.
 */
export function useDominantColor(src: string | undefined, seed: string): DominantColors {
  const [state, setState] = useState<DominantColors>(() =>
    build(normalise(cache.get(seed) ?? [], seed)),
  );

  useEffect(() => {
    let cancelled = false;
    const hit = cache.get(seed);
    if (hit) {
      setState(build(hit));
      return;
    }
    const finish = (palette: RGB[]) => {
      const normalised = normalise(palette, seed);
      cache.set(seed, normalised);
      if (!cancelled) setState(build(normalised));
    };
    if (!src) {
      finish([]);
      return () => {
        cancelled = true;
      };
    }
    sample(src)
      .then((p) => finish(p.length > 0 ? p : []))
      .catch(() => finish([]));
    return () => {
      cancelled = true;
    };
  }, [src, seed]);

  return state;
}
