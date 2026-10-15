import type { ImageMetadata } from 'astro';

// Every photo imported by `npm run media` lives in src/assets/work/<key>/NN.jpg
const all = import.meta.glob<{ default: ImageMetadata }>('../assets/work/*/*.jpg', { eager: true });

/** photo('gitanjali-2025/01') */
export function photo(id: string): ImageMetadata {
  const m = all[`../assets/work/${id}.jpg`];
  if (!m) throw new Error(`Missing photo ${id} — run "npm run media"?`);
  return m.default;
}

/** All photos for one engagement, in order (first = cover). */
export function album(key: string): ImageMetadata[] {
  return Object.keys(all).filter((k) => k.startsWith(`../assets/work/${key}/`)).sort().map((k) => all[k].default);
}
