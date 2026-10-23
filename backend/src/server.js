import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { logger } from './lib/logger.js';

runMigrations();

// Demo mode seeds its own database the first time it starts.
if (env.demoMode) {
  const { db } = await import('./db/index.js');
  if (db.prepare('SELECT COUNT(*) AS n FROM applications').get().n === 0) {
    const { seedDatabase } = await import('./db/seed.js');
    seedDatabase();
  }
  logger.warn('DEMO MODE: using fake sample data (backend/src/config/demo.js)');
}

const app = createApp();

// 0.0.0.0 so your phone on the same Wi-Fi can reach the API.
const server = app.listen(env.port, '0.0.0.0', () => {
  logger.ready(`API listening on http://localhost:${env.port}/api`);
  logger.info(`database: ${env.databasePath}`);
});

const shutdown = (signal) => () => {
  logger.warn(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
