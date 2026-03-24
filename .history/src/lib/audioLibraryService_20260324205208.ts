import { Song } from "@/data/demoData";
import { readAudioTags, type TrackMediaTags } from "@/lib/readAudioTags";
import StorageService from "@/lib/storageService";

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
      // Get all files in the audio directory
      const response = await fetch('http://localhost:3001/api/audio/scan');
      if (!response.ok) {
        console.warn('Backend server not available, using existing songs only');
        return;
      }
      
      const audioFiles = await response.json();
      const newSongs: Song[] = [];

      for (const file of audioFiles) {
        // Check if song already exists
        const existingSong = this.songs.find(s => s.audioSrc === file.publicPath);
        if (existingSong) {
          // Update existing song with favorite status
          const favoriteIds = StorageService.getFavorites();
          existingSong.isFavorite = favoriteIds.includes(existingSong.id);
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
          artwork: "/assets/album-art-1.jpg",
          isFavorite: false,
          dateAdded: new Date().toISOString().split('T')[0],
          playCount: 0,
          folder: "Downloads",
          audioSrc: file.publicPath,
        };

        // Try to extract metadata
        try {
          const metadata = await this.extractMetadata(file.publicPath);
          const enhancedSong = this.enhanceSongWithMetadata(basicSong, metadata);
          
          // Check if this song should be marked as favorite
          const favoriteIds = StorageService.getFavorites();
          if (favoriteIds.includes(enhancedSong.id)) {
            enhancedSong.isFavorite = true;
          }
          
          newSongs.push(enhancedSong);
        } catch (error) {
          console.warn(`Failed to extract metadata for ${file.filename}:`, error);
          newSongs.push(basicSong);
        }
      }

      // Merge with existing songs, keeping favorites intact
      const existingFavoriteIds = StorageService.getFavorites();
      const existingSongsWithFavorites = this.songs.map(song => ({
        ...song,
        isFavorite: existingFavoriteIds.includes(song.id)
      }));
      
      // Combine existing songs with new songs
      const allSongs = [...existingSongsWithFavorites, ...newSongs];
      
      // Remove duplicates (by audioSrc)
      const uniqueSongs = allSongs.filter((song, index, arr) => 
        arr.findIndex(s => s.audioSrc === song.audioSrc) === index
      );

      this.songs = uniqueSongs;
      this.notifyListeners();
      
      console.log(`Library updated: ${uniqueSongs.length} total songs`);
    } catch (error) {
      console.error('Failed to scan audio directory:', error);
    }
  }

  // Extract metadata from audio file
  private async extractMetadata(audioPath: string): Promise<Partial<Song>> {
    try {
      const tags = await readAudioTags(audioPath);
      return {
        title: tags.title,
        artist: tags.artist,
        album: tags.album,
      };
    } catch (error) {
      console.warn(`Failed to extract metadata for ${audioPath}:`, error);
      return {};
    }
  }

  // Enhance song with metadata
  private enhanceSongWithMetadata(song: Song, metadata: Partial<Song>): Song {
    return {
      ...song,
      title: metadata.title || song.title,
      artist: metadata.artist || song.artist,
      album: metadata.album || song.album,
    };
  }

  // Add a single new song
  async addNewSong(audioPath: string): Promise<Song | null> {
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
      artwork: "/assets/album-art-1.jpg",
      isFavorite: false,
      dateAdded: new Date().toISOString().split('T')[0],
      playCount: 0,
      folder: "Downloads",
      audioSrc: audioPath,
    };

    // Try to extract metadata
    const metadata = await this.extractMetadata(audioPath);
    const enhancedSong = this.enhanceSongWithMetadata(basicSong, metadata);
    
    // Check if this song should be marked as favorite
    const favoriteIds = StorageService.getFavorites();
    if (favoriteIds.includes(enhancedSong.id)) {
      enhancedSong.isFavorite = true;
    }
    
    this.songs.push(enhancedSong);
    this.notifyListeners();
    
    return enhancedSong;
  }

  // Refresh library (scan for new songs)
  async refresh(): Promise<void> {
    await this.scanAndUpdateSongs();
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
