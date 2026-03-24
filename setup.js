const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up yt-dlp for Smooth Audio Stream...');

// Check if yt-dlp is already installed
const checkYtDlp = () => {
  return new Promise((resolve) => {
    const ytDlp = spawn('yt-dlp', ['--version']);
    ytDlp.on('close', (code) => {
      resolve(code === 0);
    });
    ytDlp.on('error', () => {
      resolve(false);
    });
  });
};

// Install yt-dlp using pip
const installYtDlp = () => {
  return new Promise((resolve, reject) => {
    console.log('Installing yt-dlp using pip...');
    const install = spawn('pip', ['install', 'yt-dlp']);
    
    install.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    install.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ yt-dlp installed successfully!');
        resolve();
      } else {
        console.error('❌ Failed to install yt-dlp using pip');
        reject(new Error('pip install failed'));
      }
    });
  });
};

// Alternative: Download yt-dlp directly
const downloadYtDlp = () => {
  return new Promise((resolve, reject) => {
    console.log('Downloading yt-dlp directly...');
    const https = require('https');
    const file = fs.createWriteStream('yt-dlp.exe');
    
    https.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ yt-dlp downloaded successfully!');
        
        // Make it executable (on Windows this just ensures it's in the right place)
        fs.chmodSync('yt-dlp.exe', '755');
        
        // Add to PATH if needed
        const currentDir = process.cwd();
        console.log(`📍 yt-dlp.exe saved to: ${currentDir}\\yt-dlp.exe`);
        console.log('⚠️  Make sure this directory is in your PATH or run the server from this directory');
        
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink('yt-dlp.exe', () => {}); // Delete the file on error
      reject(err);
    });
  });
};

// Main setup function
const setup = async () => {
  try {
    // Check if yt-dlp is already installed
    const isInstalled = await checkYtDlp();
    if (isInstalled) {
      console.log('✅ yt-dlp is already installed!');
      return;
    }

    // Try to install with pip first
    try {
      await installYtDlp();
    } catch (pipError) {
      console.log('pip installation failed, trying direct download...');
      await downloadYtDlp();
    }

    // Verify installation
    const isNowInstalled = await checkYtDlp();
    if (isNowInstalled) {
      console.log('🎉 Setup complete! yt-dlp is ready to use.');
    } else {
      console.log('❌ Setup incomplete. Please install yt-dlp manually:');
      console.log('1. Visit https://github.com/yt-dlp/yt-dlp/releases');
      console.log('2. Download yt-dlp.exe for Windows');
      console.log('3. Place it in your PATH or in the project directory');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setup();
