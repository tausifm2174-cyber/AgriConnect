import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await buyerApi.getOrders();
      const data = res.data?.data || res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancel = (ord) => {
    setOrderToCancel(ord);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!orderToCancel) return;

    try {
      setCancelling(true);
      await buyerApi.cancelOrder(orderToCancel.orderId, {
        reason: cancelReason.trim() || 'Cancelled by buyer before farmer acceptance'
      });
      setCancelModalOpen(false);
      setOrderToCancel(null);
      setActionSuccess(`Order #ORD-${orderToCancel.orderId} cancelled successfully. Reserved harvest stock restored.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ['PENDING', 'ACCEPTED', 'SHIPPED'].includes(o.status)) ||
      (statusFilter === 'CLOSED' && ['CANCELLED', 'REJECTED'].includes(o.status)) ||
      o.status === statusFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (o.cropName && o.cropName.toLowerCase().includes(term)) ||
      (o.farmerName && o.farmerName.toLowerCase().includes(term)) ||
      (o.farmLocation && o.farmLocation.toLowerCase().includes(term)) ||
      String(o.orderId).includes(term);

    return matchesStatus && matchesSearch;
  });

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const activeOrders = orders.filter((o) => ['ACCEPTED', 'SHIPPED'].includes(o.status)).length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalSpend = orders
    .filter((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track commercial contracts placed with verified farmers, delivery dispatches, and fulfillment status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/buyer/matches')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Find Matching Harvests
          </button>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-sm">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={loadOrders} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Orders"
          value={totalOrders}
          subtitle="All contract inquiries"
          icon="shopping-bag"
          color="emerald"
        />
        <DashboardCard
          title="Awaiting Acceptance"
          value={pendingOrders}
          subtitle="Pending farmer review"
          icon="clock"
          color={pendingOrders > 0 ? "amber" : "gray"}
        />
        <DashboardCard
          title="In Transit / Shipped"
          value={activeOrders}
          subtitle="Accepted or dispatched"
          icon="truck"
          color="blue"
        />
        <DashboardCard
          title="Settled Spend"
          value={`₹${totalSpend.toLocaleString('en-IN')}`}
          subtitle={`${deliveredOrders} delivered orders`}
          icon="currency-rupee"
          color="emerald"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'CLOSED' ? 'Cancelled / Rejected' : tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search crop, farmer, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Loading purchase contracts..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No orders match your filter criteria.'
              : 'You have not placed any commercial purchase orders yet. Discover verified harvest lots via Quality-Aware Matching.'
          }
          actionLabel="Find Matching Harvests"
          onAction={() => navigate('/buyer/matches')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Order Details</th>
                  <th className="px-4 py-3.5 text-left">Crop & Grade</th>
                  <th className="px-4 py-3.5 text-left">Farmer & Location</th>
                  <th className="px-4 py-3.5 text-right">Volume</th>
                  <th className="px-4 py-3.5 text-right">Agreed Price</th>
                  <th className="px-4 py-3.5 text-right">Total Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOrders.map((ord) => {
                  const isPending = ord.status === 'PENDING';
                  return (
                    <tr key={ord.orderId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">#ORD-{ord.orderId}</div>
                        <div className="text-[11px] text-gray-500">
                          {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{ord.cropName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-500">{ord.cropCategory}</span>
                          {ord.qualityGrade && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Grade {ord.qualityGrade} ({Number(ord.qualityScore || 0).toFixed(1)}/5)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900">{ord.farmerName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={ord.farmLocation}>
                          {ord.farmLocation || 'Farm address'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-semibold text-gray-900">{Number(ord.quantity).toLocaleString()} kg</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-medium text-gray-900">₹{Number(ord.agreedPricePerKg).toFixed(2)}/kg</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-bold text-emerald-600">
                          ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <StatusBadge status={ord.status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                        {isPending && (
                          <button
                            onClick={() => handleOpenCancel(ord)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/buyer/orders/${ord.orderId}`)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                        >
                          Details &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && orderToCancel && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Purchase Order #ORD-${orderToCancel.orderId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-4 text-sm">
            <p className="text-xs text-gray-600 leading-relaxed">
              Cancelling will atomically release the reserved <strong>{Number(orderToCancel.quantity).toLocaleString()} kg</strong> of {orderToCancel.cropName} back to the farmer's marketplace stock.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cancellation Reason <span className="text-gray-400 font-normal">(Shared with farmer)</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed procurement schedule, alternative logistics arranged, pricing mismatch..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BuyerOrders;
