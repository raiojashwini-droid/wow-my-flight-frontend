import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { flightContentService: service } = await import('../src/services/flightContentService.js');
service.getBackendUrl = () => 'https://crm.example.invalid';
test('failed supplier booking does not fabricate a PNR or save a booking', async () => {
  let saved = false;
  service.createBooking = async () => { saved = true; };
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'Supplier unavailable' }) });
  await assert.rejects(service.bookFlight({}), /Supplier unavailable/);
  assert.equal(saved, false);
});
test('HTTP success without a supplier reference is not a confirmed booking', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
  await assert.rejects(service.bookFlight({}), /did not confirm/);
});
test('ticket issuance is not persisted before supplier confirmation', async () => {
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return { ok: false, json: async () => ({ message: 'Ticket not issued' }) }; };
  await assert.rejects(service.issueTicket({ pnr: 'TESTREF' }), /Ticket not issued/);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /travelopro\/flights\/issue/);
});
