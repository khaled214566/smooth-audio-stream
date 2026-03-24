# SoundFlow — app guide

This project is a **React + Vite + TypeScript** music-style web UI branded **SoundFlow** in the sidebar. It presents a library, playlists, favorites, a bottom player bar, and a **Media Converter** screen. Playback time advances with a timer; there is **no `<audio>` element and no real audio files** wired up—duration is metadata only, so the app behaves like an interactive prototype.

---

## Run and build

| Command | Purpose |
|--------|---------|
| `npm install` | Install dependencies (first time or after lockfile changes). |
| `npm run dev` | Dev server (default in this repo: port **8080**, host `::`). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run test` | Run Vitest once. |
| `npm run lint` | ESLint on the project. |

---

## What each screen does

| Route | File | Role |
|-------|------|------|
| `/` | `src/pages/Home.tsx` | Greeting, quick-play cards from the library, horizontal **Albums** (from data), **Recently added**, **Most played**. |
| `/library` | `src/pages/Library.tsx` | Tabs: **Songs** (searchable), **Albums**, **Artists**, **Folders** (grouped by each song’s `folder` field). |
| `/playlists` | `src/pages/Playlists.tsx` | Grid of playlists; opening one lists tracks by `songIds`. |
| `/favorites` | `src/pages/Favorites.tsx` | Songs where `isFavorite` is true (toggle from rows or the player bar). |
| `/converter` | `src/pages/Converter.tsx` | **UI demo only**: simulated download progress; no yt-dlp or backend integration. |
| `*` | `src/pages/NotFound.tsx` | 404. |

**Global shell:** `src/App.tsx` wraps everything in `AudioProvider`, React Query, tooltips, and Sonner toasts. **Navigation:** `src/components/AppSidebar.tsx` (desktop) and `src/components/BottomNav.tsx` (mobile). **Player:** `src/components/PlayerBar.tsx` (fixed bottom).

---

## How playback works

All playback state lives in **`src/context/AudioContext.tsx`**:

- **`songs`** — full library (initialized from `demoSongs` in `src/data/demoData.ts`).
- **`queue`**, **`currentSong`**, **`currentIndex`** — what is playing and what comes next.
- **`playQueue(songs, startIndex?)`** — replaces the queue and starts at the given index (used everywhere lists trigger playback).
- **`playSong(song)`** — sets the current track (used less than `playQueue` in the UI).
- **Time** — `currentTime` increments every second while “playing”; at `duration`, **`nextSong`** runs. **Volume**, **shuffle**, **repeat** (off / all / one) are UI state only (no audio engine).
- **`toggleFavorite`** — updates the matching entry in `songs` (in memory; not persisted).

The queue icon in the player toggles internal state but **does not render a queue panel**—there is no visible queue UI yet. **`addToQueue` / `removeFromQueue`** exist on the context for future UI.

---

## Manually adding songs

The canonical library is the **`demoSongs`** array in **`src/data/demoData.ts`**.

1. **Add an object** to `demoSongs` with every field the `Song` interface expects:

   | Field | Type | Notes |
   |--------|------|--------|
   | `id` | `string` | Unique. Playlists reference this in `songIds`. |
   | `title`, `artist`, `album` | `string` | Shown in lists and player. |
   | `duration` | `number` | Length in **seconds** (drives the fake progress bar). |
   | `artwork` | `string` | URL or bundled asset (see below). |
   | `isFavorite` | `boolean` | Initial favorite state. |
   | `dateAdded` | `string` | ISO-like date; **Recently added** sorts by this. |
   | `playCount` | `number` | **Most played** sorts by this. |
   | `folder` | `string` | **Library → Folders** groups by this exact string. |

2. **Artwork options**
   - **Bundled images** (recommended for repo consistency): add a file under `src/assets/`, then `import` it at the top of `demoData.ts` (same pattern as `album-art-1.jpg`) and set `artwork: importedImage`.
   - **Public URL:** put a file in **`public/`** and set `artwork: "/your-file.jpg"` (path from site root).
   - **External URL:** set `artwork` to a full `https://...` string (subject to hotlinking/CORS rules in the browser).

