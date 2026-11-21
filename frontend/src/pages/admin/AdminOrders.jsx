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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order #, buyer, farmer, crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none w-56 sm:w-72"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying commercial order ledger..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No marketplace orders found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Crop Commodity</th>
                  <th className="py-3 px-4">Commercial Buyer</th>
                  <th className="py-3 px-4">Farmer / Producer</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Contract Date</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-500">#ORD-{o.orderId}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{o.cropName}</div>
                      <span className="text-[10px] text-gray-400 font-mono">Lot #HAR-{o.harvestId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{o.buyerName}</div>
                      <div className="text-[10px] text-gray-500">{o.businessName || 'Direct Buyer'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{o.farmerName}</div>
                      <div className="text-[10px] text-gray-500">{o.farmLocation || 'Farm gate'}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {Number(o.quantity).toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      ₹{Number(o.agreedPricePerKg).toFixed(2)}/kg
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      ₹{Number(o.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/orders/${o.orderId}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                      >
                        <Eye size={12} />
                        <span>Inspect &rarr;</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
