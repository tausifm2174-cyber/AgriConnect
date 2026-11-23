import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SelectField from '../../components/SelectField';
import {
  Truck,
  Clock,
  CheckCircle2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  FileText
} from 'lucide-react';

export const FarmerDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [deliveryToComplete, setDeliveryToComplete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState({
    orderId: '',
    deliveryAddress: '',
    vehicleNumber: '',
    trackingNumber: '',
    remarks: ''
  });

  const [shipForm, setShipForm] = useState({
    trackingNumber: '',
    vehicleNumber: '',
    deliveryAddress: '',
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [delRes, ordRes] = await Promise.all([
        farmerApi.getDeliveries(),
        farmerApi.getOrders()
      ]);
      setDeliveries(delRes.data || []);
      setOrders(ordRes.data || []);
    } catch (err) {
      console.error('Failed to load farmer deliveries:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load deliveries data.');
    } finally {
      setLoading(false);
    }
  };

  // Orders eligible for new delivery dispatch (ACCEPTED/CONFIRMED that don't already have a delivery)
  const existingDeliveryOrderIds = new Set(deliveries.map((d) => d.orderId));
  const dispatchEligibleOrders = orders.filter(
    (o) => ['ACCEPTED', 'CONFIRMED'].includes(o.status) && !existingDeliveryOrderIds.has(o.orderId)
  );

  // Action handlers
  const handleOpenCreate = () => {
    if (dispatchEligibleOrders.length > 0) {
      const first = dispatchEligibleOrders[0];
      setCreateForm({
        orderId: first.orderId,
        deliveryAddress: first.farmLocation || '',
        vehicleNumber: '',
        trackingNumber: `TRK-${Date.now().toString().slice(-6)}`,
        remarks: ''
      });
    } else {
      setCreateForm({
        orderId: '',
        deliveryAddress: '',
        vehicleNumber: '',
        trackingNumber: `TRK-${Date.now().toString().slice(-6)}`,
        remarks: ''
      });
    }
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.orderId) {
      setError('Please select an accepted order for dispatch.');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await farmerApi.createDelivery({
        orderId: Number(createForm.orderId),
        deliveryAddress: createForm.deliveryAddress,
        vehicleNumber: createForm.vehicleNumber,
        trackingNumber: createForm.trackingNumber,
        remarks: createForm.remarks
      });
      setActionSuccess(`Delivery dispatch record created for Order #ORD-${createForm.orderId}!`);
      setCreateModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create delivery:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create dispatch record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenShip = (delivery) => {
    setSelectedDelivery(delivery);
    setShipForm({
      trackingNumber: delivery.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      vehicleNumber: delivery.vehicleNumber || '',
      deliveryAddress: delivery.deliveryAddress || '',
      remarks: delivery.remarks || ''
    });
    setShipModalOpen(true);
  };

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    try {
      setActionLoading(true);
      setError(null);
      await farmerApi.shipDelivery(selectedDelivery.deliveryId, shipForm);
      setActionSuccess(`Shipment #DEL-${selectedDelivery.deliveryId} dispatched successfully!`);
      setShipModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to dispatch shipment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to dispatch shipment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDelivery = (delivery) => {
    setDeliveryToComplete(delivery);
    setCompleteConfirmOpen(true);
  };

  const handleConfirmCompleteDelivery = async () => {
    if (!deliveryToComplete) return;
    try {
      setActionLoading(true);
      setError(null);
      await farmerApi.completeDelivery(deliveryToComplete.deliveryId);
      setActionSuccess(`Shipment #DEL-${deliveryToComplete.deliveryId} marked as DELIVERED!`);
      setCompleteConfirmOpen(false);
      setDeliveryToComplete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to complete delivery:', err);
      setError(err.response?.data?.message || err.message || 'Failed to mark delivery as completed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setDetailsModalOpen(true);
  };

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((del) => {
    const matchesStatus = statusFilter === 'ALL' || del.deliveryStatus === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(del.deliveryId).includes(term) ||
      String(del.orderId).includes(term) ||
      del.cropName?.toLowerCase().includes(term) ||
      del.buyerName?.toLowerCase().includes(term) ||
      del.trackingNumber?.toLowerCase().includes(term) ||
      del.vehicleNumber?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  // KPI calculations
  const totalDeliveries = deliveries.length;
  const inTransitCount = deliveries.filter((d) => ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
  const deliveredCount = deliveries.filter((d) => d.deliveryStatus === 'DELIVERED').length;
  const totalWeightDelivered = deliveries
    .filter((d) => d.deliveryStatus === 'DELIVERED')
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={26} color="var(--color-primary)" />
            <span>Delivery & Logistics</span>
          </h1>
          <p className="page-subtitle">
            Dispatch contracted harvest lots, update vehicle & tracking identifiers, and confirm buyer receipt.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {dispatchEligibleOrders.length > 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create Dispatch ({dispatchEligibleOrders.length} ready)</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
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

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Shipments"
          value={loading ? '...' : totalDeliveries}
          description="All logistics dispatches"
          icon={Truck}
          variant="primary"
        />
        <DashboardCard
          title="In Transit"
          value={loading ? '...' : inTransitCount}
          description="Actively on the road to buyers"
          icon={Clock}
          variant="secondary"
          trend={inTransitCount > 0 ? `+${inTransitCount}` : null}
          trendLabel={inTransitCount > 0 ? 'Active' : null}
        />
        <DashboardCard
          title="Delivered Orders"
          value={loading ? '...' : deliveredCount}
          description="Successfully fulfilled contracts"
          icon={CheckCircle2}
          variant="success"
        />
        <DashboardCard
          title="Delivered Volume"
          value={loading ? '...' : `${Number(totalWeightDelivered).toLocaleString()} kg`}
          description="Produce safely received by buyers"
          icon={PackageCheck}
          variant="accent"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="filter-bar">
        <div className="tab-group">
          {['ALL', 'PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search tracking, vehicle, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading delivery shipments..." />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No delivery shipments found"
          description={
            dispatchEligibleOrders.length > 0
              ? `You have ${dispatchEligibleOrders.length} accepted order(s) awaiting dispatch creation!`
              : 'You do not have any active shipments. Deliveries are generated once purchase orders are accepted.'
          }
          actionLabel={dispatchEligibleOrders.length > 0 ? 'Create Dispatch' : 'View Orders'}
          onAction={dispatchEligibleOrders.length > 0 ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Order & Crop</th>
                <th>Buyer & Address</th>
                <th>Tracking & Vehicle</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((del) => {
                const isPending = del.deliveryStatus === 'PENDING';
                const isShipped = ['DISPATCHED', 'IN_TRANSIT'].includes(del.deliveryStatus);
                return (
                  <tr key={del.deliveryId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#DEL-{del.deliveryId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {del.dispatchedAt
                          ? `Dispatched: ${new Date(del.dispatchedAt).toLocaleDateString('en-IN')}`
                          : 'Created'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>#ORD-{del.orderId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {del.cropName || 'Crop'} ({del.cropCategory || 'General'})
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{del.buyerName || 'Buyer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={del.deliveryAddress}>
                        {del.deliveryAddress || 'Address not specified'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {del.trackingNumber || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {del.vehicleNumber || 'Unassigned'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        {Number(del.quantity).toLocaleString()} kg
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        ₹{Number(del.totalAmount).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <StatusBadge status={del.deliveryStatus} />
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleOpenShip(del)}
                            className="btn btn-accent btn-sm"
                            title="Dispatch lot for transit"
                          >
                            Ship Lot
                          </button>
                        )}

                        {isShipped && (
                          <button
                            type="button"
                            onClick={() => handleCompleteDelivery(del)}
                            className="btn btn-primary btn-sm"
                            title="Confirm delivery receipt"
                          >
                            Delivered
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleViewDetails(del)}
                          className="btn btn-secondary btn-sm"
                        >
                          Details
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

      {/* Create Delivery Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Dispatch Record"
          maxWidth="520px"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <SelectField
              label="Accepted Order"
              required
              value={createForm.orderId}
              onChange={(e) => {
                const selOrd = dispatchEligibleOrders.find((o) => o.orderId === Number(e.target.value));
                setCreateForm({
                  ...createForm,
                  orderId: e.target.value,
                  deliveryAddress: selOrd ? selOrd.farmLocation || createForm.deliveryAddress : createForm.deliveryAddress
                });
              }}
              options={[
                { value: '', label: 'Select accepted order...' },
                ...dispatchEligibleOrders.map((ord) => ({
                  value: ord.orderId,
                  label: `#ORD-${ord.orderId} — ${ord.cropName} (${ord.quantity} kg, ₹${ord.totalAmount}) — Buyer: ${ord.buyerName}`
                }))
              ]}
            />

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Delivery Address <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={createForm.deliveryAddress}
                onChange={(e) => setCreateForm({ ...createForm, deliveryAddress: e.target.value })}
                placeholder="Buyer warehouse or delivery address"
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle Number</label>
                <input
                  type="text"
                  value={createForm.vehicleNumber}
                  onChange={(e) => setCreateForm({ ...createForm, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH-12-AB-1234"
                  className="form-control"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tracking Number</label>
                <input
                  type="text"
                  value={createForm.trackingNumber}
                  onChange={(e) => setCreateForm({ ...createForm, trackingNumber: e.target.value })}
                  placeholder="e.g. TRK-88291"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Logistics Remarks</label>
              <textarea
                rows={2}
                value={createForm.remarks}
                onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
                placeholder="Driver contact, transit temperature, special handling..."
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
              >
                {actionLoading ? 'Creating...' : 'Create Delivery'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ship Delivery Modal */}
      {shipModalOpen && selectedDelivery && (
        <Modal
          isOpen={shipModalOpen}
          onClose={() => setShipModalOpen(false)}
          title={`Dispatch Shipment #DEL-${selectedDelivery.deliveryId}`}
          maxWidth="460px"
        >
          <form onSubmit={handleShipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Update shipment details and mark the order as <strong>DISPATCHED</strong>.
            </p>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tracking Number</label>
              <input
                type="text"
                value={shipForm.trackingNumber}
                onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
                placeholder="e.g. TRK-992144"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehicle / Transport ID</label>
              <input
                type="text"
                value={shipForm.vehicleNumber}
                onChange={(e) => setShipForm({ ...shipForm, vehicleNumber: e.target.value })}
                placeholder="e.g. KA-01-EF-4321"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination Address</label>
              <input
                type="text"
                value={shipForm.deliveryAddress}
                onChange={(e) => setShipForm({ ...shipForm, deliveryAddress: e.target.value })}
                placeholder="Delivery address"
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Remarks</label>
              <textarea
                rows={2}
                value={shipForm.remarks}
                onChange={(e) => setShipForm({ ...shipForm, remarks: e.target.value })}
                placeholder="Transit updates..."
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setShipModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-accent"
              >
                {actionLoading ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delivery Details Modal */}
      {detailsModalOpen && selectedDelivery && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Delivery Audit: #DEL-${selectedDelivery.deliveryId}`}
          maxWidth="560px"
        >
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Shipment Status
                </span>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={selectedDelivery.deliveryStatus} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Associated Order
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  #ORD-{selectedDelivery.orderId}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Produce Details</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>{selectedDelivery.cropName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Category: {selectedDelivery.cropCategory}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '0.25rem' }}>
                  {Number(selectedDelivery.quantity).toLocaleString()} kg @ ₹{selectedDelivery.agreedPricePerKg}/kg
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Buyer Stakeholder</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>{selectedDelivery.buyerName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{selectedDelivery.businessName || 'Direct Wholesale'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  {selectedDelivery.buyerEmail} | {selectedDelivery.buyerPhone || 'No Phone'}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Logistics & Routing</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Destination:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedDelivery.deliveryAddress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Vehicle #:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedDelivery.vehicleNumber || 'Unassigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Tracking #:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedDelivery.trackingNumber || 'Unassigned'}</span>
              </div>
              {selectedDelivery.remarks && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.35rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Remarks:</span>
                  <span style={{ color: 'var(--color-text)' }}>{selectedDelivery.remarks}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="btn btn-secondary"
              >
                Close Audit
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Delivery Confirmation Dialog */}
      <ConfirmDialog
        isOpen={completeConfirmOpen}
        onClose={() => {
          setCompleteConfirmOpen(false);
          setDeliveryToComplete(null);
        }}
        onConfirm={handleConfirmCompleteDelivery}
        title="Confirm Delivery Receipt"
        message={
          deliveryToComplete
            ? `Confirm delivery receipt for Shipment #DEL-${deliveryToComplete.deliveryId}? This will mark the order as fulfilled and trigger payment settlement eligibility.`
            : ''
        }
        confirmText="Mark Delivered"
        confirmVariant="primary"
        loading={actionLoading}
      />
    </div>
  );
};

export default FarmerDeliveries;
