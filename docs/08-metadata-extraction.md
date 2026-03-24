# Metadata Extraction Documentation

## 📁 File: `src/lib/readAudioTags.ts`

### 🎯 Purpose
Utility for extracting ID3 tags and metadata from audio files. Handles:
- Reading ID3 tags from MP3, M4A, and WAV files
- Extracting artwork and converting to Blob URLs
- Parsing audio duration and technical information
- Error handling for unsupported or corrupted files

## 🏗️ Architecture Overview

### Core Function
```typescript
export function readAudioTags(audioUrl: string): Promise<TrackMediaTags> {
  return new Promise((resolve, reject) => {
    // Convert URL to absolute if needed
    const abs = audioUrl.startsWith("http") ? audioUrl : new URL(audioUrl, window.location.origin).href;
    
    // Fetch file as Blob
    fetch(abs)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        // Use jsmediatags to read ID3 tags
        jsmediatags.read(blob, {
          onSuccess: (tag) => resolve(readTagsFromJsMediaTag(tag)),
          onError: (e) => reject(e instanceof Error ? e : new Error(String(e))),
        });
      })
      .catch(reject);
  });
}
```

### Data Structures
```typescript
export interface TrackMediaTags {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  track?: string;
  duration?: number;
  artwork?: string;           // Blob URL
  artworkObjectUrl?: string;  // Blob URL reference
  artworkData?: string;       // Base64 data
}
```

## 🔄 Tag Reading Process

### 1. URL Resolution
```typescript
// Handle relative and absolute URLs
const abs = audioUrl.startsWith("http") ? audioUrl : new URL(audioUrl, window.location.origin).href;
```

### 2. File Fetching
```typescript
// Convert audio file to Blob for processing
fetch(abs)
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.blob();
  })
```

### 3. ID3 Tag Reading
```typescript
// Use jsmediatags library to extract metadata
jsmediatags.read(blob, {
  onSuccess: (tag) => resolve(readTagsFromJsMediaTag(tag)),
  onError: (e) => reject(e instanceof Error ? e : new Error(String(e))),
});
```

### 4. Tag Processing
```typescript
export function readTagsFromJsMediaTag(tag: { tags: Record<string, unknown> }): TrackMediaTags {
  const { tags } = tag;
  
  return {
    title: getString(tags, "title"),
    artist: getString(tags, "artist"),
    album: getString(tags, "album"),
    year: getString(tags, "year"),
    genre: getString(tags, "genre"),
    track: getString(tags, "track"),
    duration: getNumber(tags, "duration"),
    artwork: getArtwork(tags),
  };
}
```

## 🎨 Artwork Processing

### Artwork Extraction
```typescript
function getArtwork(tags: Record<string, unknown>): string | undefined {
  const art = tags.picture;
  if (!art || !Array.isArray(art) || art.length === 0) return undefined;
  
  const picture = art[0];
  if (!picture || !picture.data) return undefined;
  
  // Convert binary data to Base64
  const { data, format } = picture;
  const base64String = arrayBufferToBase64(data);
  const mimeType = format === "image/jpg" || format === "image/jpeg" ? "image/jpeg" : format;
  
  return `data:${mimeType};base64,${base64String}`;
}
```

