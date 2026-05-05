import { useEffect, useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await unwrap(await http.get('/home/summary'));
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle="Welcome to your farm operations and accounting workspace."
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total poultry (birds)"
          value={data?.stockSummary?.poultryBirds ?? '—'}
          hint="Aggregated live stock across farms"
        />
        <SummaryCard
          title="Feed on hand (units)"
          value={data?.stockSummary?.feedUnits ?? '—'}
          hint="Feed inventory totals"
        />
        <SummaryCard
          title="Approx. liquid movement"
          value={data?.approximateLiquidBalance != null ? fmt(data.approximateLiquidBalance) : '—'}
          hint="Receipts minus payments via cash/bank heads (simplified)"
        />
        <SummaryCard
          title="Total sales invoices"
          value={data?.invoiceSummary?.salesInvoiceCount ?? '—'}
          hint={data?.invoiceSummary ? `Sales ${fmt(data.invoiceSummary.totalSales || 0)}` : 'Sales summary'}
        />
        <SummaryCard
          title="Total purchase invoices"
          value={data?.invoiceSummary?.purchaseInvoiceCount ?? '—'}
          hint={data?.invoiceSummary ? `Purchases ${fmt(data.invoiceSummary.totalPurchases || 0)}` : 'Purchase summary'}
        />
        <SummaryCard
          title="Profit / loss"
          value={
            data?.invoiceSummary
              ? data.invoiceSummary.grossProfit >= 0
                ? `Profit ${fmt(data.invoiceSummary.grossProfit)}`
                : `Loss ${fmt(data.invoiceSummary.grossLoss)}`
              : '—'
          }
          hint="Based on sales line revenue minus unit cost"
        />
      </div>
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent activity</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(data?.recentTransactions || []).map((t, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="font-medium text-slate-800">
                {t.kind === 'purchase' ? 'Purchase' : 'Sale'} — {t.documentNumber}
              </span>
              <span className="text-slate-500">{new Date(t.date).toLocaleString()}</span>
              <span className="text-slate-700">{t.party}</span>
              <span className="font-mono text-slate-900">{fmt(t.amount)}</span>
            </li>
          ))}
          {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <li className="py-4 text-sm text-slate-500">No recent transactions yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function fmt(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function SummaryCard({ title, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
