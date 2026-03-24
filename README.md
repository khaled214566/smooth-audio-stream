# Smooth Audio Stream

A modern React-based audio streaming application with yt-dlp integration for downloading music from YouTube and other platforms.

## Features

- 🎵 **Audio Streaming**: Full-featured audio player with queue, shuffle, and repeat modes
- 📥 **Music Downloads**: Download audio from YouTube, SoundCloud, and other platforms using yt-dlp
- 🏷️ **Metadata Extraction**: Automatic ID3 tag reading and artwork extraction
- 📚 **Dynamic Library**: Automatically adds downloaded songs to your music library
- 🎨 **Modern UI**: Beautiful interface built with React, TypeScript, and Tailwind CSS
- 🔍 **Search & Filter**: Search through your library by song title, artist, or album

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python 3.6+ (for yt-dlp)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smooth-audio-stream
```

2. Install dependencies:
```bash
npm install
```

3. Set up yt-dlp:
```bash
npm run setup
```

This will automatically install yt-dlp. If the setup fails, you can install it manually:

**Option 1: Using pip**
```bash
pip install yt-dlp
```

**Option 2: Manual download (Windows)**
1. Download `yt-dlp.exe` from [GitHub releases](https://github.com/yt-dlp/yt-dlp/releases)
2. Place it in your system PATH or in the project directory

### Running the Application

The application requires two servers to run:

1. **Backend Server** (for yt-dlp operations):
```bash
npm run server
```

2. **Frontend Development Server** (in a new terminal):
```bash
npm run dev
```

Visit `http://localhost:5173` to use the application.

## Usage

### Downloading Music

1. Navigate to the **Media Converter** page
2. Paste a YouTube URL (or other supported platform URL)
3. Select your preferred format (MP3, M4A, WAV) and quality
4. Click "Download"
5. The song will automatically be added to your library when complete

### Managing Your Library

- Use the **Library** page to browse your music collection
- Songs are automatically organized by folders, albums, and artists
- Use the search bar to find specific songs
- Click on any song to start playing

### Audio Player Controls

- **Play/Pause**: Control playback
- **Next/Previous**: Navigate through your queue
- **Shuffle**: Randomize playback order
- **Repeat**: Toggle repeat modes (off, all, one)
- **Volume**: Adjust playback volume

## File Structure

```
smooth-audio-stream/
├── public/
│   └── audio/              # Downloaded audio files
├── src/
│   ├── components/         # React components
│   ├── context/           # Audio context and state management
│   ├── lib/               # Utility services
│   │   ├── downloadService.ts     # API service for downloads
│   │   ├── audioLibraryService.ts # Library management
│   │   └── readAudioTags.ts       # Metadata extraction
│   └── pages/             # Page components
├── server.js              # Express backend server
└── setup.js              # yt-dlp setup script
```

## API Endpoints

### Backend Server (localhost:3001)

- `POST /api/download` - Start a new download
- `GET /api/download/status/:id` - Get download status
- `GET /api/downloads` - List all downloads
- `GET /api/audio/scan` - Scan audio directory

## Supported Platforms

yt-dlp supports hundreds of platforms including:
- YouTube
- SoundCloud
- Bandcamp
- Vimeo
- And many more...

## Troubleshooting

### yt-dlp Issues

If downloads fail:

1. Ensure yt-dlp is properly installed: `yt-dlp --version`
2. Update yt-dlp: `pip install --upgrade yt-dlp`
3. Check if the URL is supported

### Server Issues

If the backend server fails to start:

1. Check if port 3001 is available
2. Ensure all dependencies are installed
3. Check the console for error messages

### Audio Playback Issues

If songs don't play:

1. Check that the audio files exist in `public/audio/`
2. Ensure the backend server is running
3. Check browser console for errors

## Development

### Adding New Features

1. Frontend components go in `src/components/`
2. New pages go in `src/pages/`
3. Utility functions go in `src/lib/`
4. API endpoints are added to `server.js`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
