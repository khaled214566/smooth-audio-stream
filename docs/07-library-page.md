# Library Page Documentation

## 📁 File: `src/pages/Library.tsx`

### 🎯 Purpose
Main interface for browsing and managing the music library. Provides:
- Song list display with search and filtering
- Album, artist, and folder views
- Song selection and playback controls
- Favorite management and sorting options

## 🏗️ Component Architecture

### State Management
```typescript
const LibraryPage = () => {
  const { songs, playSong, currentSong, isPlaying } = useAudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState<"all" | "albums" | "artists" | "folders">("all");
  const [sortBy, setSortBy] = useState<"title" | "artist" | "dateAdded" | "playCount">("title");
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
```

### Key Components
1. **Search Bar**: Real-time song filtering
2. **View Tabs**: Switch between different library views
3. **Song List**: Filtered and sorted song display
4. **Playback Controls**: Play/pause and queue management

## 🔄 Data Processing Flow

### 1. Song Filtering
```typescript
const filteredSongs = songs.filter(song =>
  song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
  song.album.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### 2. Song Sorting
```typescript
const sortedSongs = [...filteredSongs].sort((a, b) => {
  switch (sortBy) {
    case "title":
      return a.title.localeCompare(b.title);
    case "artist":
      return a.artist.localeCompare(b.artist);
    case "dateAdded":
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    case "playCount":
      return b.playCount - a.playCount;
    default:
      return 0;
  }
});
```

### 3. View Processing
```typescript
const processedData = useMemo(() => {
  switch (selectedView) {
    case "albums":
      return groupByAlbum(sortedSongs);
    case "artists":
      return groupByArtist(sortedSongs);
    case "folders":
      return groupByFolder(sortedSongs);
    default:
      return { songs: sortedSongs };
  }
}, [sortedSongs, selectedView]);
```

## 🎨 UI Components

### Search and Controls
```typescript
<div className="flex flex-col md:flex-row gap-4 mb-6">
  <div className="flex-1">
    <Input
      placeholder="Search songs, artists, albums..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="bg-secondary border-none"
    />
  </div>
  
  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
    <SelectTrigger className="w-40">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="title">Title</SelectItem>
      <SelectItem value="artist">Artist</SelectItem>
      <SelectItem value="dateAdded">Date Added</SelectItem>
      <SelectItem value="playCount">Play Count</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### View Tabs
```typescript
<div className="flex gap-2 mb-6">
  {[
    { id: "all", label: "All Songs", icon: Music },
    { id: "albums", label: "Albums", icon: Disc },
    { id: "artists", label: "Artists", icon: User },
    { id: "folders", label: "Folders", icon: Folder }
  ].map(({ id, label, icon: Icon }) => (
    <Button
      key={id}
      variant={selectedView === id ? "default" : "ghost"}
      onClick={() => setSelectedView(id as ViewType)}
      className="flex items-center gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  ))}
</div>
```

### Song Item Display
```typescript
<div className="flex items-center gap-4 p-4 hover:bg-accent rounded-lg cursor-pointer group">
  <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
    <img src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
  </div>
  
  <div className="flex-1 min-w-0">
    <h4 className="font-medium truncate">{song.title}</h4>
    <p className="text-sm text-muted-foreground truncate">{song.artist} • {song.album}</p>
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">{formatDuration(song.duration)}</span>
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(song.id);
      }}
    >
      <Heart className={`h-4 w-4 ${song.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
    </Button>
    
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        playSong(song);
      }}
    >
      {currentSong?.id === song.id && isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  </div>
</div>
```

## 📊 Data Grouping Functions

### Album Grouping
```typescript
const groupByAlbum = (songs: Song[]) => {
  const albums = songs.reduce((acc, song) => {
    const albumKey = `${song.album} - ${song.artist}`;
    if (!acc[albumKey]) {
      acc[albumKey] = {
        name: song.album,
        artist: song.artist,
        artwork: song.artwork,
        songs: [],
        duration: 0
      };
    }
    acc[albumKey].songs.push(song);
    acc[albumKey].duration += song.duration;
    return acc;
  }, {});
  
  return Object.values(albums);
};
```

### Artist Grouping
```typescript
const groupByArtist = (songs: Song[]) => {
  const artists = songs.reduce((acc, song) => {
    if (!acc[song.artist]) {
      acc[song.artist] = {
        name: song.artist,
        songs: [],
        albums: [...new Set(songs.filter(s => s.artist === song.artist).map(s => s.album))],
        duration: 0
      };
    }
    acc[song.artist].songs.push(song);
    acc[song.artist].duration += song.duration;
    return acc;
  }, {});
  
  return Object.values(artists);
};
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **React Hooks**: useState, useMemo, useCallback
- **Array Methods**: filter, sort, reduce, map
- **State Management**: Complex state patterns
- **Event Handling**: Click events and propagation
- **Performance Optimization**: useMemo for expensive operations

### UI/UX Concepts
- **Responsive Design**: Mobile and desktop layouts
- **Search Implementation**: Real-time filtering
- **Data Visualization**: Grouped data display
- **User Interactions**: Selection, favorites, playback

## 🐛 Common Issues

### 1. Performance with Large Libraries
**Problem**: Slow filtering and sorting with many songs
**Solution**: Use useMemo and debounce search
```typescript
const filteredSongs = useMemo(() => {
  return songs.filter(song => /* filtering logic */);
}, [songs, searchQuery]);
```

### 2. Search Performance
**Problem**: Search lag on every keystroke
**Solution**: Debounce search input
```typescript
const debouncedSearch = useMemo(
  () => debounce(setSearchQuery, 300),
  []
);
```

### 3. State Synchronization
**Problem**: Library updates not reflecting in UI
**Solution**: Proper dependency arrays in useMemo

### 4. Memory Leaks
**Problem**: Event listeners not cleaned up
**Solution**: Cleanup in useEffect return

## 🔍 Debugging Tools

### State Inspection
```typescript
// Debug library state
console.log('Total songs:', songs.length);
console.log('Filtered songs:', filteredSongs.length);
console.log('Current view:', selectedView);
console.log('Sort by:', sortBy);
```

### Performance Monitoring
```typescript
// Measure filtering performance
const startTime = performance.now();
const filtered = songs.filter(/* filter logic */);
const endTime = performance.now();
console.log('Filtering took:', endTime - startTime, 'ms');
```

### Search Debugging
```typescript
// Debug search matching
const debugSearch = (song: Song, query: string) => {
  const matches = {
    title: song.title.toLowerCase().includes(query.toLowerCase()),
    artist: song.artist.toLowerCase().includes(query.toLowerCase()),
    album: song.album.toLowerCase().includes(query.toLowerCase())
  };
  console.log(`Search match for "${song.title}":`, matches);
};
```

## 🚀 Performance Considerations

### Search Optimization
- Debounce search input (300ms delay)
- Use case-insensitive matching
- Consider search indexing for large libraries

### Rendering Optimization
- Use useMemo for expensive calculations
- Implement virtual scrolling for large lists
- Lazy load images and artwork

### State Management
- Minimize re-renders with proper dependencies
- Use useCallback for event handlers
- Batch state updates when possible

## 🔮 Future Enhancements

- **Advanced Search**: Genre, year, duration filters
- **Playlist Creation**: Custom playlist management
- **Smart Playlists**: Auto-generated based on criteria
- **Import/Export**: Library backup and restore
- **Cloud Sync**: Cross-device library synchronization
- **Analytics**: Listening statistics and recommendations
