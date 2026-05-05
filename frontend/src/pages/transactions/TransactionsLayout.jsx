import { NavLink, Outlet } from 'react-router-dom';

const sub = [
  { to: '/transactions/purchases', label: 'Purchase Invoice' },
  { to: '/transactions/stock-transfers', label: 'Stock Transfer' },
  { to: '/transactions/sales', label: 'Sales Invoice' },
  { to: '/transactions/sales-returns', label: 'Sales Return' },
  { to: '/transactions/receipts', label: 'Receipt Voucher' },
  { to: '/transactions/payments', label: 'Payment Voucher' },
  { to: '/transactions/bank', label: 'Bank Voucher' },
  { to: '/transactions/journal', label: 'Journal Voucher' },
];

const subLink = ({ isActive }) =>
  [
    'rounded-md px-3 py-1.5 text-sm font-medium',
    isActive ? 'bg-brand-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
  ].join(' ');

/**
 * Transactions area: secondary row for voucher types (invoice-style forms below).
 */
export default function TransactionsLayout() {
  return (
    <div>
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vouchers</p>
        <div className="flex flex-wrap gap-2">
          {sub.map((s) => (
            <NavLink key={s.to} to={s.to} className={subLink}>
              {s.label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
