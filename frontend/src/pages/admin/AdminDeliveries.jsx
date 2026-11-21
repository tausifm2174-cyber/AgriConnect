import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  RefreshCw,
  Eye,
  Edit
} from 'lucide-react';

export const AdminDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Update Modal State
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminApi.getDeliveries(params);
      const list = res.data?.data || res.data || [];
      setDeliveries(list);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve logistics fleet records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const handleOpenStatusModal = (delivery) => {
    setSelectedDelivery(delivery);
    setNewStatus(delivery.deliveryStatus);
    setUpdateRemarks(delivery.remarks || '');
    setUpdateError(null);
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      // Backend: PATCH /api/admin/deliveries/{id}/status?status=...
      const payload = {
        status: newStatus,
        remarks: updateRemarks.trim() || undefined,
      };
      await adminApi.updateDeliveryStatus(selectedDelivery.deliveryId, payload);
      setSuccessMsg(`Delivery #DEL-${selectedDelivery.deliveryId} status updated to ${newStatus}`);
      setModalOpen(false);
      fetchDeliveries();
    } catch (err) {
      console.error('Failed to update delivery status:', err);
      setUpdateError(err.response?.data?.message || err.message || 'Failed to update delivery status.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrack = d.trackingNumber?.toLowerCase().includes(q);
      const matchVehicle = d.vehicleNumber?.toLowerCase().includes(q);
      const matchCrop = d.cropName?.toLowerCase().includes(q);
      const matchAddr = d.deliveryAddress?.toLowerCase().includes(q);
      const matchId = String(d.deliveryId).includes(q) || String(d.orderId).includes(q);
      if (!matchTrack && !matchVehicle && !matchCrop && !matchAddr && !matchId) return false;
    }
    return true;
  });

  const statuses = ['ALL', 'PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Logistics & Freight Fleet</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Operations
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time monitoring of agricultural freight transit, dispatch telemetry, vehicle assignments, and delivery confirmations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDeliveries}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

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
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tracking #, vehicle, crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-56 sm:w-72"
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying freight fleet dispatches..." />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No delivery records found matching the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Delivery ID</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Tracking & Vehicle</th>
                  <th className="py-3 px-4">Commodity & Volume</th>
                  <th className="py-3 px-4">Delivery Destination</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeliveries.map((d) => (
                  <tr key={d.deliveryId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-500">#DEL-{d.deliveryId}</td>
                    <td className="py-3 px-4 font-mono text-purple-700 font-bold">#ORD-{d.orderId}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-gray-900">{d.trackingNumber || 'UNASSIGNED'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">Vehicle: {d.vehicleNumber || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{d.cropName || 'Commodity'}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {d.quantity ? `${Number(d.quantity).toLocaleString()} kg` : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={d.deliveryAddress}>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{d.deliveryAddress || 'Direct Pickup'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {d.dispatchedAt ? new Date(d.dispatchedAt).toLocaleString('en-IN') : 'Not Dispatched'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.deliveryStatus} />
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        <Edit size={12} />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {modalOpen && selectedDelivery && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Update Delivery Status — #DEL-${selectedDelivery.deliveryId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm">
            {updateError && <ErrorMessage message={updateError} onDismiss={() => setUpdateError(null)} />}

            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <div>Order Reference: <strong className="font-mono">#ORD-{selectedDelivery.orderId}</strong></div>
              <div>Tracking Number: <strong className="font-mono">{selectedDelivery.trackingNumber || 'UNASSIGNED'}</strong></div>
              <div>Current Status: <StatusBadge status={selectedDelivery.deliveryStatus} /></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">New Delivery Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Audit Remarks / Notes:</label>
              <textarea
                rows={3}
                placeholder="Transit updates, vehicle telematics, delay reasons..."
                value={updateRemarks}
                onChange={(e) => setUpdateRemarks(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                {updating ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDeliveries;
