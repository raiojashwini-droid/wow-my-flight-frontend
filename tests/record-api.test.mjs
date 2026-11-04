import test from 'node:test';
import assert from 'node:assert/strict';
import { saveRecord } from '../src/services/recordApi.js';

test('rejected saves preserve cached records and expose the server error', async () => {
  const values = new Map([['crm-leads', JSON.stringify([{ id: 'real', firstName: 'Existing' }])]]);
  globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ success: false, error: 'Permission denied' }) });
  try {
    await assert.rejects(saveRecord('/api/leads/real', 'DELETE', undefined, 'crm-leads', 'real'), /Permission denied/);
    assert.equal(JSON.parse(values.get('crm-leads')).length, 1);
  } finally { globalThis.fetch = previousFetch; delete globalThis.localStorage; }
});

test('successful changes cache only the database response', async () => {
  const values = new Map([['crm-leads', JSON.stringify([{ id: 'real', firstName: 'Old' }])]]);
  globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { id: 'real', firstName: 'Saved' } }) });
  try {
    const result = await saveRecord('/api/leads/real', 'PUT', { firstName: 'Input' }, 'crm-leads');
    assert.equal(result.firstName, 'Saved');
    assert.deepEqual(JSON.parse(values.get('crm-leads')), [result]);
  } finally { globalThis.fetch = previousFetch; delete globalThis.localStorage; }
});
