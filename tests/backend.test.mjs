import test from 'node:test';
import assert from 'node:assert/strict';
import { getBackendUrl, LIVE_BACKEND_URL } from '../src/config/backend.js';

test('localhost frontend defaults to the live backend when env values are absent', () => {
  globalThis.window = { location: { hostname: 'localhost' } };
  try {
    assert.equal(getBackendUrl({}), LIVE_BACKEND_URL);
    assert.equal(getBackendUrl({ VITE_BACKEND_URL: ' ', VITE_API_URL: '' }), LIVE_BACKEND_URL);
  } finally {
    delete globalThis.window;
  }
});

test('HTTP and socket clients use the same normalized backend setting', () => {
  assert.equal(getBackendUrl({ VITE_BACKEND_URL: ' https://crm.example.test/// ', VITE_API_URL: 'https://old.example.test' }), 'https://crm.example.test');
  assert.equal(getBackendUrl({ VITE_API_URL: 'https://crm.example.test/' }), 'https://crm.example.test');
});

test('an unavailable flight search never retries against a local backend', async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  const { flightContentService } = await import('../src/services/flightContentService.js');
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    calls.push(url);
    return { ok: false, json: async () => ({ error: 'Supplier unavailable' }) };
  };
  try {
    const result = await flightContentService.searchFlightsAcrossAdapters({ origin: 'DEL', destination: 'LHR' });
    assert.equal(result.error, 'Supplier unavailable');
    assert.deepEqual(calls, [LIVE_BACKEND_URL + '/api/travelopro/flights/search']);
  } finally {
    globalThis.fetch = previousFetch;
    delete globalThis.localStorage;
  }
});