### Blob URL Creation
```typescript
// In AudioContext, convert Base64 to Blob URL
if (tags.artwork) {
  fetch(tags.artwork)
    .then(res => res.blob())
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob);
      setTrackTags(prev => ({
        ...prev,
        [song.id]: { ...tags, artworkObjectUrl: objectUrl }
      }));
    });
}
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **ID3 Tags**: Metadata format for audio files
- **Blob API**: Binary data handling in browser
- **Base64 Encoding**: Binary to text conversion
- **Fetch API**: HTTP requests and responses
- **Promise Chains**: Asynchronous operation handling
- **ArrayBuffer**: Binary data buffer manipulation

### Audio Format Knowledge
- **MP3**: ID3v1, ID3v2 tag formats
- **M4A**: iTunes metadata format
- **WAV**: Limited metadata support
- **Artwork Formats**: JPEG, PNG embedded in audio

### jsmediatags Library
- **Cross-platform**: Works in browser environment
- **Format Support**: MP3, M4A, WAV, FLAC
- **Async API**: Promise-based tag reading
- **Error Handling**: Graceful failure for unsupported files

## 🔧 Technical Implementation

### Helper Functions
```typescript
function getString(tags: Record<string, unknown>, key: string): string | undefined {
  const value = tags[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(tags: Record<string, unknown>, key: string): number | undefined {
  const value = tags[key];
  return typeof value === "number" ? value : undefined;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

### Error Handling
```typescript
// Graceful fallback for missing metadata
try {
  const tags = await readAudioTags(audioSrc);
  return tags;
} catch (error) {
  console.warn(`Failed to read tags for ${audioSrc}:`, error);
  return {
    title: filename,
    artist: "Unknown Artist",
    album: "Unknown Album"
  };
}
```

## 🐛 Common Issues

### 1. CORS Issues
**Problem**: Cannot fetch audio files from different origins
**Solution**: Serve files from same origin or configure CORS
```typescript
// Backend CORS headers
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 2. Unsupported Formats
**Problem**: jsmediatags cannot read certain file formats
**Solution**: Graceful fallback to filename-based metadata

### 3. Memory Leaks
**Problem**: Blob URLs not revoked, causing memory leaks
**Solution**: Revoke URLs when no longer needed
```typescript
useEffect(() => {
  return () => {
    // Cleanup blob URLs
    Object.values(trackTags).forEach(tags => {
      if (tags.artworkObjectUrl) {
        URL.revokeObjectURL(tags.artworkObjectUrl);
      }
    });
  };
}, []);
```

### 4. Large Artwork
**Problem**: High-resolution artwork causes performance issues
**Solution**: Resize artwork before storing

## 🔍 Debugging Tools

### Tag Inspection
```typescript
// Debug all available tags
jsmediatags.read(blob, {
  onSuccess: (tag) => {
    console.log('All tags:', tag.tags);
    console.log('Available keys:', Object.keys(tag.tags));
  },
  onError: (error) => {
    console.error('Tag reading failed:', error);
  }
});
```

### Artwork Debugging
```typescript
// Debug artwork extraction
const artwork = getArtwork(tags);
if (artwork) {
  console.log('Artwork size:', artwork.length);
  console.log('Artwork preview:', artwork.substring(0, 100));
} else {
  console.log('No artwork found');
}
```

### File Format Detection
```typescript
// Debug file information
fetch(audioUrl)
  .then(r => r.blob())
  .then(blob => {
    console.log('File size:', blob.size);
    console.log('File type:', blob.type);
    console.log('File slice:', blob.slice(0, 10));
  });
```

## 🚀 Performance Considerations

### Memory Management
- Revoke Blob URLs when component unmounts
- Limit artwork size to prevent memory issues
- Cache metadata to avoid repeated reads

### Loading Optimization
- Load metadata asynchronously
- Show loading states during extraction
- Batch multiple file reads

### Error Recovery
- Graceful fallback for missing metadata
- Retry failed extraction attempts
- User feedback for long operations

## 📊 Supported Metadata Fields

### Standard Fields
- **title**: Track title
- **artist**: Artist name
- **album**: Album name
- **year**: Release year
- **genre**: Music genre
- **track**: Track number
- **duration**: Audio length in seconds

### Artwork
- **picture**: Embedded album artwork
- **format**: Image format (JPEG/PNG)
- **data**: Binary image data

### Technical Fields
- **bitrate**: Audio bitrate
- **sampleRate**: Sample frequency
- **channels**: Number of audio channels

## 🔮 Future Enhancements

- **Batch Processing**: Extract metadata from multiple files
- **Metadata Caching**: Persist extracted metadata
- **Artwork Optimization**: Automatic resizing and compression
- **Extended Tags**: Support for custom metadata fields
- **File Validation**: Verify file integrity before extraction
- **Progress Indicators**: Show extraction progress for large files
