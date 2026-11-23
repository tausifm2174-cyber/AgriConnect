import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import SelectField from '../../components/SelectField';
import TextareaField from '../../components/TextareaField';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Edit,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (methodFilter !== 'ALL') params.method = methodFilter;

      const res = await adminApi.getPayments(params);
      const list = res.data?.data || res.data || [];
      setPayments(list);
    } catch (err) {
      console.error('Failed to load payments:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  const handleOpenStatusModal = (p) => {
    setSelectedPayment(p);
    setNewStatus(p.paymentStatus);
    setAuditRemarks(p.remarks || '');
    setUpdateError(null);
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      // Backend: PATCH /api/admin/payments/{id}/status?status=...
      const payload = {
        paymentStatus: newStatus,
        remarks: auditRemarks.trim() || undefined,
      };
      await adminApi.updatePaymentStatus(selectedPayment.paymentId, payload);
      setSuccessMsg(`Payment #PAY-${selectedPayment.paymentId} status updated to ${newStatus}`);
      setModalOpen(false);
      fetchPayments();
    } catch (err) {
      console.error('Failed to update payment status:', err);
      setUpdateError(err.response?.data?.message || err.message || 'Failed to update payment status.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTx = p.transactionReference?.toLowerCase().includes(q);
      const matchBuyer = p.buyerName?.toLowerCase().includes(q);
      const matchFarmer = p.farmerName?.toLowerCase().includes(q);
      const matchCrop = p.cropName?.toLowerCase().includes(q);
      const matchId = String(p.paymentId).includes(q) || String(p.orderId).includes(q);
      if (!matchTx && !matchBuyer && !matchFarmer && !matchCrop && !matchId) return false;
    }
    return true;
  });

  const totalSettled = payments
    .filter((p) => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const statuses = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];
  const methods = ['ALL', 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions Audit</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Payments & Ledger
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Monitor payments, payment methods, transaction references, and payment statuses across the marketplace.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total Payment Records</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{payments.length}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Recorded across all commercial orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold">Total Settled Volume</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Cleared & Completed Settlements</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
          <div className="text-xs uppercase tracking-wider text-amber-600 font-bold">Pending Reconciliations</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Awaiting administrative clearance</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Status Filter */}
        <div className="tab-group">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Method Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <label className="font-semibold uppercase">Method:</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium focus:outline-none"
            >
              {methods.map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search reference #, buyer, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying payment records..." />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No payment records found matching the filter criteria.
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order Ref</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction Reference</th>
                <th>Payer / Buyer</th>
                <th>Payment Date</th>
                <th>Payment Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.paymentId}>
                  <td className="font-mono font-bold text-gray-500">#PAY-{p.paymentId}</td>
                  <td className="font-mono text-purple-700 font-bold">#ORD-{p.orderId}</td>
                  <td className="font-black text-emerald-700">
                    ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 uppercase">
                      {p.paymentMethod?.replace('_', ' ') || 'DIRECT'}
                    </span>
                  </td>
                  <td className="font-mono text-gray-700">
                    {p.transactionReference || '—'}
                  </td>
                  <td>
                    <div className="font-semibold text-gray-900">{p.buyerName || 'Corporate Buyer'}</div>
                    <div className="text-[10px] text-gray-400 font-mono">UID #{p.buyerId || '—'}</div>
                  </td>
                  <td className="text-gray-500">
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleString('en-IN') : '—'}
                  </td>
                  <td>
                    <StatusBadge status={p.paymentStatus} />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(p)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit size={12} />
                      <span>Reconcile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Update Modal */}
      {modalOpen && selectedPayment && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Update Payment Status — #PAY-${selectedPayment.paymentId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm">
            {updateError && <ErrorMessage message={updateError} onDismiss={() => setUpdateError(null)} />}

            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <div>Order Reference: <strong className="font-mono">#ORD-{selectedPayment.orderId}</strong></div>
              <div>Payment Amount: <strong className="text-emerald-700 font-bold">₹{Number(selectedPayment.amount).toFixed(2)}</strong></div>
              <div>Tx Reference: <strong className="font-mono">{selectedPayment.transactionReference || 'N/A'}</strong></div>
              <div>Current Status: <StatusBadge status={selectedPayment.paymentStatus} /></div>
            </div>

            <SelectField
              label="Target Payment Status"
              required
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={['PENDING', 'PROCESSING', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].map((st) => ({
                value: st,
                label: st
              }))}
            />

            <TextareaField
              label="Status Update Remarks"
              rows={3}
              placeholder="Bank clearance notes, refund reference, transaction remarks..."
              value={auditRemarks}
              onChange={(e) => setAuditRemarks(e.target.value)}
            />

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
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                {updating ? 'Updating...' : 'Save Payment Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminPayments;
