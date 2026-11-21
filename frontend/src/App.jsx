import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import FarmerLayout from './layouts/FarmerLayout';
import BuyerLayout from './layouts/BuyerLayout';
import AdminLayout from './layouts/AdminLayout';

// Public & Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Farmer Portal Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProfile from './pages/farmer/FarmerProfile';
import FarmerHarvests from './pages/farmer/FarmerHarvests';
import NewHarvest from './pages/farmer/NewHarvest';
import FarmerQuality from './pages/farmer/FarmerQuality';
import FarmerRequirements from './pages/farmer/FarmerRequirements';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerDeliveries from './pages/farmer/FarmerDeliveries';
import FarmerPayments from './pages/farmer/FarmerPayments';
import FarmerPriceHistory from './pages/farmer/FarmerPriceHistory';

// Buyer Portal Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerProfile from './pages/buyer/BuyerProfile';
import BuyerRequirements from './pages/buyer/BuyerRequirements';
import NewRequirement from './pages/buyer/NewRequirement';
import RequirementDetail from './pages/buyer/RequirementDetail';
import BuyerMatches from './pages/buyer/BuyerMatches';
import BuyerOrders from './pages/buyer/BuyerOrders';
import OrderDetail from './pages/buyer/OrderDetail';
import BuyerDeliveries from './pages/buyer/BuyerDeliveries';
import BuyerPayments from './pages/buyer/BuyerPayments';
import BuyerPriceHistory from './pages/buyer/BuyerPriceHistory';

// Admin Portal Pages (Stage 4)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminHarvests from './pages/admin/AdminHarvests';
import AdminQuality from './pages/admin/AdminQuality';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPriceHistory from './pages/admin/AdminPriceHistory';
import AdminReports from './pages/admin/AdminReports';

export const App = () => {
  const { isAuthenticated, role } = useAuth();

  // Root redirect based on authentication and role
  const getRootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (role === 'FARMER') return <Navigate to="/farmer" replace />;
    if (role === 'BUYER') return <Navigate to="/buyer" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={getRootRedirect()} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Farmer Portal Protected Routes */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={['FARMER']}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FarmerDashboard />} />
        <Route path="profile" element={<FarmerProfile />} />
        <Route path="harvests" element={<FarmerHarvests />} />
        <Route path="harvests/new" element={<NewHarvest />} />
        <Route path="quality" element={<FarmerQuality />} />
        <Route path="requirements" element={<FarmerRequirements />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="deliveries" element={<FarmerDeliveries />} />
        <Route path="payments" element={<FarmerPayments />} />
        <Route path="price-history" element={<FarmerPriceHistory />} />
      </Route>

      {/* Buyer Portal Protected Routes */}
      <Route
        path="/buyer"
        element={
          <ProtectedRoute allowedRoles={['BUYER']}>
            <BuyerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BuyerDashboard />} />
        <Route path="profile" element={<BuyerProfile />} />
        <Route path="requirements" element={<BuyerRequirements />} />
        <Route path="requirements/new" element={<NewRequirement />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        <Route path="matches" element={<BuyerMatches />} />
        <Route path="orders" element={<BuyerOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="deliveries" element={<BuyerDeliveries />} />
        <Route path="payments" element={<BuyerPayments />} />
        <Route path="price-history" element={<BuyerPriceHistory />} />
      </Route>

      {/* Admin Portal Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="harvests" element={<AdminHarvests />} />
        <Route path="quality" element={<AdminQuality />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="deliveries" element={<AdminDeliveries />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="price-history" element={<AdminPriceHistory />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
