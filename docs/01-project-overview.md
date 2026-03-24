# Smooth Audio Stream - Project Overview

## 🎵 What This Project Is

A modern, full-featured audio streaming application built with React that allows users to:
- Stream and play music from a local library
- Download audio from YouTube and 1000+ platforms using yt-dlp
- Automatically extract metadata and artwork from downloaded files
- Manage a dynamic music library with search and filtering

## 🏗️ Architecture Overview

```
Frontend (React + TypeScript)
├── Components (UI elements)
├── Pages (Library, Converter, etc.)
├── Context (Audio state management)
├── Services (API calls, library management)
└── Utils (helpers, metadata extraction)

Backend (Node.js + yt-dlp)
├── HTTP Server (serves API and static files)
├── Download Manager (yt-dlp integration)
├── File Scanner (audio directory monitoring)
└── Static File Server (serves MP3 files)
```

## 📁 Key Folders & Their Purpose

### `/src/` - Frontend Source Code
- **Components**: Reusable UI components (buttons, inputs, etc.)
- **Pages**: Main application pages (Library, Converter, etc.)
- **Context**: Global state management (AudioContext)
- **Lib**: Services and utilities (downloadService, audioLibraryService)
- **Data**: Static data and types (demoData, interfaces)

### `/public/` - Static Assets
- **Audio**: All MP3 files (existing + downloaded)
- **Assets**: Images, icons, album artwork

### `/docs/` - This Documentation
- Detailed explanations of each major component
- Workflow guides and architecture notes

## 🔄 Core Workflow

1. **Library Loading**: App scans `public/audio/` for existing files
2. **Metadata Extraction**: Reads ID3 tags from audio files
3. **Download Request**: User submits URL → Backend calls yt-dlp
4. **File Processing**: yt-dlp downloads and embeds metadata
5. **Library Update**: New file automatically appears in library
6. **Audio Playback**: User can play any song from library

## 🛠️ Technologies Used

### Frontend
- **React 18**: Component-based UI framework
- **TypeScript**: Type safety and better development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations and transitions
- **Radix UI**: Accessible component primitives
- **React Query**: Data fetching and caching

### Backend
- **Node.js**: JavaScript runtime
- **yt-dlp**: YouTube/media downloader
- **HTTP Module**: Built-in web server
- **Child Process**: Execute yt-dlp commands

### Audio Processing
- **jsmediatags**: ID3 tag extraction
- **HTML5 Audio**: Browser audio playback
- **Blob URLs**: In-memory artwork handling

## 📋 Prerequisites for Understanding

To fully understand this codebase, you should know:

### Required Knowledge
- **React Hooks**: useState, useEffect, useContext
- **TypeScript**: Interfaces, generics, type annotations
- **HTTP APIs**: Fetch, CORS, REST principles
- **File System**: Path operations, directory scanning
- **Audio Formats**: MP3, M4A, WAV, ID3 tags
- **Node.js**: Streams, child processes, file operations

### Helpful Background
- **yt-dlp**: Command-line YouTube downloader
- **ID3 Tags**: Metadata embedded in audio files
- **Blob URLs**: Client-side file references
- **CORS**: Cross-origin resource sharing
- **Static File Serving**: HTTP file serving basics

## 🎯 Key Design Patterns

### 1. **Service Pattern**
- Centralized API calls in service classes
- Singleton pattern for library management
- Separation of concerns

### 2. **Context Pattern**
- Global audio state in React Context
- Provider pattern for state distribution
- Custom hooks for component access

### 3. **Polling Pattern**
- Real-time download progress via HTTP polling
- Status updates every second
- Graceful error handling

### 4. **File Watcher Pattern**
- Scan directory for new files
- Automatic metadata extraction
- Dynamic library updates

## 🚀 Getting Started Workflow

1. **Install Dependencies**: `npm install`
2. **Setup yt-dlp**: `npm run setup`
3. **Start Backend**: `npm run server` (port 3001)
4. **Start Frontend**: `npm run dev` (port 5173)
5. **Use Application**: Visit `http://localhost:5173`

## 📊 Data Flow

```
User Action → Frontend → Backend → yt-dlp → File System → Frontend Update
     ↓           ↓         ↓        ↓         ↓            ↓
  Click URL → API Call → Download → Save MP3 → Scan Dir → Update UI
```

## 🐛 Common Issues & Solutions

1. **yt-dlp Not Found**: Run `npm run setup`
2. **CORS Errors**: Ensure backend is running on port 3001
3. **Files Not Loading**: Check `public/audio/` directory exists
4. **Metadata Missing**: Verify files have ID3 tags
5. **Download Fails**: Check URL format and internet connection

## 🔮 Future Enhancements

- Playlist management
- Cloud storage integration
- Real-time sync across devices
- Advanced audio processing
- User accounts and preferences
