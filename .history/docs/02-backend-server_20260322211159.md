# Backend Server Documentation

## 📁 File: `simple-server.cjs`

### 🎯 Purpose
The backend server is the core of the download system. It handles:
- HTTP API requests from the frontend
- yt-dlp integration for downloading audio
- Static file serving for audio playback
- Download progress tracking and status updates

## 🏗️ Architecture

### Core Components
```javascript
// HTTP Server Setup
const server = http.createServer(async (req, res) => {
  // Route handling
  // CORS management
  // Response formatting
});

// Download Management
const activeDownloads = new Map(); // Track active downloads
```

### Key Routes
1. **GET /api/test** - Server health check
2. **POST /api/download** - Start new download
3. **GET /api/download/status/:id** - Get download progress
4. **GET /api/downloads** - List all downloads
5. **GET /api/audio/scan** - Scan audio directory
6. **GET /audio/* - Serve static audio files

## 🔄 Download Workflow

### 1. Video Info Extraction
```javascript
function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      url
    ]);
    // Parse JSON output for video metadata
  });
}
```

### 2. Audio Download Process
```javascript
function downloadAudio(url, format, quality, downloadId) {
  const ytDlp = spawn('yt-dlp', [
    '-x',                    // Extract audio only
    '--audio-format', format, // MP3/M4A/WAV
    '--audio-quality', quality + 'k', // 128k/192k/320k
    '--embed-thumbnail',     // Add artwork
    '--embed-metadata',    // Add ID3 tags
    '-o', outputPath,      // Output file path
    url
  ]);
}
```

### 3. Progress Tracking
- Parses yt-dlp stderr output for progress percentage
- Updates `activeDownloads` Map with current progress
- Provides real-time status via API endpoints

## 📁 File System Operations

### Directory Structure
```
project-root/
├── simple-server.cjs     # Backend server
├── public/
│   └── audio/           # All MP3 files
│       ├── existing-song.mp3
│       └── download_123456.mp3
└── docs/                # Documentation
```

### File Naming Convention
- **Existing Songs**: Original filenames (e.g., "Warrior of the Mind.mp3")
- **Downloaded Songs**: `download_{timestamp}.mp3` (e.g., "download_1640952000000.mp3")

## 🔧 Technical Implementation Details

### HTTP Server Setup
```javascript
// CORS Configuration
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

// Content Type Handling
const ext = path.extname(filePath);
const contentType = ext === '.mp3' ? 'audio/mpeg' : 
                   ext === '.wav' ? 'audio/wav' : 'audio/mp4';
```

### Process Management
```javascript
// Child Process Spawning
const ytDlp = spawn('yt-dlp', args);

// Stream Handling
ytDlp.stdout.on('data', (chunk) => { /* JSON output */ });
ytDlp.stderr.on('data', (chunk) => { /* Progress/error output */ });
ytDlp.on('close', (code) => { /* Completion handling */ });
```

## 📊 API Endpoints Reference

### POST /api/download
**Request Body:**
```json
{
  "url": "https://youtube.com/watch?v=...",
  "format": "mp3",
  "quality": "320"
}
```

**Response:**
```json
{
  "downloadId": "1640952000000",
  "title": "Song Title",
  "thumbnail": "https://...",
  "duration": 240,
  "uploader": "Channel Name"
}
```

### GET /api/download/status/:id
**Response:**
```json
{
  "id": "1640952000000",
  "title": "Song Title",
  "status": "downloading", // "downloading" | "complete" | "error"
  "progress": 67,
  "format": "MP3",
  "filename": "download_1640952000000.mp3",
  "publicPath": "/audio/download_1640952000000.mp3"
}
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **Node.js HTTP Module**: Built-in web server capabilities
- **Child Process**: Spawning external processes (yt-dlp)
- **Stream Handling**: Process stdout/stderr management
- **File System**: Directory operations, file serving
- **HTTP Methods**: GET, POST, OPTIONS handling
- **CORS**: Cross-origin resource sharing

### yt-dlp Command Knowledge
- **-x**: Extract audio only
- **--audio-format**: Output format (mp3/m4a/wav)
- **--audio-quality**: Bitrate (128k/192k/320k)
- **--embed-thumbnail**: Add artwork to file
- **--embed-metadata**: Add ID3 tags
- **--dump-json**: Get video information

## 🐛 Common Issues & Debugging

### 1. yt-dlp Not Found
**Error**: `spawn yt-dlp ENOENT`
**Solution**: Run `npm run setup` or install yt-dlp manually

### 2. Permission Errors
**Error**: `EACCES: permission denied`
**Solution**: Check file permissions on `public/audio/`

### 3. Port Already in Use
**Error**: `EADDRINUSE: address already in use`
**Solution**: Kill existing process or change PORT constant

### 4. Download Failures
**Error**: Non-zero exit code from yt-dlp
**Solution**: Check URL validity, internet connection, yt-dlp version

## 🔍 Debugging Tools

### Server Logs
```javascript
console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
// Logs all incoming requests with timestamps
```

### Process Monitoring
```javascript
ytDlp.on('error', (err) => {
  console.error('yt-dlp process error:', err);
});
```

### File System Verification
```javascript
console.log('Audio directory exists:', fs.existsSync(audioDir));
console.log('Files in directory:', fs.readdirSync(audioDir));
```

## 🚀 Performance Considerations

### Memory Management
- Clean up completed downloads from `activeDownloads` periodically
- Use streams for file serving (not full file reads)
- Limit concurrent downloads

### Error Handling
- Graceful degradation when yt-dlp fails
- Timeout handling for long-running downloads
- Proper HTTP status codes for all scenarios

### Security Notes
- CORS allows all origins (development setup)
- No authentication (local application)
- File path validation prevents directory traversal

## 🔮 Future Enhancements

- Express.js integration for better routing
- WebSocket support for real-time progress
- Download queue management
- File cleanup and organization
- User authentication and authorization
