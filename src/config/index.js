const path = require('node:path');

const config = {
  // Brand Configuration - edit in this single place to change brand name across the site
  app: {
    name: 'GameHub Community',
    shortName: 'GameHub',
    tagline: 'The Modern Gaming Forum & Esports Community',
    description: 'Nền tảng thảo luận, chia sẻ kinh nghiệm và kết nối game thủ hiện đại.',
    version: '1.0.0',
    contactEmail: 'contact@gamehub.community',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET || 'gamehub-super-secret-session-key-2026',
    cookieName: 'gamehub_session',
    tokenExpiresInHours: 72,
  },
  database: {
    filename: process.env.DB_FILE || path.join(__dirname, '../../gamehub.db'),
  },
  upload: {
    uploadDir: path.join(__dirname, '../../public/assets/uploads'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 50,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 300,
    authMaxRequests: 30, // stricter for login/register
  }
};

module.exports = config;
