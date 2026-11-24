import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SelectField from '../../components/SelectField';
import InputField from '../../components/InputField';
import TextareaField from '../../components/TextareaField';
import {
  formatCurrency,
  formatPricePerKg,
  formatQuantity,
  formatDate,
  formatLocation,
} from '../../utils/formatters';
import {
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  Scale,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Eye,
} from 'lucide-react';

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

  // Inspect Lot Modal state
  const [inspectLotModalOpen, setInspectLotModalOpen] = useState(false);
  const [selectedInspectMatch, setSelectedInspectMatch] = useState(null);

  const handleOpenInspectLot = (match) => {
    setSelectedInspectMatch(match);
    setInspectLotModalOpen(true);
  };

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

  const requirementOptions = requirements.map((r) => ({
    value: String(r.requirementId),
    label: `#REQ-${r.requirementId} — ${r.cropName} (${Number(r.requiredQuantity).toLocaleString()} kg @ max ₹${Number(r.maxPricePerKg).toFixed(2)}/kg)`,
  }));

  const sortOptions = [
    { value: 'best', label: 'Optimal Match Score (Best)' },
    { value: 'price', label: 'Lowest Price / kg' },
    { value: 'quality', label: 'Highest Quality Rating' },
    { value: 'quantity', label: 'Largest Available Volume' },
  ];

  const totalPurchaseValue =
    (parseFloat(orderQuantity) || 0) * (parseFloat(agreedPrice) || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title">
              <Sparkles size={26} color="var(--color-primary)" />
              <span>Quality-Aware Harvest Matching</span>
            </h1>
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 800,
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary-border)',
                letterSpacing: '0.04em',
              }}
            >
              Phase 7 Engine
            </span>
          </div>
          <p className="page-subtitle">
            Deterministic 100-point multi-factor engine pairing commercial purchase requirements with certified farmer harvest lots.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div
        className="card"
        style={{
          padding: '1.15rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        <SelectField
          label="Active Crop Requirement"
          value={selectedReqId}
          onChange={handleSelectRequirement}
          disabled={loadingReqs || requirements.length === 0}
          options={requirementOptions}
          placeholder={requirements.length === 0 ? 'No Open Requirements' : undefined}
          style={{ marginBottom: 0 }}
        />

        <SelectField
          label="Rank Matching Lots By"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          options={sortOptions}
          style={{ marginBottom: 0 }}
        />
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Redesigned Requirement Summary Grid */}
      {matchingData && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  border: '1px solid var(--color-primary-border)',
                }}
              >
                {matchingData.cropName ? matchingData.cropName.charAt(0) : 'C'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    {matchingData.cropName}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    #REQ-{matchingData.requirementId}
                  </span>
                  <StatusBadge status={matchingData.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Procurement Requirement Specification
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Compatible Lots
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {matchingData.totalMatches ?? matches.length}
              </div>
            </div>
          </div>

          {/* Structured Responsive Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Demand Volume
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {formatQuantity(matchingData.requiredQuantity)}
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Maximum Price Ceiling
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                {formatPricePerKg(matchingData.maximumPricePerKg)}
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Minimum Quality Standard
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning-dark)', marginTop: '0.25rem' }}>
                Grade {matchingData.minimumQualityGrade}
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Delivery Destination
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginTop: '0.25rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={matchingData.preferredLocation}
              >
                {matchingData.preferredLocation || 'Standard Market Hub'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Match Cards */}
      {loadingReqs ? (
        <LoadingSpinner message="Loading requirements..." />
      ) : requirements.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No open crop requirements"
          description="Quality-aware matching requires at least one active, open requirement to evaluate against available harvest lots."
          actionLabel="Post New Requirement"
          onAction={() => navigate('/buyer/requirements/new')}
        />
      ) : loadingMatches ? (
        <LoadingSpinner message="Executing multi-factor quality-aware matching algorithm..." />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No compatible harvest lots found"
          description="None of the listed farmer harvests currently meet this requirement's price ceiling, minimum quality grade, or crop specifications."
          actionLabel="Adjust Requirement Criteria"
          onAction={() => navigate(`/buyer/requirements/${selectedReqId}`)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matches.map((m, index) => {
            const score = Number(m.matchScore || 0);
            const loc = formatLocation(m.location);
            return (
              <div
                key={m.harvestId}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  border: '1px solid var(--color-border)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Card Top: Identity & Score Section */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  {/* Left: Crop, Lot, Badges & Farmer Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: 'var(--color-text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        #{index + 1}
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                        {m.cropName}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'var(--color-bg-alt)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        Lot #HAR-{m.harvestId}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                        }}
                      >
                        Grade {m.qualityGrade}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-success-bg)',
                          color: 'var(--color-success)',
                        }}
                      >
                        {m.qualityVerificationStatus || 'VERIFIED'}
                      </span>
                    </div>

                    {/* Metadata Subline */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <div>
                        Farmer: <strong style={{ color: 'var(--color-text)' }}>{m.farmerName}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title={loc.full}>
                        <MapPin size={13} color="var(--color-text-muted)" />
                        <span>{loc.line1}{loc.line2 ? `, ${loc.line2}` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={13} color="var(--color-text-muted)" />
                        <span>Harvested: {formatDate(m.harvestDate)}</span>
                      </div>
                    </div>

                    {/* Quality Factor Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Freshness: <strong style={{ color: 'var(--color-text)' }}>{m.freshness != null ? `${m.freshness}/10` : 'N/A'}</strong>
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Appearance: <strong style={{ color: 'var(--color-text)' }}>{m.appearance != null ? `${m.appearance}/10` : 'N/A'}</strong>
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Ripeness: <strong style={{ color: 'var(--color-text)' }}>{m.ripeness != null ? `${m.ripeness}/10` : 'N/A'}</strong>
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Damage: <strong style={{ color: 'var(--color-text)' }}>{m.damagePercentage ?? 0}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Middle: Prominent Match Score Card with 4 Backend Factors */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      backgroundColor: 'var(--color-bg)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                        Match Compatibility
                      </span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {score.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ 100</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--color-border-subtle)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-primary)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    {/* 4 Backend Score Factors */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.35rem 0.75rem',
                        fontSize: '0.7rem',
                        color: 'var(--color-text-secondary)',
                        paddingTop: '0.2rem',
                      }}
                    >
                      <div>Price: <strong style={{ color: 'var(--color-text)' }}>{Number(m.priceScore || 0).toFixed(1)}/30</strong></div>
                      <div>Quality: <strong style={{ color: 'var(--color-text)' }}>{Number(m.qualityScoreComponent || 0).toFixed(1)}/30</strong></div>
                      <div>Location: <strong style={{ color: 'var(--color-text)' }}>{Number(m.locationScore || 0).toFixed(1)}/20</strong></div>
                      <div>Quantity: <strong style={{ color: 'var(--color-text)' }}>{Number(m.quantityScore || 0).toFixed(1)}/20</strong></div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Pricing, Available Stock, and Primary Place Order Action */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                        Listing Price
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {formatPricePerKg(m.pricePerKg)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                        Available Inventory
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        {formatQuantity(m.availableQuantity)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenInspectLot(m)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.85rem' }}
                    >
                      <Eye size={14} />
                      <span>Inspect Lot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenPlaceOrder(m)}
                      className="btn btn-primary"
                      style={{ minWidth: '130px', fontWeight: 700 }}
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Lot Modal */}
      {inspectLotModalOpen && selectedInspectMatch && (
        <Modal
          isOpen={inspectLotModalOpen}
          onClose={() => setInspectLotModalOpen(false)}
          title={`Harvest Lot Dossier — #HAR-${selectedInspectMatch.harvestId}`}
          maxWidth="600px"
        >
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                  {selectedInspectMatch.cropName}
                </h3>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                  Lot #HAR-{selectedInspectMatch.harvestId} · Harvested: {formatDate(selectedInspectMatch.harvestDate)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#92400e' }}>
                  Grade {selectedInspectMatch.qualityGrade}
                </span>
                <span style={{ padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  {selectedInspectMatch.qualityVerificationStatus || 'VERIFIED'}
                </span>
              </div>
            </div>

            {/* Farm & Commercial Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Origin Producer</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '0.2rem' }}>{selectedInspectMatch.farmerName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  {formatLocation(selectedInspectMatch.location).full}
                </div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Available Stock & Price</div>
                <div style={{ fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem', fontSize: '1rem' }}>
                  {formatPricePerKg(selectedInspectMatch.pricePerKg)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Inventory: {formatQuantity(selectedInspectMatch.availableQuantity)}
                </div>
              </div>
            </div>

            {/* Parameter Matrix */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Physical Quality Parameters (1 - 10 Scale)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {[
                  { label: 'Freshness', val: selectedInspectMatch.freshness },
                  { label: 'Appearance', val: selectedInspectMatch.appearance },
                  { label: 'Size', val: selectedInspectMatch.size },
                  { label: 'Color', val: selectedInspectMatch.color },
                  { label: 'Ripeness', val: selectedInspectMatch.ripeness },
                ].map((p) => (
                  <div key={p.label} style={{ padding: '0.5rem 0.25rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{p.label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.15rem' }}>{p.val ?? '—'}/10</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', padding: '0 0.25rem' }}>
                <span>Certified Score: <strong style={{ color: 'var(--color-primary)' }}>{Number(selectedInspectMatch.qualityScore || 0).toFixed(1)} / 100</strong></span>
                <span>Damage Allowance: <strong>{selectedInspectMatch.damagePercentage ?? 0}%</strong></span>
              </div>
            </div>

            {/* Match Compatibility Breakdown */}
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                  Multi-Factor Compatibility Breakdown
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {Number(selectedInspectMatch.matchScore || 0).toFixed(1)} / 100
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <div>Price Factor: <strong style={{ color: 'var(--color-text)' }}>{Number(selectedInspectMatch.priceScore || 0).toFixed(1)} / 30</strong></div>
                <div>Quality Factor: <strong style={{ color: 'var(--color-text)' }}>{Number(selectedInspectMatch.qualityScoreComponent || 0).toFixed(1)} / 30</strong></div>
                <div>Location Factor: <strong style={{ color: 'var(--color-text)' }}>{Number(selectedInspectMatch.locationScore || 0).toFixed(1)} / 20</strong></div>
                <div>Quantity Factor: <strong style={{ color: 'var(--color-text)' }}>{Number(selectedInspectMatch.quantityScore || 0).toFixed(1)} / 20</strong></div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setInspectLotModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectLotModalOpen(false);
                  handleOpenPlaceOrder(selectedInspectMatch);
                }}
                className="btn btn-primary"
                style={{ fontWeight: 700 }}
              >
                Proceed to Place Order
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Place Order Modal */}
      {orderModalOpen && selectedMatch && (
        <Modal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          title={`Place Purchase Order — Lot #HAR-${selectedMatch.harvestId}`}
          maxWidth="560px"
        >
          <form onSubmit={handleConfirmOrder} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orderError && <ErrorMessage message={orderError} onDismiss={() => setOrderError(null)} />}

            {/* Section 1: Harvest Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                Harvest Lot Specification
              </div>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Crop:</span>{' '}
                  <strong style={{ color: 'var(--color-text)' }}>{selectedMatch.cropName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Farmer:</span>{' '}
                  <strong style={{ color: 'var(--color-text)' }}>{selectedMatch.farmerName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Origin:</span>{' '}
                  <strong style={{ color: 'var(--color-text)' }}>{formatLocation(selectedMatch.location).full}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Quality Grade:</span>{' '}
                  <strong style={{ color: '#92400e' }}>Grade {selectedMatch.qualityGrade}</strong>{' '}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    ({Number(selectedMatch.qualityScore || 0).toFixed(1)} / 100)
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Available Stock:</span>{' '}
                  <strong style={{ color: 'var(--color-text)' }}>{formatQuantity(selectedMatch.availableQuantity)}</strong>
                </div>
              </div>
            </div>

            {/* Section 2: Purchase Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                Commercial Purchase Terms
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InputField
                  label="Order Quantity (kg)"
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedMatch.availableQuantity}
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="e.g. 150"
                  style={{ marginBottom: 0 }}
                />

                <InputField
                  label="Agreed Price (₹/kg)"
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  placeholder="e.g. 26.00"
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* Visually Prominent Total Purchase Value */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--color-primary-subtle)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary)' }}>
                    Total Purchase Value
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                    Contract volume multiplied by agreed rate
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatCurrency(totalPurchaseValue)}
                </div>
              </div>
            </div>

            {/* Section 3: Delivery Remarks */}
            <TextareaField
              label="Logistics & Delivery Remarks"
              rows={2}
              placeholder="Dock requirements, unload schedule, delivery vehicle specifications..."
              value={orderRemarks}
              onChange={(e) => setOrderRemarks(e.target.value)}
              style={{ marginBottom: 0 }}
            />

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="btn btn-secondary"
                disabled={ordering}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ordering}
                className="btn btn-primary"
                style={{ fontWeight: 700 }}
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
