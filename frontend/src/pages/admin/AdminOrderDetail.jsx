import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Clock,
  User,
  Truck,
  CreditCard,
  Wheat,
  MapPin,
  CheckCircle2,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const [orderRes, payRes] = await Promise.allSettled([
          adminApi.getOrderById(id),
          adminApi.getPaymentsByOrder(id)
        ]);

        if (orderRes.status === 'fulfilled') {
          setOrder(orderRes.value.data?.data || orderRes.value.data || null);
        } else {
          throw new Error(orderRes.reason?.response?.data?.message || 'Order record not found.');
        }

        if (payRes.status === 'fulfilled') {
          setPaymentSummary(payRes.value.data?.data || payRes.value.data || null);
        }
      } catch (err) {
        console.error('Failed to load order audit record:', err);
        setError(err.message || 'Unable to retrieve order audit record.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrderAudit();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving commercial contract audit record..." />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </button>
        <ErrorMessage message={error || 'Order record not found.'} />
      </div>
    );
  }

  // Lifecycle steps: PENDING -> ACCEPTED / CONFIRMED -> SHIPPED -> DELIVERED
  const getLifecycleStage = (status) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'ACCEPTED':
      case 'CONFIRMED': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 0; // CANCELLED or REJECTED
    }
  };

  const currentStage = getLifecycleStage(order.status);
  const isTerminated = order.status === 'CANCELLED' || order.status === 'REJECTED';

  const steps = [
    { label: 'Contract Placed', description: 'Order created & stock reserved' },
    { label: 'Confirmed by Farmer', description: 'Terms accepted for dispatch' },
    { label: 'Freight Dispatched', description: 'In transit to buyer facility' },
    { label: 'Delivered & Completed', description: 'Goods received & verified' },
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          title="Back to Orders"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="text-xs text-gray-500 font-medium">Marketplace / Contract Lifecycle Audit</div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Purchase Order #ORD-{order.orderId}</h1>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Contract Lifecycle Visual Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
          Contract Lifecycle Execution Pipeline
        </h2>

        {isTerminated ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
            <AlertTriangle size={18} className="text-rose-600" />
            <div>
              <strong>Contract Terminated ({order.status}):</strong> This purchase agreement was terminated prior to fulfillment. Reserved harvest lot stock was returned to available farmer inventory.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((st, idx) => {
              const stepNumber = idx + 1;
              const isPassed = currentStage >= stepNumber;
              const isCurrent = currentStage === stepNumber;

              return (
                <div key={idx} className="relative flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors z-10 ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 size={16} /> : stepNumber}
                  </div>
                  <div className="mt-2 font-bold text-xs text-gray-900">{st.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{st.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Order Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commodity & Financial Terms */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-700">
            <ShoppingBag size={20} />
            <h3 className="text-base font-bold text-gray-900">Commercial Contract Terms</h3>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
            <div className="text-xs text-gray-400 uppercase font-bold">Crop Commodity</div>
            <div className="text-lg font-bold text-gray-900">{order.cropName}</div>
            <div className="text-xs text-gray-500">Category: <strong className="uppercase">{order.cropCategory}</strong></div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-400 uppercase text-[10px] font-bold">Contracted Quantity</div>
              <div className="text-base font-bold text-gray-900 mt-0.5">{Number(order.quantity).toLocaleString()} kg</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-400 uppercase text-[10px] font-bold">Agreed Unit Price</div>
              <div className="text-base font-bold text-gray-900 mt-0.5">₹{Number(order.agreedPricePerKg).toFixed(2)}/kg</div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-900 uppercase">Total Invoice Value</span>
            <span className="text-xl font-black text-emerald-700">
              ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="text-xs text-gray-500 space-y-1.5 pt-2">
            <div className="flex justify-between">
              <span>Contract Initiated:</span>
              <strong className="text-gray-800">{order.orderDate ? new Date(order.orderDate).toLocaleString('en-IN') : 'N/A'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Harvest Lot Origin:</span>
              <strong className="text-gray-800 font-mono">#HAR-{order.harvestId}</strong>
            </div>
            {order.requirementId && (
              <div className="flex justify-between">
                <span>Matched Buyer Demand:</span>
                <strong className="text-gray-800 font-mono">#REQ-{order.requirementId}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Counterparty Stakeholders: Buyer & Farmer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buyer Profile */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <User size={16} />
                Commercial Buyer Entity
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">{order.buyerName}</h4>
                <div className="text-xs text-gray-500">{order.businessName || 'Direct Commercial Buyer'}</div>
              </div>
              <div className="text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-2 font-mono">
                <div>Email: {order.buyerEmail || '—'}</div>
                <div>Phone: {order.buyerPhone || '—'}</div>
                <div>Buyer ID: #{order.buyerId}</div>
              </div>
            </div>

            {/* Farmer Profile */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Wheat size={16} />
                Producing Farmer Entity
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">{order.farmerName}</h4>
                <div className="text-xs text-gray-500">{order.farmLocation || 'Farm gate location'}</div>
              </div>
              <div className="text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-2 font-mono">
                <div>Email: {order.farmerEmail || '—'}</div>
                <div>Phone: {order.farmerPhone || '—'}</div>
                <div>Farmer ID: #{order.farmerId}</div>
              </div>
            </div>
          </div>

          {/* Settlement / Payment Summary */}
          {paymentSummary && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                  <CreditCard size={16} />
                  Financial Settlement Audit
                </div>
                <span className="text-xs font-mono text-gray-400">Linked to Order #{order.orderId}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 font-bold uppercase text-[10px]">Total Invoiced</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">₹{Number(paymentSummary.totalAmount || 0).toLocaleString()}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800">
                  <div className="font-bold uppercase text-[10px]">Settled Amount</div>
                  <div className="text-sm font-black mt-0.5">₹{Number(paymentSummary.paidAmount || 0).toLocaleString()}</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-amber-800">
                  <div className="font-bold uppercase text-[10px]">Balance Remaining</div>
                  <div className="text-sm font-black mt-0.5">₹{Number(paymentSummary.balanceRemaining || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Contract Notes / Remarks */}
          {order.remarks && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
              <strong className="text-gray-900">Contract Remarks / Special Instructions:</strong>
              <p className="mt-1">{order.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
