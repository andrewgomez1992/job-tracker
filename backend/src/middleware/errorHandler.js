import { ApiError } from '../lib/ApiError.js';
import { logger } from '../lib/logger.js';
import { isProd } from '../config/env.js';

const SQLITE_MESSAGES = {
  SQLITE_CONSTRAINT_UNIQUE: 'That record already exists.',
  SQLITE_CONSTRAINT_FOREIGNKEY: 'A referenced record does not exist.',
  SQLITE_CONSTRAINT_CHECK: 'A field was set to a value the database does not allow.',
  SQLITE_CONSTRAINT_NOTNULL: 'A required field was missing.',
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { message: err.message, details: err.details ?? undefined },
    });
  }

  if (err?.code?.startsWith?.('SQLITE_CONSTRAINT')) {
    return res.status(409).json({
      error: { message: SQLITE_MESSAGES[err.code] || 'That change conflicts with existing data.' },
    });
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { message: 'That file is too large.' } });
  }

  logger.error(err);
  return res.status(500).json({
    error: {
      message: 'Something went wrong on the server.',
      ...(isProd ? {} : { detail: err?.message, stack: err?.stack }),
    },
  });
};
