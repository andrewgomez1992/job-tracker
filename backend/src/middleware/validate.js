import { ApiError } from '../lib/ApiError.js';

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed
 * result, so controllers only ever see clean, coerced data.
 */
export const validate = (schemas) => (req, _res, next) => {
  for (const key of ['body', 'query', 'params']) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || key,
        message: issue.message,
      }));
      return next(ApiError.unprocessable('Validation failed', details));
    }
    // req.query is a getter in Express 5 - define instead of assign.
    Object.defineProperty(req, key, { value: result.data, writable: true, configurable: true });
  }
  return next();
};
