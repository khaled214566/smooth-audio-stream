# Folder Structure Documentation

## 📁 Complete Project Structure

```
smooth-audio-stream/
├── 📄 Package & Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── package-lock.json         # Dependency lock file
│   ├── vite.config.ts           # Vite build configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── README.md                # Project documentation
│
├── 📁 docs/                     # Documentation (this folder)
│   ├── 01-project-overview.md   # Project introduction and architecture
│   ├── 02-backend-server.md     # Backend server implementation
│   ├── 03-audio-context.md      # Audio state management
│   ├── 04-audio-library-service.md # Library management service
│   ├── 05-download-service.md   # Download API service
│   ├── 06-converter-page.md     # Download interface
│   ├── 07-library-page.md       # Music library interface
│   ├── 08-metadata-extraction.md # ID3 tag reading
│   └── 09-folder-structure.md   # This file
│
├── 📁 public/                   # Static assets
│   ├── 📁 audio/                # All audio files
│   │   ├── Warrior of the Mind.mp3
│   │   ├── Polyphemus.mp3
│   │   ├── Survive.mp3
│   │   ├── Open Arms.mp3
│   │   ├── horse-infant.mp3
│   │   ├── Full Speed Ahead.mp3
│   │   └── download_*.mp3       # Downloaded files
│   │
│   └── 📁 assets/               # Images and icons
│       ├── album-art-1.jpg
│       ├── album-art-2.jpg
│       ├── album-art-3.jpg
│       ├── album-art-4.jpg
│       ├── album-art-5.jpg
│       └── album-art-6.jpg
│
├── 📁 src/                      # Frontend source code
│   ├── 📄 App.tsx               # Main application component
│   ├── 📄 main.tsx              # Application entry point
│   ├── 📄 index.css             # Global styles
│   │
│   ├── 📁 components/           # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── 📁 context/              # React context providers
│   │   └── AudioContext.tsx     # Global audio state management
│   │
│   ├── 📁 lib/                  # Services and utilities
│   │   ├── downloadService.ts    # Backend API communication
│   │   ├── audioLibraryService.ts # Library management
│   │   └── readAudioTags.ts      # ID3 tag extraction
│   │
│   ├── 📁 pages/                # Main application pages
│   │   ├── Library.tsx          # Music library interface
│   │   ├── Converter.tsx         # Download interface
│   │   └── ...
│   │
│   └── 📁 data/                 # Static data and types
│       ├── demoData.ts          # Demo songs and types
│       └── ...
│
├── 📄 Backend Files
│   ├── simple-server.cjs        # Main backend server
│   ├── server.js               # Alternative Express server
│   ├── setup.js                # yt-dlp installation script
│   ├── start.js                # Server startup script
│   ├── test-server.js          # Server testing utility
│   └── test-setup.js           # Setup verification script
│
└── 📁 Development Files
    ├── 📁 .vite/                # Vite build cache
    ├── 📁 node_modules/         # Installed dependencies
    └── 📄 .gitignore            # Git ignore rules
```

## 🎯 Key Folder Purposes

### `/docs/` - Documentation
**Purpose**: Comprehensive documentation for every major component
**Contents**: Architecture guides, implementation details, workflow explanations
**Knowledge Needed**: Understanding of documentation structure and technical writing

### `/public/` - Static Assets
**Purpose**: Files served directly to the browser
**Contents**: Audio files, images, icons
**Knowledge Needed**: Static file serving, file paths, web assets

### `/src/` - Frontend Source Code
**Purpose**: All React application code
**Contents**: Components, pages, services, utilities
**Knowledge Needed**: React, TypeScript, modern web development

### Backend Files (Root Level)
**Purpose**: Node.js server and utilities
**Contents**: HTTP server, yt-dlp integration, setup scripts
**Knowledge Needed**: Node.js, HTTP servers, child processes

## 🔄 Data Flow Between Folders

