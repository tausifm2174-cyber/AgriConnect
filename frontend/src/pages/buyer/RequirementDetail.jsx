import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SelectField from '../../components/SelectField';

export const RequirementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requirement, setRequirement] = useState(null);
  const [matchCount, setMatchCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    cropId: '',
    requiredQuantity: '',
    maxPricePerKg: '',
    minQualityGrade: 'B',
    preferredLocation: '',
    requiredByDate: '',
  });
  const [crops, setCrops] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Cancel Dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editError, setEditError] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    loadRequirement();
  }, [id]);

  const loadRequirement = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reqRes, cropsRes] = await Promise.all([
        buyerApi.getRequirementById(id),
        buyerApi.getCrops().catch(() => ({ data: [] })),
      ]);

      const reqData = reqRes.data?.data || reqRes.data;
      const cropData = cropsRes.data?.data || cropsRes.data || [];

      setRequirement(reqData);
      setCrops(Array.isArray(cropData) ? cropData : []);

      if (reqData) {
        setEditForm({
          cropId: reqData.cropId,
          requiredQuantity: reqData.requiredQuantity,
          maxPricePerKg: reqData.maxPricePerKg,
          minQualityGrade: reqData.minQualityGrade,
          preferredLocation: reqData.preferredLocation,
          requiredByDate: reqData.requiredByDate || '',
        });

        // If OPEN, check match count
        if (reqData.status === 'OPEN') {
          buyerApi
            .getRequirementMatches(id)
            .then((res) => {
              const mData = res.data?.data || res.data;
              setMatchCount(mData?.totalMatches ?? mData?.matches?.length ?? 0);
            })
            .catch(() => setMatchCount(0));
        }
      }
    } catch (err) {
      console.error('Error loading requirement details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve requirement details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        cropId: Number(editForm.cropId),
        requiredQuantity: parseFloat(editForm.requiredQuantity),
        maxPricePerKg: parseFloat(editForm.maxPricePerKg),
        minQualityGrade: editForm.minQualityGrade,
        preferredLocation: editForm.preferredLocation.trim(),
        requiredByDate: editForm.requiredByDate,
      };

      const res = await buyerApi.updateRequirement(id, payload);
      setRequirement(res.data?.data || res.data);
      setEditModalOpen(false);
      setEditError(null);
      loadRequirement();
    } catch (err) {
      console.error('Failed to update requirement:', err);
      setEditError(err.response?.data?.message || 'Failed to update requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      setCancelError(null);
      await buyerApi.cancelRequirement(id);
      setCancelDialogOpen(false);
      loadRequirement();
    } catch (err) {
      console.error('Failed to cancel requirement:', err);
      setCancelError(err.response?.data?.message || 'Failed to cancel requirement.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading requirement details..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadRequirement} />;
  if (!requirement) return null;

  const isOpen = requirement.status === 'OPEN';
  const isFulfilled = requirement.status === 'FULFILLED';
  const isCancelled = requirement.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/buyer/requirements')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mb-2"
          >
            &larr; Back to Requirements
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Requirement #REQ-{requirement.requirementId}
            </h1>
            <StatusBadge status={requirement.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Created on {new Date(requirement.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="btn btn-secondary btn-sm"
              >
                Edit Parameters
              </button>
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="btn btn-danger btn-sm"
              >
                Cancel Requirement
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Spec Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs font-semibold uppercase text-gray-500">Commodity Specification</span>
            <div className="text-lg font-bold text-gray-900 mt-1">{requirement.cropName}</div>
            <div className="text-xs text-gray-500">Category: {requirement.cropCategory || 'Agricultural'}</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs font-semibold uppercase text-gray-500">Required Quality Standard</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                Grade {requirement.minQualityGrade} or Above
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Minimum acceptable assessment rating for matching
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <span className="text-xs text-emerald-800 font-medium">Required Volume</span>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {Number(requirement.requiredQuantity).toLocaleString()} kg
            </p>
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <span className="text-xs text-emerald-800 font-medium">Maximum Buying Price</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">
              ₹{Number(requirement.maxPricePerKg).toFixed(2)} / kg
            </p>
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <span className="text-xs text-emerald-800 font-medium">Required-By Target Date</span>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {requirement.requiredByDate
                ? new Date(requirement.requiredByDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Flexible'}
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Preferred Destination Location</span>
          <p className="text-gray-800 font-medium mt-0.5">{requirement.preferredLocation}</p>
        </div>
      </div>

      {/* Quality-Aware Matching Action Card */}
      {isOpen && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white uppercase">
                Matching Engine Ready
              </span>
              {matchCount !== null && (
                <span className="text-xs font-semibold text-emerald-800">
                  {matchCount} verified harvest lot{matchCount === 1 ? '' : 's'} available
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-base mt-1">
              Deterministic Quality-Aware Harvest Matching
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Ranks farmer lots based on 100-point multi-factor model (Price, Quality, Proximity, Volume).
            </p>
          </div>

          <button
            onClick={() => navigate(`/buyer/matches?requirementId=${requirement.requirementId}`)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            View Matching Harvests &rarr;
          </button>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Requirement #REQ-${requirement.requirementId}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4 text-sm">
            {editError && (
              <div style={{ padding: '0.6rem 0.85rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', fontSize: '0.8rem' }}>
                {editError}
              </div>
            )}
            <SelectField
              label="Crop Commodity"
              value={editForm.cropId}
              onChange={(e) => setEditForm({ ...editForm, cropId: e.target.value })}
              required
              options={crops.map((c) => ({
                value: c.cropId,
                label: `${c.cropName} (${c.category})`
              }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.requiredQuantity}
                  onChange={(e) => setEditForm({ ...editForm, requiredQuantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Max Price (₹/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.maxPricePerKg}
                  onChange={(e) => setEditForm({ ...editForm, maxPricePerKg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Min Grade"
                value={editForm.minQualityGrade}
                onChange={(e) => setEditForm({ ...editForm, minQualityGrade: e.target.value })}
                options={[
                  { value: 'A', label: 'Grade A' },
                  { value: 'B', label: 'Grade B' },
                  { value: 'C', label: 'Grade C' },
                ]}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Required By Date</label>
                <input
                  type="date"
                  required
                  value={editForm.requiredByDate}
                  onChange={(e) => setEditForm({ ...editForm, requiredByDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Location</label>
              <input
                type="text"
                required
                value={editForm.preferredLocation}
                onChange={(e) => setEditForm({ ...editForm, preferredLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Crop Requirement"
        message={`Are you sure you want to cancel requirement #REQ-${requirement.requirementId}? It will no longer receive matching harvest lots.`}
        confirmText="Cancel Requirement"
        confirmVariant="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default RequirementDetail;
