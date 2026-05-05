import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../../api/http.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';

const emptyLine = () => ({
  lineType: 'poultry',
  description: '',
  quantity: 1,
  poultryType: '',
  productName: '',
});

export default function StockTransfers() {
  const [rows, setRows] = useState([]);
  const [farms, setFarms] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({
    _id: null,
    date: new Date().toISOString().slice(0, 10),
    fromFarm: '',
    toFarm: '',
    notes: '',
    lines: [emptyLine()],
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [r, f, t] = await Promise.all([
      unwrap(await http.get('/transactions/stock-transfers')),
      unwrap(await http.get('/setup/farms')),
      unwrap(await http.get('/setup/poultry-types')),
    ]);
    setRows(r);
    setFarms(f);
    setTypes(t);
    setForm((prev) => ({
      ...prev,
      fromFarm: prev.fromFarm || f[0]?._id || '',
      toFarm: prev.toFarm || f[1]?._id || f[0]?._id || '',
    }));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (form.fromFarm === form.toFarm) {
      setMsg('Select different farms.');
      return;
    }
    const payload = {
      date: form.date,
      fromFarm: form.fromFarm,
      toFarm: form.toFarm,
      notes: form.notes,
      lines: form.lines.map((l) => ({
        lineType: 'poultry',
        description: l.description,
        quantity: Number(l.quantity),
        poultryType: l.poultryType,
        productName: l.productName,
      })),
    };
    try {
      if (form._id) await http.put(`/transactions/stock-transfers/${form._id}`, payload);
      else await http.post('/transactions/stock-transfers', payload);
      setMsg('Saved.');
      setForm({
        _id: null,
        date: new Date().toISOString().slice(0, 10),
        fromFarm: farms[0]?._id,
        toFarm: farms[1]?._id || farms[0]?._id,
        notes: '',
        lines: [emptyLine()],
      });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Stock transfer" subtitle="Move poultry stock between farms." />
      {msg && <p className="mb-2 text-sm text-brand-800">{msg}</p>}
      <form onSubmit={submit} className="mb-8 space-y-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <label className="text-xs text-slate-600">
            Date
            <input
              type="date"
              required
              className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="text-xs text-slate-600">
            From farm
            <select
              required
              className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.fromFarm}
              onChange={(e) => setForm({ ...form, fromFarm: e.target.value })}
            >
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            To farm
            <select
              required
              className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.toFarm}
              onChange={(e) => setForm({ ...form, toFarm: e.target.value })}
            >
              {farms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {form.lines.map((line, idx) => (
          <div key={idx} className="flex flex-wrap gap-2 border-t border-slate-100 pt-2">
            <input
              className="flex-1 min-w-[160px] rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Description"
              value={line.description}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].description = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <input
              type="number"
              min="1"
              className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
              value={line.quantity}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].quantity = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <select
              required
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={line.poultryType}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].poultryType = e.target.value;
                setForm({ ...form, lines });
              }}
            >
              <option value="">Poultry type…</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" className="text-sm text-brand-700" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}>
            + Line
          </button>
          <button type="submit" className="rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
            Save transfer
          </button>
        </div>
      </form>
      <DataTable
        columns={[
          { key: 'documentNumber', label: 'No.' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'fromFarm', label: 'From', render: (r) => r.fromFarm?.name },
          { key: 'toFarm', label: 'To', render: (r) => r.toFarm?.name },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
