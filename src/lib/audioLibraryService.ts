import { Song } from "@/data/demoData";
import { DownloadService, type AudioFile } from "./downloadService";
import { readAudioTags, type TrackMediaTags } from "./readAudioTags";

const FAVORITES_STORAGE_KEY = "smooth-audio-stream:favorites";

export class AudioLibraryService {
  private static instance: AudioLibraryService;
  private songs: Song[] = [];
  private listeners: ((songs: Song[]) => void)[] = [];

  // ── Favorites persistence ───────────────────────────────────────────────────
  private loadFavoriteKeys(): Set<string> {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set<string>(parsed) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveFavoriteKeys(keys: Set<string>): void {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...keys]));
    } catch {
      // Storage unavailable – silently ignore.
    }
  }

  private applyFavorites(songs: Song[]): Song[] {
    const favKeys = this.loadFavoriteKeys();
    return songs.map((s) => ({
      ...s,
      isFavorite: s.audioSrc ? favKeys.has(s.audioSrc) : s.isFavorite,
    }));
  }
  // ───────────────────────────────────────────────────────────────────────────

  private constructor() {}

  static getInstance(): AudioLibraryService {
    if (!AudioLibraryService.instance) {
      AudioLibraryService.instance = new AudioLibraryService();
    }
    return AudioLibraryService.instance;
  }

  // Subscribe to song updates
  subscribe(listener: (songs: Song[]) => void) {
    this.listeners.push(listener);
    listener(this.songs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.songs));
  }

  // Get all songs
  getSongs(): Song[] {
    return this.songs;
  }

  // Load actual duration from the audio file via the browser Audio API
  private getDuration(audioSrc: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        resolve(Math.floor(audio.duration));
        audio.src = ""; // release resource
      };
      audio.onerror = () => resolve(0); // fallback silently
      audio.src = audioSrc;
    });
  }

  // Scan audio directory and update songs
  async scanAndUpdateSongs(): Promise<void> {
    try {
      const audioFiles = await DownloadService.scanAudioDirectory();
      const newSongs: Song[] = [];

      for (const file of audioFiles) {
        // Reuse existing song if already loaded (preserves duration, artwork, etc.)
        const existingSong = this.songs.find(s => s.audioSrc === file.publicPath);
        if (existingSong) {
          newSongs.push(existingSong);
          continue;
        }

        // Create new song with basic info
        const basicSong: Song = {
          id: this.generateId(),
          title: this.extractTitleFromFilename(file.filename),
          artist: "Unknown Artist",
          album: "Unknown Album",
          duration: 0,
          artwork: "/placeholder.svg",
          isFavorite: false,
          dateAdded: file.modified
            ? new Date(file.modified).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          playCount: 0,
          folder: this.extractFolderFromPath(file.publicPath),
          audioSrc: file.publicPath,
        };

        // Try to read metadata
        try {
          const metadata = await readAudioTags(file.publicPath);
          const enhancedSong = this.enhanceSongWithMetadata(basicSong, metadata);
          enhancedSong.duration = await this.getDuration(file.publicPath);
          newSongs.push(enhancedSong);
        } catch (error) {
          console.warn(`Failed to read metadata for ${file.filename}:`, error);
          basicSong.duration = await this.getDuration(file.publicPath);
          newSongs.push(basicSong);
        }
      }

      // Sort by date added (newest first)
      newSongs.sort(
        (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );

      this.songs = this.applyFavorites(newSongs);
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to scan audio directory:", error);
      throw error;
    }
  }

  // Add a single new song
  async addNewSong(audioPath: string): Promise<Song> {
    // Check if already exists
    const existing = this.songs.find(s => s.audioSrc === audioPath);
    if (existing) {
      return existing;
    }

    const filename = audioPath.split("/").pop() || "Unknown";
    const basicSong: Song = {
      id: this.generateId(),
      title: this.extractTitleFromFilename(filename),
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      artwork: "/placeholder.svg",
      isFavorite: false,
      dateAdded: new Date().toISOString().split("T")[0],
      playCount: 0,
      folder: this.extractFolderFromPath(audioPath),
      audioSrc: audioPath,
    };

    // Try to read metadata
    try {
      const metadata = await readAudioTags(audioPath);
      const enhancedSong = this.enhanceSongWithMetadata(basicSong, metadata);
      enhancedSong.duration = await this.getDuration(audioPath);
      this.songs.unshift(enhancedSong);
    } catch (error) {
      console.warn(`Failed to read metadata for ${filename}:`, error);
      basicSong.duration = await this.getDuration(audioPath);
      this.songs.unshift(basicSong);
    }

    this.songs = this.applyFavorites(this.songs);
    this.notifyListeners();
    return this.songs[0];
  }

  // Remove a song
  removeSong(songId: string): void {
    this.songs = this.songs.filter(s => s.id !== songId);
    this.notifyListeners();
  }

  // Update song
  updateSong(songId: string, updates: Partial<Song>): void {
    this.songs = this.songs.map(s =>
      s.id === songId ? { ...s, ...updates } : s
    );

    // Persist favorites whenever isFavorite is part of the update
    if ("isFavorite" in updates) {
      const favKeys = this.loadFavoriteKeys();
      this.songs.forEach((s) => {
        if (!s.audioSrc) return;
        if (s.isFavorite) {
          favKeys.add(s.audioSrc);
        } else {
          favKeys.delete(s.audioSrc);
        }
      });
      this.saveFavoriteKeys(favKeys);
    }

    this.notifyListeners();
  }

  // Initialize by scanning all audio files
  async initialize(): Promise<void> {
    await this.scanAndUpdateSongs();
  }

  // Refresh the library (scan for new files)
  async refresh(): Promise<void> {
    await this.scanAndUpdateSongs();
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private extractTitleFromFilename(filename: string): string {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    // Remove common yt-dlp patterns like [videoId] at the end
    const withoutId = nameWithoutExt.replace(/\s*\[[A-Za-z0-9_-]{8,}\]$/, "");
    // Remove common download_ timestamps
    const cleaned = withoutId.replace(/^download_\d+[_-]?/, "");
    // Replace underscores and hyphens with spaces
    const spaced = cleaned.replace(/[_-]/g, " ").trim();
    // Capitalize words
    return spaced.replace(/\b\w/g, l => l.toUpperCase());
  }

  // Derive a folder name from the file path
  // e.g. "/audio/EPIC/song.mp3" → "EPIC"
  //      "/audio/song.mp3"      → "audio"
  private extractFolderFromPath(publicPath: string): string {
    const parts = publicPath.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return parts[parts.length - 1] || "Unknown";
  }

  private enhanceSongWithMetadata(song: Song, metadata: TrackMediaTags): Song {
    return {
      ...song,
      title: metadata.title || song.title,
      artist: metadata.artist || song.artist,
      album: metadata.album || song.album,
      dateAdded: metadata.year ? metadata.year : song.dateAdded,
      artwork: metadata.artworkObjectUrl || song.artwork,
    };
  }
}