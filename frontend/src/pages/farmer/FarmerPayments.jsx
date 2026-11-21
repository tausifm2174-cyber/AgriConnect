import React, { useState, useEffect } from 'react';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const FarmerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Order summary audit modal
  const [selectedOrderSummary, setSelectedOrderSummary] = useState(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await farmerApi.getPayments();
      const data = res.data?.data || res.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError(err.response?.data?.message || 'Failed to load payment receipts.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrderSummary = async (orderId) => {
    try {
      setSummaryLoading(true);
      setSummaryModalOpen(true);
      const res = await farmerApi.getPaymentsByOrder(orderId);
      const summary = res.data?.data || res.data;
      setSelectedOrderSummary(summary);
    } catch (err) {
      console.error('Error loading order payment summary:', err);
      alert(err.response?.data?.message || 'Failed to load order payment ledger summary.');
      setSummaryModalOpen(false);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      p.paymentStatus === statusFilter;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(searchLower)) ||
      (p.cropName && p.cropName.toLowerCase().includes(searchLower)) ||
      (p.buyerName && p.buyerName.toLowerCase().includes(searchLower)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(searchLower)) ||
      String(p.paymentId).includes(searchLower) ||
      String(p.orderId).includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // Financial KPIs
  const totalReceived = payments
    .filter((p) => p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingSettlement = payments
    .filter((p) => p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalReceipts = payments.length;
  const completedReceipts = payments.filter((p) => p.paymentStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settlements & Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Audit buyer disbursements, digital escrow settlements, and verified commercial transaction credits.
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Settled Revenue"
          value={`₹${totalReceived.toLocaleString('en-IN')}`}
          subtitle={`${completedReceipts} completed credits`}
          icon="currency-rupee"
          color="emerald"
        />
        <DashboardCard
          title="Pending Settlement"
          value={`₹${pendingSettlement.toLocaleString('en-IN')}`}
          subtitle="Processing disbursements"
          icon="clock"
          color={pendingSettlement > 0 ? "amber" : "gray"}
        />
        <DashboardCard
          title="Total Transactions"
          value={totalReceipts}
          subtitle="All recorded disbursements"
          icon="document-text"
          color="blue"
        />
        <DashboardCard
          title="Settlement Rate"
          value={totalReceipts > 0 ? `${((completedReceipts / totalReceipts) * 100).toFixed(0)}%` : '100%'}
          subtitle="Successful commercial completion"
          icon="check-circle"
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
            placeholder="Search ref #, order, buyer..."
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
        <LoadingSpinner message="Auditing financial payment ledger..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadPayments} />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No payment records found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No payment receipts match your filter criteria.'
              : 'Payments will appear here when buyers complete transactions for delivered produce orders.'
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Receipt & Date</th>
                  <th className="px-4 py-3.5 text-left">Order & Produce</th>
                  <th className="px-4 py-3.5 text-left">Buyer</th>
                  <th className="px-4 py-3.5 text-left">Method & Reference</th>
                  <th className="px-4 py-3.5 text-right">Settled Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Ledger Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPayments.map((pay) => (
                  <tr key={pay.paymentId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">#PAY-{pay.paymentId}</div>
                      <div className="text-xs text-gray-500">
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
                      <div className="text-xs text-gray-500">{pay.cropName || 'Produce'}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pay.buyerName || 'Buyer'}</div>
                      <div className="text-xs text-gray-500">{pay.businessName || 'Wholesale Buyer'}</div>
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
                      <div className="text-xs text-gray-400">
                        Order total: ₹{Number(pay.orderTotalAmount || pay.amount).toLocaleString('en-IN')}
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

      {/* Order Payment Summary Modal */}
      {summaryModalOpen && (
        <Modal
          isOpen={summaryModalOpen}
          onClose={() => setSummaryModalOpen(false)}
          title={`Order Payment Balance Summary: #ORD-${selectedOrderSummary?.orderId || ''}`}
          maxWidth="max-w-xl"
        >
          {summaryLoading ? (
            <LoadingSpinner message="Auditing contract receipts..." />
          ) : selectedOrderSummary ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Total Contract Value</span>
                  <div className="text-base font-bold text-gray-900">
                    ₹{Number(selectedOrderSummary.orderTotalAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 uppercase">Total Paid</span>
                  <div className="text-base font-bold text-emerald-600">
                    ₹{Number(selectedOrderSummary.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-amber-700 uppercase">Remaining Balance</span>
                  <div className="text-base font-bold text-amber-600">
                    ₹{Number(selectedOrderSummary.remainingBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-100 pb-2">
                <span>Payment Settlement Status:</span>
                <span className={`font-semibold ${selectedOrderSummary.isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedOrderSummary.isFullyPaid ? 'Fully Settled' : 'Partial / Balance Due'}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Transaction Disbursements ({selectedOrderSummary.payments?.length || 0})
                </h4>
                {selectedOrderSummary.payments && selectedOrderSummary.payments.length > 0 ? (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                    {selectedOrderSummary.payments.map((p) => (
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
                  <p className="text-xs text-gray-400 italic">No disbursement receipts found for this order.</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSummaryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
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

export default FarmerPayments;
