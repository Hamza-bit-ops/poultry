import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../../api/http.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';

const emptyLine = () => ({ account: '', narration: '', debit: 0, credit: 0 });

export default function BankVouchers() {
  const [rows, setRows] = useState([]);
  const [heads, setHeads] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    bankAccount: '',
    notes: '',
    lines: [emptyLine(), emptyLine()],
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [r, h] = await Promise.all([
      unwrap(await http.get('/transactions/bank-vouchers')),
      unwrap(await http.get('/setup/account-heads')),
    ]);
    setRows(r);
    setHeads(h);
    const banks = h.filter((x) => x.type === 'bank');
    setForm((prev) => ({ ...prev, bankAccount: prev.bankAccount || banks[0]?._id || '' }));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const payload = {
      date: form.date,
      bankAccount: form.bankAccount,
      notes: form.notes,
      lines: form.lines.map((l) => ({
        account: l.account,
        narration: l.narration,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      })),
    };
    try {
      await http.post('/transactions/bank-vouchers', payload);
      setMsg('Saved (debits must equal credits).');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Bank voucher" subtitle="Double-entry style lines; totals must balance." />
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
            Bank account
            <select
              required
              className="mt-1 block min-w-[220px] rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.bankAccount}
              onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
            >
              {heads
                .filter((h) => h.type === 'bank')
                .map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        {form.lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-4">
            <select
              required
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={line.account}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].account = e.target.value;
                setForm({ ...form, lines });
              }}
            >
              <option value="">Account…</option>
              {heads.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Narration"
              value={line.narration}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].narration = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <input
              type="number"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Debit"
              value={line.debit}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].debit = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <input
              type="number"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Credit"
              value={line.credit}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].credit = e.target.value;
                setForm({ ...form, lines });
              }}
            />
          </div>
        ))}
        <button type="button" className="text-sm text-brand-700" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}>
          + Line
        </button>
        <button type="submit" className="ml-3 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save bank voucher
        </button>
      </form>
      <DataTable
        columns={[
          { key: 'documentNumber', label: 'No.' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'bankAccount', label: 'Bank', render: (r) => r.bankAccount?.name },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
