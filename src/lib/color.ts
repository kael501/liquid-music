import { hashString } from './utils';

export type RGB = [number, number, number];

export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue(p, q, h + 1 / 3) * 255),
    Math.round(hue(p, q, h) * 255),
    Math.round(hue(p, q, h - 1 / 3) * 255),
  ];
}

export function toCss([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Push a raw sampled colour into a range that glows nicely behind dark glass. */
export function vivid(rgb: RGB): RGB {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb(h, Math.max(0.55, Math.min(0.95, s * 1.15)), Math.max(0.38, Math.min(0.58, l)));
}

/** Deterministic palette from a string so every track has a distinct mood even without pixels. */
export function fallbackPalette(seed: string): RGB[] {
  const base = (hashString(seed) % 360) / 360;
  return [0, 0.11, -0.13].map((shift) => {
    let h = base + shift;
    if (h < 0) h += 1;
    if (h > 1) h -= 1;
    return hslToRgb(h, 0.72, 0.5);
  });
}

function distance(a: RGB, b: RGB): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Quantised, saturation-weighted dominant colour extraction from raw RGBA pixels. */
export function extractPalette(data: Uint8ClampedArray, count = 3): RGB[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number; score: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;
    const [, s, l] = rgbToHsl([r, g, b]);
    if (l < 0.12 || l > 0.92) continue;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const weight = 0.35 + s;
    const entry = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0, score: 0 };
    entry.r += r;
    entry.g += g;
    entry.b += b;
    entry.n += 1;
    entry.score += weight;
    buckets.set(key, entry);
  }
  const ranked = [...buckets.values()]
    .sort((x, y) => y.score - x.score)
    .map((e): RGB => [Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)]);

  const picked: RGB[] = [];
  for (const c of ranked) {
    if (picked.every((p) => distance(p, c) > 70)) picked.push(c);
    if (picked.length === count) break;
  }
  return picked;
}
