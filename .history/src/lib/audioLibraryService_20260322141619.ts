import { Song } from "@/data/demoData";
import { DownloadService, type AudioFile } from "./downloadService";
import { readAudioTags, type TrackMediaTags } from "./readAudioTags";

export class AudioLibraryService {
  private static instance: AudioLibraryService;
  private songs: Song[] = [];
  private listeners: ((songs: Song[]) => void)[] = [];

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

  // Scan audio directory and update songs
  async scanAndUpdateSongs(): Promise<void> {
    try {
      const audioFiles = await DownloadService.scanAudioDirectory();
      const newSongs: Song[] = [];

      for (const file of audioFiles) {
        // Check if song already exists
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
          artwork: this.getDefaultArtwork(),
          isFavorite: false,
          dateAdded: new Date().toISOString().split('T')[0],
          playCount: 0,
          folder: "Downloads",
          audioSrc: file.publicPath,
        };

        // Try to read metadata
        try {
          const metadata = await readAudioTags(file.publicPath);
          const enhancedSong = this.enhanceSongWithMetadata(basicSong, metadata);
          newSongs.push(enhancedSong);
        } catch (error) {
          console.warn(`Failed to read metadata for ${file.filename}:`, error);
          newSongs.push(basicSong);
        }
      }

      // Sort by date added (newest first)
      newSongs.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

      this.songs = newSongs;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to scan audio directory:', error);
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

    const filename = audioPath.split('/').pop() || 'Unknown';
    const basicSong: Song = {
      id: this.generateId(),
      title: this.extractTitleFromFilename(filename),
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      artwork: this.getDefaultArtwork(),
      isFavorite: false,
      dateAdded: new Date().toISOString().split('T')[0],
      playCount: 0,
      folder: "Downloads",
      audioSrc: audioPath,
    };

    // Try to read metadata
    try {
      const metadata = await readAudioTags(audioPath);
      const enhancedSong = this.enhanceSongWithMetadata(basicSong, metadata);
      this.songs.unshift(enhancedSong); // Add to beginning
    } catch (error) {
      console.warn(`Failed to read metadata for ${filename}:`, error);
      this.songs.unshift(basicSong);
    }

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
    this.notifyListeners();
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private extractTitleFromFilename(filename: string): string {
    // Remove extension and clean up
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    // Remove common patterns like download_ timestamps
    const cleaned = nameWithoutExt.replace(/^download_\d+[_-]?/, "");
    // Replace underscores and hyphens with spaces
    const spaced = cleaned.replace(/[_-]/g, " ");
    // Capitalize words
    return spaced.replace(/\b\w/g, l => l.toUpperCase());
  }

  private getDefaultArtwork(): string {
    // Return a default artwork path or use one of the existing ones
    return "/placeholder.svg";
  }

  private enhanceSongWithMetadata(song: Song, metadata: TrackMediaTags): Song {
    return {
      ...song,
      title: metadata.title || song.title,
      artist: metadata.artist || song.artist,
      album: metadata.album || song.album,
      // Use metadata year if available, otherwise keep current date added
      dateAdded: metadata.year ? metadata.year : song.dateAdded,
      // You could also extract genre, track number, etc. if needed
    };
  }

  // Initialize with demo songs and scan for new ones
  async initialize(): Promise<void> {
    // First, add existing demo songs from the audio folder
    await this.loadExistingSongs();
    
    // Then scan for downloaded songs
    await this.scanAndUpdateSongs();
  }

  // Refresh the library (scan for new files)
  async refresh(): Promise<void> {
    await this.scanAndUpdateSongs();
  }

  // Load existing songs that are already in the audio folder
  private async loadExistingSongs(): Promise<void> {
    try {
      // Map of existing demo songs
      const existingSongs = [
        {
          id: "1",
          title: "Warrior of the Mind",
          artist: "EPIC: The Musical",
          album: "EPIC: The Musical Animatics",
          duration: 240,
          artwork: "/assets/album-art-1.jpg",
          isFavorite: true,
          dateAdded: "2026-03-21",
          playCount: 0,
          folder: "EPIC",
          audioSrc: "/audio/Warrior of the Mind - EPIC： The Musical Animatic (FLASH WARNING) [_N15ek-uTl0].mp3",
        },
        {
          id: "2",
          title: "Polyphemus",
          artist: "EPIC: The Musical",
          album: "EPIC: The Musical Animatics",
          duration: 240,
          artwork: "/assets/album-art-2.jpg",
          isFavorite: false,
          dateAdded: "2026-03-21",
          playCount: 0,
          folder: "EPIC",
          audioSrc: "/audio/Polyphemus - EPIC： The Musical Animatic [kKgwQy30R-c].mp3",
        },
        {
          id: "3",
          title: "Survive",
          artist: "EPIC: The Musical",
          album: "EPIC: The Musical Animatics",
          duration: 240,
          artwork: "/assets/album-art-3.jpg",
          isFavorite: true,
          dateAdded: "2026-03-21",
          playCount: 0,
          folder: "EPIC",
          audioSrc: "/audio/Survive - EPIC： The Musical Animatic (CW： GORE AND FLASH) [6GpuV9iyQYU].mp3",
        },
        {
          id: "4",
          title: "Open Arms",
          artist: "EPIC: The Musical",
          album: "EPIC: The Musical Animatics",
          duration: 240,
          artwork: "/assets/album-art-4.jpg",
          isFavorite: false,
          dateAdded: "2026-03-21",
          playCount: 0,
          folder: "EPIC",
          audioSrc: "/audio/OPEN ARMS ⧸⧸ Epic： the musical animatic [bKMgFJq88Is].mp3",
        },
        {
          id: "5",
          title: "The Horse and The Infant + Just a Man",
          artist: "EPIC: The Musical",
          album: "EPIC: The Musical Animatics",
          duration: 240,
          artwork: "/assets/album-art-5.jpg",
          isFavorite: false,
          dateAdded: "2026-03-21",
          playCount: 0,
          folder: "EPIC",
          audioSrc: "/audio/horse-infant.mp3",
        },
        {
          id: "6",
          title: "Full Speed Ahead",
          artist: "EPIC: The Musical",
          album: "EPIC: The Musical Animatics",
          duration: 240,
          artwork: "/assets/album-art-6.jpg",
          isFavorite: false,
          dateAdded: "2026-03-21",
          playCount: 0,
          folder: "EPIC",
          audioSrc: "/audio/Full Speed Ahead ｜ EPIC： The Musical ｜ Updated Audio [5NDW9cHZQAg].mp3",
        },
      ];

      this.songs = existingSongs;
      console.log('Loaded existing songs:', existingSongs.length);
    } catch (error) {
      console.error('Failed to load existing songs:', error);
    }
  }
}
