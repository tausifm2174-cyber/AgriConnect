import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import SelectField from '../../components/SelectField';
import TextareaField from '../../components/TextareaField';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Award,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  Clock,
  RotateCcw,
  FileText,
  Star,
  ArrowRight,
  ChevronRight,
  Sliders,
  History,
  MessageSquare
} from 'lucide-react';

export const AdminQuality = () => {
  const [assessments, setAssessments] = useState([]);
  const [allReassessments, setAllReassessments] = useState([]);
  const [buyerFeedbacks, setBuyerFeedbacks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Tabs: 'PENDING' | 'VERIFIED' | 'REASSESSMENT_REQUIRED' | 'REJECTED' | 'AUDIT_HISTORY'
  const [activeTab, setActiveTab] = useState('PENDING');
  const [auditSubTab, setAuditSubTab] = useState('reassessments'); // 'reassessments' | 'feedback'
  const [searchQuery, setSearchQuery] = useState('');

  // Inspect Modal State
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingAuditHistory, setLoadingAuditHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Reject initial assessment form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  // Request Reassessment Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('BUYER_COMPLAINT_VERIFICATION');
  const [requestNotes, setRequestNotes] = useState('');

  // Reinspection Modal State
  const [reinspectModalOpen, setReinspectModalOpen] = useState(false);
  const [reinspectParams, setReinspectParams] = useState({
    freshness: 8.0,
    appearance: 8.0,
    size: 8.0,
    color: 8.0,
    ripeness: 8.0,
    damagePercentage: 2.0,
    reason: 'BUYER_QUALITY_DISPUTE',
    notes: '',
  });
  const [confirmRejectModalOpen, setConfirmRejectModalOpen] = useState(false);

  const fetchQualityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, metricsRes, reassessRes, feedbackRes] = await Promise.all([
        adminApi.getQualityAssessments(),
        adminApi.getQualityMetrics(),
        adminApi.getAllReassessments().catch(() => ({ data: { data: [] } })),
        adminApi.getBuyerQualityFeedback().catch(() => ({ data: { data: [] } })),
      ]);

      const list = listRes.data?.data || listRes.data || [];
      const m = metricsRes.data?.data || metricsRes.data || null;
      const reassessList = reassessRes.data?.data || reassessRes.data || [];
      const feedbackList = feedbackRes.data?.data || feedbackRes.data || [];

      setAssessments(list);
      setMetrics(m);
      setAllReassessments(reassessList);
      setBuyerFeedbacks(feedbackList);
    } catch (err) {
      console.error('Failed to load quality data:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve quality assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  // Fetch individual audit history when inspect modal opens
  const handleOpenInspect = async (qa) => {
    setSelectedAssessment(qa);
    setInspectModalOpen(true);
    setActionError(null);
    setShowRejectForm(false);
    setRejectNotes('');
    setAuditHistory([]);
    setLoadingAuditHistory(true);

    try {
      const res = await adminApi.getQualityAuditHistory(qa.assessmentId);
      setAuditHistory(res.data?.data || res.data || []);
    } catch (err) {
      console.warn('Could not load specific audit history:', err);
    } finally {
      setLoadingAuditHistory(false);
    }
  };

  // Initial Assessment Verify
  const handleVerify = async () => {
    if (!selectedAssessment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.verifyQualityAssessment(selectedAssessment.assessmentId);
      setSuccessMsg(`Quality Assessment #QA-${selectedAssessment.assessmentId} formally VERIFIED! Harvest lot is now available for buyer matching.`);
      setInspectModalOpen(false);
      fetchQualityData();
    } catch (err) {
      console.error('Failed to verify assessment:', err);
      setActionError(err.response?.data?.message || 'Unable to verify quality assessment. Please refresh and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Initial Assessment Reject
  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.rejectQualityAssessment(selectedAssessment.assessmentId, { notes: rejectNotes });
      setSuccessMsg(`Quality Assessment #QA-${selectedAssessment.assessmentId} marked as REJECTED.`);
      setInspectModalOpen(false);
      setShowRejectForm(false);
      fetchQualityData();
    } catch (err) {
      console.error('Failed to reject assessment:', err);
      setActionError(err.response?.data?.message || 'Unable to reject quality assessment. Please refresh and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Request Reassessment Modal
  const handleOpenRequestReassessment = () => {
    setRequestReason('BUYER_COMPLAINT_VERIFICATION');
    setRequestNotes('');
    setActionError(null);
    setRequestModalOpen(true);
  };

  // Submit Request Reassessment
  const handleSubmitRequestReassessment = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.requestReassessment(selectedAssessment.assessmentId, {
        reason: requestReason,
        notes: requestNotes.trim(),
      });
      setSuccessMsg(
        `Reassessment initiated for #QA-${selectedAssessment.assessmentId}. Harvest Lot #HAR-${selectedAssessment.harvestId} status set to REASSESSMENT_REQUIRED and temporarily disqualified from matching.`
      );
      setRequestModalOpen(false);
      setInspectModalOpen(false);
      fetchQualityData();
    } catch (err) {
      console.error('Failed to request reassessment:', err);
      setActionError(err.response?.data?.message || 'Unable to request reassessment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reinspection Modal
  const handleOpenReinspect = () => {
    if (!selectedAssessment) return;
    setReinspectParams({
      freshness: selectedAssessment.freshness ?? 8.0,
      appearance: selectedAssessment.appearance ?? 8.0,
      size: selectedAssessment.size ?? 8.0,
      color: selectedAssessment.color ?? 8.0,
      ripeness: selectedAssessment.ripeness ?? 8.0,
      damagePercentage: selectedAssessment.damagePercentage ?? 2.0,
      reason: 'BUYER_QUALITY_DISPUTE',
      notes: '',
    });
    setActionError(null);
    setReinspectModalOpen(true);
  };

  // Live calculation of reinspected score & grade
  const calcAverage =
    (Number(reinspectParams.freshness) +
      Number(reinspectParams.appearance) +
      Number(reinspectParams.size) +
      Number(reinspectParams.color) +
      Number(reinspectParams.ripeness)) /
    5.0;
  const calculatedScore = Math.min(100, Math.max(0, calcAverage * 10.0));
  const calculatedGrade = calculatedScore >= 80 ? 'A' : calculatedScore >= 60 ? 'B' : 'C';

  // Perform Reassessment Execution (Decision: RE_VERIFIED or REJECTED)
  const executeReassessment = async (decision) => {
    if (!selectedAssessment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.performReassessment(selectedAssessment.assessmentId, {
        freshness: Number(reinspectParams.freshness),
        appearance: Number(reinspectParams.appearance),
        size: Number(reinspectParams.size),
        color: Number(reinspectParams.color),
        ripeness: Number(reinspectParams.ripeness),
        damagePercentage: Number(reinspectParams.damagePercentage),
        reason: reinspectParams.reason,
        decision: decision,
        notes: reinspectParams.notes.trim(),
      });

      const outcomeText =
        decision === 'RE_VERIFIED'
          ? `RE-VERIFIED with score ${calculatedScore.toFixed(1)} / 100 (Grade ${calculatedGrade}). Harvest lot matching reinstated!`
          : `REJECTED. Lot is permanently disqualified from marketplace matching.`;

      setSuccessMsg(`Reinspection complete for #QA-${selectedAssessment.assessmentId}: ${outcomeText}`);
      setReinspectModalOpen(false);
      setInspectModalOpen(false);
      setConfirmRejectModalOpen(false);
      fetchQualityData();
    } catch (err) {
      console.error('Failed to submit reinspection:', err);
      setActionError(err.response?.data?.message || 'Failed to record reinspection. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter assessments based on active tab and search query
  const filteredAssessments = assessments.filter((qa) => {
    if (activeTab !== 'AUDIT_HISTORY' && activeTab !== 'ALL') {
      if (qa.verificationStatus !== activeTab) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCrop = qa.cropName?.toLowerCase().includes(q);
      const matchFarmer = qa.farmerName?.toLowerCase().includes(q);
      const matchId = String(qa.assessmentId).includes(q) || String(qa.harvestId).includes(q);
      if (!matchCrop && !matchFarmer && !matchId) return false;
    }
    return true;
  });

  // Filter feedback for selected assessment in dossier modal
  const selectedLotFeedback = selectedAssessment
    ? buyerFeedbacks.filter((fb) => fb.harvestId === selectedAssessment.harvestId)
    : [];

  return (
    <div className="space-y-6" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quality Inspection & Audit Center</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Regulatory Desk
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Official APMC produce certification, multi-parameter grading, buyer feedback dispute review & reassessment audit trail.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQualityData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Records</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center shadow-sm">
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Total Lots</div>
            <div className="text-xl font-black text-gray-900 mt-1">{metrics.totalHarvests || 0}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">Verified Lots</div>
            <div className="text-xl font-black text-emerald-700 mt-1">{metrics.verified || 0}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
            <div className="text-[11px] uppercase tracking-wider text-amber-700 font-bold">Pending Review</div>
            <div className="text-xl font-black text-amber-700 mt-1">{metrics.pending || 0}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-orange-200 shadow-sm bg-orange-50/30">
            <div className="text-[11px] uppercase tracking-wider text-orange-700 font-bold">Reassess Required</div>
            <div className="text-xl font-black text-orange-700 mt-1">{metrics.reassessmentRequired || 0}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
            <div className="text-[11px] uppercase tracking-wider text-rose-700 font-bold">Rejected Lots</div>
            <div className="text-xl font-black text-rose-700 mt-1">{metrics.rejected || 0}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
            <div className="text-[11px] uppercase tracking-wider text-blue-700 font-bold">Buyer Feedback</div>
            <div className="text-xl font-black text-blue-700 mt-1">{buyerFeedbacks.length}</div>
          </div>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="filter-bar">
        {/* Status Filter Tabs */}
        <div className="tab-group">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
          >
            Pending Inspection {metrics?.pending ? `(${metrics.pending})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VERIFIED')}
            className={`tab-btn ${activeTab === 'VERIFIED' ? 'active' : ''}`}
          >
            Verified {metrics?.verified ? `(${metrics.verified})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REASSESSMENT_REQUIRED')}
            className={`tab-btn ${activeTab === 'REASSESSMENT_REQUIRED' ? 'active' : ''}`}
          >
            Reassessment Required {metrics?.reassessmentRequired ? `(${metrics.reassessmentRequired})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REJECTED')}
            className={`tab-btn ${activeTab === 'REJECTED' ? 'active' : ''}`}
          >
            Rejected {metrics?.rejected ? `(${metrics.rejected})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_HISTORY')}
            className={`tab-btn ${activeTab === 'AUDIT_HISTORY' ? 'active' : ''}`}
          >
            Audit Trail & Feedback
          </button>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search crop, farmer, QA #, lot #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* View 1: Inspection & Quality Assessment Lists */}
      {activeTab !== 'AUDIT_HISTORY' && (
        <div className="table-wrapper">
          {loading ? (
            <div className="py-16">
              <LoadingSpinner message="Querying quality assessments and inspection logs..." />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No quality assessments found under <strong>{activeTab.replace(/_/g, ' ')}</strong>.
            </div>
          ) : (
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Lot ID</th>
                  <th>Commodity Crop</th>
                  <th>Farmer / Producer</th>
                  <th>Parameters (F / A / S / C / R)</th>
                  <th>Damage %</th>
                  <th>Certified Score</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Audit Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((qa) => {
                  const gradeBadgeColor =
                    qa.qualityGrade === 'A'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : qa.qualityGrade === 'B'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300';

                  return (
                    <tr key={qa.assessmentId}>
                      <td className="font-mono font-bold text-gray-500">#QA-{qa.assessmentId}</td>
                      <td className="font-mono text-gray-600">#HAR-{qa.harvestId}</td>
                      <td className="font-bold text-gray-900">{qa.cropName}</td>
                      <td className="font-semibold text-gray-700">{qa.farmerName}</td>
                      <td className="font-mono text-[11px] text-gray-600">
                        {qa.freshness ?? '—'} / {qa.appearance ?? '—'} / {qa.size ?? '—'} / {qa.color ?? '—'} / {qa.ripeness ?? '—'}
                      </td>
                      <td className="text-gray-600">
                        {qa.damagePercentage != null ? `${Number(qa.damagePercentage).toFixed(1)}%` : '—'}
                      </td>
                      <td className="font-bold text-emerald-700">
                        {qa.qualityScore != null ? `${Number(qa.qualityScore).toFixed(1)} / 100` : '—'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${gradeBadgeColor}`}>
                          Grade {qa.qualityGrade || '—'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={qa.verificationStatus} />
                      </td>
                      <td className="text-gray-500 text-xs">
                        {qa.assessmentDate ? new Date(qa.assessmentDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenInspect(qa)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* View 2: Platform Audit Trail & Buyer Feedback Sub-Tabs */}
      {activeTab === 'AUDIT_HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <button
              type="button"
              onClick={() => setAuditSubTab('reassessments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                auditSubTab === 'reassessments'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History size={14} />
              <span>Historical Reassessments ({allReassessments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAuditSubTab('feedback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                auditSubTab === 'feedback'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare size={14} />
              <span>Buyer Feedback Reports ({buyerFeedbacks.length})</span>
            </button>
          </div>

          {/* Sub-view A: Reassessments Log */}
          {auditSubTab === 'reassessments' && (
            <div className="table-wrapper">
              {allReassessments.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  No historical quality reassessments recorded on the platform yet.
                </div>
              ) : (
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Reassessment ID</th>
                      <th>Audit Lot</th>
                      <th>Commodity Crop</th>
                      <th>Inspector</th>
                      <th>Previous Score</th>
                      <th>Reinspected Score</th>
                      <th>Decision</th>
                      <th>Reason Trigger</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReassessments.map((r) => (
                      <tr key={r.reassessmentId}>
                        <td className="font-mono font-bold text-gray-500">#RE-{r.reassessmentId}</td>
                        <td className="font-mono text-gray-600">#QA-{r.assessmentId}</td>
                        <td className="font-bold text-gray-900">{r.cropName || 'Commodity'}</td>
                        <td className="font-semibold text-gray-700">{r.adminName}</td>
                        <td className="text-xs text-gray-500">
                          {r.previousQualityScore != null ? `${Number(r.previousQualityScore).toFixed(1)} / 100` : '—'}
                          <span className="ml-1 text-[10px] font-bold">({r.previousQualityGrade})</span>
                        </td>
                        <td className="font-bold text-emerald-700 text-xs">
                          {r.recalculatedQualityScore != null ? `${Number(r.recalculatedQualityScore).toFixed(1)} / 100` : '—'}
                          <span className="ml-1 text-[10px]">({r.recalculatedQualityGrade})</span>
                        </td>
                        <td>
                          <StatusBadge status={r.decision} />
                        </td>
                        <td className="text-xs text-gray-600 font-medium">
                          {r.reason?.replace(/_/g, ' ') || 'Reassessment'}
                        </td>
                        <td className="text-gray-500 text-xs">
                          {r.reassessmentDate ? new Date(r.reassessmentDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Sub-view B: Buyer Quality Feedback & Complaints */}
          {auditSubTab === 'feedback' && (
            <div className="table-wrapper">
              {buyerFeedbacks.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">
                  No buyer quality feedback reports submitted yet.
                </div>
              ) : (
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Feedback ID</th>
                      <th>Order #</th>
                      <th>Harvest Lot</th>
                      <th>Commodity Crop</th>
                      <th>Buyer Name</th>
                      <th>Rating</th>
                      <th>Issue Category</th>
                      <th>Review Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyerFeedbacks.map((fb) => (
                      <tr key={fb.feedbackId}>
                        <td className="font-mono font-bold text-gray-500">#FB-{fb.feedbackId}</td>
                        <td className="font-mono text-gray-600">#ORD-{fb.orderId}</td>
                        <td className="font-mono text-gray-600">#HAR-{fb.harvestId}</td>
                        <td className="font-bold text-gray-900">{fb.cropName}</td>
                        <td className="font-semibold text-gray-700">{fb.buyerName}</td>
                        <td>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                            <span>{fb.rating}</span>
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                          </div>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            {fb.issueType ? fb.issueType.replace(/_/g, ' ') : 'General Feedback'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={fb.reviewStatus} />
                        </td>
                        <td className="text-gray-500 text-xs">
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inspect & Action Dossier Modal */}
      {inspectModalOpen && selectedAssessment && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Quality Audit Dossier — #QA-${selectedAssessment.assessmentId}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-sm">
            {actionError && <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} />}

            {/* Assessment Meta Header */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-500">
                  Harvest Lot #HAR-{selectedAssessment.harvestId} • Audit Record #QA-{selectedAssessment.assessmentId}
                </span>
                <StatusBadge status={selectedAssessment.verificationStatus} />
              </div>
              <div className="flex justify-between items-baseline">
                <h3 className="text-lg font-bold text-gray-900">{selectedAssessment.cropName}</h3>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Official Score: </span>
                  <span className="text-lg font-black text-emerald-700">
                    {Number(selectedAssessment.qualityScore).toFixed(1)} / 100
                  </span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Grade {selectedAssessment.qualityGrade}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 flex flex-wrap gap-4 pt-1">
                <span>Farmer: <strong>{selectedAssessment.farmerName}</strong></span>
                <span>Inspector: <strong>{selectedAssessment.adminName || 'Admin Desk'}</strong></span>
                <span>Date: <strong>{selectedAssessment.assessmentDate}</strong></span>
                <span>Location: <strong>{selectedAssessment.harvestLocation || 'Farm Gate'}</strong></span>
              </div>
            </div>

            {/* Physical Parameter Matrix */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Physical Parameter Breakdown (1 - 10 Standard Scale)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Freshness</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{selectedAssessment.freshness ?? '—'}/10</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Appearance</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{selectedAssessment.appearance ?? '—'}/10</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Size Uniformity</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{selectedAssessment.size ?? '—'}/10</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Color Vibrancy</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{selectedAssessment.color ?? '—'}/10</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-gray-400 text-[10px] uppercase font-bold">Optimal Ripeness</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{selectedAssessment.ripeness ?? '—'}/10</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex justify-between px-1">
                <span>Damage Allowance: <strong>{Number(selectedAssessment.damagePercentage || 0).toFixed(1)}%</strong></span>
                <span>Category: <strong>{selectedAssessment.cropCategory || 'Commodity Produce'}</strong></span>
              </div>
            </div>

            {/* Inspector Notes */}
            {selectedAssessment.inspectorNotes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                <div className="font-bold text-amber-900">Inspector Verification Remarks:</div>
                <p className="text-amber-800 mt-0.5">{selectedAssessment.inspectorNotes}</p>
              </div>
            )}

            {/* Buyer Feedback on this Harvest Lot */}
            {selectedLotFeedback.length > 0 && (
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare size={14} className="text-rose-600" />
                    <span>Buyer Quality Complaints ({selectedLotFeedback.length})</span>
                  </div>
                  <span className="text-[11px] text-rose-700 font-medium">Recorded on delivered orders</span>
                </div>
                <div className="space-y-2">
                  {selectedLotFeedback.map((fb) => (
                    <div key={fb.feedbackId} className="p-2.5 bg-white rounded-lg border border-rose-100 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">{fb.buyerName} (Order #ORD-{fb.orderId})</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <span>{fb.rating}★</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-rose-700 font-semibold">
                        Issue: {fb.issueType?.replace(/_/g, ' ') || 'Quality Discrepancy'}
                      </div>
                      <p className="text-gray-600 italic">"{fb.comments}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chronological Quality Audit Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <History size={14} />
                <span>Regulatory Audit & Reassessment History</span>
              </h4>
              {loadingAuditHistory ? (
                <div className="py-4 text-center text-xs text-gray-400">Loading timeline...</div>
              ) : auditHistory.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-400 text-center">
                  No historical reassessment entries recorded for this lot.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {auditHistory.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs flex items-start gap-3">
                      <div className="mt-0.5">
                        <Clock size={13} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800">{item.action?.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-gray-400">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : '—'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Actor: <strong>{item.actorName || 'System'}</strong> ({item.actorRole})
                        </div>
                        {item.scoreAfter != null && (
                          <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                            Score: {Number(item.scoreAfter).toFixed(1)} / 100 {item.gradeAfter ? `(Grade ${item.gradeAfter})` : ''}
                          </div>
                        )}
                        {item.notes && <p className="text-[11px] text-gray-600 mt-1 italic">"{item.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contextual Action Footer */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                Current Lot Verification Status: <strong>{selectedAssessment.verificationStatus}</strong>
              </span>

              <div className="flex items-center gap-2">
                {/* When PENDING: Can Verify or Reject */}
                {selectedAssessment.verificationStatus === 'PENDING' && !showRejectForm && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Reject Assessment
                    </button>
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                    >
                      {actionLoading ? 'Verifying...' : 'Formally Verify Assessment'}
                    </button>
                  </>
                )}

                {/* When VERIFIED: Can Trigger Quality Reassessment */}
                {selectedAssessment.verificationStatus === 'VERIFIED' && (
                  <button
                    type="button"
                    onClick={handleOpenRequestReassessment}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Request Quality Reassessment</span>
                  </button>
                )}

                {/* When REASSESSMENT_REQUIRED: Can Conduct Physical Reinspection */}
                {selectedAssessment.verificationStatus === 'REASSESSMENT_REQUIRED' && (
                  <button
                    type="button"
                    onClick={handleOpenReinspect}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Sliders size={13} />
                    <span>Conduct Physical Reinspection</span>
                  </button>
                )}
              </div>
            </div>

            {/* Rejection Form for Initial Assessment */}
            {showRejectForm && (
              <form onSubmit={handleReject} className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Provide Rejection Reason & Regulatory Notes
                </h5>
                <TextareaField
                  required
                  rows={3}
                  label="Inspector Rejection Notes"
                  placeholder="Detail the failure reasons (e.g. excessive physical damage, pest damage, abnormal moisture content)..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !rejectNotes.trim()}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    {actionLoading ? 'Submitting...' : 'Confirm Lot Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* Modal 1: Request Quality Reassessment */}
      {requestModalOpen && selectedAssessment && (
        <Modal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          title={`Initiate Quality Reassessment — #QA-${selectedAssessment.assessmentId}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitRequestReassessment} className="space-y-4 text-sm">
            {actionError && <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} />}

            <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Regulatory Notice:</strong> Requesting reassessment will update Harvest Lot{' '}
              <strong>#HAR-{selectedAssessment.harvestId}</strong> to{' '}
              <span className="font-mono font-bold">REASSESSMENT_REQUIRED</span>. The produce lot will be immediately
              disqualified from buyer matching engines until an official physical reinspection is completed.
            </div>

            <SelectField
              label="Audit Trigger Reason"
              required
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              options={[
                { value: 'BUYER_COMPLAINT_VERIFICATION', label: 'Buyer Complaint / Post-Delivery Quality Dispute' },
                { value: 'ROUTINE_SPOT_CHECK', label: 'Routine APMC Quality Audit & Spot Check' },
                { value: 'TRANSIT_DAMAGE_REPORT', label: 'Logistics In-Transit Degradation / Damage Report' },
                { value: 'SUSPECTED_DEGRADATION', label: 'Produce Perishability / Shelf-Life Expiry Concern' },
                { value: 'OTHER', label: 'Other Administrative / Regulatory Audit' },
              ]}
            />

            <TextareaField
              label="Audit Justification & Inspector Instructions"
              required
              rows={4}
              placeholder="Specify the observed discrepancy or instructions for the physical reinspection team..."
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !requestNotes.trim()}
                className="btn btn-warning text-xs font-bold"
              >
                {actionLoading ? 'Flagging Lot...' : 'Flag Lot for Reassessment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Conduct Physical Reinspection & Decision Form */}
      {reinspectModalOpen && selectedAssessment && (
        <Modal
          isOpen={reinspectModalOpen}
          onClose={() => setReinspectModalOpen(false)}
          title={`Physical Reinspection & Re-grading — #QA-${selectedAssessment.assessmentId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            {actionError && <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} />}

            {/* Score Comparison Banner */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Previous Certified</span>
                <div className="text-xl font-black text-gray-700 mt-0.5">
                  {Number(selectedAssessment.qualityScore).toFixed(1)} / 100
                </div>
                <span className="text-xs font-bold text-gray-500">Grade {selectedAssessment.qualityGrade}</span>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">Reinspected Composite</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">
                  {calculatedScore.toFixed(1)} / 100
                </div>
                <span className="text-xs font-bold text-emerald-800">Grade {calculatedGrade}</span>
              </div>
            </div>

            {/* Physical Parameter Sliders / Numeric Inputs */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Re-evaluated Physical Parameters (1 - 10 Standard Scale)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'freshness', label: 'Freshness' },
                  { key: 'appearance', label: 'Appearance' },
                  { key: 'size', label: 'Size Uniformity' },
                  { key: 'color', label: 'Color Vibrancy' },
                  { key: 'ripeness', label: 'Optimal Ripeness' },
                ].map(({ key, label }) => (
                  <div key={key} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block">{label}</span>
                      <span className="text-[10px] text-gray-400">Score 1 (Poor) to 10 (Premium)</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={reinspectParams[key]}
                      onChange={(e) =>
                        setReinspectParams({
                          ...reinspectParams,
                          [key]: Math.min(10, Math.max(1, parseFloat(e.target.value) || 1)),
                        })
                      }
                      className="w-16 p-1.5 text-center font-bold border border-gray-300 rounded text-sm bg-white"
                    />
                  </div>
                ))}

                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block">Damage Percentage</span>
                    <span className="text-[10px] text-gray-400">0% (None) to 100% (Loss)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={reinspectParams.damagePercentage}
                      onChange={(e) =>
                        setReinspectParams({
                          ...reinspectParams,
                          damagePercentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                        })
                      }
                      className="w-16 p-1.5 text-center font-bold border border-gray-300 rounded text-sm bg-white"
                    />
                    <span className="text-xs text-gray-500 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            <SelectField
              label="Reassessment Reason & Resolution Category"
              required
              value={reinspectParams.reason}
              onChange={(e) => setReinspectParams({ ...reinspectParams, reason: e.target.value })}
              options={[
                { value: 'BUYER_QUALITY_DISPUTE', label: 'Buyer Quality Dispute Resolution' },
                { value: 'SCHEDULED_AUDIT', label: 'Scheduled Regulatory Re-audit' },
                { value: 'DAMAGE_INSPECTION', label: 'Physical Damage & Spoilage Check' },
                { value: 'CORRECTIVE_REVIEW', label: 'Corrective Physical Assessment' },
                { value: 'OTHER', label: 'General Administrative Reassessment' },
              ]}
            />

            <TextareaField
              label="Reinspection Findings & Lab Analysis"
              required
              rows={3}
              placeholder="Record formal physical observations, testing instruments used, and justification for score adjustments..."
              value={reinspectParams.notes}
              onChange={(e) => setReinspectParams({ ...reinspectParams, notes: e.target.value })}
            />

            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setReinspectModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRejectModalOpen(true)}
                  disabled={actionLoading || !reinspectParams.notes.trim()}
                  className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Reject Produce Lot
                </button>
                <button
                  type="button"
                  onClick={() => executeReassessment('RE_VERIFIED')}
                  disabled={actionLoading || !reinspectParams.notes.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                  {actionLoading ? 'Recording...' : `Re-Verify Lot (${calculatedScore.toFixed(1)} / 100)`}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Rejecting Reassessed Lot */}
      {confirmRejectModalOpen && (
        <ConfirmDialog
          isOpen={confirmRejectModalOpen}
          onClose={() => setConfirmRejectModalOpen(false)}
          onConfirm={() => executeReassessment('REJECTED')}
          title="Confirm Produce Lot Rejection"
          message="Are you sure you want to mark this harvest lot as REJECTED based on physical reinspection? This will permanently disqualify the lot from buyer matching and cancel pending eligibility."
          confirmLabel="Yes, Reject Lot"
          confirmVariant="danger"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default AdminQuality;
