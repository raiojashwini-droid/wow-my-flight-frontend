export const LIVE_BACKEND_URL = 'https://wow-my-flight-backend-production-2ef6.up.railway.app';

// HTTP requests and sockets must use the same backend, including on localhost.
export function getBackendUrl(env = import.meta.env ?? {}) {
  const configured = env.VITE_BACKEND_URL?.trim() || env.VITE_API_URL?.trim();
  return (configured || LIVE_BACKEND_URL).replace(/\/+$/, '');
}
