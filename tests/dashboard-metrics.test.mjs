import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentTrend, leadWaste } from '../src/utils/dashboardMetrics.js';
test('revenue excludes pending invoices and retains year boundaries', () => {
  assert.deepEqual(paymentTrend([
    {status:'Paid',amount:100,createdAt:'2026-11-01'},
    {status:'Pending',amount:5000,createdAt:'2026-11-02'},
    {status:'Paid',amount:20,createdAt:'2025-11-03'},
  ]), [{name:'2025-11',revenue:20},{name:'2026-11',revenue:100}]);
});
test('empty dashboards invent no months or lost leads', () => {
  assert.deepEqual(paymentTrend([]), []);
  assert.deepEqual(leadWaste([]), []);
  assert.equal(leadWaste([{createdAt:'2026-11-01',status:'New Lead'}])[0].wasteRate, 0);
});
