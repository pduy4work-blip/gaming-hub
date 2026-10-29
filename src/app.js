const express = require('express');
const path = require('node:path');
const cookieParser = require('cookie-parser');
const config = require('./config');
const routes = require('./routes');
const { apiRateLimiter } = require('./middleware/rateLimit');

const app = express();

// Security headers (lightweight helmet-like headers)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(config.server.sessionSecret));

// Rate limit for APIs
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api', routes);

// Serve static frontend files
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Route shortcuts for clean URLs
app.get('/post/:slug', (req, res) => {
  res.sendFile(path.join(publicDir, 'post.html'));
});
app.get('/games/:slug', (req, res) => {
  res.sendFile(path.join(publicDir, 'games.html'));
});
app.get('/users/:username', (req, res) => {
  res.sendFile(path.join(publicDir, 'profile.html'));
});

// Fallback 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint API không tồn tại.',
    code: 'NOT_FOUND'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  
  if (err.message && err.message.includes('Chỉ chấp nhận các định dạng ảnh')) {
    return res.status(400).json({ success: false, error: err.message, code: 'INVALID_FILE_TYPE' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'Kích thước tập tin vượt quá giới hạn cho phép (5MB).', code: 'FILE_TOO_LARGE' });
  }

  res.status(500).json({
    success: false,
    error: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

module.exports = app;
