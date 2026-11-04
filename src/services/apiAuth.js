import { getBackendUrl } from '../config/backend.js';
// Attach the logged-in credential only to our CRM API origin.
export function installApiAuth() {
  const backend = new URL(getBackendUrl());
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options = {}) => {
    const url = new URL(input instanceof Request ? input.url : input, window.location.href);
    if (url.origin === backend.origin && url.pathname.startsWith('/api/')) {
      const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
      try {
        const token = JSON.parse(localStorage.getItem('crm-auth-user'))?.token;
        if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      } catch {}
      return originalFetch(input, { ...options, headers });
    }
    return originalFetch(input, options);
  };
}
