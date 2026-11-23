import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  ShoppingBag,
  Clock,
  Truck,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';

export const BuyerOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

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
      console.error('Failed to load buyer orders:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load purchase orders.');
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
      setError(null);
      await buyerApi.cancelOrder(orderToCancel.orderId, cancelReason || 'Buyer requested cancellation');
      setActionSuccess(`Order #ORD-${orderToCancel.orderId} cancelled. Produce inventory restored to farmer.`);
      setCancelModalOpen(false);
      setOrderToCancel(null);
      await loadOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const activeOrders = orders.filter((o) => ['ACCEPTED', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT'].includes(o.status)).length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalSpend = orders
    .filter((o) => ['ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Filter
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'CLOSED'
        ? ['CANCELLED', 'REJECTED'].includes(ord.status)
        : ord.status === statusFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(ord.orderId).includes(term) ||
      ord.cropName?.toLowerCase().includes(term) ||
      ord.farmerName?.toLowerCase().includes(term) ||
      ord.cropCategory?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingBag size={26} color="var(--color-primary)" />
            <span>Purchase Orders</span>
          </h1>
          <p className="page-subtitle">
            Track commercial contracts placed with verified farmers, delivery dispatches, and fulfillment status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/buyer/matches')}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            <span>Find Matching Harvests</span>
          </button>
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
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
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Orders"
          value={loading ? '...' : totalOrders}
          description="All contract inquiries"
          icon={ShoppingBag}
          variant="primary"
        />
        <DashboardCard
          title="Awaiting Acceptance"
          value={loading ? '...' : pendingOrders}
          description={pendingOrders > 0 ? 'Pending farmer review' : 'No pending offers'}
          icon={Clock}
          variant="secondary"
          trend={pendingOrders > 0 ? `+${pendingOrders}` : null}
          trendLabel={pendingOrders > 0 ? 'Pending' : null}
        />
        <DashboardCard
          title="In Transit / Shipped"
          value={loading ? '...' : activeOrders}
          description="Accepted or dispatched"
          icon={Truck}
          variant="accent"
        />
        <DashboardCard
          title="Settled Spend"
          value={loading ? '...' : `₹${Number(totalSpend).toLocaleString('en-IN')}`}
          description={`${deliveredOrders} delivered orders`}
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="tab-group">
          {['ALL', 'PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CLOSED'].map((tab) => (
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
            placeholder="Search crop, farmer, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Loading purchase contracts..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
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
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Order Details</th>
                <th>Crop & Grade</th>
                <th>Farmer & Location</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
                <th style={{ textAlign: 'right' }}>Agreed Price</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const isPending = ord.status === 'PENDING';
                return (
                  <tr key={ord.orderId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#ORD-{ord.orderId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ord.cropName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ord.cropCategory}</span>
                        {ord.qualityGrade && (
                          <StatusBadge status={ord.qualityGrade} type="grade" />
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ord.farmerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.farmLocation}>
                        {ord.farmLocation || 'Farm address'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600 }}>
                      {Number(ord.quantity).toLocaleString()} kg
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      ₹{Number(ord.agreedPricePerKg).toFixed(2)} / kg
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <StatusBadge status={ord.status} />
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancel(ord)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.3rem 0.6rem' }}
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/buyer/orders/${ord.orderId}`)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.65rem' }}
                        >
                          Details &rarr;
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && orderToCancel && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Purchase Order #ORD-${orderToCancel.orderId}`}
          maxWidth="460px"
        >
          <form onSubmit={handleConfirmCancel} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Cancelling will atomically release the reserved <strong>{Number(orderToCancel.quantity).toLocaleString()} kg</strong> of {orderToCancel.cropName} back to the farmer's marketplace stock.
            </p>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Cancellation Reason <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Shared with farmer)</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed procurement schedule, alternative logistics arranged, pricing mismatch..."
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="btn btn-secondary"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="btn btn-danger"
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
