import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Award,
  Calendar,
  User,
  MapPin,
  RefreshCw
} from 'lucide-react';

export const AdminQuality = () => {
  const [assessments, setAssessments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection / Action Modal State
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchQualityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, metricsRes] = await Promise.all([
        adminApi.getQualityAssessments(),
        adminApi.getQualityMetrics()
      ]);
      const list = listRes.data?.data || listRes.data || [];
      const m = metricsRes.data?.data || metricsRes.data || null;
      setAssessments(list);
      setMetrics(m);
    } catch (err) {
      console.error('Failed to load quality audits:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve quality assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const handleOpenInspect = (qa) => {
    setSelectedAssessment(qa);
    setInspectModalOpen(true);
    setActionError(null);
    setShowRejectForm(false);
    setRejectNotes('');
  };

  const handleVerify = async () => {
    if (!selectedAssessment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.verifyQualityAssessment(selectedAssessment.assessmentId);
      setSuccessMsg(`Quality Assessment #QA-${selectedAssessment.assessmentId} formally VERIFIED!`);
      setInspectModalOpen(false);
      fetchQualityData();
    } catch (err) {
      console.error('Failed to verify assessment:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to verify quality assessment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.rejectQualityAssessment(selectedAssessment.assessmentId, { notes: rejectNotes });
      setSuccessMsg(`Quality Assessment #QA-${selectedAssessment.assessmentId} marked as REJECTED.`);
      setInspectModalOpen(false);
      fetchQualityData();
    } catch (err) {
      console.error('Failed to reject assessment:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to reject quality assessment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Client filtering
  const filteredAssessments = assessments.filter((qa) => {
    if (selectedStatus !== 'ALL' && qa.verificationStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCrop = qa.cropName?.toLowerCase().includes(q);
      const matchFarmer = qa.farmerName?.toLowerCase().includes(q);
      const matchId = String(qa.assessmentId).includes(q) || String(qa.harvestId).includes(q);
      if (!matchCrop && !matchFarmer && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Quality Assessment & Verification</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Phase 5 Center
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Official quality inspections, 100-point physical parameter grading, and regulatory certification workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQualityData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Audits</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total Harvest Lots</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{metrics.totalHarvests || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
            <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold">Verified Lots</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.verified || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
            <div className="text-xs uppercase tracking-wider text-amber-600 font-bold">Pending Review</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{metrics.pending || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
            <div className="text-xs uppercase tracking-wider text-rose-600 font-bold">Rejected Lots</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{metrics.rejected || 0}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Status Filter Tabs */}
        <div className="tab-group">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`tab-btn ${selectedStatus === st ? 'active' : ''}`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search crop, farmer, QA #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Assessments Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying quality assessments and lab reports..." />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No quality assessments match the selected filter criteria.
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
                <th>Official Score</th>
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
                    ? 'bg-emerald-100 text-emerald-800'
                    : qa.qualityGrade === 'B'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800';

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
                    <td className="text-gray-500">
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

      {/* Inspection & Action Modal */}
      {inspectModalOpen && selectedAssessment && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Quality Audit Dossier — #QA-${selectedAssessment.assessmentId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            {actionError && <ErrorMessage message={actionError} onDismiss={() => setActionError(null)} />}

            {/* Assessment Meta Header */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">
                  Harvest Lot #HAR-{selectedAssessment.harvestId} • Audit #{selectedAssessment.assessmentId}
                </span>
                <StatusBadge status={selectedAssessment.verificationStatus} />
              </div>
              <div className="flex justify-between items-baseline">
                <h3 className="text-lg font-bold text-gray-900">{selectedAssessment.cropName}</h3>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Official Score: </span>
                  <span className="text-lg font-black text-emerald-600">
                    {Number(selectedAssessment.qualityScore).toFixed(1)} / 100
                  </span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                    Grade {selectedAssessment.qualityGrade}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 flex flex-wrap gap-4 pt-1">
                <span>Farmer: <strong>{selectedAssessment.farmerName}</strong></span>
                <span>Inspector Admin: <strong>{selectedAssessment.adminName || 'Admin Desk'}</strong></span>
                <span>Date: <strong>{selectedAssessment.assessmentDate}</strong></span>
              </div>
            </div>

            {/* Parameter Matrix */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Physical Parameter Breakdown (1 - 10 Scale)
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
                <span>Location: <strong>{selectedAssessment.harvestLocation || 'Farm gate'}</strong></span>
              </div>
            </div>

            {/* Inspector Notes */}
            {selectedAssessment.inspectorNotes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                <div className="font-bold text-amber-900">Inspector Verification Remarks:</div>
                <p className="text-amber-800 mt-0.5">{selectedAssessment.inspectorNotes}</p>
              </div>
            )}

            {/* Actions for PENDING or Status Modifications */}
            {selectedAssessment.verificationStatus !== 'VERIFIED' && !showRejectForm && (
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Reject Assessment
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                  {actionLoading ? 'Processing...' : 'Formally Verify Assessment'}
                </button>
              </div>
            )}

            {/* Rejection Form */}
            {showRejectForm && (
              <form onSubmit={handleReject} className="p-4 bg-rose-50 rounded-xl border border-rose-100 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Provide Rejection Reason & Regulatory Notes
                </h5>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the failure reasons (e.g. excessive physical damage, pest infestation, high moisture)..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full p-2.5 border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
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
                    {actionLoading ? 'Submitting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminQuality;
