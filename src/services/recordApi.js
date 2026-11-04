import { getBackendUrl } from '../config/backend.js';

export async function saveRecord(endpoint, method, body, cacheKey, deletedId) {
  const token = JSON.parse(localStorage.getItem('crm-auth-user') || 'null')?.token;
  const response = await fetch(getBackendUrl() + endpoint, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) throw new Error(result.error || result.message || 'The server could not save this change.');
  if (cacheKey) {
    const current = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const rows = Array.isArray(current) ? current : [];
    if (deletedId) localStorage.setItem(cacheKey, JSON.stringify(rows.filter(row => row.id !== deletedId)));
    else if (result.data?.id) localStorage.setItem(cacheKey, JSON.stringify([result.data, ...rows.filter(row => row.id !== result.data.id)]));
  }
  return deletedId || result.data || result;
}
