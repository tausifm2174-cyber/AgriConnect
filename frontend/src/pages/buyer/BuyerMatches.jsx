import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerMatches = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const reqParam = searchParams.get('requirementId');
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState(reqParam || '');
  const [sortOption, setSortOption] = useState('best');

  const [matchingData, setMatchingData] = useState(null);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState(null);

  // Place Order Modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [orderRemarks, setOrderRemarks] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Load Open Requirements on mount
  useEffect(() => {
    loadOpenRequirements();
  }, []);

  // When selected requirement or sort changes, load matches
  useEffect(() => {
    if (selectedReqId) {
      loadMatches(selectedReqId, sortOption);
    } else {
      setMatchingData(null);
    }
  }, [selectedReqId, sortOption]);

  const loadOpenRequirements = async () => {
    try {
      setLoadingReqs(true);
      setError(null);
      const res = await buyerApi.getRequirements();
      const allReqs = res.data?.data || res.data || [];
      const openReqs = allReqs.filter((r) => r.status === 'OPEN');
      setRequirements(openReqs);

      // Auto-select first if none specified in URL or invalid
      if (openReqs.length > 0) {
        if (!selectedReqId || !openReqs.some((r) => String(r.requirementId) === String(selectedReqId))) {
          const firstId = String(openReqs[0].requirementId);
          setSelectedReqId(firstId);
          setSearchParams({ requirementId: firstId });
        }
      }
    } catch (err) {
      console.error('Failed to load requirements:', err);
      setError('Failed to retrieve open requirements for matching.');
    } finally {
      setLoadingReqs(false);
    }
  };

  const loadMatches = async (reqId, sort) => {
    try {
      setLoadingMatches(true);
      setError(null);
      const res = await buyerApi.getRequirementMatches(reqId, sort);
      const data = res.data?.data || res.data;
      setMatchingData(data);
    } catch (err) {
      console.error('Error executing matching engine:', err);
      setError(err.response?.data?.message || err.message || 'Failed to compute harvest lot matches.');
      setMatchingData(null);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSelectRequirement = (e) => {
    const newId = e.target.value;
    setSelectedReqId(newId);
    setSearchParams(newId ? { requirementId: newId } : {});
  };

  const handleOpenPlaceOrder = (match) => {
    setSelectedMatch(match);
    // Default quantity to minimum of required quantity or available harvest quantity
    const targetQty = matchingData?.requiredQuantity || match.availableQuantity;
    const defaultQty = Math.min(Number(targetQty), Number(match.availableQuantity));
    setOrderQuantity(String(defaultQty));
    setAgreedPrice(String(match.pricePerKg));
    setOrderRemarks('');
    setOrderError(null);
    setOrderModalOpen(true);
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const qty = parseFloat(orderQuantity);
    const price = parseFloat(agreedPrice);

    if (isNaN(qty) || qty <= 0) {
      setOrderError('Order quantity must be greater than 0 kg.');
      return;
    }
    if (qty > Number(selectedMatch.availableQuantity)) {
      setOrderError(`Requested quantity (${qty} kg) exceeds available lot stock (${selectedMatch.availableQuantity} kg).`);
      return;
    }
    if (isNaN(price) || price <= 0) {
      setOrderError('Agreed price must be greater than ₹0.');
      return;
    }

    try {
      setOrdering(true);
      setOrderError(null);

      const orderPayload = {
        harvestId: selectedMatch.harvestId,
        quantity: qty,
        agreedPricePerKg: price,
        requirementId: Number(selectedReqId),
        remarks: orderRemarks.trim() || undefined,
      };

      const res = await buyerApi.createOrder(orderPayload);
      const createdOrder = res.data?.data || res.data;
      setOrderModalOpen(false);

      if (createdOrder?.orderId) {
        navigate(`/buyer/orders/${createdOrder.orderId}`);
      } else {
        navigate('/buyer/orders');
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setOrderError(err.response?.data?.message || err.message || 'Failed to place purchase order.');
    } finally {
      setOrdering(false);
    }
  };

  const matches = matchingData?.matches || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Quality-Aware Harvest Matching</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Phase 7 Engine
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Deterministic 100-point multi-factor engine matching commercial buyer requirements with verified farmer harvest lots.
          </p>
        </div>

        {/* Requirement & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Requirement:</label>
            <select
              value={selectedReqId}
              onChange={handleSelectRequirement}
              disabled={loadingReqs || requirements.length === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {requirements.length === 0 ? (
                <option value="">No Open Requirements</option>
              ) : (
                requirements.map((r) => (
                  <option key={r.requirementId} value={r.requirementId}>
                    #REQ-{r.requirementId} — {r.cropName} ({r.requiredQuantity} kg @ max ₹{r.maxPricePerKg})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Rank By:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="best">Optimal Match Score (Best)</option>
              <option value="price">Lowest Price / kg</option>
              <option value="quality">Highest Quality Rating</option>
              <option value="quantity">Largest Available Volume</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Target Requirement Specification Banner */}
      {matchingData && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-lg">
              {matchingData.cropName ? matchingData.cropName.charAt(0) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base">
                  Target: {matchingData.cropName}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  #REQ-{matchingData.requirementId}
                </span>
                <StatusBadge status={matchingData.status} />
              </div>
              <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>Demand: <strong>{Number(matchingData.requiredQuantity).toLocaleString()} kg</strong></span>
                <span>Max Ceiling: <strong>₹{Number(matchingData.maximumPricePerKg).toFixed(2)}/kg</strong></span>
                <span>Min Standard: <strong>Grade {matchingData.minimumQualityGrade}</strong></span>
                <span>Destination: <strong>{matchingData.preferredLocation}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Compatible Lots</div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {matchingData.totalMatches ?? matches.length}
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Match Cards */}
      {loadingReqs ? (
        <LoadingSpinner message="Loading requirements..." />
      ) : requirements.length === 0 ? (
        <EmptyState
          title="No open crop requirements"
          description="Quality-aware matching requires at least one active, non-expired requirement."
          actionLabel="Post New Requirement"
          onAction={() => navigate('/buyer/requirements/new')}
        />
      ) : loadingMatches ? (
        <LoadingSpinner message="Executing multi-factor quality-aware matching algorithm..." />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No compatible harvest lots found"
          description="None of the listed farmer harvests currently meet this requirement's price ceiling, minimum quality grade, or crop specifications."
          actionLabel="Adjust Requirement Criteria"
          onAction={() => navigate(`/buyer/requirements/${selectedReqId}`)}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m, index) => {
            const score = Number(m.matchScore || 0);
            return (
              <div
                key={m.harvestId}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-emerald-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Left: Harvest & Farmer Meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-500">#{index + 1}</span>
                      <h3 className="text-base font-bold text-gray-900">
                        {m.cropName} — Lot #HAR-{m.harvestId}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                        Grade {m.qualityGrade}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.qualityVerificationStatus || 'VERIFIED'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Farmer: <strong className="text-gray-900">{m.farmerName}</strong></span>
                      <span>Farm Location: <strong className="text-gray-900">{m.location}</strong></span>
                      <span>
                        Harvested:{' '}
                        <strong>
                          {m.harvestDate ? new Date(m.harvestDate).toLocaleDateString('en-IN') : 'N/A'}
                        </strong>
                      </span>
                    </div>

                    {/* Quality Assessment Breakdown */}
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Freshness: {m.freshness ?? 'N/A'}/5</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Appearance: {m.appearance ?? 'N/A'}/5</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Ripeness: {m.ripeness ?? 'N/A'}/5</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Damage: {m.damagePercentage ?? 0}%</span>
                    </div>
                  </div>

                  {/* Middle: 100-Point Match Score & Scoring Components */}
                  <div className="lg:w-72 bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Deterministic Match Score
                      </span>
                      <span className="text-lg font-black text-emerald-600">
                        {score.toFixed(1)} <span className="text-xs font-normal text-gray-400">/ 100</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      />
                    </div>

                    {/* Breakdown 4 Factors */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-600 pt-1">
                      <div>Price Score: <strong>{Number(m.priceScore || 0).toFixed(1)}/30</strong></div>
                      <div>Quality Score: <strong>{Number(m.qualityScoreComponent || 0).toFixed(1)}/30</strong></div>
                      <div>Location Score: <strong>{Number(m.locationScore || 0).toFixed(1)}/20</strong></div>
                      <div>Quantity Score: <strong>{Number(m.quantityScore || 0).toFixed(1)}/20</strong></div>
                    </div>
                  </div>

                  {/* Right: Quantity, Pricing & Order CTA */}
                  <div className="lg:text-right flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 min-w-[170px]">
                    <div>
                      <div className="text-xl font-bold text-gray-900">
                        ₹{Number(m.pricePerKg).toFixed(2)}
                        <span className="text-xs font-normal text-gray-500"> / kg</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Stock: <strong>{Number(m.availableQuantity).toLocaleString()} kg</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenPlaceOrder(m)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors whitespace-nowrap"
                    >
                      Place Order &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Place Order Modal */}
      {orderModalOpen && selectedMatch && (
        <Modal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          title={`Place Purchase Order — Lot #HAR-${selectedMatch.harvestId}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleConfirmOrder} className="space-y-4 text-sm">
            {orderError && <ErrorMessage message={orderError} onDismiss={() => setOrderError(null)} />}

            <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Crop Commodity:</span>
                <span className="font-semibold text-gray-900">{selectedMatch.cropName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Farmer:</span>
                <span className="font-semibold text-gray-900">{selectedMatch.farmerName} ({selectedMatch.location})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verified Quality:</span>
                <span className="font-semibold text-amber-700">Grade {selectedMatch.qualityGrade} ({Number(selectedMatch.qualityScore || 0).toFixed(1)}/5)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Available Lot Inventory:</span>
                <span className="font-semibold text-gray-900">{Number(selectedMatch.availableQuantity).toLocaleString()} kg</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Order Volume (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedMatch.availableQuantity}
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Agreed Price (₹/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Total Calculation Display */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-800">Total Purchase Value:</span>
              <span className="text-lg font-black text-emerald-700">
                ₹{((parseFloat(orderQuantity) || 0) * (parseFloat(agreedPrice) || 0)).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Logistics / Delivery Remarks</label>
              <textarea
                rows={2}
                placeholder="Special delivery instructions, warehouse dock details, delivery deadline..."
                value={orderRemarks}
                onChange={(e) => setOrderRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ordering}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
              >
                {ordering ? 'Placing Order...' : 'Confirm Purchase Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BuyerMatches;
