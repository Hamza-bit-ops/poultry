import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-brand-800 text-white shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white',
  ].join(' ');

const items = [
  { to: '/', label: 'Home', end: true },
  { to: '/setup', label: 'Setup' },
  { to: '/transactions/purchases', label: 'Transactions' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/reports/purchases', label: 'Purchase Reports' },
  { to: '/reports/sales', label: 'Sale Reports' },
  { to: '/ledgers', label: 'Ledgers' },
  { to: '/financials', label: 'Financials' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-800 bg-brand-900 shadow">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-brand-100">
            Poultry ERP
          </div>
          <nav className="flex flex-wrap gap-1">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={linkClass}>
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <span className="hidden sm:inline">{user?.name}</span>
          <button
            type="button"
            className="rounded border border-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/10"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
