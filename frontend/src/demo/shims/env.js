/** Browser stand-in for backend/src/config/env.js. */
export const env = {
  nodeEnv: 'production',
  demoMode: true,
  port: 0,
  rootDir: '/',
  databasePath: ':memory:',
  uploadsDir: '/uploads',
  maxUploadBytes: 10 * 1024 * 1024,
  corsOrigin: true,
};
export const isProd = true;
