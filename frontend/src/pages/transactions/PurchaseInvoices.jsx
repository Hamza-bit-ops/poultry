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
  farm: '',
  poultryType: '',
  productName: '',
  unit: '',
});

/**
 * Purchase invoices: supplier bill with stock-aware lines (poultry / feed / medicine).
 */
export default function PurchaseInvoices() {
  const [rows, setRows] = useState([]);
  const [farms, setFarms] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    _id: null,
    date: new Date().toISOString().slice(0, 10),
    supplier: '',
    taxAmount: 0,
    notes: '',
    lines: [emptyLine()],
  });
  const [message, setMessage] = useState('');

  const loadRefs = useCallback(async () => {
    const [f, t, u, s] = await Promise.all([
      unwrap(await http.get('/setup/farms')),
      unwrap(await http.get('/setup/poultry-types')),
      unwrap(await http.get('/setup/units')),
      unwrap(await http.get('/setup/account-heads?type=supplier')),
    ]);
    setFarms(f);
    setTypes(t);
    setUnits(u);
    setSuppliers(s);
    setForm((prev) => ({
      ...prev,
      supplier: prev.supplier || s[0]?._id || '',
    }));
  }, []);

  const loadRows = useCallback(async () => {
    setRows(await unwrap(await http.get('/transactions/purchase-invoices')));
  }, []);

  useEffect(() => {
    loadRefs().catch(() => {});
  }, [loadRefs]);

  useEffect(() => {
    loadRows().catch(() => {});
  }, [loadRows]);

  const totals = useMemo(() => {
    const sub = form.lines.reduce((a, l) => a + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0);
    const tax = Number(form.taxAmount) || 0;
    return { subtotal: sub, total: sub + tax };
  }, [form.lines, form.taxAmount]);

  const resetForm = () => {
    setForm({
      _id: null,
      date: new Date().toISOString().slice(0, 10),
      supplier: suppliers[0]?._id || '',
      taxAmount: 0,
      notes: '',
      lines: [emptyLine()],
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const payload = {
      date: form.date,
      supplier: form.supplier,
      taxAmount: Number(form.taxAmount) || 0,
      notes: form.notes,
      lines: form.lines.map((l) => ({
        lineType: l.lineType,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        farm: l.lineType === 'poultry' ? l.farm || undefined : undefined,
        poultryType: l.lineType === 'poultry' ? l.poultryType || undefined : undefined,
        productName: l.lineType !== 'poultry' ? l.productName : '',
        unit: l.lineType !== 'poultry' ? l.unit || undefined : undefined,
      })),
    };
    try {
      if (form._id) {
        await http.put(`/transactions/purchase-invoices/${form._id}`, payload);
        setMessage('Updated successfully.');
      } else {
        await http.post('/transactions/purchase-invoices', payload);
        setMessage('Saved successfully.');
      }
      resetForm();
      loadRows();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
    }
  };

  const editRow = (r) => {
    setForm({
      _id: r._id,
      date: r.date?.slice?.(0, 10) || r.date,
      supplier: r.supplier?._id || r.supplier,
      taxAmount: r.taxAmount ?? 0,
      notes: r.notes || '',
      lines:
        r.lines?.map((l) => ({
          lineType: l.lineType,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          farm: l.farm?._id || l.farm || '',
          poultryType: l.poultryType?._id || l.poultryType || '',
          productName: l.productName || '',
          unit: l.unit?._id || l.unit || '',
        })) || [emptyLine()],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRow = async (id) => {
    if (!confirm('Delete this purchase invoice? Stock will be reversed.')) return;
    await http.delete(`/transactions/purchase-invoices/${id}`);
    loadRows();
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
      title: `Purchase Invoice ${row.documentNumber}`,
      bodyHtml: `
        <h1>Purchase Invoice ${row.documentNumber || ''}</h1>
        <div class="meta">Date: ${new Date(row.date).toLocaleDateString()} | Supplier: ${row.supplier?.name || '-'}</div>
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
        <td>${row.supplier?.name || ''}</td>
        <td class="amount">${Number(row.total || 0).toFixed(2)}</td>
      </tr>`
      )
      .join('');
    const total = rows.reduce((acc, row) => acc + Number(row.total || 0), 0);
    printHtmlDocument({
      title: 'Purchase Invoices Register',
      bodyHtml: `
        <h1>Purchase Invoices Register</h1>
        <div class="meta">Printed: ${new Date().toLocaleString()}</div>
        <table>
          <thead><tr><th>Invoice No.</th><th>Date</th><th>Supplier</th><th>Total</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <div class="summary"><strong>Total Invoices: ${rows.length}</strong> | <strong>Grand Total: ${total.toFixed(2)}</strong></div>`,
    });
  };

  return (
    <div>
      <PageHeader
        title="Purchase invoice"
        subtitle="Supplier purchases with automatic stock updates for poultry, feed, and medicine lines."
      />
      {message && <p className="mb-3 text-sm text-brand-800">{message}</p>}
      <form
        onSubmit={onSubmit}
        className="mb-8 space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow-sm ring-1 ring-slate-100"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">
            Date
            <input
              type="date"
              required
              className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Supplier
            <select
              required
              className="mt-1 block min-w-[200px] rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Tax / other charges
            <input
              type="number"
              step="0.01"
              className="mt-1 block w-32 rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.taxAmount}
              onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
            />
          </label>
          <label className="flex-1 text-xs font-medium text-slate-600">
            Notes
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase text-slate-600">
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Qty</th>
              <th className="px-2 py-2">Rate</th>
              <th className="px-2 py-2">Farm / product</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {form.lines.map((line, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="px-2 py-2">
                  <select
                    className="rounded border border-slate-300 px-1 py-1"
                    value={line.lineType}
                    onChange={(e) => {
                      const lines = [...form.lines];
                      lines[idx] = { ...line, lineType: e.target.value };
                      setForm({ ...form, lines });
                    }}
                  >
                    <option value="poultry">Poultry</option>
                    <option value="feed">Feed</option>
                    <option value="medicine">Medicine</option>
                    <option value="other">Other</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input
                    required
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={line.description}
                    onChange={(e) => {
                      const lines = [...form.lines];
                      lines[idx].description = e.target.value;
                      setForm({ ...form, lines });
                    }}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                    value={line.quantity}
                    onChange={(e) => {
                      const lines = [...form.lines];
                      lines[idx].quantity = e.target.value;
                      setForm({ ...form, lines });
                    }}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-28 rounded border border-slate-300 px-2 py-1"
                    value={line.unitPrice}
                    onChange={(e) => {
                      const lines = [...form.lines];
                      lines[idx].unitPrice = e.target.value;
                      setForm({ ...form, lines });
                    }}
                  />
                </td>
                <td className="px-2 py-2">
                  {line.lineType === 'poultry' ? (
                    <div className="flex flex-col gap-1">
                      <select
                        className="rounded border border-slate-300 px-1 py-1"
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
                        className="rounded border border-slate-300 px-1 py-1"
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
                  ) : (
                    <div className="flex flex-col gap-1">
                      <input
                        placeholder="Product name"
                        className="rounded border border-slate-300 px-2 py-1"
                        value={line.productName}
                        onChange={(e) => {
                          const lines = [...form.lines];
                          lines[idx].productName = e.target.value;
                          setForm({ ...form, lines });
                        }}
                      />
                      <select
                        className="rounded border border-slate-300 px-1 py-1"
                        value={line.unit}
                        onChange={(e) => {
                          const lines = [...form.lines];
                          lines[idx].unit = e.target.value;
                          setForm({ ...form, lines });
                        }}
                      >
                        <option value="">Unit…</option>
                        {units.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.abbreviation}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      const lines = form.lines.filter((_, i) => i !== idx);
                      setForm({ ...form, lines: lines.length ? lines : [emptyLine()] });
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm"
            onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })}
          >
            Add line
          </button>
          <div className="text-right text-sm text-slate-700">
            <div>Subtotal: {totals.subtotal.toFixed(2)}</div>
            <div className="font-semibold">Total: {totals.total.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            {form._id ? 'Update invoice' : 'Save invoice'}
          </button>
          {form._id && (
            <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm" onClick={resetForm}>
              Cancel edit
            </button>
          )}
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
          { key: 'supplier', label: 'Supplier', render: (r) => r.supplier?.name },
          { key: 'total', label: 'Total', render: (r) => r.total?.toFixed?.(2) ?? r.total },
          {
            key: '_id',
            label: 'Actions',
            sortable: false,
            render: (r) => (
              <span className="flex gap-2">
                <button type="button" className="text-brand-700 hover:underline" onClick={() => editRow(r)}>
                  Edit
                </button>
                <button type="button" className="text-red-600 hover:underline" onClick={() => deleteRow(r._id)}>
                  Delete
                </button>
                <button type="button" className="text-brand-700 hover:underline" onClick={() => printInvoice(r)}>
                  Print
                </button>
              </span>
            ),
          },
        ]}
        rows={rows}
        filterKeys={['documentNumber']}
      />
    </div>
  );
}
