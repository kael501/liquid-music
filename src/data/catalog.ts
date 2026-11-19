import type { Mood } from '../types';

export const artUrl = (videoId: string): string => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/** Music browse tiles. Each query is searched on YouTube (music category only). */
export const BROWSE_CATEGORIES: Array<{ label: string; query: string; from: string; to: string }> = [
  { label: 'Pop', query: 'lagu pop terbaru', from: '#ff4f8b', to: '#8a2be2' },
  { label: 'Santai', query: 'lagu santai chill', from: '#18c1ff', to: '#3a5bff' },
  { label: 'Workout', query: 'workout music', from: '#ff7a18', to: '#ff2d55' },
  { label: 'Nostalgia', query: 'lagu nostalgia 2000an', from: '#f5b700', to: '#e8590c' },
  { label: 'Lagu Cinta', query: 'lagu cinta romantis', from: '#ff5e98', to: '#c026d3' },
  { label: 'Akustik', query: 'akustik cover', from: '#6d4cff', to: '#0f172a' },
  { label: 'Hip-Hop', query: 'hip hop rap', from: '#22c55e', to: '#0d9488' },
  { label: 'Dangdut', query: 'dangdut terpopuler', from: '#a855f7', to: '#ec4899' },
];

/** Video categories use YouTube's own category ids ('' = all). */
export const VIDEO_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: '', label: 'Semua' },
  { id: '24', label: 'Hiburan' },
  { id: '20', label: 'Gaming' },
  { id: '23', label: 'Komedi' },
  { id: '1', label: 'Film & Animasi' },
  { id: '17', label: 'Olahraga' },
  { id: '25', label: 'Berita' },
  { id: '28', label: 'Sains & Teknologi' },
  { id: '27', label: 'Edukasi' },
  { id: '26', label: 'Gaya Hidup' },
  { id: '19', label: 'Wisata' },
];

/** Moods drive "mood radio": after a song ends, the next one is picked at random from the same mood. */
export const MOODS: Mood[] = [
  {
    id: 'sad',
    label: 'Sedih',
    description: 'Galau dan patah hati',
    from: '#3b5bdb',
    to: '#1e1b4b',
    queries: ['lagu sedih galau', 'sad songs heartbreak', 'lagu patah hati'],
  },
  {
    id: 'chill',
    label: 'Santai',
    description: 'Pelan dan tenang',
    from: '#0ea5a4',
    to: '#1d4ed8',
    queries: ['lagu santai chill', 'chill acoustic songs', 'lofi chill songs'],
  },
  {
    id: 'energetic',
    label: 'Semangat',
    description: 'Tempo tinggi',
    from: '#f97316',
    to: '#dc2626',
    queries: ['lagu semangat', 'workout songs high energy', 'rock energetic songs'],
  },
  {
    id: 'romantic',
    label: 'Romantis',
    description: 'Lagu cinta',
    from: '#ec4899',
    to: '#9d174d',
    queries: ['lagu romantis', 'love songs romantic', 'lagu cinta terbaik'],
  },
  {
    id: 'happy',
    label: 'Ceria',
    description: 'Bikin senyum',
    from: '#facc15',
    to: '#f97316',
    queries: ['lagu ceria bahagia', 'happy feel good songs', 'upbeat pop songs'],
  },
  {
    id: 'party',
    label: 'Pesta',
    description: 'Goyang terus',
    from: '#a855f7',
    to: '#ec4899',
    queries: ['lagu pesta dance', 'party dance hits', 'edm party mix songs'],
  },
];
