console.log('Testing dependencies...');

try {
  const express = require('express');
  console.log('✅ Express found:', express.version);
} catch (e) {
  console.log('❌ Express not found:', e.message);
}

try {
  const cors = require('cors');
  console.log('✅ CORS found');
} catch (e) {
  console.log('❌ CORS not found:', e.message);
}

try {
  const multer = require('multer');
  console.log('✅ Multer found');
} catch (e) {
  console.log('❌ Multer not found:', e.message);
}
