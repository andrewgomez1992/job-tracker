/**
 * Errors the API is willing to describe to the client.
 * Anything thrown that is not an ApiError becomes a generic 500.
 */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found`);
  }

  static conflict(message = 'Conflict', details) {
    return new ApiError(409, message, details);
  }

  static unprocessable(message = 'Unprocessable', details) {
    return new ApiError(422, message, details);
  }
}
