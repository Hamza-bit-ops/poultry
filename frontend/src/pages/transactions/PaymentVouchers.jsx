import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../../api/http.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';

export default function PaymentVouchers() {
  const [rows, setRows] = useState([]);
  const [heads, setHeads] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    paidTo: '',
    paidFrom: '',
    amount: 0,
    paymentMode: 'bank',
    reference: '',
    notes: '',
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [r, h] = await Promise.all([
      unwrap(await http.get('/transactions/payment-vouchers')),
      unwrap(await http.get('/setup/account-heads')),
    ]);
    setRows(r);
    setHeads(h);
    const cashBank = h.filter((x) => x.type === 'cash' || x.type === 'bank');
    const payees = h.filter((x) => x.type === 'supplier' || x.type === 'expense');
    setForm((prev) => ({
      ...prev,
      paidTo: prev.paidTo || payees[0]?._id || '',
      paidFrom: prev.paidFrom || cashBank[0]?._id || '',
    }));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const payees = heads.filter((x) => x.type === 'supplier' || x.type === 'expense');
  const sources = heads.filter((x) => x.type === 'cash' || x.type === 'bank');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await http.post('/transactions/payment-vouchers', { ...form, amount: Number(form.amount) });
      setMsg('Saved.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Payment voucher" subtitle="Pay suppliers, expenses, or other parties from cash/bank." />
      {msg && <p className="mb-2 text-sm text-brand-800">{msg}</p>}
      <form onSubmit={submit} className="mb-8 grid gap-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="text-xs text-slate-600">
          Date
          <input
            type="date"
            required
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="text-xs text-slate-600">
          Pay to
          <select
            required
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.paidTo}
            onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
          >
            {payees.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          Pay from
          <select
            required
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.paidFrom}
            onChange={(e) => setForm({ ...form, paidFrom: e.target.value })}
          >
            {sources.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            required
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <label className="text-xs text-slate-600 md:col-span-2">
          Notes
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <button type="submit" className="rounded bg-brand-700 px-3 py-2 text-sm text-white md:col-span-3">
          Save payment
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'documentNumber', label: 'No.' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'paidTo', label: 'Paid to', render: (r) => r.paidTo?.name },
          { key: 'amount', label: 'Amount' },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
