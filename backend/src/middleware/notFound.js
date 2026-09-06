import { ApiError } from '../lib/ApiError.js';

export const notFound = (req, _res, next) =>
  next(new ApiError(404, `No route for ${req.method} ${req.originalUrl}`));
