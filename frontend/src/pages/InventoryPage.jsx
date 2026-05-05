import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../api/http.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

const tabs = ['Poultry stock', 'Feed', 'Medicine', 'Movements'];

export default function InventoryPage() {
  const [tab, setTab] = useState(tabs[0]);
  const [poultry, setPoultry] = useState([]);
  const [feed, setFeed] = useState([]);
  const [medicine, setMedicine] = useState([]);
  const [movements, setMovements] = useState([]);

  const load = useCallback(async () => {
    const [p, f, m, mv] = await Promise.all([
      unwrap(await http.get('/inventory/poultry')),
      unwrap(await http.get('/inventory/feed')),
      unwrap(await http.get('/inventory/medicine')),
      unwrap(await http.get('/inventory/movements?limit=200')),
    ]);
    setPoultry(p);
    setFeed(f);
    setMedicine(m);
    setMovements(mv);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Live birds, feed, medicine, and audit trail of stock movements."
        actions={
          <button type="button" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm" onClick={load}>
            Refresh
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium',
              tab === t ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white text-slate-700',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Poultry stock' && (
        <DataTable
          columns={[
            { key: 'farm', label: 'Farm', render: (r) => r.farm?.name },
            { key: 'poultryType', label: 'Type', render: (r) => r.poultryType?.name },
            { key: 'quantity', label: 'Birds' },
          ]}
          rows={poultry}
        />
      )}
      {tab === 'Feed' && (
        <DataTable
          columns={[
            { key: 'name', label: 'Product' },
            { key: 'unit', label: 'Unit', render: (r) => r.unit?.abbreviation },
            { key: 'quantity', label: 'Qty' },
          ]}
          rows={feed}
          filterKeys={['name']}
        />
      )}
      {tab === 'Medicine' && (
        <DataTable
          columns={[
            { key: 'name', label: 'Product' },
            { key: 'unit', label: 'Unit', render: (r) => r.unit?.abbreviation },
            { key: 'quantity', label: 'Qty' },
          ]}
          rows={medicine}
          filterKeys={['name']}
        />
      )}
      {tab === 'Movements' && (
        <DataTable
          columns={[
            { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleString() },
            { key: 'category', label: 'Cat' },
            { key: 'movementType', label: 'Type' },
            { key: 'documentNumber', label: 'Doc' },
            { key: 'quantity', label: 'Qty' },
            { key: 'notes', label: 'Notes' },
          ]}
          rows={movements}
          filterKeys={['documentNumber', 'movementType']}
        />
      )}
    </div>
  );
}
