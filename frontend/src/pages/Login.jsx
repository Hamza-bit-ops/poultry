import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@farm.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Poultry Farm Management &amp; Accounting</p>
        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-800 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
