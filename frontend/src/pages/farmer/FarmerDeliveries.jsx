import React, { useState, useEffect } from 'react';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const FarmerDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Form states
  const [actionLoading, setActionLoading] = useState(false);
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
    remarks: '',
    deliveryAddress: ''
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

      const delData = delRes.data?.data || delRes.data || [];
      const ordData = ordRes.data?.data || ordRes.data || [];

      setDeliveries(Array.isArray(delData) ? delData : []);
      setOrders(Array.isArray(ordData) ? ordData : []);
    } catch (err) {
      console.error('Error loading deliveries:', err);
      setError(err.response?.data?.message || 'Failed to load delivery and logistics records.');
    } finally {
      setLoading(false);
    }
  };

  // Orders eligible for dispatch: ACCEPTED orders that do not already have a delivery record
  const existingDeliveryOrderIds = new Set(deliveries.map((d) => d.orderId));
  const dispatchEligibleOrders = orders.filter(
    (o) => o.status === 'ACCEPTED' && !existingDeliveryOrderIds.has(o.orderId)
  );

  // Handlers
  const handleOpenCreate = () => {
    if (dispatchEligibleOrders.length > 0) {
      const first = dispatchEligibleOrders[0];
      setCreateForm({
        orderId: first.orderId,
        deliveryAddress: first.farmLocation || 'Mandatory shipment destination',
        vehicleNumber: '',
        trackingNumber: '',
        remarks: ''
      });
    } else {
      setCreateForm({
        orderId: '',
        deliveryAddress: '',
        vehicleNumber: '',
        trackingNumber: '',
        remarks: ''
      });
    }
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.orderId || !createForm.deliveryAddress) {
      alert('Order ID and delivery address are required.');
      return;
    }

    try {
      setActionLoading(true);
      await farmerApi.createDelivery({
        orderId: Number(createForm.orderId),
        deliveryAddress: createForm.deliveryAddress.trim(),
        vehicleNumber: createForm.vehicleNumber.trim() || undefined,
        trackingNumber: createForm.trackingNumber.trim() || undefined,
        remarks: createForm.remarks.trim() || undefined
      });
      setCreateModalOpen(false);
      setActionSuccess(`Delivery record created successfully for Order #${createForm.orderId}!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error creating delivery:', err);
      alert(err.response?.data?.message || 'Failed to create delivery record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenShip = (del) => {
    setSelectedDelivery(del);
    setShipForm({
      trackingNumber: del.trackingNumber || '',
      vehicleNumber: del.vehicleNumber || '',
      remarks: del.remarks || '',
      deliveryAddress: del.deliveryAddress || ''
    });
    setShipModalOpen(true);
  };

  const handleShipSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setActionLoading(true);
      await farmerApi.shipDelivery(selectedDelivery.deliveryId, {
        trackingNumber: shipForm.trackingNumber.trim() || undefined,
        vehicleNumber: shipForm.vehicleNumber.trim() || undefined,
        remarks: shipForm.remarks.trim() || undefined,
        deliveryAddress: shipForm.deliveryAddress.trim() || undefined
      });
      setShipModalOpen(false);
      setSelectedDelivery(null);
      setActionSuccess(`Shipment #${selectedDelivery.deliveryId} dispatched successfully! Order marked as SHIPPED.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error shipping delivery:', err);
      alert(err.response?.data?.message || 'Failed to dispatch shipment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDelivery = async (del) => {
    if (!window.confirm(`Confirm delivery completion for Shipment #${del.deliveryId}? This marks the order as DELIVERED and triggers transaction sale recording.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await farmerApi.markDelivered(del.deliveryId);
      setActionSuccess(`Shipment #${del.deliveryId} marked as DELIVERED! Commercial sale finalized.`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error completing delivery:', err);
      alert(err.response?.data?.message || 'Failed to complete delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (del) => {
    setSelectedDelivery(del);
    setDetailsModalOpen(true);
  };

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'IN_TRANSIT' && ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)) ||
      d.deliveryStatus === statusFilter;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (d.trackingNumber && d.trackingNumber.toLowerCase().includes(searchLower)) ||
      (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(searchLower)) ||
      (d.cropName && d.cropName.toLowerCase().includes(searchLower)) ||
      (d.buyerName && d.buyerName.toLowerCase().includes(searchLower)) ||
      String(d.deliveryId).includes(searchLower) ||
      String(d.orderId).includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // KPIs
  const totalDeliveries = deliveries.length;
  const inTransitCount = deliveries.filter((d) => ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
  const completedCount = deliveries.filter((d) => d.deliveryStatus === 'DELIVERED').length;
  const totalWeightDelivered = deliveries
    .filter((d) => d.deliveryStatus === 'DELIVERED')
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery & Logistics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dispatch contracted harvest lots, update vehicle & tracking identifiers, and confirm buyer receipt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dispatchEligibleOrders.length > 0 && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Dispatch ({dispatchEligibleOrders.length} ready)
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Shipments"
          value={totalDeliveries}
          subtitle="All logistics records"
          icon="truck"
          color="blue"
        />
        <DashboardCard
          title="In Transit / Dispatched"
          value={inTransitCount}
          subtitle="On the road"
          icon="clock"
          color={inTransitCount > 0 ? "amber" : "gray"}
        />
        <DashboardCard
          title="Successfully Delivered"
          value={completedCount}
          subtitle="Confirmed by parties"
          icon="check-circle"
          color="emerald"
        />
        <DashboardCard
          title="Weight Delivered"
          value={`${(totalWeightDelivered / 1000).toFixed(1)} MT`}
          subtitle={`${totalWeightDelivered.toLocaleString()} kg total`}
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
            placeholder="Search tracking, vehicle, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading delivery shipments..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          title="No delivery shipments found"
          description={
            dispatchEligibleOrders.length > 0
              ? `You have ${dispatchEligibleOrders.length} accepted order(s) awaiting dispatch creation!`
              : 'You do not have any active shipments. Deliveries are generated once purchase orders are accepted.'
          }
          actionLabel={dispatchEligibleOrders.length > 0 ? "Create Dispatch" : "View Orders"}
          onAction={dispatchEligibleOrders.length > 0 ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Shipment ID</th>
                  <th className="px-4 py-3.5 text-left">Order & Crop</th>
                  <th className="px-4 py-3.5 text-left">Buyer & Address</th>
                  <th className="px-4 py-3.5 text-left">Tracking & Vehicle</th>
                  <th className="px-4 py-3.5 text-right">Quantity</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDeliveries.map((del) => {
                  const isPending = del.deliveryStatus === 'PENDING';
                  const isShipped = ['DISPATCHED', 'IN_TRANSIT'].includes(del.deliveryStatus);
                  return (
                    <tr key={del.deliveryId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">#DEL-{del.deliveryId}</div>
                        <div className="text-xs text-gray-500">
                          {del.dispatchedAt
                            ? `Dispatched: ${new Date(del.dispatchedAt).toLocaleDateString('en-IN')}`
                            : 'Created'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">#ORD-{del.orderId}</div>
                        <div className="text-xs text-gray-500">{del.cropName || 'Crop'} ({del.cropCategory || 'General'})</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900">{del.buyerName || 'Buyer'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={del.deliveryAddress}>
                          {del.deliveryAddress || 'Address not specified'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-gray-900">
                          {del.trackingNumber || 'No tracking #'}
                        </div>
                        <div className="text-xs text-gray-500">{del.vehicleNumber || 'No vehicle #'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-medium text-gray-900">{Number(del.quantity).toLocaleString()} kg</div>
                        <div className="text-xs text-emerald-600 font-semibold">₹{Number(del.totalAmount).toLocaleString('en-IN')}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <StatusBadge status={del.deliveryStatus} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                        {isPending && (
                          <button
                            onClick={() => handleOpenShip(del)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                            title="Mark as Shipped"
                          >
                            Ship Lot
                          </button>
                        )}

                        {isShipped && (
                          <button
                            onClick={() => handleCompleteDelivery(del)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                            title="Mark as Delivered"
                          >
                            Delivered
                          </button>
                        )}

                        <button
                          onClick={() => handleViewDetails(del)}
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

      {/* Create Delivery Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Dispatch Record"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accepted Order <span className="text-red-500">*</span>
              </label>
              <select
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Select accepted order...</option>
                {dispatchEligibleOrders.map((ord) => (
                  <option key={ord.orderId} value={ord.orderId}>
                    #ORD-{ord.orderId} — {ord.cropName} ({ord.quantity} kg, ₹{ord.totalAmount}) — Buyer: {ord.buyerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createForm.deliveryAddress}
                onChange={(e) => setCreateForm({ ...createForm, deliveryAddress: e.target.value })}
                placeholder="Buyer warehouse or delivery address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={createForm.vehicleNumber}
                  onChange={(e) => setCreateForm({ ...createForm, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={createForm.trackingNumber}
                  onChange={(e) => setCreateForm({ ...createForm, trackingNumber: e.target.value })}
                  placeholder="e.g. TRK-88291"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logistics Remarks</label>
              <textarea
                rows={2}
                value={createForm.remarks}
                onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
                placeholder="Driver contact, transit temperature, special handling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
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
          maxWidth="max-w-md"
        >
          <form onSubmit={handleShipSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Update shipment details and mark the order as <strong>SHIPPED</strong>.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={shipForm.trackingNumber}
                onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
                placeholder="e.g. TRK-992144"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle / Transport ID</label>
              <input
                type="text"
                value={shipForm.vehicleNumber}
                onChange={(e) => setShipForm({ ...shipForm, vehicleNumber: e.target.value })}
                placeholder="e.g. KA-01-EF-4321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Address</label>
              <input
                type="text"
                value={shipForm.deliveryAddress}
                onChange={(e) => setShipForm({ ...shipForm, deliveryAddress: e.target.value })}
                placeholder="Delivery address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                rows={2}
                value={shipForm.remarks}
                onChange={(e) => setShipForm({ ...shipForm, remarks: e.target.value })}
                placeholder="Transit updates..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShipModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
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
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                <div className="mt-1"><StatusBadge status={selectedDelivery.deliveryStatus} /></div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Associated Order</span>
                <div className="text-lg font-bold text-gray-900">#ORD-{selectedDelivery.orderId}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase">Crop & Volume</div>
                <div className="mt-1 font-semibold text-gray-900">{selectedDelivery.cropName}</div>
                <div className="text-xs text-gray-600">Category: {selectedDelivery.cropCategory}</div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">
                  {Number(selectedDelivery.quantity).toLocaleString()} kg @ ₹{selectedDelivery.agreedPricePerKg}/kg
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase">Buyer Info</div>
                <div className="mt-1 font-semibold text-gray-900">{selectedDelivery.buyerName}</div>
                <div className="text-xs text-gray-600">{selectedDelivery.businessName || 'Direct Wholesale'}</div>
                <div className="text-xs text-gray-600">{selectedDelivery.buyerEmail} | {selectedDelivery.buyerPhone || 'No Phone'}</div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg space-y-1.5">
              <div className="text-xs font-semibold text-gray-500 uppercase">Logistics & Tracking</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Destination:</span>
                <span className="font-medium text-gray-800 text-right">{selectedDelivery.deliveryAddress}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Vehicle Number:</span>
                <span className="font-mono font-medium text-gray-800">{selectedDelivery.vehicleNumber || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tracking Number:</span>
                <span className="font-mono font-medium text-gray-800">{selectedDelivery.trackingNumber || 'Unassigned'}</span>
              </div>
              {selectedDelivery.remarks && (
                <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Remarks:</span>
                  <span className="text-gray-700">{selectedDelivery.remarks}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div>
                <span>Dispatched: </span>
                <span className="font-medium text-gray-800">
                  {selectedDelivery.dispatchedAt ? new Date(selectedDelivery.dispatchedAt).toLocaleString('en-IN') : 'Pending'}
                </span>
              </div>
              <div>
                <span>Delivered: </span>
                <span className="font-medium text-gray-800">
                  {selectedDelivery.deliveredAt ? new Date(selectedDelivery.deliveredAt).toLocaleString('en-IN') : 'Pending'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
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
    </div>
  );
};

export default FarmerDeliveries;
