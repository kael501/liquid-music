import { useMemo } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import type { Collection, ContentMode } from '../types';

export type LibraryFilter = 'playlists' | 'artists';

export const LIBRARY_FILTERS: Array<{ id: LibraryFilter; label: string }> = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'artists', label: 'Artists' },
];

/** Videos have no artist pages, so that filter only exists in music mode. */
export function filtersFor(mode: ContentMode): Array<{ id: LibraryFilter; label: string }> {
  return mode === 'music' ? LIBRARY_FILTERS : LIBRARY_FILTERS.filter((f) => f.id === 'playlists');
}

/** Collections shown in "Your Library" for the selected filter (shared by sidebar and mobile library page). */
export function useLibraryItems(filter: LibraryFilter): Collection[] {
  const library = useLibrary();
  const { settings } = useSettings();
  const mode = settings.mode;
  return useMemo<Collection[]>(() => {
    if (filter === 'artists' && mode === 'music') {
      return library.following.map((name) => ({
        id: `artist:${name}`,
        kind: 'artist' as const,
        title: name,
        subtitle: 'Artist',
        cover: '',
        tracks: [],
      }));
    }
    const ids = ['liked', 'history', ...library.playlists.map((p) => p.id)];
    return ids.map((id) => library.getCollection(id)).filter((c): c is Collection => c !== null);
  }, [filter, library, mode]);
}

export function collectionSubtitle(item: Collection, likedCount: number, mode: ContentMode = 'music'): string {
  const unit = mode === 'video' ? 'videos' : 'songs';
  switch (item.kind) {
    case 'liked':
      return `Playlist • ${likedCount} ${unit}`;
    case 'history':
      return `Recently played • ${item.tracks.length}`;
    case 'artist':
      return 'Artist';
    default:
      return `Playlist • ${item.tracks.length} ${unit}`;
  }
}

