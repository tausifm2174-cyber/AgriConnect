import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  ShoppingBag,
  RefreshCw,
  Check,
  X,
  Clock,
  Truck,
  CreditCard,
  Search,
  AlertTriangle
} from 'lucide-react';

export const FarmerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [orderToAccept, setOrderToAccept] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await farmerApi.getOrders();
      if (res.data && res.data.success) {
        setOrders(res.data.data || []);
      } else {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.message || 'Failed to load incoming orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAccept = (order) => {
    setOrderToAccept(order);
    setAcceptConfirmOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!orderToAccept) return;
    try {
      setActionLoading(true);
      const res = await farmerApi.acceptOrder(orderToAccept.orderId);
      setAcceptConfirmOpen(false);
      setOrderToAccept(null);
      setActionSuccess(`Order #${orderToAccept.orderId} accepted successfully! Harvest inventory reserved.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadOrders();
    } catch (err) {
      console.error('Error accepting order:', err);
      setActionError(err.response?.data?.message || 'Failed to accept order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (order) => {
    setActionError(null);
    setOrderToReject(order);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!orderToReject) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await farmerApi.rejectOrder(orderToReject.orderId, {
        reason: rejectReason.trim() || 'Rejected by farmer due to capacity or scheduling constraints'
      });
      setRejectModalOpen(false);
      setOrderToReject(null);
      setRejectReason('');
      setActionSuccess(`Order #${orderToReject.orderId} rejected. Harvest stock has been restored to marketplace.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadOrders();
    } catch (err) {
      console.error('Error rejecting order:', err);
      setActionError(err.response?.data?.message || 'Failed to reject order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ['PENDING', 'ACCEPTED', 'SHIPPED'].includes(o.status)) ||
      (statusFilter === 'COMPLETED' && o.status === 'DELIVERED') ||
      (statusFilter === 'CLOSED' && ['REJECTED', 'CANCELLED'].includes(o.status)) ||
      o.status === statusFilter;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (o.cropName && o.cropName.toLowerCase().includes(searchLower)) ||
      (o.buyerName && o.buyerName.toLowerCase().includes(searchLower)) ||
      (o.businessName && o.businessName.toLowerCase().includes(searchLower)) ||
      String(o.orderId).includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const activeOrders = orders.filter((o) => ['ACCEPTED', 'SHIPPED'].includes(o.status)).length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalRevenue = orders
    .filter((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingBag size={26} color="var(--color-primary)" />
            <span>Incoming Purchase Orders</span>
          </h1>
          <p className="page-subtitle">
            Review, accept, or reject commercial buyer procurement offers for your verified harvest lots.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {actionSuccess && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--color-primary-subtle)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 600 }}>
            <Check size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Orders"
          value={loading ? '...' : totalOrders}
          description="All contract inquiries"
          icon={ShoppingBag}
          variant="primary"
        />
        <DashboardCard
          title="Pending Approval"
          value={loading ? '...' : pendingOrders}
          description={pendingOrders > 0 ? "Awaiting your response" : "Inbox up to date"}
          icon={Clock}
          variant="secondary"
          trend={pendingOrders > 0 ? `+${pendingOrders}` : null}
          trendLabel={pendingOrders > 0 ? 'Pending' : null}
        />
        <DashboardCard
          title="Active Contracts"
          value={loading ? '...' : activeOrders}
          description="Accepted or in transit"
          icon={Truck}
          variant="accent"
        />
        <DashboardCard
          title="Contract Volume"
          value={loading ? '...' : `₹${Number(totalRevenue).toLocaleString('en-IN')}`}
          description={`${deliveredOrders} completed deliveries`}
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="tab-group">
          {['ALL', 'PENDING', 'ACCEPTED', 'DELIVERED', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
            >
              {tab === 'CLOSED' ? 'Cancelled / Rejected' : tab}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search crop, buyer, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading your incoming purchase orders..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadOrders} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No orders match your filter criteria.'
              : 'You have not received any commercial purchase orders yet. Ensure your harvest lots have verified quality assessments.'
          }
          actionLabel="View Harvest Lots"
          onAction={() => navigate('/farmer/harvests')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Order Details</th>
                  <th className="px-4 py-3.5 text-left">Buyer</th>
                  <th className="px-4 py-3.5 text-left">Produce & Grade</th>
                  <th className="px-4 py-3.5 text-right">Quantity & Terms</th>
                  <th className="px-4 py-3.5 text-right">Total Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  const isAccepted = order.status === 'ACCEPTED';
                  return (
                    <tr key={order.orderId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">#ORD-{order.orderId}</div>
                        <div className="text-xs text-gray-500">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.buyerName || 'Buyer'}</div>
                        <div className="text-xs text-gray-500">{order.businessName || order.buyerEmail || 'Commercial Buyer'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.cropName || 'Crop'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-500">{order.cropCategory}</span>
                          {order.qualityGrade && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Grade {order.qualityGrade} ({Number(order.qualityScore).toFixed(1)}/5)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-medium text-gray-900">{Number(order.quantity).toLocaleString()} kg</div>
                        <div className="text-xs text-gray-500">₹{Number(order.agreedPricePerKg).toFixed(2)} / kg</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-bold text-emerald-600">₹{Number(order.totalAmount).toLocaleString('en-IN')}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenAccept(order)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                              title="Accept Order"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleOpenReject(order)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                              title="Reject Order"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() => navigate('/farmer/deliveries')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            title="Manage Dispatch"
                          >
                            Dispatch &rarr;
                          </button>
                        )}

                        <button
                          onClick={() => handleViewDetails(order)}
                          className="px-2 py-1 text-xs font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          Details
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

      {/* View Order Details Modal */}
      {detailsModalOpen && selectedOrder && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Order Details: #ORD-${selectedOrder.orderId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                <div className="mt-1"><StatusBadge status={selectedOrder.status} /></div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Total Contract Value</span>
                <div className="text-xl font-bold text-emerald-600">
                  ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase">Crop Information</div>
                <div className="mt-1 font-semibold text-gray-900">{selectedOrder.cropName}</div>
                <div className="text-xs text-gray-600">Category: {selectedOrder.cropCategory}</div>
                <div className="text-xs text-gray-600">Harvest Lot ID: #{selectedOrder.harvestId}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase">Buyer Details</div>
                <div className="mt-1 font-semibold text-gray-900">{selectedOrder.buyerName}</div>
                <div className="text-xs text-gray-600">{selectedOrder.businessName || 'Independent Wholesale'}</div>
                <div className="text-xs text-gray-600">{selectedOrder.buyerEmail} | {selectedOrder.buyerPhone || 'No Phone'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <div>
                <span className="text-xs text-emerald-700">Contract Quantity</span>
                <p className="font-semibold text-gray-900">{Number(selectedOrder.quantity).toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-xs text-emerald-700">Agreed Price</span>
                <p className="font-semibold text-gray-900">₹{Number(selectedOrder.agreedPricePerKg).toFixed(2)} / kg</p>
              </div>
              <div>
                <span className="text-xs text-emerald-700">Quality Verified</span>
                <p className="font-semibold text-gray-900">
                  Grade {selectedOrder.qualityGrade || 'N/A'} ({Number(selectedOrder.qualityScore || 0).toFixed(1)}/5)
                </p>
              </div>
            </div>

            {selectedOrder.remarks && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase">Order Remarks / Logistics Notes</div>
                <p className="mt-1 text-gray-700">{selectedOrder.remarks}</p>
              </div>
            )}

            {selectedOrder.cancellationReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs font-semibold text-red-600 uppercase">Cancellation / Rejection Reason</div>
                <p className="mt-1 text-red-800">{selectedOrder.cancellationReason}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 pt-2 flex justify-between">
              <span>Created: {new Date(selectedOrder.orderDate).toLocaleString('en-IN')}</span>
              {selectedOrder.updatedAt && (
                <span>Last Updated: {new Date(selectedOrder.updatedAt).toLocaleString('en-IN')}</span>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Order Reason Modal */}
      {rejectModalOpen && orderToReject && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Reject Order #ORD-${orderToReject.orderId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting this order will atomically restore the <strong>{Number(orderToReject.quantity).toLocaleString()} kg</strong> of {orderToReject.cropName} back to your active harvest lot stock.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection <span className="text-xs text-gray-400">(Shared with buyer)</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Inability to meet specified delivery window, capacity shortfall, or transit limitation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Accept Confirmation Dialog */}
      <ConfirmDialog
        isOpen={acceptConfirmOpen}
        onClose={() => setAcceptConfirmOpen(false)}
        onConfirm={handleConfirmAccept}
        title="Accept Purchase Order"
        message={
          orderToAccept
            ? `Are you sure you want to accept order #ORD-${orderToAccept.orderId} from ${orderToAccept.buyerName} for ${orderToAccept.quantity} kg of ${orderToAccept.cropName} at ₹${orderToAccept.agreedPricePerKg}/kg (Total: ₹${orderToAccept.totalAmount})?`
            : ''
        }
        confirmText="Accept Order"
        confirmVariant="primary"
        loading={actionLoading}
      />
    </div>
  );
};

export default FarmerOrders;
