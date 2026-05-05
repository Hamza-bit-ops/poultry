import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

/**
 * Shell: fixed top navbar + scrollable content (no classic “dashboard” page).
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
