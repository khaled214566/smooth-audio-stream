const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use('/audio', express.static('public/audio'));

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ensure public/audio directory exists
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log('Created audio directory:', audioDir);
}

// Store active downloads
const activeDownloads = new Map();

// Helper function to sanitize filename
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9\s\-_\.]/gi, '').trim();
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

// Routes
// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    audioDir: audioDir,
    audioDirExists: fs.existsSync(audioDir)
  });
});

app.post('/api/download', async (req, res) => {
  try {
    console.log('Download request:', req.body);
    const { url, format = 'mp3', quality = '320' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
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

    res.json({
      downloadId,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
      uploader: videoInfo.uploader
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download/status/:id', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  res.json(download);
});

app.get('/api/downloads', (req, res) => {
  const downloads = Array.from(activeDownloads.values());
  res.json(downloads);
});

// Scan audio directory and return file list with metadata
app.get('/api/audio/scan', async (req, res) => {
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

    res.json(audioFiles);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
