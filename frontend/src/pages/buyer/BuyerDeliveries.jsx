import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Confirm Received Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [confirmRemarks, setConfirmRemarks] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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
      console.error('Error loading deliveries:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve delivery tracking.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = (del) => {
    setSelectedDelivery(del);
    setConfirmRemarks('Produce received in satisfactory condition and verified weight.');
    setConfirmModalOpen(true);
  };

  const handleConfirmReceivedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setConfirming(true);
      await buyerApi.confirmDeliveryReceived(selectedDelivery.deliveryId, {
        remarks: confirmRemarks.trim() || undefined
      });
      setConfirmModalOpen(false);
      setSelectedDelivery(null);
      setActionSuccess(`Shipment #DEL-${selectedDelivery.deliveryId} confirmed received! Order marked as DELIVERED.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadDeliveries();
    } catch (err) {
      console.error('Error confirming delivery receipt:', err);
      alert(err.response?.data?.message || 'Failed to confirm delivery receipt.');
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenDetails = (del) => {
    setSelectedDelivery(del);
    setDetailsModalOpen(true);
  };

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_TRANSIT' && ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)) ||
      d.deliveryStatus === statusFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (d.trackingNumber && d.trackingNumber.toLowerCase().includes(term)) ||
      (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(term)) ||
      (d.cropName && d.cropName.toLowerCase().includes(term)) ||
      (d.farmerName && d.farmerName.toLowerCase().includes(term)) ||
      String(d.deliveryId).includes(term) ||
      String(d.orderId).includes(term);

    return matchesStatus && matchesSearch;
  });

  // KPIs
  const totalDeliveries = deliveries.length;
  const inTransitCount = deliveries.filter((d) => ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
  const deliveredCount = deliveries.filter((d) => d.deliveryStatus === 'DELIVERED').length;
  const totalTonnageReceived = deliveries
    .filter((d) => d.deliveryStatus === 'DELIVERED')
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery & Logistics Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track farmer dispatch telematics, vehicle identifiers, transit schedules, and confirm produce receipt.
          </p>
        </div>

        <button
          onClick={loadDeliveries}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Logistics
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-sm">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={loadDeliveries} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Shipments"
          value={totalDeliveries}
          subtitle="All scheduled dispatches"
          icon="truck"
          color="blue"
        />
        <DashboardCard
          title="In Transit / On Road"
          value={inTransitCount}
          subtitle="Active transit"
          icon="clock"
          color={inTransitCount > 0 ? "amber" : "gray"}
        />
        <DashboardCard
          title="Received & Completed"
          value={deliveredCount}
          subtitle="Confirmed delivered"
          icon="check-circle"
          color="emerald"
        />
        <DashboardCard
          title="Volume Received"
          value={`${(totalTonnageReceived / 1000).toFixed(1)} MT`}
          subtitle={`${totalTonnageReceived.toLocaleString()} kg verified`}
          icon="scale"
          color="emerald"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search tracking, vehicle, crop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Deliveries Table */}
      {loading ? (
        <LoadingSpinner message="Auditing logistics telematics..." />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          title="No deliveries found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No shipments match your filter criteria.'
              : 'Shipment tracking records will appear once farmers accept and dispatch your purchase orders.'
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Shipment ID</th>
                  <th className="px-4 py-3.5 text-left">Order & Crop</th>
                  <th className="px-4 py-3.5 text-left">Farmer / Origin</th>
                  <th className="px-4 py-3.5 text-left">Vehicle & Tracking</th>
                  <th className="px-4 py-3.5 text-right">Volume</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDeliveries.map((del) => {
                  const canConfirm = ['DISPATCHED', 'IN_TRANSIT'].includes(del.deliveryStatus);
                  return (
                    <tr key={del.deliveryId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">#DEL-{del.deliveryId}</div>
                        <div className="text-[11px] text-gray-400">
                          {del.dispatchedAt ? `Dispatched: ${new Date(del.dispatchedAt).toLocaleDateString('en-IN')}` : 'Scheduled'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">#ORD-{del.orderId}</div>
                        <div className="text-xs text-gray-500">{del.cropName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900">{del.farmerName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={del.farmLocation}>
                          {del.farmLocation || 'Origin Hub'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-gray-900">
                          {del.trackingNumber || 'No tracking #'}
                        </div>
                        <div className="text-[11px] text-gray-500">{del.vehicleNumber || 'Unassigned vehicle'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-semibold text-gray-900">{Number(del.quantity).toLocaleString()} kg</div>
                        <div className="text-xs text-emerald-600 font-semibold">₹{Number(del.totalAmount).toLocaleString('en-IN')}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <StatusBadge status={del.deliveryStatus} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                        {canConfirm && (
                          <button
                            onClick={() => handleOpenConfirm(del)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                          >
                            Confirm Received
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetails(del)}
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

      {/* Confirm Received Modal */}
      {confirmModalOpen && selectedDelivery && (
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title={`Confirm Produce Receipt — Shipment #DEL-${selectedDelivery.deliveryId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReceivedSubmit} className="space-y-4 text-sm">
            <p className="text-xs text-gray-600 leading-relaxed">
              Confirming receipt marks both the delivery and order as <strong>DELIVERED</strong>. This verifies that you have received <strong>{Number(selectedDelivery.quantity).toLocaleString()} kg</strong> of {selectedDelivery.cropName}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Receipt Remarks & Condition</label>
              <textarea
                rows={3}
                value={confirmRemarks}
                onChange={(e) => setConfirmRemarks(e.target.value)}
                placeholder="Produce received in verified quality condition..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={confirming}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
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
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 uppercase">Status</span>
                <div className="mt-1"><StatusBadge status={selectedDelivery.deliveryStatus} /></div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase">Order ID</span>
                <div className="text-base font-bold text-gray-900">#ORD-{selectedDelivery.orderId}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 font-semibold uppercase">Produce & Volume</span>
                <div className="font-bold text-gray-900 mt-1">{selectedDelivery.cropName}</div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                  {Number(selectedDelivery.quantity).toLocaleString()} kg @ ₹{selectedDelivery.agreedPricePerKg}/kg
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 font-semibold uppercase">Origin Farmer</span>
                <div className="font-bold text-gray-900 mt-1">{selectedDelivery.farmerName}</div>
                <div className="text-xs text-gray-600">{selectedDelivery.farmLocation}</div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Destination Address:</span>
                <span className="font-medium text-gray-800 text-right">{selectedDelivery.deliveryAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle / Transport ID:</span>
                <span className="font-mono font-bold text-gray-900">{selectedDelivery.vehicleNumber || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking Number:</span>
                <span className="font-mono font-bold text-gray-900">{selectedDelivery.trackingNumber || 'Unassigned'}</span>
              </div>
              {selectedDelivery.remarks && (
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Remarks:</span>
                  <span className="text-gray-700">{selectedDelivery.remarks}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BuyerDeliveries;
