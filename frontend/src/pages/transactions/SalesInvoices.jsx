import { useCallback, useEffect, useMemo, useState } from 'react';
import { http, unwrap } from '../../api/http.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import { printHtmlDocument } from '../../utils/print.js';

const emptyLine = () => ({
  lineType: 'poultry',
  description: '',
  quantity: 1,
  unitPrice: 0,
  unitCost: 0,
  farm: '',
  poultryType: '',
  productName: '',
});

export default function SalesInvoices() {
  const [rows, setRows] = useState([]);
  const [farms, setFarms] = useState([]);
  const [types, setTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    _id: null,
    date: new Date().toISOString().slice(0, 10),
    customer: '',
    taxAmount: 0,
    notes: '',
    lines: [emptyLine()],
  });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [inv, f, t, c] = await Promise.all([
      unwrap(await http.get('/transactions/sales-invoices')),
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

  const totals = useMemo(() => {
    const sub = form.lines.reduce((a, l) => a + Number(l.quantity) * Number(l.unitPrice), 0);
    const tax = Number(form.taxAmount) || 0;
    return { subtotal: sub, total: sub + tax };
  }, [form.lines, form.taxAmount]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const payload = {
      date: form.date,
      customer: form.customer,
      taxAmount: Number(form.taxAmount) || 0,
      notes: form.notes,
      lines: form.lines.map((l) => ({
        lineType: l.lineType,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        unitCost: Number(l.unitCost) || 0,
        farm: l.lineType === 'poultry' ? l.farm || undefined : undefined,
        poultryType: l.lineType === 'poultry' ? l.poultryType || undefined : undefined,
        productName: l.lineType !== 'poultry' ? l.productName : '',
      })),
    };
    try {
      if (form._id) await http.put(`/transactions/sales-invoices/${form._id}`, payload);
      else await http.post('/transactions/sales-invoices', payload);
      setMsg('Saved.');
      setForm({
        _id: null,
        date: new Date().toISOString().slice(0, 10),
        customer: customers[0]?._id,
        taxAmount: 0,
        notes: '',
        lines: [emptyLine()],
      });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  const printInvoice = (row) => {
    const lineRows = (row.lines || [])
      .map(
        (line) => `
        <tr>
          <td>${line.description || ''}</td>
          <td>${line.quantity ?? 0}</td>
          <td class="amount">${Number(line.unitPrice || 0).toFixed(2)}</td>
          <td class="amount">${Number(line.amount || 0).toFixed(2)}</td>
        </tr>`
      )
      .join('');
    printHtmlDocument({
      title: `Sales Invoice ${row.documentNumber}`,
      bodyHtml: `
        <h1>Sales Invoice ${row.documentNumber || ''}</h1>
        <div class="meta">Date: ${new Date(row.date).toLocaleDateString()} | Customer: ${row.customer?.name || '-'}</div>
        <table>
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>${lineRows}</tbody>
        </table>
        <div class="summary"><strong>Total: ${Number(row.total || 0).toFixed(2)}</strong></div>`,
    });
  };

  const printAllInvoices = () => {
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
    const total = rows.reduce((acc, row) => acc + Number(row.total || 0), 0);
    printHtmlDocument({
      title: 'Sales Invoices Register',
      bodyHtml: `
        <h1>Sales Invoices Register</h1>
        <div class="meta">Printed: ${new Date().toLocaleString()}</div>
        <table>
          <thead><tr><th>Invoice No.</th><th>Date</th><th>Customer</th><th>Total</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <div class="summary"><strong>Total Invoices: ${rows.length}</strong> | <strong>Grand Total: ${total.toFixed(2)}</strong></div>`,
    });
  };

  return (
    <div>
      <PageHeader title="Sales invoice" subtitle="Customer billing; include unit cost for margin reporting." />
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
          <label className="text-xs text-slate-600">
            Tax
            <input
              type="number"
              className="mt-1 block w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.taxAmount}
              onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
            />
          </label>
        </div>
        {form.lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 border-t border-slate-100 pt-2 md:grid-cols-6">
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
              placeholder="Qty"
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
              placeholder="Rate"
              value={line.unitPrice}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].unitPrice = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            <input
              type="number"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Unit cost"
              value={line.unitCost}
              onChange={(e) => {
                const lines = [...form.lines];
                lines[idx].unitCost = e.target.value;
                setForm({ ...form, lines });
              }}
            />
            {line.lineType === 'poultry' ? (
              <>
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-3"
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
                  className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-3"
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
                className="rounded border border-slate-300 px-2 py-1 text-sm md:col-span-6"
                placeholder="Product name (feed/medicine)"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="text-sm text-brand-700" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}>
            + Line
          </button>
          <div className="text-sm text-slate-700">
            Subtotal {totals.subtotal.toFixed(2)} · Total <span className="font-semibold">{totals.total.toFixed(2)}</span>
          </div>
          <button type="submit" className="rounded bg-brand-700 px-3 py-1.5 text-sm text-white">
            Save
          </button>
        </div>
      </form>
      <div className="mb-3 flex justify-end">
        <button type="button" className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50" onClick={printAllInvoices}>
          Print invoices list
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'documentNumber', label: 'No.' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
          { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
          { key: 'total', label: 'Total', render: (r) => r.total?.toFixed?.(2) },
          {
            key: '_id',
            label: 'Print',
            sortable: false,
            render: (r) => (
              <button type="button" className="text-brand-700 hover:underline" onClick={() => printInvoice(r)}>
                Print
              </button>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
