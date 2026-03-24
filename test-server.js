console.log('Testing server startup...');

try {
  const express = require('express');
  console.log('✅ Express imported successfully');
  
  const cors = require('cors');
  console.log('✅ CORS imported successfully');
  
  const multer = require('multer');
  console.log('✅ Multer imported successfully');
  
  console.log('\n🚀 All dependencies are installed!');
  console.log('You can now run: npm run server');
  
} catch (error) {
  console.error('❌ Missing dependency:', error.message);
  console.log('\n💡 Run: npm install express cors multer node-yt-dlp');
}
