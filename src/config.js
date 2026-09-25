/** Backend origin. Set VITE_API_ORIGIN before starting or building the app. */
export const API_ORIGIN = (import.meta.env?.VITE_API_ORIGIN || 'http://localhost:8080').replace(/\/+$/, '');

/** Base URL for versioned API endpoints. /health is outside this prefix. */
export const API_URL = `${API_ORIGIN}/api/v1`;

/** Shared fetch options for cookie-based cross-origin sessions. */
export const API_REQUEST_OPTIONS = Object.freeze({ credentials: 'include' });
