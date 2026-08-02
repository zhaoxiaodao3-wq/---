import { Routes, Route, Navigate } from 'react-router-dom';
import BasicLayout from './layout/BasicLayout';
import Login from './pages/Login';
import OrderList from './pages/orders/OrderList';
import ExpenseList from './pages/expenses/ExpenseList';
import PayableList from './pages/payables/PayableList';
import Statistics from './pages/statistics/Statistics';
import { isLoggedIn } from './services/authService';

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <BasicLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/orders" replace />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="payables" element={<PayableList />} />
        <Route path="statistics" element={<Statistics />} />
      </Route>
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
}