3. **Albums and artists** — **`getAlbums()`** and **`getArtists()`** in the same file derive views from **`demoSongs`**. You do not maintain separate album/artist tables; keep **`demoSongs`** accurate and the **Albums** and **Artists** tabs stay coherent.

4. **Playlists** — Add the new song’s `id` to **`songIds`** on entries in **`demoPlaylists`** (same file) if it should appear in a playlist.

After saving, the dev server hot-reloads; the provider re-reads initial state on **full refresh** (favorites toggled only in memory are reset on reload).

---

## Manually removing songs

1. Delete the song object from **`demoSongs`** in **`src/data/demoData.ts`**.
2. Remove its **`id`** from every **`songIds`** array in **`demoPlaylists`** so playlists do not point at missing tracks.
3. Search the repo for that **`id`** if you used it elsewhere (unlikely in the stock app).

There is no in-app “delete song” control; removal is always by editing data (or by extending the app to call `setSongs` from the context).

---

## Important implementation detail (albums vs. live state)

- **Songs tab, Home quick picks, folders, favorites** use **`songs` from `AudioContext`** (so favorite toggles apply there).
- **`getAlbums()` / `getArtists()`** read the module-level **`demoSongs`** array, not the React state copy. After you toggle favorites, **playing an album from the Albums grid** may still hand the queue **objects whose `isFavorite` flag does not match** the heart state in **Library → Songs** until you align data or refactor helpers to accept the live `songs` array. For a static library edited only in **`demoData.ts`**, everything stays consistent.

---

## Files to change for common goals

| Goal | Where to work |
|------|----------------|
| Library content, playlists, duration, artwork imports | **`src/data/demoData.ts`** |
| Play/pause, queue, shuffle, repeat, volume, time simulation | **`src/context/AudioContext.tsx`** |
| Player UI (progress, buttons, layout) | **`src/components/PlayerBar.tsx`** |
| Row behavior (click = play from full library, favorite button) | **`src/components/SongRow.tsx`** |
| Routes and page layout shell | **`src/App.tsx`** |
| Sidebar labels / brand (“SoundFlow”) | **`src/components/AppSidebar.tsx`** |
| Mobile bottom tabs | **`src/components/BottomNav.tsx`** |
| Home sections | **`src/pages/Home.tsx`** |
| Library tabs and search | **`src/pages/Library.tsx`** |
| Playlist grid and detail | **`src/pages/Playlists.tsx`** |
| Converter mock UI | **`src/pages/Converter.tsx`** |
| Global colors / dark theme CSS variables | **`src/index.css`** |
| Tailwind theme extensions (fonts, semantic colors) | **`tailwind.config.ts`** |
| Dev server port / path alias `@` | **`vite.config.ts`** |
| TypeScript path alias `@/*` | **`tsconfig.json`** / **`tsconfig.app.json`** |

---

## Adding real audio (not in the project today)

To play actual files you would typically:

1. Extend **`Song`** (in `demoData.ts`) with something like `src: string` (URL or blob).
2. Use a ref to **`<audio>`** (or the Web Audio API) in **`AudioContext`** or **`PlayerBar`**, sync `currentTime` / `duration` from `timeupdate` and `loadedmetadata`, and call `play()` / `pause()` from **`togglePlay`**.
3. Replace the **interval-based** time increment in **`AudioContext`** with events from the media element.

The **Converter** page text mentions yt-dlp; implementing that would require a **backend or local CLI**—the current UI is front-end only.

---

## Summary

- **Manipulate the library** by editing **`src/data/demoData.ts`** (`demoSongs`, `demoPlaylists`, and optional new asset imports).
- **Behavior and playback rules** live in **`src/context/AudioContext.tsx`**; **presentation** is split across **`PlayerBar`**, **`SongRow`**, and the **`src/pages/*`** screens.
- The app is a **styled, data-driven player prototype** without persistent storage or real media until you add those layers.
