import React, { useState, useEffect } from 'react';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  CreditCard,
  Clock,
  FileText,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';

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
      setError(err.response?.data?.message || 'Failed to load order payment ledger summary.');
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

  const pendingPayments = payments
    .filter((p) => p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalReceipts = payments.length;
  const completedReceipts = payments.filter((p) => p.paymentStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CreditCard size={26} color="var(--color-primary)" />
            <span>Payment Ledger & Receipts</span>
          </h1>
          <p className="page-subtitle">
            Track received and pending payments, payment methods, and transaction references for your orders.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayments}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Received Revenue"
          value={`₹${totalReceived.toLocaleString('en-IN')}`}
          description={`${completedReceipts} completed credits`}
          icon={CreditCard}
          variant="success"
        />
        <DashboardCard
          title="Pending Payments"
          value={`₹${pendingPayments.toLocaleString('en-IN')}`}
          description="Processing order payments"
          icon={Clock}
          variant="secondary"
          trend={pendingPayments > 0 ? `+${pendingPayments}` : null}
          trendLabel={pendingPayments > 0 ? 'Pending' : null}
        />
        <DashboardCard
          title="Total Transactions"
          value={totalReceipts}
          description="All recorded payments"
          icon={FileText}
          variant="accent"
        />
        <DashboardCard
          title="Payment Completion Rate"
          value={totalReceipts > 0 ? `${((completedReceipts / totalReceipts) * 100).toFixed(0)}%` : '100%'}
          description="Successful payment completion"
          icon={CheckCircle2}
          variant="primary"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="tab-group">
          {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search ref #, order, buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Receipt & Date</th>
                <th>Order & Produce</th>
                <th>Buyer</th>
                <th>Method & Reference</th>
                <th style={{ textAlign: 'right' }}>Settled Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Ledger Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay) => (
                <tr key={pay.paymentId}>
                  <td>
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

                  <td>
                    <div className="font-medium text-gray-900">#ORD-{pay.orderId}</div>
                    <div className="text-xs text-gray-500">{pay.cropName || 'Produce'}</div>
                  </td>

                  <td>
                    <div className="font-medium text-gray-900">{pay.buyerName || 'Buyer'}</div>
                    <div className="text-xs text-gray-500">{pay.businessName || 'Wholesale Buyer'}</div>
                  </td>

                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                      {pay.paymentMethod ? pay.paymentMethod.replace('_', ' ') : 'DIRECT'}
                    </span>
                    <div className="font-mono text-xs text-gray-500 mt-0.5 truncate max-w-[140px]" title={pay.transactionReference}>
                      {pay.transactionReference || 'REF-N/A'}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="text-base font-bold text-emerald-600">
                      ₹{Number(pay.amount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Order total: ₹{Number(pay.orderTotalAmount || pay.amount).toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge status={pay.paymentStatus} />
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenOrderSummary(pay.orderId)}
                      className="btn btn-secondary btn-sm"
                    >
                      Order Balance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <span>Payment Status:</span>
                <span className={`font-semibold ${selectedOrderSummary.isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedOrderSummary.isFullyPaid ? 'Fully Paid' : 'Partial / Balance Due'}
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
