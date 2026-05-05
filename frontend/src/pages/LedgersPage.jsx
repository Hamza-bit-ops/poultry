import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

const kinds = [
  { id: 'customer', label: 'Customer ledger', path: (id) => `/ledgers/customers/${id}` },
  { id: 'supplier', label: 'Supplier ledger', path: (id) => `/ledgers/suppliers/${id}` },
  { id: 'cash', label: 'Cash ledger', path: (id) => `/ledgers/cash/${id}` },
  { id: 'bank', label: 'Bank ledger', path: (id) => `/ledgers/bank/${id}` },
];

export default function LedgersPage() {
  const [kind, setKind] = useState(kinds[0].id);
  const [heads, setHeads] = useState([]);
  const [selected, setSelected] = useState('');
  const [lines, setLines] = useState([]);
  const [account, setAccount] = useState(null);

  const loadHeads = useCallback(async () => {
    const map = { customer: 'customer', supplier: 'supplier', cash: 'cash', bank: 'bank' };
    const rows = await unwrap(await http.get(`/setup/account-heads?type=${map[kind]}`));
    setHeads(rows);
    setSelected(rows[0]?._id || '');
    setLines([]);
    setAccount(null);
  }, [kind]);

  useEffect(() => {
    loadHeads().catch(() => {});
  }, [loadHeads]);

  const loadLedger = async () => {
    if (!selected) return;
    const def = kinds.find((k) => k.id === kind);
    const data = await unwrap(await http.get(def.path(selected)));
    setAccount(data.account);
    setLines(data.lines || []);
  };

  return (
    <div>
      <PageHeader title="Ledgers" subtitle="Party and cash/bank books with running balance." />
      <div className="mb-4 flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium',
              kind === k.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700',
            ].join(' ')}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs text-slate-600">
          Account
          <select
            className="mt-1 block min-w-[240px] rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {heads.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="rounded bg-brand-700 px-4 py-2 text-sm text-white" onClick={loadLedger}>
          Load ledger
        </button>
      </div>
      {account && (
        <p className="mb-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{account.name}</span> — opening {account.openingBalance ?? 0}
        </p>
      )}
      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'type', label: 'Type' },
          { key: 'ref', label: 'Reference' },
          { key: 'debit', label: 'Debit' },
          { key: 'credit', label: 'Credit' },
          { key: 'balance', label: 'Balance' },
        ]}
        rows={lines}
        emptyText="Load a ledger to see lines"
      />
    </div>
  );
}
