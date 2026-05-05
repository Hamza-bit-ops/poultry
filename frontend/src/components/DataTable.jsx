import { useMemo, useState } from 'react';

/**
 * Lightweight sortable/filterable table for accounting-style lists.
 */
export default function DataTable({ columns, rows, filterKeys, emptyText = 'No records' }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) => {
      if (!filterKeys?.length) return JSON.stringify(r).toLowerCase().includes(q);
      return filterKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q));
    });
  }, [rows, filter, filterKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sort]);

  const toggleSort = (key) => {
    setSort((s) =>
      s.key !== key ? { key, dir: 'asc' } : { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {filterKeys && (
        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
          <input
            className="w-full max-w-xs rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="cursor-pointer px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                >
                  {c.label}
                  {sort.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sorted.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
            {sorted.map((row, idx) => (
              <tr key={row._id || idx} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-3 py-2 text-slate-800">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
