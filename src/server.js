const app = require('./app');
const config = require('./config');
const { initDatabase } = require('./database');
const { seed } = require('./database/seed');

// Initialize database
console.log('[Database] Initializing SQLite database...');
initDatabase();

// Run initial seed if needed
seed();

// Start HTTP server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎮 ${config.app.name} server running!`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`⚡ Environment: ${config.server.env}`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed remaining connections. Exiting.');
    process.exit(0);
  });
});

module.exports = server;
