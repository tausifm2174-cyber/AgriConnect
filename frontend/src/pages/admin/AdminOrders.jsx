import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminApi.getOrders(params);
      const list = res.data?.data || res.data || [];
      setOrders(list);
    } catch (err) {
      console.error('Failed to load marketplace orders:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve marketplace orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBuyer = o.buyerName?.toLowerCase().includes(q) || o.businessName?.toLowerCase().includes(q);
      const matchFarmer = o.farmerName?.toLowerCase().includes(q);
      const matchCrop = o.cropName?.toLowerCase().includes(q);
      const matchId = String(o.orderId).includes(q);
      if (!matchBuyer && !matchFarmer && !matchCrop && !matchId) return false;
    }
    return true;
  });

  const statuses = ['ALL', 'PENDING', 'ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Commercial Marketplace Orders</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Contract Lifecycle
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Audit and track purchase contracts agreed between commercial buyers and farmers across all lifecycle stages.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Status Filter Tabs */}
        <div className="tab-group">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search order #, buyer, farmer, crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying commercial order ledger..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No marketplace orders found matching the filter criteria.
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Crop Commodity</th>
                <th>Commercial Buyer</th>
                <th>Farmer / Producer</th>
                <th>Volume</th>
                <th>Unit Price</th>
                <th>Total Amount</th>
                <th>Contract Date</th>
                <th>Lifecycle Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.orderId}>
                  <td className="font-mono font-bold text-gray-500">#ORD-{o.orderId}</td>
                  <td>
                    <div className="font-bold text-gray-900">{o.cropName}</div>
                    <span className="text-[10px] text-gray-400 font-mono">Lot #HAR-{o.harvestId}</span>
                  </td>
                  <td>
                    <div className="font-semibold text-gray-900">{o.buyerName}</div>
                    <div className="text-[10px] text-gray-500">{o.businessName || 'Direct Buyer'}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-gray-900">{o.farmerName}</div>
                    <div className="text-[10px] text-gray-500">{o.farmLocation || 'Farm gate'}</div>
                  </td>
                  <td className="font-bold text-gray-900">
                    {Number(o.quantity).toLocaleString()} kg
                  </td>
                  <td className="font-mono text-gray-700">
                    ₹{Number(o.agreedPricePerKg).toFixed(2)}/kg
                  </td>
                  <td className="font-black text-emerald-700">
                    ₹{Number(o.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-gray-500">
                    {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/orders/${o.orderId}`)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={12} />
                      <span>Inspect &rarr;</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
