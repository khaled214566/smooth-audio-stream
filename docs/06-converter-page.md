# Converter Page Documentation

## 📁 File: `src/pages/Converter.tsx`

### 🎯 Purpose
Main user interface for downloading media. Provides:
- URL input and download controls
- Format and quality selection
- Real-time download progress display
- Download history management

## 🏗️ Component Architecture

### State Management
```typescript
const ConverterPage = () => {
  const [url, setUrl] = useState("");                    // Input URL
  const [format, setFormat] = useState("mp3");          // Audio format
  const [quality, setQuality] = useState("320");        // Audio quality
  const [downloads, setDownloads] = useState<DownloadItem[]>([]); // Active downloads
  const [isLoading, setIsLoading] = useState(false);    // Loading state
```

### Key Components
1. **URL Input Section**: Link input and download button
2. **Format Controls**: Format and quality selectors
3. **Download List**: Active and completed downloads
4. **Status Notice**: Information about download capabilities

## 🔄 Download Process Flow

### 1. Download Initiation
```typescript
const handleDownload = async () => {
  if (!url.trim()) {
    toast.error("Please enter a URL");
    return;
  }

  setIsLoading(true);
  
  try {
    // Start download via API
    const downloadInfo = await DownloadService.startDownload(url, format, quality);
    
    // Begin progress polling
    pollDownloadStatus(downloadInfo.downloadId);
    
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Progress Polling
```typescript
const pollDownloadStatus = async () => {
  const statusResponse = await fetch(`http://localhost:3001/api/download/status/${downloadId}`);
  const status = await statusResponse.json();
  
  // Update download list
  setDownloads(prev => {
    const existing = prev.findIndex(d => d.id === status.id);
    if (existing >= 0) {
      const updated = [...prev];
      updated[existing] = status;
      return updated;
    } else {
      return [...prev, status];
    }
  });

  // Handle completion
  if (status.status === 'complete') {
    toast.success(`Downloaded: ${status.title}`);
    
    // Refresh library
    const libraryService = AudioLibraryService.getInstance();
    libraryService.refresh();
  }
  
  // Continue polling if still downloading
  if (status.status === 'downloading') {
    setTimeout(pollStatus, 1000);
  }
};
```

### 3. Library Integration
```typescript
if (status.status === 'complete') {
  // Refresh library to include the new song
  const libraryService = AudioLibraryService.getInstance();
  libraryService.refresh().then(() => {
    console.log('Library refreshed with new song');
  });
}
```

## 🎨 UI Components

### URL Input Section
```typescript
<div className="flex gap-2">
  <Input
    placeholder="Paste YouTube, SoundCloud, or other media URL here..."
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    className="flex-1 bg-secondary border-none"
  />
  <Button onClick={handleDownload} disabled={isLoading}>
    {isLoading ? <Loader2 className="animate-spin" /> : <Download />}
    {isLoading ? "Starting..." : "Download"}
  </Button>
</div>
```

### Format Controls
```typescript
<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">Format</label>
    <Select value={format} onValueChange={setFormat}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="mp3">MP3</SelectItem>
        <SelectItem value="m4a">M4A</SelectItem>
        <SelectItem value="wav">WAV</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">Quality</label>
    <Select value={quality} onValueChange={setQuality}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="128">128k</SelectItem>
        <SelectItem value="192">192k</SelectItem>
        <SelectItem value="320">320k</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

### Download Item Display
```typescript
<div className="flex items-center justify-between p-4 bg-card rounded-xl border">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
      {status === 'complete' ? <CheckCircle2 /> : 
       status === 'error' ? <X /> : <Loader2 className="animate-spin" />}
    </div>
    <div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground">{format} • {progress}%</p>
    </div>
  </div>
  
  <div className="flex items-center gap-2">
    {status === 'downloading' && (
      <div className="w-32 bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    )}
    <Button variant="ghost" size="sm" onClick={() => removeDownload(id)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
</div>
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **React Hooks**: useState, useEffect for state management
- **Async/Await**: Promise-based API calls
- **TypeScript**: Type definitions and interfaces
- **Event Handling**: User input and form submission
- **State Updates**: Immutable state patterns

### UI/UX Concepts
- **Loading States**: Visual feedback during operations
- **Progress Indicators**: Real-time progress display
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Non-intrusive user feedback
- **Responsive Design**: Mobile-friendly layouts

## 📊 Data Flow

```
User Input → handleDownload() → DownloadService → Backend API → yt-dlp
     ↓              ↓              ↓            ↓         ↓
  URL/Format → Start Request → Poll Status → Progress → File Saved
     ↓              ↓              ↓            ↓         ↓
  UI Update → Progress Bar → Library Refresh → New Song → Ready to Play
```

## 🐛 Common Issues

### 1. Empty URL Submission
**Problem**: User clicks download without entering URL
**Solution**: Input validation with user feedback
```typescript
if (!url.trim()) {
  toast.error("Please enter a URL");
  return;
}
```

### 2. Multiple Simultaneous Downloads
**Problem**: User starts multiple downloads rapidly
**Solution**: Loading state prevents concurrent requests
```typescript
<Button onClick={handleDownload} disabled={isLoading}>
```

### 3. Memory Leaks
**Problem**: Polling continues after component unmount
**Solution**: Cleanup in useEffect return
```typescript
useEffect(() => {
  loadDownloads();
  return () => {
    // Cleanup polling intervals
  };
}, []);
```

### 4. Stale Download State
**Problem**: Download list shows old/cancelled downloads
**Solution**: Filter and refresh download list

## 🔍 Debugging Tools

### State Inspection
```typescript
// Debug current downloads
console.log('Current downloads:', downloads);
console.log('Loading state:', isLoading);
console.log('Input URL:', url);
```

### Network Monitoring
```typescript
// Monitor API calls
console.log('Starting download:', { url, format, quality });
console.log('Download response:', downloadInfo);
console.log('Status update:', status);
```

### Error Tracking
```typescript
// Enhanced error logging
catch (error) {
  console.error('Download failed:', {
    error: error.message,
    url: url,
    format: format,
    quality: quality,
    timestamp: new Date().toISOString()
  });
}
```

## 🚀 Performance Considerations

### Polling Optimization
- Use appropriate intervals (1 second for downloads)
- Stop polling when download completes
- Implement cleanup on component unmount

### State Management
- Use immutable updates for download list
- Avoid unnecessary re-renders
- Debounce rapid state changes

### User Experience
- Show loading states immediately
- Provide clear progress feedback
- Handle network errors gracefully

## 🔮 Future Enhancements

- **Batch Downloads**: Download multiple URLs at once
- **Download Queue**: Queue management system
- **Download History**: Persistent download records
- **URL Validation**: Client-side URL validation
- **Preview Features**: Video preview before download
- **Custom File Naming**: User-defined naming patterns
