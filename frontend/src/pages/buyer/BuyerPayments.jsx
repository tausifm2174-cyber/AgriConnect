import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import SelectField from '../../components/SelectField';
import InputField from '../../components/InputField';
import {
  CreditCard,
  ShoppingBag,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const BuyerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Form state
  const [recordForm, setRecordForm] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'UPI',
    transactionReference: '',
    remarks: ''
  });
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    loadPaymentsData();
  }, []);

  const loadPaymentsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [payRes, ordRes] = await Promise.all([
        buyerApi.getPayments(),
        buyerApi.getOrders(),
      ]);

      const pData = payRes.data?.data || payRes.data || [];
      const oData = ordRes.data?.data || ordRes.data || [];

      setPayments(Array.isArray(pData) ? pData : []);
      setOrders(Array.isArray(oData) ? oData : []);
    } catch (err) {
      console.error('Failed to load buyer payments:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load payment records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecord = () => {
    const firstEligible = orders.find((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status)) || orders[0];
    setRecordForm({
      orderId: firstEligible ? String(firstEligible.orderId) : '',
      amount: firstEligible ? String(firstEligible.totalAmount) : '',
      paymentMethod: 'UPI',
      transactionReference: `UPI-${Date.now().toString().slice(-8)}`,
      remarks: 'Payment against purchase order'
    });
    setRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.orderId || !recordForm.amount) {
      setError('Please select an order and provide payment amount.');
      return;
    }

    try {
      setRecording(true);
      setError(null);
      await buyerApi.recordPayment({
        orderId: Number(recordForm.orderId),
        amount: Number(recordForm.amount),
        paymentMethod: recordForm.paymentMethod,
        transactionReference: recordForm.transactionReference,
        remarks: recordForm.remarks
      });

      setActionSuccess(`Payment of ₹${Number(recordForm.amount).toLocaleString('en-IN')} recorded for Order #ORD-${recordForm.orderId}!`);
      setRecordModalOpen(false);
      await loadPaymentsData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setError(err.response?.data?.message || err.message || 'Payment recording failed.');
    } finally {
      setRecording(false);
    }
  };

  const handleOpenOrderSummary = async (orderId) => {
    try {
      setLoadingSummary(true);
      setSummaryModalOpen(true);
      const res = await buyerApi.getOrderPaymentSummary(orderId);
      setSelectedSummary(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Failed to load order payment summary:', err);
      setSelectedSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // KPIs
  const totalPaidAmount = payments
    .filter((p) => p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalOrdersContracted = orders
    .filter((o) => ['ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const pendingInvoiceBalance = Math.max(0, totalOrdersContracted - totalPaidAmount);
  const totalReceipts = payments.length;

  // Filter
  const filteredPayments = payments.filter((pay) => {
    const matchesStatus = statusFilter === 'ALL' || pay.paymentStatus === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(pay.paymentId).includes(term) ||
      String(pay.orderId).includes(term) ||
      pay.transactionReference?.toLowerCase().includes(term) ||
      pay.cropName?.toLowerCase().includes(term) ||
      pay.farmerName?.toLowerCase().includes(term) ||
      pay.paymentMethod?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CreditCard size={26} color="var(--color-primary)" />
            <span>Payments & Invoice History</span>
          </h1>
          <p className="page-subtitle">
            View order payments, payment methods, transaction references, and payment statuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={handleOpenRecord}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Make Payment</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadPaymentsData}
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
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Paid"
          value={loading ? '...' : `₹${Number(totalPaidAmount).toLocaleString('en-IN')}`}
          description={`${payments.filter((p) => p.paymentStatus === 'COMPLETED').length} completed payments`}
          icon={CreditCard}
          variant="success"
        />
        <DashboardCard
          title="Contract Volume"
          value={loading ? '...' : `₹${Number(totalOrdersContracted).toLocaleString('en-IN')}`}
          description="All accepted & delivered orders"
          icon={ShoppingBag}
          variant="primary"
        />
        <DashboardCard
          title="Pending Invoices"
          value={loading ? '...' : `₹${Number(pendingInvoiceBalance).toLocaleString('en-IN')}`}
          description="Remaining contract balance"
          icon={Clock}
          variant="secondary"
          trend={pendingInvoiceBalance > 0 ? `₹${Number(pendingInvoiceBalance).toLocaleString('en-IN')}` : null}
          trendLabel={pendingInvoiceBalance > 0 ? 'Pending' : null}
        />
        <DashboardCard
          title="Payment Receipts"
          value={loading ? '...' : totalReceipts}
          description="Recorded transactions"
          icon={FileText}
          variant="accent"
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
            placeholder="Search ref #, order #, farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <LoadingSpinner message="Auditing financial transaction ledger..." />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No payments match your filter criteria.'
              : 'Payments recorded for delivered produce orders appear here.'
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Receipt & Date</th>
                <th>Order & Crop</th>
                <th>Farmer</th>
                <th>Method & Reference</th>
                <th style={{ textAlign: 'right' }}>Paid Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay) => (
                <tr key={pay.paymentId}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#PAY-{pay.paymentId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {pay.paymentDate
                        ? new Date(pay.paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Recorded'}
                    </div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>#ORD-{pay.orderId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{pay.cropName}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{pay.farmerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{pay.farmLocation}</div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-bg-alt)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {pay.paymentMethod ? pay.paymentMethod.replace('_', ' ') : 'DIRECT'}
                    </span>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pay.transactionReference}>
                      {pay.transactionReference || 'REF-N/A'}
                    </div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ₹{Number(pay.amount).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Order Total: ₹{Number(pay.orderTotalAmount || pay.amount).toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                    <StatusBadge status={pay.paymentStatus} />
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenOrderSummary(pay.orderId)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.65rem' }}
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

      {/* Make Payment Modal */}
      {recordModalOpen && (
        <Modal
          isOpen={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          title="Record Order Payment"
          maxWidth="480px"
        >
          <form onSubmit={handleRecordSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SelectField
              label="Purchase Order"
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
              options={[
                { value: '', label: 'Select order...' },
                ...orders.map((o) => ({
                  value: o.orderId,
                  label: `#ORD-${o.orderId} — ${o.cropName} (₹${Number(o.totalAmount).toLocaleString('en-IN')}) — ${o.status}`
                }))
              ]}
            />

            <InputField
              label="Payment Amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              suffix="₹"
              value={recordForm.amount}
              onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
            />

            <SelectField
              label="Payment Method"
              required
              value={recordForm.paymentMethod}
              onChange={(e) => setRecordForm({ ...recordForm, paymentMethod: e.target.value })}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
                { value: 'UPI', label: 'UPI (Unified Payments Interface)' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque' },
              ]}
            />

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Transaction Reference</label>
              <input
                type="text"
                placeholder="Bank UTR / UPI Ref ID..."
                value={recordForm.transactionReference}
                onChange={(e) => setRecordForm({ ...recordForm, transactionReference: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Remarks</label>
              <input
                type="text"
                value={recordForm.remarks}
                onChange={(e) => setRecordForm({ ...recordForm, remarks: e.target.value })}
                className="form-control"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recording}
                className="btn btn-primary"
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
          maxWidth="560px"
        >
          {loadingSummary ? (
            <LoadingSpinner message="Auditing contract receipts..." />
          ) : selectedSummary ? (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Contract Total</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.2rem' }}>
                    ₹{Number(selectedSummary.orderTotalAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Paid</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                    ₹{Number(selectedSummary.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Balance Due</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.2rem' }}>
                    ₹{Number(selectedSummary.remainingBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: selectedSummary.isFullyPaid ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                  {selectedSummary.isFullyPaid ? 'Fully Paid' : 'Balance Pending'}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Transaction Disbursements ({selectedSummary.payments?.length || 0})
                </h4>
                {selectedSummary.payments && selectedSummary.payments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedSummary.payments.map((p) => (
                      <div key={p.paymentId} style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#PAY-{p.paymentId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {p.paymentMethod} • {p.transactionReference || 'REF-N/A'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>₹{Number(p.amount).toLocaleString('en-IN')}</div>
                          <div style={{ marginTop: '0.2rem' }}><StatusBadge status={p.paymentStatus} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No disbursement receipts found.</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  onClick={() => setSummaryModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <p style={{ padding: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Summary could not be loaded.</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default BuyerPayments;
