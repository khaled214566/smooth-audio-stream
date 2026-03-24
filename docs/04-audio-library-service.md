# Audio Library Service Documentation

## 📁 File: `src/lib/audioLibraryService.ts`

### 🎯 Purpose
Centralized service for managing the music library. Handles:
- Scanning the `public/audio/` directory for files
- Extracting metadata from audio files
- Managing the dynamic song list
- Notifying subscribers of library changes

## 🏗️ Architecture Overview

### Singleton Pattern
```typescript
export class AudioLibraryService {
  private static instance: AudioLibraryService;
  private songs: Song[] = [];
  private subscribers: Set<(songs: Song[]) => void> = new Set();

  static getInstance(): AudioLibraryService {
    if (!AudioLibraryService.instance) {
      AudioLibraryService.instance = new AudioLibraryService();
    }
    return AudioLibraryService.instance;
  }
}
```

### Key Components
1. **File Scanner**: Directory scanning and file filtering
2. **Metadata Extractor**: ID3 tag reading and processing
3. **Song Manager**: Song object creation and management
4. **Event System**: Subscriber notification system

## 🔄 Library Management Workflow

### 1. Initialization
```typescript
async initialize(): Promise<void> {
  // Load existing demo songs
  await this.loadExistingSongs();
  
  // Scan for downloaded songs
  await this.scanAndUpdateSongs();
}
```

### 2. Directory Scanning
```typescript
private async scanAndUpdateSongs(): Promise<void> {
  try {
    const response = await fetch('http://localhost:3001/api/audio/scan');
    const audioFiles = await response.json();
    
    // Process new files and update library
    const newSongs = await Promise.all(
      audioFiles.map(file => this.createSongFromFile(file))
    );
    
    this.songs = [...this.songs, ...newSongs];
    this.notifySubscribers();
  } catch (error) {
    console.error('Failed to scan audio directory:', error);
  }
}
```

### 3. Song Creation
```typescript
private async createSongFromFile(file: AudioFile): Promise<Song> {
  const song: Song = {
    id: this.generateId(file.filename),
    title: file.filename.replace(/\.[^/.]+$/, ''), // Remove extension
    artist: "Unknown Artist",
    album: "Unknown Album",
    duration: 0,
    artwork: "/assets/album-art-1.jpg",
    isFavorite: false,
    dateAdded: new Date().toISOString().split('T')[0],
    playCount: 0,
    folder: "Downloads",
    audioSrc: file.publicPath
  };

  // Extract metadata to enhance song info
  try {
    const metadata = await this.extractMetadata(file.publicPath);
    return this.enhanceSongWithMetadata(song, metadata);
  } catch (error) {
    console.warn(`Failed to extract metadata for ${file.filename}:`, error);
    return song;
  }
}
```

## 🏷️ Metadata Extraction

### ID3 Tag Reading
```typescript
private async extractMetadata(audioPath: string): Promise<Partial<Song>> {
  try {
    const tags = await readAudioTags(audioPath);
    
    return {
      title: tags.title,
      artist: tags.artist,
      album: tags.album,
      duration: tags.duration,
      // Extract additional metadata as needed
    };
  } catch (error) {
    console.error('Metadata extraction failed:', error);
    return {};
  }
}
```

### Metadata Enhancement
```typescript
private enhanceSongWithMetadata(song: Song, metadata: Partial<Song>): Song {
  return {
    ...song,
    title: metadata.title || song.title,
    artist: metadata.artist || song.artist,
    album: metadata.album || song.album,
    duration: metadata.duration || song.duration,
    dateAdded: metadata.year || song.dateAdded,
  };
}
```

## 📡 Subscription System

### Event Notification
```typescript
subscribe(callback: (songs: Song[]) => void): void {
  this.subscribers.add(callback);
}

unsubscribe(callback: (songs: Song[]) => void): void {
  this.subscribers.delete(callback);
}

private notifySubscribers(): void {
  this.subscribers.forEach(callback => callback(this.songs));
}
```

### Usage in Components
```typescript
// In AudioContext
useEffect(() => {
  const libraryService = AudioLibraryService.getInstance();
  
  const updateSongs = (songs: Song[]) => setSongs(songs);
  libraryService.subscribe(updateSongs);
  
  return () => libraryService.unsubscribe(updateSongs);
}, []);
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **Singleton Pattern**: Ensuring single instance
- **Observer Pattern**: Subscription/notification system
- **Async/Await**: Promise-based operations
- **File System**: Directory scanning concepts
- **Metadata**: ID3 tags and audio file properties
- **Event Systems**: Pub/sub patterns

### Audio File Knowledge
- **File Extensions**: MP3, M4A, WAV formats
- **ID3 Tags**: Title, artist, album, artwork
- **File Paths**: Public path vs. file system path
- **Metadata Extraction**: Reading embedded information

## 📁 File System Integration

### Directory Structure
```
public/audio/
├── existing-song-1.mp3
├── existing-song-2.mp3
└── download_123456.mp3
```

### API Integration
```typescript
// Backend API call
const response = await fetch('http://localhost:3001/api/audio/scan');
const audioFiles: AudioFile[] = await response.json();

interface AudioFile {
  filename: string;
  publicPath: string;     // "/audio/filename.mp3"
  size: number;
  modified: string;
}
```

## 🐛 Common Issues

### 1. Duplicate Songs
**Problem**: Same file added multiple times
**Solution**: Check existing songs before adding
```typescript
const existingIds = new Set(this.songs.map(s => s.id));
const newSongs = allSongs.filter(song => !existingIds.has(song.id));
```

### 2. Metadata Extraction Failures
**Problem**: readAudioTags throws error
**Solution**: Graceful fallback to filename-based metadata

### 3. Race Conditions
**Problem**: Multiple scans running simultaneously
**Solution**: Implement scan locking mechanism

### 4. Memory Leaks
**Problem**: Subscribers not properly unsubscribed
**Solution**: Always unsubscribe in component cleanup

## 🔍 Debugging Tools

### Library State Inspection
```typescript
// Debug method to inspect current state
debugLibrary(): void {
  console.log('Total songs:', this.songs.length);
  console.log('Subscribers:', this.subscribers.size);
  console.log('Song IDs:', this.songs.map(s => s.id));
}
```

### Metadata Validation
```typescript
// Validate extracted metadata
private validateMetadata(metadata: any): boolean {
  return metadata && 
         typeof metadata.title === 'string' && 
         metadata.title.length > 0;
}
```

## 🚀 Performance Considerations

### Efficient Scanning
- Debounce rapid scan requests
- Cache metadata extraction results
- Use file modification times for change detection

### Memory Management
- Limit number of cached metadata objects
- Clean up old subscriptions
- Use weak references where appropriate

### Error Handling
- Graceful degradation for missing metadata
- Retry mechanisms for failed scans
- User feedback for long operations

## 🔮 Future Enhancements

- **Incremental Scanning**: Only scan changed files
- **Metadata Caching**: Persist extracted metadata
- **File Watching**: Automatic library updates
- **Duplicate Detection**: Smart duplicate handling
- **Batch Processing**: Process multiple files efficiently