```
User Input (src/pages/Converter.tsx)
    ↓
Download Service (src/lib/downloadService.ts)
    ↓
Backend API (simple-server.cjs)
    ↓
yt-dlp Process
    ↓
File System (public/audio/)
    ↓
Library Service (src/lib/audioLibraryService.ts)
    ↓
Audio Context (src/context/AudioContext.tsx)
    ↓
UI Update (src/pages/Library.tsx)
```

## 🛠️ Development Workflow

### 1. Frontend Development
```
src/pages/ → Components → Context → Services → Backend API
```

### 2. Backend Development
```
simple-server.cjs → yt-dlp → File System → Static Serving
```

### 3. Audio Processing
```
public/audio/ → Library Service → Metadata Extraction → Context → UI
```

## 📁 File Naming Conventions

### React Components
- **PascalCase**: `AudioContext.tsx`, `LibraryPage.tsx`
- **Descriptive Names**: `downloadService.ts`, `readAudioTags.ts`

### Audio Files
- **Existing Songs**: Original filenames with spaces
- **Downloaded Songs**: `download_{timestamp}.mp3`

### Documentation
- **Numbered Prefix**: `01-project-overview.md`, `02-backend-server.md`
- **Descriptive Names**: `metadata-extraction.md`, `folder-structure.md`

### Configuration Files
- **Standard Names**: `package.json`, `vite.config.ts`, `tsconfig.json`

## 🗂️ Import/Export Patterns

### Frontend Imports
```typescript
// Component imports
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DownloadService } from "@/lib/downloadService";

// Context imports
import { useAudio } from "@/context/AudioContext";
```

### Backend Imports
```javascript
// Node.js built-in modules
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

// No external dependencies (simple-server.cjs)
```

## 🔧 Configuration Files

### `package.json`
- **Dependencies**: React, TypeScript, UI libraries
- **Scripts**: Development, build, server commands
- **Type**: "module" (ES modules)

### `vite.config.ts`
- **Development Server**: Port 5173
- **Build Configuration**: React, TypeScript
- **Path Aliases**: @/ for src/ directory

### `tsconfig.json`
- **Compiler Options**: Strict TypeScript settings
- **Path Mapping**: Import aliases
- **Target**: Modern browsers

## 🚀 Build and Deployment

### Development Build
```bash
npm run dev        # Frontend dev server (port 5173)
npm run server     # Backend server (port 3001)
```

### Production Build
```bash
npm run build      # Build frontend for production
npm run preview    # Preview production build
```

### Distribution Structure
```
dist/                     # Built frontend files
├── assets/              # Static assets
├── index.html           # Main HTML file
└── ...                  # Other build outputs
```

## 🐛 Common Folder Issues

### 1. Import Path Errors
**Problem**: Cannot find module imports
**Solution**: Check path aliases in vite.config.ts

### 2. Static File 404s
**Problem**: Audio files not loading
**Solution**: Verify files in public/audio/ directory

### 3. Build Failures
**Problem**: TypeScript errors during build
**Solution**: Check tsconfig.json and import paths

### 4. Server Connection Issues
**Problem**: Frontend cannot reach backend
**Solution**: Check CORS and port configurations

## 🔮 Future Folder Structure

### Potential Additions
```
├── 📁 tests/                 # Unit and integration tests
├── 📁 scripts/               # Build and deployment scripts
├── 📁 config/                # Environment configurations
├── 📁 utils/                 # Shared utilities
└── 📁 types/                 # TypeScript type definitions
```

### Reorganization
- **Feature-based structure**: Group by feature rather than type
- **Microservices**: Separate backend into multiple services
- **Monorepo**: Multiple packages in single repository

## 📚 Folder Best Practices

### 1. Consistent Structure
- Keep similar files together
- Use descriptive names
- Follow established conventions

### 2. Import Organization
- Group imports by type (React, components, utilities)
- Use path aliases for cleaner imports
- Avoid circular dependencies

### 3. Documentation
- Document folder purposes
- Explain complex relationships
- Provide usage examples

### 4. Scalability
- Design for growth
- Avoid deep nesting
- Keep related files accessible
