# Smooth Audio Stream Documentation

## 📚 Documentation Overview

This comprehensive documentation explains every important file and folder in the Smooth Audio Stream project. Each document provides detailed explanations of the purpose, architecture, implementation details, and prerequisites for understanding that component.

## 📖 Documentation Index

### 🚀 Getting Started
1. **[01-project-overview.md](./01-project-overview.md)**
   - Project introduction and goals
   - Architecture overview
   - Core workflow explanation
   - Technology stack
   - Prerequisites and required knowledge

### 🔧 Backend Components
2. **[02-backend-server.md](./02-backend-server.md)**
   - `simple-server.cjs` implementation
   - HTTP API endpoints
   - yt-dlp integration
   - File serving and management

### 🎵 Frontend Core
3. **[03-audio-context.md](./03-audio-context.md)**
   - `AudioContext.tsx` state management
   - Global audio state
   - Playback controls
   - Library integration

4. **[04-audio-library-service.md](./04-audio-library-service.md)**
   - `audioLibraryService.ts` implementation
   - Dynamic library management
   - File scanning and metadata
   - Subscription pattern

5. **[05-download-service.md](./05-download-service.md)**
   - `downloadService.ts` API communication
   - Backend integration
   - Progress polling
   - Error handling

### 🖥️ User Interface
6. **[06-converter-page.md](./06-converter-page.md)**
   - `Converter.tsx` download interface
   - URL input and controls
   - Progress tracking
   - User interactions

7. **[07-library-page.md](./07-library-page.md)**
   - `Library.tsx` music browser
   - Search and filtering
   - Multiple view modes
   - Song management

### 🔍 Technical Components
8. **[08-metadata-extraction.md](./08-metadata-extraction.md)**
   - `readAudioTags.ts` implementation
   - ID3 tag reading
   - Artwork extraction
   - Blob URL management

9. **[09-folder-structure.md](./09-folder-structure.md)**
   - Complete project structure
   - File organization
   - Import patterns
   - Development workflow

## 🎯 How to Use This Documentation

### For New Developers
1. Start with **Project Overview** to understand the big picture
2. Read **Folder Structure** to understand the codebase organization
3. Study **Backend Server** to understand the download system
4. Review **Audio Context** to understand state management
5. Explore **Pages** to understand the user interface

### For Feature Development
1. Identify the relevant components for your feature
2. Read the corresponding documentation files
3. Understand the data flow and interactions
4. Follow the established patterns and conventions

### For Debugging and Maintenance
1. Use the specific component documentation for troubleshooting
2. Refer to the "Common Issues" sections in each file
3. Check the "Debugging Tools" for diagnostic helpers
4. Review the "Prerequisites" to ensure you have the right knowledge

## 🔄 Component Relationships

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Converter     │    │  Download       │    │   Backend       │
│     Page        │───▶│   Service       │───▶│    Server       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │  Audio Library  │              │
         │              │    Service      │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Library      │    │  Audio Context  │    │  File System   │
│     Page        │◀───│   (State Mgmt)  │◀───│  (Audio Files) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Prerequisites by Document

### Basic Requirements (All Documents)
- **JavaScript/TypeScript**: Language fundamentals
- **React**: Components, hooks, context
- **Node.js**: Runtime environment
- **Git**: Version control

### Specialized Requirements
- **Backend Server**: HTTP APIs, child processes, yt-dlp
- **Audio Context**: State management, audio APIs
- **Services**: Async programming, error handling
- **Pages**: UI patterns, event handling
- **Metadata**: File formats, binary data
- **Structure**: Project organization, build tools

## 🐛 Common Issues Across Components

### 1. Server Connection
- **Problem**: Frontend cannot reach backend
- **Solution**: Check ports, CORS, server status
- **Documents**: Backend Server, Download Service

### 2. File Loading
- **Problem**: Audio files not loading
- **Solution**: Check file paths, permissions, server static serving
- **Documents**: Backend Server, Folder Structure

### 3. State Management
- **Problem**: UI not updating with data changes
- **Solution**: Check context subscriptions, state updates
- **Documents**: Audio Context, Library Service

### 4. Memory Leaks
- **Problem**: Browser memory usage increasing
- **Solution**: Check blob URLs, event listeners, subscriptions
- **Documents**: Audio Context, Metadata Extraction

## 🚀 Development Workflow

### 1. Setup
```bash
# Install dependencies
npm install

# Setup yt-dlp
npm run setup

# Start servers
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

### 2. Development
- **Frontend**: Edit files in `src/` directory
- **Backend**: Edit `simple-server.cjs`
- **Testing**: Use browser dev tools and server logs
- **Documentation**: Update relevant docs when making changes

### 3. Debugging
- **Frontend**: Browser console, React dev tools
- **Backend**: Server console logs, network tab
- **Audio**: Check file paths, metadata extraction
- **Integration**: Test full download-to-playback workflow

## 📚 Additional Resources

### External Documentation
- **React**: [react.dev](https://react.dev)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org)
- **yt-dlp**: [github.com/yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **jsmediatags**: [github.com/43081j/jsmediatags](https://github.com/43081j/jsmediatags)

### Related Technologies
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library

## 🔄 Keeping Documentation Updated

When making changes to the codebase:

1. **Update Relevant Docs**: Modify the specific documentation files
2. **Check Dependencies**: Update related documentation if needed
3. **Verify Examples**: Ensure code examples still work
4. **Review Prerequisites**: Update knowledge requirements if needed
5. **Test Workflows**: Verify documented workflows still function

## 📞 Getting Help

If you need help understanding the codebase:

1. **Read the relevant documentation** first
2. **Check the "Common Issues" sections** in each document
3. **Use the debugging tools** provided in each document
4. **Refer to the prerequisites** to ensure you have the right knowledge
5. **Follow the component relationships** to understand data flow

---

**Last Updated**: This documentation covers the complete Smooth Audio Stream application as implemented with real yt-dlp downloads, dynamic library management, and modern React architecture.
