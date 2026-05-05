import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import MainLayout from './layout/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import SetupPage from './pages/SetupPage.jsx';
import TransactionsLayout from './pages/transactions/TransactionsLayout.jsx';
import PurchaseInvoices from './pages/transactions/PurchaseInvoices.jsx';
import StockTransfers from './pages/transactions/StockTransfers.jsx';
import SalesInvoices from './pages/transactions/SalesInvoices.jsx';
import SalesReturns from './pages/transactions/SalesReturns.jsx';
import ReceiptVouchers from './pages/transactions/ReceiptVouchers.jsx';
import PaymentVouchers from './pages/transactions/PaymentVouchers.jsx';
import BankVouchers from './pages/transactions/BankVouchers.jsx';
import JournalVouchers from './pages/transactions/JournalVouchers.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import PurchaseReportsPage from './pages/PurchaseReportsPage.jsx';
import SaleReportsPage from './pages/SaleReportsPage.jsx';
import LedgersPage from './pages/LedgersPage.jsx';
import FinancialsPage from './pages/FinancialsPage.jsx';

function Protected({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading session…
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <MainLayout />
          </Protected>
        }
      >
        <Route index element={<Home />} />
        <Route path="setup" element={<SetupPage />} />
        <Route path="transactions" element={<TransactionsLayout />}>
          <Route index element={<Navigate to="purchases" replace />} />
          <Route path="purchases" element={<PurchaseInvoices />} />
          <Route path="stock-transfers" element={<StockTransfers />} />
          <Route path="sales" element={<SalesInvoices />} />
          <Route path="sales-returns" element={<SalesReturns />} />
          <Route path="receipts" element={<ReceiptVouchers />} />
          <Route path="payments" element={<PaymentVouchers />} />
          <Route path="bank" element={<BankVouchers />} />
          <Route path="journal" element={<JournalVouchers />} />
        </Route>
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="reports/purchases" element={<PurchaseReportsPage />} />
        <Route path="reports/sales" element={<SaleReportsPage />} />
        <Route path="ledgers" element={<LedgersPage />} />
        <Route path="financials" element={<FinancialsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
