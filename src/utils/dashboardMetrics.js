export const isPaid = payment => ['Paid', 'Completed', 'Payment Confirmed'].includes(payment.status);
export const money = value => Number(String(value ?? 0).replace(/[^0-9.-]/g, '')) || 0;
export function paymentTrend(payments) {
  const totals = new Map();
  for (const payment of payments.filter(isPaid)) {
    const date = String(payment.paidAt || payment.createdAt || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(date)) continue;
    totals.set(date, (totals.get(date) || 0) + money(payment.amount));
  }
  return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([name, revenue]) => ({ name, revenue }));
}
export function leadWaste(leads) {
  const months = new Map();
  for (const lead of leads) {
    const date = String(lead.createdAt || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(date)) continue;
    const item = months.get(date) || { name: date, total: 0, wastedLeads: 0 };
    item.total++;
    if (['lost', 'spam', 'cancelled'].some(status => (lead.status || '').toLowerCase().includes(status))) item.wastedLeads++;
    months.set(date, item);
  }
  return [...months.values()].sort((a, b) => a.name.localeCompare(b.name)).map(item => ({ ...item, wasteRate: Math.round(item.wastedLeads / item.total * 100) }));
}
