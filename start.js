const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Smooth Audio Stream...\n');

// Function to start a process and handle output
function startProcess(name, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Starting ${name}...`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('error', (error) => {
      console.error(`❌ Failed to start ${name}:`, error.message);
      reject(error);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.log(`⚠️ ${name} exited with code ${code}`);
      } else {
        console.log(`✅ ${name} started successfully`);
      }
    });

    // Give it a moment to start
    setTimeout(() => {
      resolve(process);
    }, 2000);
  });
}

// Main function
async function startAll() {
  try {
    // Start backend server
    console.log('🔧 Starting backend server...');
    const backend = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    backend.on('error', (error) => {
      console.error('❌ Failed to start backend server:', error.message);
      console.log('\n💡 Make sure you have installed dependencies:');
      console.log('   npm install express cors multer node-yt-dlp');
      process.exit(1);
    });

    // Wait a moment for backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start frontend
    console.log('🎨 Starting frontend development server...');
    const frontend = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });

    frontend.on('error', (error) => {
      console.error('❌ Failed to start frontend:', error.message);
      console.log('\n💡 Make sure you have installed dependencies:');
      console.log('   npm install');
      process.exit(1);
    });

    console.log('\n✨ Both servers are starting!');
    console.log('📱 Frontend will be available at: http://localhost:5173');
    console.log('🔧 Backend API is running at: http://localhost:3001');
    console.log('\n💡 Press Ctrl+C to stop both servers');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  startAll();
}

module.exports = { startAll };
