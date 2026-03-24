# Audio Context Documentation

## 📁 File: `src/context/AudioContext.tsx`

### 🎯 Purpose
Global state management for the entire audio system. Manages:
- Current playing song and playback state
- Song queue and playback controls
- Volume, shuffle, and repeat settings
- Audio library integration

## 🏗️ Core Architecture

### State Management
```typescript
interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentTime: number;
  playbackDuration: number;
  trackTags: Record<string, TrackMediaTags>;
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  songs: Song[];
  // ... control functions
}
```

### Key Components
1. **AudioProvider**: Context provider component
2. **useAudio**: Custom hook for accessing context
3. **Audio Library Service Integration**: Dynamic song loading

## 🔄 Audio Library Integration

### Initialization Flow
```typescript
useEffect(() => {
  const libraryService = AudioLibraryService.getInstance();
  
  // Subscribe to library changes
  libraryService.subscribe(setSongs);
  
  // Load initial songs
  libraryService.initialize();
  
  return () => libraryService.unsubscribe(setSongs);
}, []);
```

### Metadata Loading
```typescript
// Load ID3 tags for each song
songs.forEach((song) => {
  readAudioTags(song.audioSrc)
    .then((tags) => {
      setTrackTags(prev => ({ ...prev, [song.id]: tags }));
    });
});
```

## 🎵 Playback Controls

### Core Functions
- `playSong(song)`: Start playing specific song
- `playQueue(songs, index)`: Play from queue position
- `togglePlayPause()`: Play/pause toggle
- `nextSong()`: Skip to next song
- `previousSong()`: Go to previous song
- `setVolume(volume)`: Adjust volume (0-1)

### Queue Management
```typescript
const [queue, setQueue] = useState<Song[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);

// Shuffle implementation
const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);

// Repeat modes: "off" | "all" | "one"
```

## 🔧 Technical Implementation

### Audio Element Management
```typescript
const audioRef = useRef<HTMLAudioElement | null>(null);

// Time updates
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const updateTime = () => setCurrentTime(audio.currentTime);
  audio.addEventListener('timeupdate', updateTime);
  
  return () => audio.removeEventListener('timeupdate', updateTime);
}, []);
```

### Progress Tracking
```typescript
// Duration from metadata or file
const getDuration = () => {
  const audio = audioRef.current;
  const tags = trackTags[currentSong?.id || ''];
  
  return audio?.duration || tags?.duration || currentSong?.duration || 0;
};
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **React Context API**: Provider pattern, useContext hook
- **React Hooks**: useState, useEffect, useRef, useCallback
- **TypeScript**: Interfaces, generics, type annotations
- **Audio API**: HTML5 Audio element properties and events
- **State Management**: Global state patterns and subscriptions

### Audio Concepts
- **ID3 Tags**: Metadata embedded in audio files
- **Blob URLs**: Client-side file references for artwork
- **Audio Formats**: MP3, M4A, WAV properties
- **Playback States**: Playing, paused, loading, ended

## 🐛 Common Issues

### 1. Memory Leaks
**Problem**: Blob URLs not revoked
**Solution**: Cleanup in useEffect return
```typescript
useEffect(() => {
  // ... load tags
  
  return () => {
    // Revoke blob URLs to prevent memory leaks
    Object.values(trackTags).forEach(tags => {
      if (tags.artworkObjectUrl) {
        URL.revokeObjectURL(tags.artworkObjectUrl);
      }
    });
  };
}, []);
```

### 2. Audio Context State
**Problem**: Audio element not properly initialized
**Solution**: Check audioRef before accessing properties

### 3. Queue Management
**Problem**: Queue not updating on song changes
**Solution**: Proper dependency arrays in useEffect

## 📊 Data Flow

```
Audio Library Service → AudioContext → UI Components
        ↓                    ↓              ↓
    Song Updates     →  State Updates →  UI Re-renders
        ↓                    ↓              ↓
    Metadata Load    →  Tag Storage  →  Display Tags
```

## 🔮 Future Enhancements

- Persistent playback state
- Cross-tab audio synchronization
- Advanced audio effects
- Playlist management
- Audio visualization
