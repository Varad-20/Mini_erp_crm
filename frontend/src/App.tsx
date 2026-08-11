import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import StockPage from './pages/stock/StockPage';
import ChallansPage from './pages/challans/ChallansPage';
import CreateChallanPage from './pages/challans/CreateChallanPage';
import ChallanDetailPage from './pages/challans/ChallanDetailPage';
import UsersPage from './pages/users/UsersPage';

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — wrapped in Layout (which handles auth check) */}
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/challans" element={<ChallansPage />} />
        <Route path="/challans/create" element={<CreateChallanPage />} />
        <Route path="/challans/:id" element={<ChallanDetailPage />} />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
