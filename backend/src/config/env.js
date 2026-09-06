import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..', '..');

const resolveFromRoot = (value, fallback) =>
  path.resolve(rootDir, value || fallback);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  rootDir,
  databasePath: resolveFromRoot(process.env.DATABASE_PATH, 'data/job-tracker.db'),
  uploadsDir: resolveFromRoot(process.env.UPLOADS_DIR, 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
  // Allow any localhost/LAN origin in dev so the phone can hit the API too.
  corsOrigin: process.env.CORS_ORIGIN || true,
};

export const isProd = env.nodeEnv === 'production';
