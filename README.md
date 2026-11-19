# Liquid Music

Spotify-style music app on the YouTube IFrame Player, with a liquid-glass UI (React + Vite + TypeScript, Tailwind, Framer Motion, Lucide).

    npm install
    npm run dev

No songs are bundled. All music and videos come from the YouTube Data API v3: paste your API key in
Settings → Sumber (or set `VITE_YOUTUBE_API_KEY` in `.env`). Without a key the app shows empty states.
Login is local to this browser (accounts are not synced).
Lyrics are fetched at runtime from LRCLIB.

## Structure
- `src/services/ytMusicService.ts` search, trending, mood radio (YouTube API only, music/video kept separate)
- `src/services/lyricsService.ts` synced lyrics (LRCLIB)
- `src/hooks/useAudioPlayer.ts` hidden IFrame engine + 5Hz time store
- `src/hooks/useDominantColor.ts` artwork palette for the ambient mesh
- `src/context/` PlayerContext (queue, transport, likes, UI) and NavContext (history)
- `src/components/` Sidebar, TopBar, views, RightPanel, PlayerDock, FullScreenPlayer, shared UI
- `src/index.css` glass utilities (`.glass`, `.glass-thin`, `.glass-thick`, `.glass-sheen`)

## Features
Playlists you create and edit, liked songs, listening history, follow artists, track menu (play next, queue, add to playlist, copy link),
sleep timer, playback speed, autoplay of similar songs, waveform progress bar, keyboard shortcuts, toasts, backup/restore, and a Settings page.

Mobile layout (<768px): bottom navigation, mini player, library page, bottom-sheet queue/lyrics, safe-area aware.
