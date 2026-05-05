import { useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';

export default function FinancialsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pnl, setPnl] = useState(null);
  const [bs, setBs] = useState(null);
  const [cf, setCf] = useState(null);
  const [error, setError] = useState('');

  const qs = () => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  const loadAll = async () => {
    setError('');
    try {
      const [p, b, c] = await Promise.all([
        unwrap(await http.get(`/financials/profit-loss${qs()}`)),
        unwrap(await http.get('/financials/balance-sheet')),
        unwrap(await http.get(`/financials/cash-flow${qs()}`)),
      ]);
      setPnl(p);
      setBs(b);
      setCf(c);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <PageHeader title="Financials" subtitle="Profit & loss, simplified balance sheet, and cash-flow movement." />
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs text-slate-600">
          From (P&amp;L / cash flow)
          <input type="date" className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs text-slate-600">
          To
          <input type="date" className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="rounded bg-brand-700 px-4 py-2 text-sm text-white" onClick={loadAll}>
          Refresh statements
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Statement title="Profit & Loss" body={pnl} />
        <Statement title="Balance sheet (basic)" body={bs} />
        <Statement title="Cash flow" body={cf} />
      </div>
    </div>
  );
}

function Statement({ title, body }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {!body && <p className="mt-2 text-sm text-slate-500">Click refresh to load.</p>}
      {body && (
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(body, null, 2)}</pre>
      )}
    </section>
  );
}
