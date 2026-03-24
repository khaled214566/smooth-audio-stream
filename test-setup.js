// Test script to verify the setup
console.log('Testing Smooth Audio Stream setup...\n');

// Test 1: Check if required dependencies are installed
const testDependencies = () => {
  console.log('📦 Checking dependencies...');
  try {
    require('express');
    require('cors');
    require('multer');
    console.log('✅ Backend dependencies installed');
  } catch (error) {
    console.log('❌ Missing backend dependencies. Run: npm install express cors multer');
    return false;
  }

  try {
    // Check if yt-dlp is available
    const { spawn } = require('child_process');
    const ytDlp = spawn('yt-dlp', ['--version'], { stdio: 'pipe' });
    
    ytDlp.on('close', (code) => {
      if (code === 0) {
        console.log('✅ yt-dlp is available');
      } else {
        console.log('❌ yt-dlp not working. Run: npm run setup');
      }
    });

    ytDlp.on('error', () => {
      console.log('❌ yt-dlp not found. Run: npm run setup');
    });
  } catch (error) {
    console.log('❌ Error checking yt-dlp');
  }

  return true;
};

// Test 2: Check if directories exist
const testDirectories = () => {
  console.log('\n📁 Checking directories...');
  const fs = require('fs');
  const path = require('path');

  const audioDir = path.join(__dirname, 'public', 'audio');
  if (fs.existsSync(audioDir)) {
    console.log('✅ public/audio directory exists');
  } else {
    console.log('⚠️  public/audio directory missing (will be created automatically)');
  }

  const srcDir = path.join(__dirname, 'src');
  if (fs.existsSync(srcDir)) {
    console.log('✅ src directory exists');
  } else {
    console.log('❌ src directory missing');
  }
};

// Test 3: Check if key files exist
const testFiles = () => {
  console.log('\n📄 Checking key files...');
  const fs = require('fs');
  const path = require('path');

  const files = [
    'server.js',
    'src/lib/downloadService.ts',
    'src/lib/audioLibraryService.ts',
    'src/pages/Converter.tsx',
    'src/context/AudioContext.tsx'
  ];

  files.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
};

// Run all tests
testDependencies();
testDirectories();
testFiles();

console.log('\n🚀 Setup test complete!');
console.log('\nTo start the application:');
console.log('1. Terminal 1: npm run server');
console.log('2. Terminal 2: npm run dev');
console.log('3. Visit: http://localhost:5173');
