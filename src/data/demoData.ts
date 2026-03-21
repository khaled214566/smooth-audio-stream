import albumArt1 from "@/assets/album-art-1.jpg";
import albumArt2 from "@/assets/album-art-2.jpg";
import albumArt3 from "@/assets/album-art-3.jpg";
import albumArt4 from "@/assets/album-art-4.jpg";
import albumArt5 from "@/assets/album-art-5.jpg";
import albumArt6 from "@/assets/album-art-6.jpg";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artwork: string;
  isFavorite: boolean;
  dateAdded: string;
  playCount: number;
  folder: string;
}

export interface Playlist {
  id: string;
  name: string;
  artwork: string;
  songIds: string[];
  createdAt: string;
}

export const demoSongs: Song[] = [
  { id: "1", title: "Golden Hour", artist: "Aurora Waves", album: "Amber Glow", duration: 234, artwork: albumArt1, isFavorite: true, dateAdded: "2025-03-15", playCount: 47, folder: "Electronic" },
  { id: "2", title: "Cosmic Drift", artist: "Nebula Sound", album: "Deep Space", duration: 312, artwork: albumArt2, isFavorite: false, dateAdded: "2025-03-10", playCount: 23, folder: "Ambient" },
  { id: "3", title: "Neon Pulse", artist: "Synthwave Collective", album: "Electric Dreams", duration: 198, artwork: albumArt3, isFavorite: true, dateAdded: "2025-02-28", playCount: 89, folder: "Synthwave" },
  { id: "4", title: "Forest Echo", artist: "Nature Sounds", album: "Earth Tones", duration: 267, artwork: albumArt4, isFavorite: false, dateAdded: "2025-03-01", playCount: 12, folder: "Ambient" },
  { id: "5", title: "Sunset Ride", artist: "Desert Beats", album: "Warm Horizons", duration: 245, artwork: albumArt5, isFavorite: true, dateAdded: "2025-03-18", playCount: 56, folder: "Chill" },
  { id: "6", title: "Midnight Rain", artist: "Shadow Keys", album: "Monochrome", duration: 289, artwork: albumArt6, isFavorite: false, dateAdded: "2025-02-20", playCount: 34, folder: "Piano" },
  { id: "7", title: "Solar Flare", artist: "Aurora Waves", album: "Amber Glow", duration: 203, artwork: albumArt1, isFavorite: false, dateAdded: "2025-03-15", playCount: 19, folder: "Electronic" },
  { id: "8", title: "Starfall", artist: "Nebula Sound", album: "Deep Space", duration: 278, artwork: albumArt2, isFavorite: true, dateAdded: "2025-03-10", playCount: 41, folder: "Ambient" },
  { id: "9", title: "Cyber City", artist: "Synthwave Collective", album: "Electric Dreams", duration: 221, artwork: albumArt3, isFavorite: false, dateAdded: "2025-02-28", playCount: 67, folder: "Synthwave" },
  { id: "10", title: "Mountain Stream", artist: "Nature Sounds", album: "Earth Tones", duration: 334, artwork: albumArt4, isFavorite: false, dateAdded: "2025-03-01", playCount: 8, folder: "Ambient" },
  { id: "11", title: "Dusk Patrol", artist: "Desert Beats", album: "Warm Horizons", duration: 256, artwork: albumArt5, isFavorite: false, dateAdded: "2025-03-18", playCount: 29, folder: "Chill" },
  { id: "12", title: "Silent Film", artist: "Shadow Keys", album: "Monochrome", duration: 301, artwork: albumArt6, isFavorite: true, dateAdded: "2025-02-20", playCount: 15, folder: "Piano" },
];

export const demoPlaylists: Playlist[] = [
  { id: "p1", name: "Chill Vibes", artwork: albumArt5, songIds: ["1", "4", "5", "10", "11"], createdAt: "2025-03-01" },
  { id: "p2", name: "Late Night Coding", artwork: albumArt2, songIds: ["2", "3", "6", "8", "9"], createdAt: "2025-02-15" },
  { id: "p3", name: "Workout Energy", artwork: albumArt3, songIds: ["3", "5", "7", "9"], createdAt: "2025-03-10" },
];

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getAlbums = () => {
  const albumMap = new Map<string, { name: string; artist: string; artwork: string; songs: Song[] }>();
  demoSongs.forEach((song) => {
    if (!albumMap.has(song.album)) {
      albumMap.set(song.album, { name: song.album, artist: song.artist, artwork: song.artwork, songs: [] });
    }
    albumMap.get(song.album)!.songs.push(song);
  });
  return Array.from(albumMap.values());
};

export const getArtists = () => {
  const artistMap = new Map<string, { name: string; artwork: string; songCount: number }>();
  demoSongs.forEach((song) => {
    if (!artistMap.has(song.artist)) {
      artistMap.set(song.artist, { name: song.artist, artwork: song.artwork, songCount: 0 });
    }
    artistMap.get(song.artist)!.songCount++;
  });
  return Array.from(artistMap.values());
};
