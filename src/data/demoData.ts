import albumArt1 from "@/assets/album-art-1.jpg";
import albumArt2 from "@/assets/album-art-2.jpg";
import albumArt3 from "@/assets/album-art-3.jpg";
import albumArt4 from "@/assets/album-art-4.jpg";
import albumArt5 from "@/assets/album-art-5.jpg";
import albumArt6 from "@/assets/album-art-6.jpg";

/** Build a URL for files under `public/audio/` (handles Unicode / special characters). */
const audioPublicPath = (filename: string) => "/audio/" + encodeURIComponent(filename);

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds (placeholder until metadata loads for tracks with audioSrc)
  artwork: string;
  isFavorite: boolean;
  dateAdded: string;
  playCount: number;
  folder: string;
  /** Public URL for playback (e.g. `/audio/track.mp3`) when the player uses real audio. */
  audioSrc?: string;
}

export interface Playlist {
  id: string;
  name: string;
  artwork: string;
  songIds: string[];
  createdAt: string;
}

/** Filenames on disk in `public/audio/` (must match exactly). */
const AUDIO = {
  warrior:
    "Warrior of the Mind - EPIC： The Musical Animatic (FLASH WARNING) [_N15ek-uTl0].mp3",
  polyphemus: "Polyphemus - EPIC： The Musical Animatic [kKgwQy30R-c].mp3",
  survive:
    "Survive - EPIC： The Musical Animatic (CW： GORE AND FLASH) [6GpuV9iyQYU].mp3",
  openArms: "OPEN ARMS ⧸⧸ Epic： the musical animatic [bKMgFJq88Is].mp3",
  horse:
    "The Horse and The Infant + Just a Man ｜ EPIC： The Musical Animatics [QXeYVV1zcUc].mp3",
  fullSpeed:
    "Full Speed Ahead ｜ EPIC： The Musical ｜ Updated Audio [5NDW9cHZQAg].mp3",
} as const;

export const demoSongs: Song[] = [
  {
    id: "1",
    title: "Warrior of the Mind",
    artist: "EPIC: The Musical",
    album: "EPIC: The Musical Animatics",
    duration: 240,
    artwork: albumArt1,
    isFavorite: true,
    dateAdded: "2026-03-21",
    playCount: 0,
    folder: "EPIC",
    audioSrc: audioPublicPath(AUDIO.warrior),
  },
  {
    id: "2",
    title: "Polyphemus",
    artist: "EPIC: The Musical",
    album: "EPIC: The Musical Animatics",
    duration: 240,
    artwork: albumArt2,
    isFavorite: false,
    dateAdded: "2026-03-21",
    playCount: 0,
    folder: "EPIC",
    audioSrc: audioPublicPath(AUDIO.polyphemus),
  },
  {
    id: "3",
    title: "Survive",
    artist: "EPIC: The Musical",
    album: "EPIC: The Musical Animatics",
    duration: 240,
    artwork: albumArt3,
    isFavorite: true,
    dateAdded: "2026-03-21",
    playCount: 0,
    folder: "EPIC",
    audioSrc: audioPublicPath(AUDIO.survive),
  },
  {
    id: "4",
    title: "Open Arms",
    artist: "EPIC: The Musical",
    album: "EPIC: The Musical Animatics",
    duration: 240,
    artwork: albumArt4,
    isFavorite: false,
    dateAdded: "2026-03-21",
    playCount: 0,
    folder: "EPIC",
    audioSrc: audioPublicPath(AUDIO.openArms),
  },
  {
    id: "5",
    title: "The Horse and The Infant + Just a Man",
    artist: "EPIC: The Musical",
    album: "EPIC: The Musical Animatics",
    duration: 240,
    artwork: albumArt5,
    isFavorite: false,
    dateAdded: "2026-03-21",
    playCount: 0,
    folder: "EPIC",
    audioSrc: audioPublicPath(AUDIO.horse),
  },
  {
    id: "6",
    title: "Full Speed Ahead",
    artist: "EPIC: The Musical",
    album: "EPIC: The Musical Animatics",
    duration: 240,
    artwork: albumArt6,
    isFavorite: false,
    dateAdded: "2026-03-21",
    playCount: 0,
    folder: "EPIC",
    audioSrc: audioPublicPath(AUDIO.fullSpeed),
  },
];

export const demoPlaylists: Playlist[] = [
  {
    id: "p1",
    name: "EPIC Essentials",
    artwork: albumArt1,
    songIds: ["1", "2", "3"],
    createdAt: "2026-03-21",
  },
  {
    id: "p2",
    name: "Epic Moments",
    artwork: albumArt4,
    songIds: ["4", "5", "6"],
    createdAt: "2026-03-21",
  },
  {
    id: "p3",
    name: "Full Journey",
    artwork: albumArt3,
    songIds: ["1", "2", "3", "4", "5", "6"],
    createdAt: "2026-03-21",
  },
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
