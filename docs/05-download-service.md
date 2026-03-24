# Download Service Documentation

## 📁 File: `src/lib/downloadService.ts`

### 🎯 Purpose
Frontend service for communicating with the backend download API. Handles:
- Starting new downloads
- Polling download progress
- Managing download history
- Error handling and connection testing

## 🏗️ Service Architecture

### Static Class Pattern
```typescript
export class DownloadService {
  // All methods are static - no instance needed
  static async startDownload(url: string, format: string, quality: string): Promise<DownloadInfo>
  static async getDownloadStatus(id: string): Promise<DownloadStatus>
  static async getAllDownloads(): Promise<DownloadStatus[]>
  static pollDownloadStatus(id: string, callback: Function): Function
}
```

### API Configuration
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

## 🔄 Download Workflow

### 1. Connection Testing
```typescript
static async testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    return response.ok;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
}
```

### 2. Starting Downloads
```typescript
static async startDownload(url: string, format: string = 'mp3', quality: string = '320'): Promise<DownloadInfo> {
  // Test connection first
  const isConnected = await this.testConnection();
  if (!isConnected) {
    throw new Error('Backend server is not running. Please start the server with "npm run server"');
  }

  const response = await fetch(`${API_BASE_URL}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format, quality }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start download');
  }

  return response.json();
}
```

### 3. Progress Polling
```typescript
static pollDownloadStatus(id: string, onStatus: (status: DownloadStatus) => void, interval: number = 1000): () => void {
  const poll = async () => {
    try {
      const status = await this.getDownloadStatus(id);
      onStatus(status);
      
      if (status.status === 'complete' || status.status === 'error') {
        return; // Stop polling
      }
      
      setTimeout(poll, interval); // Continue polling
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  poll();

  return () => {
    // Cleanup function if needed
  };
}
```

## 📊 Data Structures

### Download Info (Initial Response)
```typescript
interface DownloadInfo {
  id: string;           // Unique download identifier
  title: string;        // Video/song title
  thumbnail?: string;    // Video thumbnail URL
  duration?: number;    // Video duration in seconds
  uploader?: string;    // Channel/uploader name
}
```

### Download Status (Progress Updates)
```typescript
interface DownloadStatus {
  id: string;
  title: string;
  status: 'downloading' | 'complete' | 'error';
  progress: number;      // 0-100 percentage
  format: string;        // MP3, M4A, WAV
  filename?: string;     // Actual filename
  publicPath?: string;   // /audio/filename.mp3
  error?: string;       // Error message if failed
}
```

### Audio File (Library Scan)
```typescript
interface AudioFile {
  filename: string;      // download_123456.mp3
  publicPath: string;    // /audio/download_123456.mp3
  size: number;          // File size in bytes
  modified: string;      // Last modified timestamp
}
```

## 🛠️ Prerequisites for Understanding

### Required Knowledge
- **Fetch API**: HTTP requests and responses
- **Async/Await**: Promise-based asynchronous programming
- **Static Classes**: Class methods without instantiation
- **Polling Patterns**: Repeated status checking
- **Error Handling**: Try/catch and error propagation
- **TypeScript Interfaces**: Type definitions and contracts

### HTTP Concepts
- **REST API**: GET, POST methods
- **JSON**: Data serialization format
- **Status Codes**: 200, 400, 404, 500
- **Headers**: Content-Type, CORS
- **Request/Response**: HTTP message structure

## 🔧 Implementation Details

### Error Handling Strategy
```typescript
// Graceful degradation for offline server
static async getAllDownloads(): Promise<DownloadStatus[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/downloads`);
    return response.json();
  } catch (error) {
    console.warn('Could not fetch downloads, server may be offline:', error);
    return []; // Return empty array instead of crashing
  }
}
```

### Connection Validation
```typescript
// Pre-flight check before operations
static async startDownload(url: string, format: string, quality: string): Promise<DownloadInfo> {
  const isConnected = await this.testConnection();
  if (!isConnected) {
    throw new Error('Backend server is not running. Please start the server with "npm run server"');
  }
  // ... proceed with download
}
```

### Polling Implementation
```typescript
// Recursive setTimeout for continuous polling
static pollDownloadStatus(id: string, onStatus: Function, interval: number = 1000): () => void {
  const poll = async () => {
    const status = await this.getDownloadStatus(id);
    onStatus(status);
    
    if (status.status === 'complete' || status.status === 'error') {
      return; // Stop condition
    }
    
    setTimeout(poll, interval); // Recursive call
  };

  poll(); // Start polling
  
  return () => {
    // Return cleanup function
  };
}
```

## 🐛 Common Issues

### 1. Server Not Running
**Error**: `Failed to fetch`
**Solution**: Check backend server status with `testConnection()`

### 2. Network Errors
**Error**: `TypeError: Failed to fetch`
**Solution**: Handle gracefully, show user-friendly message

### 3. Invalid URLs
**Error**: `400 Bad Request`
**Solution**: Validate URLs before sending to backend

### 4. Memory Leaks
**Problem**: Polling continues after component unmount
**Solution**: Use cleanup function returned by `pollDownloadStatus`

## 📡 Usage Examples

### Basic Download
```typescript
try {
  const downloadInfo = await DownloadService.startDownload(url, 'mp3', '320');
  console.log('Download started:', downloadInfo.title);
} catch (error) {
  console.error('Download failed:', error.message);
}
```

### Progress Polling
```typescript
const cleanup = DownloadService.pollDownloadStatus(downloadId, (status) => {
  console.log(`Progress: ${status.progress}%`);
  
  if (status.status === 'complete') {
    console.log('Download finished!');
    cleanup(); // Stop polling
  }
});

// Cleanup on component unmount
useEffect(() => return cleanup, []);
```

### Error Handling
```typescript
const downloads = await DownloadService.getAllDownloads();
if (downloads.length === 0) {
  console.log('No downloads or server offline');
}
```

## 🔍 Debugging Tools

### Connection Testing
```typescript
// Manual connection test
const isOnline = await DownloadService.testConnection();
console.log('Server online:', isOnline);
```

### Status Monitoring
```typescript
// Monitor specific download
setInterval(async () => {
  const status = await DownloadService.getDownloadStatus(downloadId);
  console.log('Status:', status);
}, 2000);
```

### Error Logging
```typescript
// Enhanced error logging
try {
  await DownloadService.startDownload(url);
} catch (error) {
  console.error('Download failed:', {
    message: error.message,
    url: url,
    timestamp: new Date().toISOString()
  });
}
```

## 🚀 Performance Considerations

### Polling Optimization
- Use appropriate intervals (1-2 seconds for downloads)
- Stop polling when download completes
- Implement exponential backoff for errors

### Request Optimization
- Debounce rapid download requests
- Cache download status briefly
- Use appropriate timeout values

### Memory Management
- Clean up polling intervals
- Limit concurrent downloads
- Store minimal state in service

## 🔮 Future Enhancements

- **WebSocket Support**: Real-time updates instead of polling
- **Request Queuing**: Queue multiple downloads
- **Retry Logic**: Automatic retry for failed downloads
- **Download Resumption**: Support for partial downloads
- **Batch Operations**: Start multiple downloads at once
