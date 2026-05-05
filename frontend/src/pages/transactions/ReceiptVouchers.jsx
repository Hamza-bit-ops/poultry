import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../../api/http.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';

export default function ReceiptVouchers() {
  const [rows, setRows] = useState([]);
  const [parties, setParties] = useState([]);
  const [targets, setTargets] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    receivedFrom: '',
    depositTo: '',
    amount: 0,
    paymentMode: 'cash',
    reference: '',
    notes: '',
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [r, cust, cb] = await Promise.all([
      unwrap(await http.get('/transactions/receipt-vouchers')),
      unwrap(await http.get('/setup/account-heads?type=customer')),
      unwrap(await http.get('/setup/account-heads')),
    ]);
    setRows(r);
    setParties(cust);
    const cashBank = cb.filter((h) => h.type === 'cash' || h.type === 'bank');
    setTargets(cashBank);
    setForm((prev) => ({
      ...prev,
      receivedFrom: prev.receivedFrom || cust[0]?._id || '',
      depositTo: prev.depositTo || cashBank[0]?._id || '',
    }));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await http.post('/transactions/receipt-vouchers', {
        ...form,
        amount: Number(form.amount),
      });
      setMsg('Saved.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Receipt voucher" subtitle="Record money received into cash or bank." />
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
          Received from
          <select
            required
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.receivedFrom}
            onChange={(e) => setForm({ ...form, receivedFrom: e.target.value })}
          >
            {parties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          Deposit to
          <select
            required
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.depositTo}
            onChange={(e) => setForm({ ...form, depositTo: e.target.value })}
          >
            {targets.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.type})
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
        <label className="text-xs text-slate-600">
          Mode
          <select
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.paymentMode}
            onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
          >
            {['cash', 'bank', 'cheque', 'upi', 'other'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          Reference
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </label>
        <label className="text-xs text-slate-600 md:col-span-3">
          Notes
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <button type="submit" className="rounded bg-brand-700 px-3 py-2 text-sm text-white md:col-span-3">
          Save receipt
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'documentNumber', label: 'No.' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'receivedFrom', label: 'From', render: (r) => r.receivedFrom?.name },
          { key: 'amount', label: 'Amount' },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
