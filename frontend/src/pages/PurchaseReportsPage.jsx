import { useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import { printHtmlDocument } from '../utils/print.js';

export default function PurchaseReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [bySupplier, setBySupplier] = useState([]);
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
      const [s, b] = await Promise.all([
        unwrap(await http.get(`/reports/purchases/summary${qs()}`)),
        unwrap(await http.get(`/reports/purchases/by-supplier${qs()}`)),
      ]);
      setSummary(s);
      setBySupplier(b);
    } catch (e) {
      setError(e.message);
    }
  };

  const printReport = () => {
    const supplierRows = bySupplier
      .map(
        (row) => `
      <tr>
        <td>${row.supplierName || ''}</td>
        <td>${row.invoices || 0}</td>
        <td class="amount">${Number(row.total || 0).toFixed(2)}</td>
      </tr>`
      )
      .join('');
    printHtmlDocument({
      title: 'Purchase Report',
      bodyHtml: `
        <h1>Purchase Report</h1>
        <div class="meta">From: ${from || 'Start'} | To: ${to || 'Today'} | Printed: ${new Date().toLocaleString()}</div>
        <div class="summary">
          <strong>Invoices:</strong> ${summary?.invoiceCount || 0} |
          <strong>Total Purchases:</strong> ${Number(summary?.totalPurchases || 0).toFixed(2)}
        </div>
        <table>
          <thead><tr><th>Supplier</th><th>Invoices</th><th>Total</th></tr></thead>
          <tbody>${supplierRows}</tbody>
        </table>`,
    });
  };

  return (
    <div>
      <PageHeader title="Purchase reports" subtitle="Summary and supplier-wise totals with optional date filters." />
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
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Invoices</p>
            <p className="text-2xl font-semibold">{summary.invoiceCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Total purchases</p>
            <p className="text-2xl font-semibold">{summary.totalPurchases?.toFixed?.(2) ?? summary.totalPurchases}</p>
          </div>
        </div>
      )}
      <h3 className="mb-2 text-sm font-semibold text-slate-800">Supplier-wise</h3>
      <DataTable
        columns={[
          { key: 'supplierName', label: 'Supplier' },
          { key: 'invoices', label: 'Invoices' },
          { key: 'total', label: 'Total', render: (r) => r.total?.toFixed?.(2) },
        ]}
        rows={bySupplier}
        filterKeys={['supplierName']}
      />
    </div>
  );
}
