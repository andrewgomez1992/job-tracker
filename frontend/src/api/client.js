/**
 * The only place that talks to the network. Everything else goes through the
 * query hooks, which go through here.
 */
const BASE = '/api';

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** Map a 422 into { fieldName: message } for inline form errors. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

const buildQuery = (params) => {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

async function request(method, path, { body, params, signal } = {}) {
  const isFormData = body instanceof FormData;

  const response = await fetch(BASE + path + buildQuery(params), {
    method,
    signal,
    headers: body && !isFormData ? { 'content-type': 'application/json' } : undefined,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new ApiError('Cannot reach the server. Is the API running?', { status: 0 });
  });

  if (response.status === 204) return null;

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed (${response.status})`, {
      status: response.status,
      details: payload?.error?.details,
    });
  }

  return payload?.data ?? null;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};
