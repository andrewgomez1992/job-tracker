import { logger } from '../lib/logger.js';

export const requestLogger = (req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const colour = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    logger.info(`${colour}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} \x1b[90m${ms.toFixed(1)}ms\x1b[0m`);
  });
  next();
};
