import { useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import { printHtmlDocument } from '../utils/print.js';

export default function SaleReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [byCustomer, setByCustomer] = useState([]);
  const [error, setError] = useState('');

  const qs = () => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  const run = async () => {
    setError('');
    try {
      const [s, c] = await Promise.all([
        unwrap(await http.get(`/reports/sales/summary${qs()}`)),
        unwrap(await http.get(`/reports/sales/by-customer${qs()}`)),
      ]);
      setSummary(s);
      setByCustomer(c);
    } catch (e) {
      setError(e.message);
    }
  };

  const printReport = () => {
    const customerRows = byCustomer
      .map(
        (row) => `
      <tr>
        <td>${row.customerName || ''}</td>
        <td>${row.invoiceCount || 0}</td>
        <td class="amount">${Number(row.totalSales || 0).toFixed(2)}</td>
        <td class="amount">${Number(row.grossProfit || 0).toFixed(2)}</td>
      </tr>`
      )
      .join('');
    printHtmlDocument({
      title: 'Sales Report',
      bodyHtml: `
        <h1>Sales Report</h1>
        <div class="meta">From: ${from || 'Start'} | To: ${to || 'Today'} | Printed: ${new Date().toLocaleString()}</div>
        <div class="summary">
          <strong>Invoices:</strong> ${summary?.invoiceCount || 0} |
          <strong>Total Sales:</strong> ${Number(summary?.totalSales || 0).toFixed(2)} |
          <strong>Gross Profit:</strong> ${Number(summary?.grossProfit || 0).toFixed(2)}
        </div>
        <table>
          <thead><tr><th>Customer</th><th>Invoices</th><th>Sales</th><th>Gross Profit</th></tr></thead>
          <tbody>${customerRows}</tbody>
        </table>`,
    });
  };

  return (
    <div>
      <PageHeader title="Sale reports" subtitle="Sales summary, customer profitability (uses line unit cost)." />
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs text-slate-600">
          From
          <input type="date" className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs text-slate-600">
          To
          <input type="date" className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="rounded bg-brand-700 px-4 py-2 text-sm text-white" onClick={run}>
          Run report
        </button>
        <button type="button" className="rounded border border-slate-300 px-4 py-2 text-sm" onClick={printReport} disabled={!summary}>
          Print
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Stat label="Invoices" value={summary.invoiceCount} />
          <Stat label="Total sales" value={summary.totalSales?.toFixed?.(2)} />
          <Stat label="Line revenue" value={summary.lineRevenue?.toFixed?.(2)} />
          <Stat label="Gross profit" value={summary.grossProfit?.toFixed?.(2)} />
        </div>
      )}
      <h3 className="mb-2 text-sm font-semibold text-slate-800">Customer-wise</h3>
      <DataTable
        columns={[
          { key: 'customerName', label: 'Customer' },
          { key: 'invoiceCount', label: 'Invoices' },
          { key: 'totalSales', label: 'Sales', render: (r) => r.totalSales?.toFixed?.(2) },
          { key: 'grossProfit', label: 'Gross profit', render: (r) => r.grossProfit?.toFixed?.(2) },
        ]}
        rows={byCustomer}
        filterKeys={['customerName']}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
