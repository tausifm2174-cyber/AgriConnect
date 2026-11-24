import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SelectField from '../../components/SelectField';
import TextareaField from '../../components/TextareaField';
import {
  ShoppingBag,
  RefreshCw,
  Check,
  X,
  Clock,
  Truck,
  CreditCard,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Award,
  User,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  RotateCcw
} from 'lucide-react';

const REJECTION_REASONS = [
  { value: 'Insufficient available stock', label: 'Insufficient available stock' },
  { value: 'Price not acceptable', label: 'Price not acceptable' },
  { value: 'Delivery arrangement unavailable', label: 'Delivery arrangement unavailable' },
  { value: 'Requirement mismatch', label: 'Requirement mismatch' },
  { value: 'Quality concern', label: 'Quality concern' },
  { value: 'Other', label: 'Other' },
];

export const FarmerOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Accept Confirmation Modal
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [orderToAccept, setOrderToAccept] = useState(null);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [rejectReasonSelect, setRejectReasonSelect] = useState('Insufficient available stock');
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await farmerApi.getOrders();
      const data = res.data?.data || res.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading farmer orders:', err);
      setError(err.response?.data?.message || 'We couldn\'t retrieve your incoming orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAccept = (order) => {
    setActionError(null);
    setOrderToAccept(order);
    setAcceptModalOpen(true);
  };

  const handleConfirmAccept = async (e) => {
    if (e) e.preventDefault();
    if (!orderToAccept) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await farmerApi.acceptOrder(orderToAccept.orderId);
      setAcceptModalOpen(false);
      if (detailsModalOpen && selectedOrder?.orderId === orderToAccept.orderId) {
        setDetailsModalOpen(false);
      }
      setActionSuccess(`Purchase Order #ORD-${orderToAccept.orderId} accepted successfully! Harvest lot inventory reserved.`);
      setOrderToAccept(null);
      await loadOrders();
    } catch (err) {
      console.error('Error accepting order:', err);
      setActionError(err.response?.data?.message || 'Failed to accept purchase order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (order) => {
    setActionError(null);
    setOrderToReject(order);
    setRejectReasonSelect('Insufficient available stock');
    setRejectRemarks('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!orderToReject) return;
    try {
      setActionLoading(true);
      setActionError(null);

      const combinedReason = rejectRemarks.trim()
        ? `${rejectReasonSelect}: ${rejectRemarks.trim()}`.slice(0, 255)
        : rejectReasonSelect;

      await farmerApi.rejectOrder(orderToReject.orderId, {
        reason: combinedReason
      });

      setRejectModalOpen(false);
      if (detailsModalOpen && selectedOrder?.orderId === orderToReject.orderId) {
        setDetailsModalOpen(false);
      }
      setActionSuccess(`Purchase Order #ORD-${orderToReject.orderId} rejected. Reserved harvest stock restored to marketplace.`);
      setOrderToReject(null);
      setRejectRemarks('');
      await loadOrders();
    } catch (err) {
      console.error('Error rejecting order:', err);
      setActionError(err.response?.data?.message || 'Unable to reject order. Please refresh the page and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setSearchTerm('');
  };

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const acceptedOrders = orders.filter((o) => ['ACCEPTED', 'CONFIRMED'].includes(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalRevenue = orders
    .filter((o) => ['ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CLOSED' && ['REJECTED', 'CANCELLED'].includes(o.status)) ||
      o.status === statusFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(o.orderId).includes(term) ||
      (o.cropName && o.cropName.toLowerCase().includes(term)) ||
      (o.buyerName && o.buyerName.toLowerCase().includes(term)) ||
      (o.businessName && o.businessName.toLowerCase().includes(term)) ||
      (o.cropCategory && o.cropCategory.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  const hasActiveFilters = statusFilter !== 'ALL' || searchTerm.trim() !== '';

  return (
    <div className="space-y-6" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingBag size={26} color="var(--color-primary)" />
            <span>Incoming Purchase Orders</span>
          </h1>
          <p className="page-subtitle">
            Review buyer requests, inspect commercial terms, and manage incoming purchase orders.
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

      {/* Action Success Alert */}
      {actionSuccess && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--color-primary-subtle)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
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

      {/* Action Error Alert */}
      {actionError && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
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

      {/* KPI Cards Grid */}
      <div className="grid-cards">
        <DashboardCard
          title="New Requests"
          value={loading ? '...' : pendingOrders}
          description={pendingOrders > 0 ? "Awaiting your decision" : "Inbox up to date"}
          icon={Clock}
          variant="secondary"
          trend={pendingOrders > 0 ? `+${pendingOrders}` : null}
          trendLabel={pendingOrders > 0 ? 'Pending' : null}
        />
        <DashboardCard
          title="Awaiting Decision"
          value={loading ? '...' : pendingOrders}
          description={pendingOrders > 0 ? "Action required" : "No pending items"}
          icon={AlertCircle}
          variant={pendingOrders > 0 ? "warning" : "secondary"}
        />
        <DashboardCard
          title="Accepted"
          value={loading ? '...' : acceptedOrders}
          description="Under active contract"
          icon={CheckCircle2}
          variant="primary"
        />
        <DashboardCard
          title="Completed"
          value={loading ? '...' : completedOrders}
          description="Successfully fulfilled"
          icon={CheckCircle2}
          variant="success"
        />
        <DashboardCard
          title="Total Order Value"
          value={loading ? '...' : `₹${Number(totalRevenue).toLocaleString('en-IN')}`}
          description="From accepted contracts"
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Search Orders
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search by buyer, order #, or crop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Status SelectField */}
          <div className="w-full md:w-64">
            <SelectField
              label="Order Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Incoming Orders' },
                { value: 'PENDING', label: 'Pending Decision' },
                { value: 'ACCEPTED', label: 'Accepted by Farmer' },
                { value: 'CONFIRMED', label: 'Confirmed Contract' },
                { value: 'SHIPPED', label: 'Dispatched in Transit' },
                { value: 'DELIVERED', label: 'Delivered & Completed' },
                { value: 'CLOSED', label: 'Closed / Terminated' },
              ]}
              size="md"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-secondary text-xs h-[38px] px-3 flex items-center justify-center gap-1.5 self-end"
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Loading your incoming purchase orders..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadOrders} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Incoming Purchase Orders"
          description={
            hasActiveFilters
              ? 'No incoming orders match your filter criteria. Try clearing the search or status filter.'
              : 'New buyer purchase requests will appear here when buyers place orders against your harvest lots.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'View Harvest Lots'}
          onAction={hasActiveFilters ? handleClearFilters : () => navigate('/farmer/harvests')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Order & Commodity</th>
                  <th className="px-4 py-3.5 text-left">Buyer Profile</th>
                  <th className="px-4 py-3.5 text-left">Quality Standard</th>
                  <th className="px-4 py-3.5 text-right">Commercial Terms</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right" style={{ minWidth: '220px' }}>Action Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  const isAccepted = order.status === 'ACCEPTED';
                  const isDelivered = order.status === 'DELIVERED';
                  const isTerminated = order.status === 'CANCELLED' || order.status === 'REJECTED';
                  const isShippedOrConfirmed = order.status === 'SHIPPED' || order.status === 'CONFIRMED';

                  return (
                    <tr key={order.orderId} className="hover:bg-gray-50/70 transition-colors">
                      {/* Identity: Order & Commodity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">#ORD-{order.orderId}</span>
                          {order.harvestId && (
                            <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              #HAR-{order.harvestId}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-800 text-xs mt-1">
                          {order.cropName}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} className="text-gray-400" />
                          <span>
                            {order.orderDate
                              ? new Date(order.orderDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">
                          {order.buyerName || 'Commercial Buyer'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {order.businessName || 'Independent Wholesale'}
                        </div>
                        {order.buyerEmail && (
                          <div className="text-[11px] font-mono text-gray-400 mt-0.5 truncate max-w-[180px]">
                            {order.buyerEmail}
                          </div>
                        )}
                      </td>

                      {/* Quality */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.qualityGrade ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Grade {order.qualityGrade}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Standard</span>
                          )}
                          <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {order.qualityScore != null
                              ? `${Number(order.qualityScore).toFixed(1)} / 100`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-600" />
                          <span>{order.qualityVerificationStatus || 'OFFICIALLY_VERIFIED'}</span>
                        </div>
                      </td>

                      {/* Commercial Terms */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-gray-900">
                          {Number(order.quantity).toLocaleString()} kg
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{Number(order.agreedPricePerKg).toFixed(2)} / kg
                        </div>
                        <div className="font-black text-emerald-700 text-sm mt-0.5">
                          ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Action Center with Strict Visual Hierarchy */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Inspect is always available as secondary */}
                          <button
                            type="button"
                            onClick={() => handleViewDetails(order)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1"
                            title="Inspect complete order specifications"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>

                          {/* For PENDING: Accept (primary positive) & Reject (destructive) */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenAccept(order)}
                                className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1"
                                title="Accept this purchase order"
                              >
                                <Check size={13} />
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(order)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1"
                                title="Reject this purchase order"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* For ACCEPTED: Route to Deliveries dispatch */}
                          {isAccepted && (
                            <button
                              type="button"
                              onClick={() => navigate('/farmer/deliveries')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                              title="Proceed to create delivery dispatch"
                            >
                              <Truck size={13} />
                              <span>Dispatch &rarr;</span>
                            </button>
                          )}

                          {/* For SHIPPED / CONFIRMED: Route to tracking */}
                          {isShippedOrConfirmed && (
                            <button
                              type="button"
                              onClick={() => navigate('/farmer/deliveries')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center gap-1"
                              title="Track delivery logistics"
                            >
                              <Truck size={13} />
                              <span>Track</span>
                            </button>
                          )}

                          {/* For DELIVERED: Informational badge */}
                          {isDelivered && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Fulfilled
                            </span>
                          )}

                          {/* For TERMINATED: Informational badge */}
                          {isTerminated && (
                            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECT ORDER MODAL */}
      {detailsModalOpen && selectedOrder && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Purchase Order #ORD-${selectedOrder.orderId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            {/* Modal Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} />
                {selectedOrder.qualityGrade && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Grade {selectedOrder.qualityGrade}
                  </span>
                )}
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Contract Value</span>
                <span className="text-xl font-black text-emerald-700">
                  ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Lifecycle Progress Stepper */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-3">
                Contract Fulfillment Lifecycle
              </span>

              {selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'REJECTED' ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span>Order Terminated ({selectedOrder.status})</span>
                  </div>
                  <p className="text-red-700 mt-1">
                    Reason: {selectedOrder.cancellationReason || selectedOrder.remarks || 'No specific reason recorded.'}
                  </p>
                </div>
              ) : (
                (() => {
                  const stages = [
                    { key: 'PENDING', label: 'Order Placed' },
                    { key: 'ACCEPTED', label: 'Accepted' },
                    { key: 'CONFIRMED', label: 'Confirmed' },
                    { key: 'SHIPPED', label: 'Dispatched' },
                    { key: 'DELIVERED', label: 'Delivered' },
                  ];
                  const stageOrder = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
                  const currentIndex = stageOrder.indexOf(selectedOrder.status);

                  return (
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {stages.map((stage, idx) => {
                        const isPast = currentIndex > idx;
                        const isCurrent = currentIndex === idx;
                        return (
                          <div key={stage.key} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isPast
                                  ? 'bg-emerald-600'
                                  : isCurrent
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-gray-200'
                              }`}
                            />
                            <div
                              className={`text-[10px] font-bold leading-tight ${
                                isPast || isCurrent ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {stage.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Spec Cards: 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Profile */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <User size={14} className="text-emerald-600" />
                  <span>Buyer Information</span>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{selectedOrder.buyerName || 'Buyer'}</div>
                  <div className="text-xs text-gray-600">{selectedOrder.businessName || 'Wholesale Buyer'}</div>
                  {selectedOrder.buyerEmail && (
                    <div className="text-xs font-mono text-gray-600 mt-1">{selectedOrder.buyerEmail}</div>
                  )}
                  {selectedOrder.buyerPhone && (
                    <div className="text-xs text-gray-600">{selectedOrder.buyerPhone}</div>
                  )}
                </div>
              </div>

              {/* Commodity & Lot */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <Award size={14} className="text-emerald-600" />
                  <span>Produce & Harvest Lot</span>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{selectedOrder.cropName}</div>
                  <div className="text-xs text-gray-600">Category: {selectedOrder.cropCategory}</div>
                  <div className="text-xs text-gray-600 font-mono mt-1">Lot Ref: #HAR-{selectedOrder.harvestId}</div>
                  {selectedOrder.requirementId && (
                    <div className="text-xs text-emerald-700 font-medium mt-0.5">
                      Matched Req: #REQ-{selectedOrder.requirementId}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verified Quality & Commercial Terms Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <div>
                <span className="text-xs text-emerald-800 font-semibold uppercase">Contract Quantity</span>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {Number(selectedOrder.quantity).toLocaleString()} kg
                </p>
              </div>
              <div>
                <span className="text-xs text-emerald-800 font-semibold uppercase">Agreed Unit Price</span>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  ₹{Number(selectedOrder.agreedPricePerKg).toFixed(2)} / kg
                </p>
              </div>
              <div>
                <span className="text-xs text-emerald-800 font-semibold uppercase">Quality Assurance</span>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  Grade {selectedOrder.qualityGrade || 'A'} · {Number(selectedOrder.qualityScore || 0).toFixed(1)} / 100
                </p>
              </div>
            </div>

            {/* Remarks / Logistics Notes */}
            {selectedOrder.remarks && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase block">Buyer Remarks & Logistics</span>
                <p className="text-xs text-gray-800 mt-1 italic">"{selectedOrder.remarks}"</p>
              </div>
            )}

            {/* Footer with Contextual Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">
                Placed on {new Date(selectedOrder.orderDate).toLocaleString('en-IN')}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Close
                </button>

                {/* If PENDING, enable Accept or Reject directly from modal */}
                {selectedOrder.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenReject(selectedOrder);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      Reject Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenAccept(selectedOrder);
                      }}
                      className="btn btn-primary text-xs"
                    >
                      Accept Order
                    </button>
                  </>
                )}

                {selectedOrder.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      navigate('/farmer/deliveries');
                    }}
                    className="btn btn-primary text-xs flex items-center gap-1"
                  >
                    <Truck size={13} />
                    <span>Manage Dispatch &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ACCEPT ORDER CONFIRMATION MODAL */}
      {acceptModalOpen && orderToAccept && (
        <Modal
          isOpen={acceptModalOpen}
          onClose={() => setAcceptModalOpen(false)}
          title={`Accept Purchase Order #ORD-${orderToAccept.orderId}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Please review the commercial procurement terms before accepting:
            </p>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Order Reference:</span>
                <span className="font-bold text-gray-900">#ORD-{orderToAccept.orderId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Buyer:</span>
                <span className="font-bold text-gray-900">{orderToAccept.buyerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Commodity:</span>
                <span className="font-semibold text-gray-900">{orderToAccept.cropName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-bold text-gray-900">{Number(orderToAccept.quantity).toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Agreed Price:</span>
                <span className="font-semibold text-gray-900">₹{Number(orderToAccept.agreedPricePerKg).toFixed(2)} / kg</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <span className="font-bold uppercase tracking-wider text-emerald-900 text-[11px]">
                  Total Purchase Value:
                </span>
                <span className="text-lg font-black text-emerald-700">
                  ₹{Number(orderToAccept.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              Accepting this order confirms the commercial request.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                disabled={actionLoading}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={actionLoading}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Accepting...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Accept Purchase Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT ORDER MODAL */}
      {rejectModalOpen && orderToReject && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Reject Purchase Order #ORD-${orderToReject.orderId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <p className="text-xs text-gray-600">
              Rejecting this order will release the reserved <strong>{Number(orderToReject.quantity).toLocaleString()} kg</strong> of {orderToReject.cropName} back to active marketplace stock.
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Order:</span>
                <span className="font-bold text-gray-900">#ORD-{orderToReject.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Buyer:</span>
                <span className="font-semibold text-gray-900">{orderToReject.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity & Price:</span>
                <span className="font-semibold text-gray-900">
                  {Number(orderToReject.quantity).toLocaleString()} kg @ ₹{Number(orderToReject.agreedPricePerKg).toFixed(2)}/kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Value:</span>
                <span className="font-bold text-emerald-700">₹{Number(orderToReject.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Rejection Reason (SelectField) */}
            <div>
              <SelectField
                label="Rejection Reason *"
                value={rejectReasonSelect}
                onChange={(e) => setRejectReasonSelect(e.target.value)}
                options={REJECTION_REASONS}
                size="md"
              />
            </div>

            {/* Additional Remarks (TextareaField) */}
            <div>
              <TextareaField
                label="Additional Remarks"
                rows={3}
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="Explain why this order cannot be fulfilled (shared with buyer)..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-danger text-xs flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X size={14} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FarmerOrders;