import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordRes, payRes] = await Promise.all([
        buyerApi.getOrderById(id),
        buyerApi.getPaymentsByOrder(id).catch(() => ({ data: null })),
      ]);

      const ordData = ordRes.data?.data || ordRes.data;
      const payData = payRes.data?.data || payRes.data || null;

      setOrder(ordData);
      setPaymentSummary(payData);
    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    try {
      setCancelling(true);
      await buyerApi.cancelOrder(id, {
        reason: cancelReason.trim() || 'Cancelled by buyer before farmer acceptance'
      });
      setCancelModalOpen(false);
      loadOrderDetails();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading contract specifications..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadOrderDetails} />;
  if (!order) return null;

  const isPending = order.status === 'PENDING';
  const isAccepted = order.status === 'ACCEPTED';
  const isShipped = order.status === 'SHIPPED';
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';
  const isRejected = order.status === 'REJECTED';

  // Timeline Step Status
  const getTimelineStatus = (step) => {
    if (isCancelled || isRejected) return 'closed';
    if (step === 'PLACED') return 'completed';
    if (step === 'ACCEPTED') return ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : isPending ? 'active' : 'pending';
    if (step === 'SHIPPED') return ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'completed' : isAccepted ? 'active' : 'pending';
    if (step === 'DELIVERED') return isDelivered ? 'completed' : isShipped ? 'active' : 'pending';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/buyer/orders')}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mb-2"
        >
          &larr; Back to Orders
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Order #ORD-{order.orderId}
            </h1>
            <StatusBadge status={order.status} />
          </div>

          {isPending && (
            <button
              onClick={() => {
                setCancelReason('');
                setCancelModalOpen(true);
              }}
              className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Placed on {new Date(order.orderDate).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Visual Contract Lifecycle Timeline */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
          Contract Lifecycle Status
        </h3>

        {isCancelled || isRejected ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <div className="font-bold flex items-center gap-2">
              <span>Order Terminated ({order.status})</span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Reason: {order.cancellationReason || 'No specific remarks recorded.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { id: 'PLACED', title: '1. Placed', desc: 'Awaiting farmer' },
              { id: 'ACCEPTED', title: '2. Accepted', desc: 'Reserved by farmer' },
              { id: 'SHIPPED', title: '3. Dispatched', desc: 'In logistics transit' },
              { id: 'DELIVERED', title: '4. Delivered', desc: 'Received & settled' },
            ].map((step) => {
              const state = getTimelineStatus(step.id);
              const isComp = state === 'completed';
              const isAct = state === 'active';
              return (
                <div key={step.id} className="space-y-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isComp ? 'bg-emerald-600' : isAct ? 'bg-emerald-300 animate-pulse' : 'bg-gray-200'
                    }`}
                  />
                  <div className={`font-bold mt-2 ${isComp ? 'text-emerald-700' : isAct ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-gray-500">{step.desc}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spec Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commodity & Pricing */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Commodity & Financial Terms
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Crop Commodity:</span>
              <span className="font-semibold text-gray-900">{order.cropName} ({order.cropCategory})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Harvest Lot Ref:</span>
              <span className="font-mono text-gray-800">#HAR-{order.harvestId}</span>
            </div>
            {order.requirementId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Matched Requirement:</span>
                <Link to={`/buyer/requirements/${order.requirementId}`} className="text-emerald-600 font-semibold hover:underline">
                  #REQ-{order.requirementId}
                </Link>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Contract Quantity:</span>
              <span className="font-bold text-gray-900">{Number(order.quantity).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Agreed Price / kg:</span>
              <span className="font-semibold text-gray-900">₹{Number(order.agreedPricePerKg).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-900">Total Purchase Value:</span>
              <span className="text-lg font-black text-emerald-600">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Farmer Information */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Producer / Farmer Information
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Farmer Name:</span>
              <span className="font-semibold text-gray-900">{order.farmerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Farm Location:</span>
              <span className="text-gray-800 text-right">{order.farmLocation || 'Farm registered in state'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="text-gray-800">{order.farmerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span className="text-gray-800">{order.farmerPhone || 'Verified Contact'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Certificate Snapshot */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2 flex items-center justify-between">
          <span>Verified Quality Certificate Snapshot</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
            Grade {order.qualityGrade || 'N/A'}
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Quality Score:</span>
            <div className="font-bold text-gray-900 text-sm mt-0.5">
              {order.qualityScore ? `${Number(order.qualityScore).toFixed(1)} / 5.0` : 'N/A'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Verification:</span>
            <div className="font-bold text-emerald-700 text-sm mt-0.5">
              {order.qualityVerificationStatus || 'OFFICIALLY_VERIFIED'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg sm:col-span-2">
            <span className="text-gray-500">Quality Assurance:</span>
            <div className="text-gray-700 text-[11px] mt-0.5">
              Certified by APMC Certified Quality Inspector prior to commercial listing.
            </div>
          </div>
        </div>
      </div>

      {/* Financial Settlement & Payment Balance */}
      {paymentSummary && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 text-sm">Escrow & Payment Settlement</h3>
            <Link to="/buyer/payments" className="text-xs font-semibold text-emerald-600 hover:underline">
              Manage Payments &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 uppercase">Contract Total</span>
              <div className="font-bold text-gray-900 mt-0.5">
                ₹{Number(paymentSummary.orderTotalAmount || order.totalAmount).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Total Paid</span>
              <div className="font-bold text-emerald-700 mt-0.5">
                ₹{Number(paymentSummary.totalPaid || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <span className="text-xs text-amber-700 uppercase font-semibold">Remaining Due</span>
              <div className="font-bold text-amber-700 mt-0.5">
                ₹{Number(paymentSummary.remainingBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Purchase Order #ORD-${order.orderId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-4 text-sm">
            <p className="text-xs text-gray-600">
              Please enter the reason for cancellation before the farmer accepts this order:
            </p>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, alternate harvest procured..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OrderDetail;
