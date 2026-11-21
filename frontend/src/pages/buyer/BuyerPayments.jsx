import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Recording Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'UPI',
    transactionReference: '',
    remarks: '',
  });
  const [recording, setRecording] = useState(false);

  // Order Summary Modal
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadPaymentsData();
  }, []);

  const loadPaymentsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [payRes, ordRes] = await Promise.all([
        buyerApi.getPayments(),
        buyerApi.getOrders().catch(() => ({ data: [] })),
      ]);

      const payData = payRes.data?.data || payRes.data || [];
      const ordData = ordRes.data?.data || ordRes.data || [];

      setPayments(Array.isArray(payData) ? payData : []);
      setOrders(Array.isArray(ordData) ? ordData : []);
    } catch (err) {
      console.error('Failed to load payment records:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve payment records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecord = () => {
    // Default to first accepted or delivered order if available
    const eligibleOrder = orders.find((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status));
    setRecordForm({
      orderId: eligibleOrder ? String(eligibleOrder.orderId) : '',
      amount: eligibleOrder ? String(eligibleOrder.totalAmount) : '',
      paymentMethod: 'UPI',
      transactionReference: `UPI-${Date.now().toString().slice(-8)}`,
      remarks: 'Digital escrow settlement via AgriConnect Gateway',
    });
    setRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(recordForm.amount);
    if (!recordForm.orderId || isNaN(amt) || amt <= 0) {
      alert('Valid order and positive payment amount are required.');
      return;
    }

    try {
      setRecording(true);
      const payload = {
        orderId: Number(recordForm.orderId),
        amount: amt,
        paymentMethod: recordForm.paymentMethod,
        transactionReference: recordForm.transactionReference.trim() || undefined,
        remarks: recordForm.remarks.trim() || undefined,
      };

      await buyerApi.recordPayment(payload);
      setRecordModalOpen(false);
      setActionSuccess(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully for Order #${recordForm.orderId}!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadPaymentsData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      alert(err.response?.data?.message || err.message || 'Failed to process payment.');
    } finally {
      setRecording(false);
    }
  };

  const handleOpenOrderSummary = async (orderId) => {
    try {
      setLoadingSummary(true);
      setSummaryModalOpen(true);
      const res = await buyerApi.getPaymentsByOrder(orderId);
      const data = res.data?.data || res.data;
      setSelectedSummary(data);
    } catch (err) {
      console.error('Failed to load order payment summary:', err);
      alert(err.response?.data?.message || 'Failed to load order payment ledger summary.');
      setSummaryModalOpen(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.paymentStatus === statusFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(term)) ||
      (p.cropName && p.cropName.toLowerCase().includes(term)) ||
      (p.farmerName && p.farmerName.toLowerCase().includes(term)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(term)) ||
      String(p.paymentId).includes(term) ||
      String(p.orderId).includes(term);

    return matchesStatus && matchesSearch;
  });

  // Financial KPIs
  const totalSettledPaid = payments
    .filter((p) => p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingDisbursements = payments
    .filter((p) => p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalOrdersContracted = orders
    .filter((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const totalReceipts = payments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settlements & Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Audit digital escrow disbursements, transaction references, and contract financial balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={handleOpenRecord}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Make Payment
            </button>
          )}

          <button
            onClick={loadPaymentsData}
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-sm">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={loadPaymentsData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Paid (Settled)"
          value={`₹${totalSettledPaid.toLocaleString('en-IN')}`}
          subtitle={`${payments.filter((p) => p.paymentStatus === 'COMPLETED').length} settled receipts`}
          icon="currency-rupee"
          color="emerald"
        />
        <DashboardCard
          title="Contract Volume"
          value={`₹${totalOrdersContracted.toLocaleString('en-IN')}`}
          subtitle="All accepted/delivered orders"
          icon="shopping-bag"
          color="blue"
        />
        <DashboardCard
          title="Pending Settlements"
          value={`₹${pendingDisbursements.toLocaleString('en-IN')}`}
          subtitle="In escrow processing"
          icon="clock"
          color={pendingDisbursements > 0 ? "amber" : "gray"}
        />
        <DashboardCard
          title="Payment Receipts"
          value={totalReceipts}
          subtitle="Recorded disbursements"
          icon="document-text"
          color="emerald"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search ref #, order #, farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <LoadingSpinner message="Auditing financial transaction ledger..." />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No payment records found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No payments match your filter criteria.'
              : 'Payments recorded for delivered produce orders appear here.'
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Receipt & Date</th>
                  <th className="px-4 py-3.5 text-left">Order & Crop</th>
                  <th className="px-4 py-3.5 text-left">Farmer</th>
                  <th className="px-4 py-3.5 text-left">Method & Reference</th>
                  <th className="px-4 py-3.5 text-right">Settled Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPayments.map((pay) => (
                  <tr key={pay.paymentId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">#PAY-{pay.paymentId}</div>
                      <div className="text-[11px] text-gray-400">
                        {pay.paymentDate
                          ? new Date(pay.paymentDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Recorded'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">#ORD-{pay.orderId}</div>
                      <div className="text-xs text-gray-500">{pay.cropName}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pay.farmerName}</div>
                      <div className="text-xs text-gray-500">{pay.farmLocation}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                        {pay.paymentMethod ? pay.paymentMethod.replace('_', ' ') : 'DIRECT'}
                      </span>
                      <div className="font-mono text-xs text-gray-500 mt-0.5 truncate max-w-[140px]" title={pay.transactionReference}>
                        {pay.transactionReference || 'REF-N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="text-base font-bold text-emerald-600">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Order Total: ₹{Number(pay.orderTotalAmount || pay.amount).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <StatusBadge status={pay.paymentStatus} />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenOrderSummary(pay.orderId)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      >
                        Order Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Make Payment Modal */}
      {recordModalOpen && (
        <Modal
          isOpen={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          title="Record Order Payment Settlement"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Purchase Order <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={recordForm.orderId}
                onChange={(e) => {
                  const sel = orders.find((o) => String(o.orderId) === e.target.value);
                  setRecordForm({
                    ...recordForm,
                    orderId: e.target.value,
                    amount: sel ? String(sel.totalAmount) : recordForm.amount
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select order...</option>
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    #ORD-{o.orderId} — {o.cropName} (₹{Number(o.totalAmount).toLocaleString('en-IN')}) — {o.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Settlement Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={recordForm.amount}
                onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Channel <span className="text-red-500">*</span>
              </label>
              <select
                value={recordForm.paymentMethod}
                onChange={(e) => setRecordForm({ ...recordForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="UPI">UPI Digital Payment</option>
                <option value="BANK_TRANSFER">NEFT / RTGS / IMPS Bank Transfer</option>
                <option value="ESCROW">Digital Escrow Protection</option>
                <option value="CREDIT_CARD">Corporate Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CASH_ON_DELIVERY">Cash on Delivery (APMC Mandi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Reference</label>
              <input
                type="text"
                placeholder="Bank UTR / UPI Ref ID..."
                value={recordForm.transactionReference}
                onChange={(e) => setRecordForm({ ...recordForm, transactionReference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={recordForm.remarks}
                onChange={(e) => setRecordForm({ ...recordForm, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recording}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
              >
                {recording ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Order Balance Summary Modal */}
      {summaryModalOpen && (
        <Modal
          isOpen={summaryModalOpen}
          onClose={() => setSummaryModalOpen(false)}
          title={`Order Payment Balance: #ORD-${selectedSummary?.orderId || ''}`}
          maxWidth="max-w-xl"
        >
          {loadingSummary ? (
            <LoadingSpinner message="Auditing contract receipts..." />
          ) : selectedSummary ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Contract Total</span>
                  <div className="text-base font-bold text-gray-900">
                    ₹{Number(selectedSummary.orderTotalAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 uppercase">Total Paid</span>
                  <div className="text-base font-bold text-emerald-600">
                    ₹{Number(selectedSummary.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-amber-700 uppercase">Balance Due</span>
                  <div className="text-base font-bold text-amber-600">
                    ₹{Number(selectedSummary.remainingBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-100 pb-2">
                <span>Settlement Status:</span>
                <span className={`font-semibold ${selectedSummary.isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedSummary.isFullyPaid ? 'Fully Settled' : 'Balance Pending'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Transaction Disbursements ({selectedSummary.payments?.length || 0})
                </h4>
                {selectedSummary.payments && selectedSummary.payments.length > 0 ? (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                    {selectedSummary.payments.map((p) => (
                      <div key={p.paymentId} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">#PAY-{p.paymentId}</div>
                          <div className="text-xs text-gray-500">
                            {p.paymentMethod} • {p.transactionReference || 'REF-N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">₹{Number(p.amount).toLocaleString('en-IN')}</div>
                          <div className="text-xs"><StatusBadge status={p.paymentStatus} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No disbursement receipts found.</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSummaryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Summary could not be loaded.</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default BuyerPayments;
