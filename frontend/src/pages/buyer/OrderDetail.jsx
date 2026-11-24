import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import InputField from '../../components/InputField';
import TextareaField from '../../components/TextareaField';
import SelectField from '../../components/SelectField';
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  User,
  Award,
  Truck,
  CreditCard,
  AlertTriangle,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  Star,
  MessageSquare,
  RotateCcw,
  History
} from 'lucide-react';

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Buyer Quality Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackIssueType, setFeedbackIssueType] = useState('QUALITY_LOWER_THAN_CERTIFIED');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordRes, payRes, fbRes, auditRes] = await Promise.all([
        buyerApi.getOrderById(id),
        buyerApi.getPaymentsByOrder(id).catch(() => ({ data: null })),
        buyerApi.getOrderQualityFeedback(id).catch(() => ({ data: { data: null } })),
        buyerApi.getOrderQualityAuditHistory(id).catch(() => ({ data: { data: [] } })),
      ]);

      const ordData = ordRes.data?.data || ordRes.data;
      const payData = payRes.data?.data || payRes.data || null;
      const fbData = fbRes.data?.data || fbRes.data || null;
      const auditData = auditRes.data?.data || auditRes.data || [];

      setOrder(ordData);
      setPaymentSummary(payData);
      setFeedback(fbData);
      setAuditHistory(auditData);
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
      setCancelError(null);
      await buyerApi.cancelOrder(id, {
        reason: cancelReason.trim() || 'Cancelled by buyer before farmer acceptance'
      });
      setCancelModalOpen(false);
      loadOrderDetails();
    } catch (err) {
      console.error('Error cancelling order:', err);
      setCancelError(err.response?.data?.message || 'Unable to cancel order. Please refresh the page and try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      setFeedbackError(null);
      await buyerApi.submitQualityFeedback(id, {
        rating: Number(feedbackRating),
        issueType: feedbackRating < 5 ? feedbackIssueType : null,
        comments: feedbackComments.trim(),
      });
      setFeedbackSuccess('Quality feedback submitted successfully and registered in the Quality Audit Center.');
      setFeedbackModalOpen(false);
      loadOrderDetails();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setFeedbackError(err.response?.data?.message || 'Failed to submit quality feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading procurement contract specifications..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadOrderDetails} />;
  if (!order) return null;

  const isPending = order.status === 'PENDING';
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';
  const isRejected = order.status === 'REJECTED';
  const isTerminated = isCancelled || isRejected;

  // Stepper lifecycle status
  const steps = [
    { key: 'PENDING', label: 'Order Placed', sub: 'Awaiting farmer acceptance' },
    { key: 'ACCEPTED', label: 'Accepted', sub: 'Reserved by producer' },
    { key: 'CONFIRMED', label: 'Confirmed', sub: 'Commercial terms locked' },
    { key: 'SHIPPED', label: 'Dispatched', sub: 'In logistics transit' },
    { key: 'DELIVERED', label: 'Delivered', sub: 'Fulfillment complete' },
  ];

  const statusOrder = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ paddingBottom: '3rem' }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link
          to="/buyer/orders"
          className="hover:text-emerald-700 flex items-center gap-1 transition-colors text-gray-600"
        >
          <ArrowLeft size={14} />
          <span>Purchase Orders</span>
        </Link>
        <ChevronRight size={12} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Order #ORD-{order.orderId}</span>
      </nav>

      {/* Main Order Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Purchase Order #ORD-{order.orderId}
              </h1>
              <StatusBadge status={order.status} />
              {order.qualityGrade && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Grade {order.qualityGrade}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
              <Calendar size={13} className="text-gray-400" />
              <span>
                Contract created on{' '}
                <strong className="text-gray-700">
                  {new Date(order.orderDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </strong>
              </span>
              {order.harvestId && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>Harvest Lot <strong className="font-mono text-gray-700">#HAR-{order.harvestId}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPending && (
              <button
                type="button"
                onClick={() => {
                  setCancelReason('');
                  setCancelError(null);
                  setCancelModalOpen(true);
                }}
                className="px-3.5 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle size={14} />
                <span>Cancel Contract</span>
              </button>
            )}

            {isDelivered && !feedback && (
              <button
                type="button"
                onClick={() => {
                  setFeedbackRating(5);
                  setFeedbackIssueType('QUALITY_LOWER_THAN_CERTIFIED');
                  setFeedbackComments('');
                  setFeedbackError(null);
                  setFeedbackModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <MessageSquare size={14} />
                <span>Report Quality / Feedback</span>
              </button>
            )}

            {!isTerminated && (
              <Link
                to="/buyer/deliveries"
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Truck size={14} />
                <span>Track Delivery</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center shadow-sm">
          <span>{feedbackSuccess}</span>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Contract Lifecycle Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Clock size={14} className="text-emerald-600" />
            <span>Procurement Lifecycle Stepper</span>
          </h2>
          <span className="text-xs font-semibold text-gray-600">
            Current Stage: <strong className="text-gray-900">{order.status}</strong>
          </span>
        </div>

        {isTerminated ? (
          <div className="p-5 bg-red-50 border border-red-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertTriangle size={18} className="text-red-600" />
              <span>{order.status === 'CANCELLED' ? 'ORDER CANCELLED' : 'ORDER REJECTED'}</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              <strong>Termination Reason:</strong> {order.cancellationReason || 'Contract terminated before fulfillment.'}
            </p>
            <div className="text-[11px] text-red-600 flex flex-wrap gap-4 pt-1.5 border-t border-red-200/60">
              <span>Status: <strong className="font-semibold">{order.status}</strong></span>
              <span>Purchase Value: <strong>₹{Number(order.totalAmount).toLocaleString('en-IN')}</strong></span>
              <span>Commodity: <strong>{order.cropName} ({Number(order.quantity).toLocaleString()} kg)</strong></span>
              <span>Farmer: <strong>{order.farmerName}</strong></span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {steps.map((step, idx) => {
              const isPast = currentIndex > idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={step.key} className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-full rounded-full transition-all ${
                        isPast
                          ? 'bg-emerald-600'
                          : isCurrent
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5">
                      {isPast ? (
                        <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                      ) : (
                        <span
                          className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold flex-shrink-0 ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold leading-tight ${
                          isPast || isCurrent ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug pl-5">
                      {step.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Specifications 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commodity & Financial Terms */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              <span>Commodity & Commercial Terms</span>
            </h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">
              {order.cropCategory || 'Agricultural Produce'}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Commodity Crop:</span>
              <span className="font-semibold text-gray-900">{order.cropName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Harvest Lot Ref:</span>
              <span className="font-mono text-gray-800 font-semibold">#HAR-{order.harvestId}</span>
            </div>
            {order.requirementId && (
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 text-xs">Matched Requirement:</span>
                <Link
                  to={`/buyer/requirements/${order.requirementId}`}
                  className="text-emerald-600 font-semibold hover:underline flex items-center gap-1 text-xs"
                >
                  <span>#REQ-{order.requirementId}</span>
                  <ExternalLink size={11} />
                </Link>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Contract Volume:</span>
              <span className="font-bold text-gray-900">{Number(order.quantity).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Agreed Unit Price:</span>
              <span className="font-bold text-gray-900">₹{Number(order.agreedPricePerKg).toFixed(2)} / kg</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Total Purchase Value
              </span>
              <span className="text-xl font-black text-emerald-700">
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Producer / Farmer Information */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User size={16} className="text-emerald-600" />
              <span>Producer & Farm Profile</span>
            </h3>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
              Verified Farmer
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Producer Name:</span>
              <span className="font-semibold text-gray-900">{order.farmerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Farm Origin:</span>
              <span className="text-gray-800 text-right font-medium max-w-[220px]">
                {order.farmLocation || 'Farm registered in state'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Official Contact Email:</span>
              <span className="text-gray-800 font-mono text-xs">{order.farmerEmail}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Phone Contact:</span>
              <span className="text-gray-800 font-medium">{order.farmerPhone || 'Verified Contact'}</span>
            </div>
            {order.notes && (
              <div className="pt-1">
                <span className="text-gray-500 text-xs block mb-1">Contract Remarks:</span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200 italic">
                  "{order.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verified Quality Certificate Snapshot (Strictly /100) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Verified Quality Certificate Snapshot
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Grade {order.qualityGrade || 'N/A'}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {order.qualityVerificationStatus || 'OFFICIALLY_VERIFIED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Certified Quality Score
            </span>
            <div className="text-xl font-black text-gray-900 mt-1 flex items-baseline gap-1">
              <span>
                {order.qualityScore != null ? Number(order.qualityScore).toFixed(1) : 'N/A'}
              </span>
              <span className="text-xs text-gray-400 font-normal">/ 100</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Standardized composite score computed across lab inspection parameters.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 sm:col-span-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Quality Assurance Compliance
            </span>
            <div className="flex items-start gap-2 mt-2">
              <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 leading-relaxed">
                Inspected and officially stamped by an accredited Agricultural Produce Market Committee (APMC) Quality Inspector prior to listing. Lot meets grading and food safety standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Quality Feedback Section (Delivered Orders) */}
      {isDelivered && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">
                Buyer Quality Assessment & Post-Delivery Feedback
              </h3>
            </div>
            {feedback && <StatusBadge status={feedback.reviewStatus} />}
          </div>

          {feedback ? (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Your Rating:</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={15}
                        className={star <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                      />
                    ))}
                    <span className="ml-1 text-xs text-gray-700 font-black">({feedback.rating}/5)</span>
                  </div>
                </div>

                {feedback.issueType && (
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                    {feedback.issueType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-500 uppercase text-[10px] block mb-1">
                  Recorded Quality Observations:
                </span>
                <p className="italic">"{feedback.comments}"</p>
              </div>

              <div className="text-[11px] text-gray-400 flex justify-between pt-1">
                <span>Submitted on: {new Date(feedback.createdAt).toLocaleString('en-IN')}</span>
                <span>Review Status: <strong className="text-gray-700">{feedback.reviewStatus}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900">Produce Delivered — Have you inspected this lot?</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  If the produce delivered does not meet the certified quality grade, or has incurred damage, you can submit official feedback to trigger an administrative audit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedbackRating(5);
                  setFeedbackIssueType('QUALITY_LOWER_THAN_CERTIFIED');
                  setFeedbackComments('');
                  setFeedbackError(null);
                  setFeedbackModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-colors flex items-center gap-1.5"
              >
                <MessageSquare size={13} />
                <span>Submit Quality Feedback</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quality Audit & Reassessment History (If Reassessment occurred on this Lot) */}
      {auditHistory.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">
                Quality Audit & Reassessment History
              </h3>
            </div>
            <span className="text-xs text-gray-400">Harvest Lot #HAR-{order.harvestId}</span>
          </div>

          <div className="space-y-2">
            {auditHistory.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs flex items-start gap-3">
                <Clock size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">{item.action?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-gray-400">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : '—'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Authorized Inspector: <strong>{item.actorName || 'APMC Quality Desk'}</strong>
                  </div>
                  {item.scoreAfter != null && (
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                      Updated Certified Score: {Number(item.scoreAfter).toFixed(1)} / 100 {item.gradeAfter ? `(Grade ${item.gradeAfter})` : ''}
                    </div>
                  )}
                  {item.notes && <p className="text-[11px] text-gray-600 mt-1 italic">"{item.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logistics & Delivery Address */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Truck size={16} className="text-emerald-600" />
            <span>Delivery & Logistics Destination</span>
          </h3>
          {!isTerminated && (
            <Link
              to="/buyer/deliveries"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View Deliveries Console</span>
              <ChevronRight size={13} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <MapPin size={13} className="text-gray-400" />
              <span>Receiving Facility Address</span>
            </span>
            <p className="font-medium text-gray-800 text-xs pt-1">
              {order.deliveryAddress || 'Standard Warehouse / Receiving Facility on record'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Expected Delivery:</span>
              <span className="font-semibold text-gray-900">
                {order.expectedDeliveryDate
                  ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Pending dispatch scheduling'}
              </span>
            </div>
            {order.actualDeliveryDate && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Actual Delivery:</span>
                <span className="font-semibold text-emerald-700">
                  {new Date(order.actualDeliveryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment & Balance Summary */}
      {paymentSummary && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-600" />
              <span>Commercial Payment & Invoice Balance</span>
            </h3>
            <Link
              to="/buyer/payments"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Payments Console</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Contract Total
              </span>
              <div className="text-lg font-black text-gray-900 mt-1">
                ₹{Number(paymentSummary.orderTotalAmount || order.totalAmount).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-700 uppercase tracking-wider font-bold">
                Total Paid
              </span>
              <div className="text-lg font-black text-emerald-700 mt-1">
                ₹{Number(paymentSummary.totalPaid || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-xs text-amber-700 uppercase tracking-wider font-bold">
                Remaining Balance Due
              </span>
              <div className="text-lg font-black text-amber-700 mt-1">
                ₹{Number(paymentSummary.remainingBalance || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Feedback Submission Modal */}
      {feedbackModalOpen && (
        <Modal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          title={`Submit Quality Assessment Feedback — #ORD-${order.orderId}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitFeedback} className="space-y-4 text-sm">
            {feedbackError && <ErrorMessage message={feedbackError} onDismiss={() => setFeedbackError(null)} />}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <strong>Quality Assurance Policy:</strong> Your review and remarks will be recorded in the APMC Quality Audit Center. Rating lower than 4 stars can trigger an administrative review and physical reinspection of the harvest lot.
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Overall Produce Quality Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={
                        star <= feedbackRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300 hover:text-gray-400'
                      }
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-700 ml-2">
                  {feedbackRating === 5 && 'Excellent (Grade Verified)'}
                  {feedbackRating === 4 && 'Good (Minor Variations)'}
                  {feedbackRating === 3 && 'Fair (Noticeable Defect)'}
                  {feedbackRating === 2 && 'Poor (Major Discrepancy)'}
                  {feedbackRating === 1 && 'Severe Issue / Unacceptable'}
                </span>
              </div>
            </div>

            {/* Issue Category (if rating is < 5) */}
            {feedbackRating < 5 && (
              <SelectField
                label="Primary Quality Discrepancy Category"
                required
                value={feedbackIssueType}
                onChange={(e) => setFeedbackIssueType(e.target.value)}
                options={[
                  { value: 'QUALITY_LOWER_THAN_CERTIFIED', label: 'Quality noticeably lower than certified grade/score' },
                  { value: 'EXCESSIVE_DAMAGE', label: 'Excessive physical damage, spoilage, or transit bruising' },
                  { value: 'FRESHNESS_ISSUE', label: 'Produce freshness degraded or wilted' },
                  { value: 'APPEARANCE_ISSUE', label: 'Visual defects, abnormal discoloration, or blemishes' },
                  { value: 'RIPENESS_ISSUE', label: 'Over-ripe or premature/under-ripe produce' },
                  { value: 'SIZE_MISMATCH', label: 'Size variation outside certified uniformity standards' },
                  { value: 'OTHER', label: 'Other quality / specification discrepancy' },
                ]}
              />
            )}

            <TextareaField
              label="Quality Inspection Remarks"
              required
              rows={4}
              placeholder="Describe your physical observation upon receiving the delivery (e.g. condition, packaging, moisture, damage observed)..."
              value={feedbackComments}
              onChange={(e) => setFeedbackComments(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingFeedback || !feedbackComments.trim()}
                className="btn btn-primary text-xs font-bold"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Quality Feedback'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Purchase Contract #ORD-${order.orderId}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-4">
            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                {cancelError}
              </div>
            )}
            <p className="text-xs text-gray-600">
              Please enter the procurement cancellation reason. Once cancelled before farmer acceptance, produce stock is automatically unlocked.
            </p>
            <TextareaField
              label="Cancellation Reason"
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Specification adjustment, internal procurement schedule update..."
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="btn btn-danger text-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OrderDetail;
