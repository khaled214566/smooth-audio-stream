const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3001;

// Store active downloads
const activeDownloads = new Map();

// Ensure public/audio directory exists
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log('Created audio directory:', audioDir);
}

// Helper function to extract YouTube video info
function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      url
    ]);

    let data = '';
    let error = '';

    ytDlp.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    ytDlp.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    ytDlp.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(data);
          resolve(info);
        } catch (e) {
          reject(new Error('Failed to parse video info'));
        }
      } else {
        reject(new Error(error || 'Failed to get video info'));
      }
    });
  });
}

// Download audio using yt-dlp
function downloadAudio(url, format, quality, downloadId) {
  return new Promise((resolve, reject) => {
    const audioFormat = format === 'wav' ? 'wav' : 'mp3';
    const qualityBitrate = quality + 'k';
    
    const filename = `download_${downloadId}.${audioFormat}`;
    const outputPath = path.join(audioDir, filename);

    const ytDlp = spawn('yt-dlp', [
      '-x',  // Extract audio
      '--audio-format', audioFormat,
      '--audio-quality', qualityBitrate,
      '--embed-thumbnail',
      '--embed-metadata',
      '-o', outputPath,
      url
    ]);

    let error = '';

    ytDlp.stderr.on('data', (chunk) => {
      error += chunk.toString();
      // Update progress based on yt-dlp output
      const progressMatch = chunk.toString().match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId),
          progress: Math.round(progress)
        });
      }
    });

    ytDlp.on('close', (code) => {
      if (code === 0) {
        // Find the actual file (yt-dlp might add extension)
        const files = fs.readdirSync(audioDir).filter(f => f.includes(`download_${downloadId}`));
        if (files.length > 0) {
          const actualFile = files[0];
          const finalPath = path.join(audioDir, actualFile);
          resolve({
            filename: actualFile,
            path: finalPath,
            publicPath: `/audio/${actualFile}`
          });
        } else {
          reject(new Error('Downloaded file not found'));
        }
      } else {
        reject(new Error(error || 'Download failed'));
      }
    });

    ytDlp.on('error', (err) => {
      reject(err);
    });
  });
}

// Simple HTTP server without express
const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Test endpoint
  if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Server is running!', 
      timestamp: new Date().toISOString(),
      audioDir: audioDir,
      audioDirExists: fs.existsSync(audioDir)
    }));
    return;
  }

  // Download endpoint
  if (req.url === '/api/download' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { url, format = 'mp3', quality = '320' } = JSON.parse(body);
        
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'URL is required' }));
          return;
        }

        // Get video info first
        const videoInfo = await getVideoInfo(url);
        const downloadId = Date.now().toString();

        console.log('Starting download:', { downloadId, title: videoInfo.title });

        // Initialize download tracking
        activeDownloads.set(downloadId, {
          id: downloadId,
          title: videoInfo.title || 'Unknown Title',
          status: 'downloading',
          progress: 0,
          format: format.toUpperCase()
        });

        // Start download in background
        downloadAudio(url, format, quality, downloadId)
          .then((result) => {
            console.log('Download completed:', result.filename);
            activeDownloads.set(downloadId, {
              ...activeDownloads.get(downloadId),
              status: 'complete',
              progress: 100,
              filename: result.filename,
              publicPath: result.publicPath
            });
          })
          .catch((error) => {
            console.error('Download failed:', error);
            activeDownloads.set(downloadId, {
              ...activeDownloads.get(downloadId),
              status: 'error',
              error: error.message
            });
          });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          downloadId,
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          uploader: videoInfo.uploader
        }));

      } catch (error) {
        console.error('Download error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Download status endpoint
  if (req.url.startsWith('/api/download/status/') && req.method === 'GET') {
    const id = req.url.split('/').pop();
    const download = activeDownloads.get(id);
    
    if (!download) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Download not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(download));
    return;
  }

  // All downloads endpoint
  if (req.url === '/api/downloads' && req.method === 'GET') {
    const downloads = Array.from(activeDownloads.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(downloads));
    return;
  }

  // Scan audio directory
  if (req.url === '/api/audio/scan' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(audioDir).filter(f => 
        f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav')
      );

      const audioFiles = files.map(filename => ({
        filename,
        publicPath: `/audio/${filename}`,
        size: fs.statSync(path.join(audioDir, filename)).size,
        modified: fs.statSync(path.join(audioDir, filename)).mtime
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(audioFiles));
    } catch (error) {
      console.error('Scan error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Serve static files from public/audio
  if (req.url.startsWith('/audio/')) {
    const filePath = path.join(__dirname, 'public', req.url);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath);
      const contentType = ext === '.mp3' ? 'audio/mpeg' : 
                         ext === '.wav' ? 'audio/wav' : 'audio/mp4';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Content-Length': stat.size
      });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    } else {
      res.writeHead(404);
      res.end('File not found');
    }
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Server is running' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📡 Test endpoint: http://localhost:3001/api/test');
  console.log('🎵 Audio files served from: /audio/');
});
