import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
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
      setError(err.response?.data?.message || err.message || 'Unable to retrieve financial settlement records.');
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
      setUpdateError(err.response?.data?.message || err.message || 'Failed to update payment settlement status.');
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
            <h1 className="text-2xl font-bold text-gray-900">Financial Settlements & Audit</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Escrow & Ledger
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Reconcile payments, bank transfer confirmations, UPI transaction references, and settlement lifecycles.
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Method Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <label className="font-semibold uppercase">Method:</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {methods.map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reference #, buyer, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none w-52 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying financial settlement records..." />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No payment records found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4">Payer / Buyer</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Settlement Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-500">#PAY-{p.paymentId}</td>
                    <td className="py-3 px-4 font-mono text-purple-700 font-bold">#ORD-{p.orderId}</td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 uppercase">
                        {p.paymentMethod?.replace('_', ' ') || 'DIRECT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {p.transactionReference || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{p.buyerName || 'Corporate Buyer'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">UID #{p.buyerId || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.paymentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                      >
                        <Edit size={12} />
                        <span>Reconcile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Reconcile Modal */}
      {modalOpen && selectedPayment && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Reconcile Payment Settlement — #PAY-${selectedPayment.paymentId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm">
            {updateError && <ErrorMessage message={updateError} onDismiss={() => setUpdateError(null)} />}

            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <div>Order Reference: <strong className="font-mono">#ORD-{selectedPayment.orderId}</strong></div>
              <div>Settlement Amount: <strong className="text-emerald-700 font-bold">₹{Number(selectedPayment.amount).toFixed(2)}</strong></div>
              <div>Tx Reference: <strong className="font-mono">{selectedPayment.transactionReference || 'N/A'}</strong></div>
              <div>Current Status: <StatusBadge status={selectedPayment.paymentStatus} /></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Target Settlement Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {['PENDING', 'PROCESSING', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Reconciliation Remarks:</label>
              <textarea
                rows={3}
                placeholder="Bank clearance notes, refund reference, transaction remarks..."
                value={auditRemarks}
                onChange={(e) => setAuditRemarks(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                {updating ? 'Updating...' : 'Save Settlement Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminPayments;
