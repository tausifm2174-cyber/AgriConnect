import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import { pluralize, formatLocation } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  Truck,
  Clock,
  CheckCircle2,
  Scale,
  RefreshCw,
  Search,
  Check,
  X
} from 'lucide-react';

export const BuyerDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [confirmRemarks, setConfirmRemarks] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await buyerApi.getDeliveries();
      const data = res.data?.data || res.data || [];
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load buyer deliveries:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load delivery telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = (del) => {
    setSelectedDelivery(del);
    setConfirmRemarks('');
    setConfirmModalOpen(true);
  };

  const handleConfirmReceivedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setConfirming(true);
      setError(null);
      await (buyerApi.confirmDelivery || buyerApi.confirmDeliveryReceived)(
        selectedDelivery.deliveryId,
        { notes: confirmRemarks?.trim() || 'Confirmed received by buyer' }
      );
      setActionSuccess(`Delivery #DEL-${selectedDelivery.deliveryId} confirmed received! Associated Order #ORD-${selectedDelivery.orderId} marked as DELIVERED.`);
      setConfirmModalOpen(false);
      setSelectedDelivery(null);
      setConfirmRemarks('');
      await loadDeliveries();
    } catch (err) {
      console.error('Failed to confirm delivery:', err);
      const safeMsg = err.response?.data?.message || 'Unable to update delivery. Please refresh the page and try again.';
      setError(safeMsg);
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenDetails = (del) => {
    setSelectedDelivery(del);
    setDetailsModalOpen(true);
  };

  // KPIs
  const totalDeliveries = deliveries.length;
  const inTransitCount = deliveries.filter((d) => ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
  const deliveredCount = deliveries.filter((d) => d.deliveryStatus === 'DELIVERED').length;
  const totalTonnageReceived = deliveries
    .filter((d) => d.deliveryStatus === 'DELIVERED')
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  // Filter
  const filteredDeliveries = deliveries.filter((del) => {
    const matchesStatus = statusFilter === 'ALL' || del.deliveryStatus === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(del.deliveryId).includes(term) ||
      String(del.orderId).includes(term) ||
      del.cropName?.toLowerCase().includes(term) ||
      del.farmerName?.toLowerCase().includes(term) ||
      del.trackingNumber?.toLowerCase().includes(term) ||
      del.vehicleNumber?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={26} color="var(--color-primary)" />
            <span>Delivery & Logistics Tracking</span>
          </h1>
          <p className="page-subtitle">
            Track farmer dispatch telematics, vehicle identifiers, transit schedules, and confirm produce receipt.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDeliveries}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Logistics</span>
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

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Shipments"
          value={loading ? '...' : totalDeliveries}
          description="All scheduled dispatches"
          icon={Truck}
          variant="primary"
        />
        <DashboardCard
          title="In Transit"
          value={loading ? '...' : inTransitCount}
          description="Active on-road freight"
          icon={Clock}
          variant="secondary"
          trend={inTransitCount > 0 ? `+${inTransitCount}` : null}
          trendLabel={inTransitCount > 0 ? 'Active' : null}
        />
        <DashboardCard
          title="Received & Fulfilled"
          value={loading ? '...' : deliveredCount}
          description={pluralize(deliveredCount, 'completed delivery', 'completed deliveries')}
          icon={CheckCircle2}
          variant="success"
        />
        <DashboardCard
          title="Volume Received"
          value={loading ? '...' : `${(totalTonnageReceived / 1000).toFixed(1)} MT`}
          description={`${Number(totalTonnageReceived).toLocaleString()} kg verified produce`}
          icon={Scale}
          variant="accent"
        />
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search tracking, vehicle, crop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Deliveries Table */}
      {loading ? (
        <LoadingSpinner message="Auditing logistics telematics..." />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No deliveries found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No shipments match your filter criteria.'
              : 'Shipment tracking records will appear once farmers accept and dispatch your purchase orders.'
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Order & Crop</th>
                <th>Farmer / Origin</th>
                <th>Vehicle & Tracking</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((del) => {
                const canConfirm = ['SHIPPED', 'IN_TRANSIT', 'DISPATCHED'].includes(del.deliveryStatus);
                return (
                  <tr key={del.deliveryId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#DEL-{del.deliveryId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {del.dispatchedAt ? `Dispatched: ${new Date(del.dispatchedAt).toLocaleDateString('en-IN')}` : 'Scheduled'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>#ORD-{del.orderId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{del.cropName}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{del.farmerName}</div>
                      {(() => {
                        const loc = formatLocation(del.farmLocation);
                        return (
                          <div style={{ marginTop: '0.15rem' }} title={loc.full}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.25 }}>
                              {loc.line1}
                            </div>
                            {loc.line2 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.25 }}>
                                {loc.line2}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {del.trackingNumber || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {del.vehicleNumber || 'Unassigned vehicle'}
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
                        {canConfirm && (
                          <button
                            type="button"
                            onClick={() => handleOpenConfirm(del)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.3rem 0.65rem' }}
                          >
                            Confirm Received
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(del)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.65rem' }}
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

      {/* Confirm Received Modal */}
      {confirmModalOpen && selectedDelivery && (
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title={`Confirm Produce Receipt — Shipment #DEL-${selectedDelivery.deliveryId}`}
          maxWidth="460px"
        >
          <form onSubmit={handleConfirmReceivedSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Are you sure you have received this shipment? Confirming receipt marks both the delivery and order as <strong>DELIVERED</strong>.
            </p>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Shipment:</span>
                <span style={{ fontWeight: 700 }}>#DEL-{selectedDelivery.deliveryId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Order:</span>
                <span style={{ fontWeight: 600 }}>#ORD-{selectedDelivery.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Produce:</span>
                <span style={{ fontWeight: 600 }}>{selectedDelivery.cropName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Quantity:</span>
                <span style={{ fontWeight: 600 }}>{Number(selectedDelivery.quantity).toLocaleString()} kg</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Receipt Remarks & Condition</label>
              <textarea
                rows={3}
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                placeholder="Produce received in verified quality condition..."
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={confirming}
                className="btn btn-primary"
              >
                {confirming ? 'Confirming...' : 'Confirm Receipt'}
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
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={selectedDelivery.deliveryStatus} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Associated Order</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  #ORD-{selectedDelivery.orderId}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Produce & Volume</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>{selectedDelivery.cropName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '0.25rem' }}>
                  {Number(selectedDelivery.quantity).toLocaleString()} kg {selectedDelivery.agreedPricePerKg ? `@ ₹${selectedDelivery.agreedPricePerKg}/kg` : (selectedDelivery.totalAmount ? `(₹${Number(selectedDelivery.totalAmount).toLocaleString('en-IN')})` : '')}
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Origin Farmer</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>{selectedDelivery.farmerName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>{selectedDelivery.farmLocation}</div>
              </div>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Destination Address:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedDelivery.deliveryAddress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Vehicle / Transport ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedDelivery.vehicleNumber || 'Unassigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Tracking Number:</span>
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
    </div>
  );
};

export default BuyerDeliveries;
