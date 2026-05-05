import { useCallback, useEffect, useState } from 'react';
import { http, unwrap } from '../../api/http.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import { printHtmlDocument } from '../../utils/print.js';

const emptyLine = () => ({
  lineType: 'poultry',
  description: '',
  quantity: 1,
  unitPrice: 0,
  farm: '',
  poultryType: '',
  productName: '',
});

export default function SalesReturns() {
  const [rows, setRows] = useState([]);
  const [farms, setFarms] = useState([]);
  const [types, setTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    customer: '',
    notes: '',
    lines: [emptyLine()],
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [inv, f, t, c] = await Promise.all([
      unwrap(await http.get('/transactions/sales-returns')),
      unwrap(await http.get('/setup/farms')),
      unwrap(await http.get('/setup/poultry-types')),
      unwrap(await http.get('/setup/account-heads?type=customer')),
    ]);
    setRows(inv);
    setFarms(f);
    setTypes(t);
    setCustomers(c);
    setForm((prev) => ({ ...prev, customer: prev.customer || c[0]?._id || '' }));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const payload = {
      date: form.date,
      customer: form.customer,
      notes: form.notes,
      lines: form.lines.map((l) => ({
        lineType: l.lineType,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        farm: l.lineType === 'poultry' ? l.farm || undefined : undefined,
        poultryType: l.lineType === 'poultry' ? l.poultryType || undefined : undefined,
        productName: l.lineType !== 'poultry' ? l.productName : '',
      })),
    };
    try {
      await http.post('/transactions/sales-returns', payload);
      setMsg('Saved.');
      setForm({
        date: new Date().toISOString().slice(0, 10),
        customer: customers[0]?._id,
        notes: '',
        lines: [emptyLine()],
      });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  const printReturns = () => {
    const bodyRows = rows
      .map(
        (row) => `
      <tr>
        <td>${row.documentNumber || ''}</td>
        <td>${new Date(row.date).toLocaleDateString()}</td>
        <td>${row.customer?.name || ''}</td>
        <td class="amount">${Number(row.total || 0).toFixed(2)}</td>
      </tr>`
      )
      .join('');
    printHtmlDocument({
      title: 'Sales Returns Register',
      bodyHtml: `
        <h1>Sales Returns Register</h1>
        <div class="meta">Printed: ${new Date().toLocaleString()}</div>
        <table>
          <thead><tr><th>Return No.</th><th>Date</th><th>Customer</th><th>Total</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>`,
    });
  };

  return (
    <div>
      <PageHeader title="Sales return" subtitle="Credit customer and restore stock." />
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
            Customer
            <select
              required
              className="mt-1 block min-w-[200px] rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {form.lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 border-t border-slate-100 pt-2 md:grid-cols-5">
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={line.lineType}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].lineType = e.target.value;
                setForm({ ...form, lines });
              }}
            >
              <option value="poultry">Poultry</option>
              <option value="feed">Feed</option>
              <option value="medicine">Medicine</option>
              <option value="other">Other</option>
            </select>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-2"
              placeholder="Description"
              required
              value={line.description}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].description = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <input
              type="number"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={line.quantity}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].quantity = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <input
              type="number"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={line.unitPrice}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].unitPrice = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            {line.lineType === 'poultry' ? (
              <>
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={line.farm}
                  onChange={(e) => {
                    const lines = [...form.lines];
                    lines[idx].farm = e.target.value;
                    setForm({ ...form, lines });
                  }}
                >
                  <option value="">Farm…</option>
                  {farms.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={line.poultryType}
                  onChange={(e) => {
                    const lines = [...form.lines];
                    lines[idx].poultryType = e.target.value;
                    setForm({ ...form, lines });
                  }}
                >
                  <option value="">Type…</option>
                  {types.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <input
                className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-2"
                placeholder="Product"
                value={line.productName}
                onChange={(e) => {
                  const lines = [...form.lines];
                  lines[idx].productName = e.target.value;
                  setForm({ ...form, lines });
                }}
              />
            )}
          </div>
        ))}
        <button type="button" className="text-sm text-brand-700" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}>
          + Line
        </button>
        <button type="submit" className="ml-3 rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
          Save return
        </button>
      </form>
      <div className="mb-3 flex justify-end">
        <button type="button" className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50" onClick={printReturns}>
          Print returns list
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'documentNumber', label: 'No.' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
          { key: 'total', label: 'Total', render: (r) => r.total?.toFixed?.(2) },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
