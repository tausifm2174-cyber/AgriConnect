import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import farmerApi from '../../services/farmerApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/ErrorMessage';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import {
  Wheat,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Trash2,
  Calendar,
  MapPin,
  Tag,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export const FarmerHarvests = () => {
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quality Modal State
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [selectedHarvestForQuality, setSelectedHarvestForQuality] = useState(null);

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHarvests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await farmerApi.getHarvests();
      // Backend returns ApiResponse { data: List<HarvestResponse> }
      setHarvests(res.data || []);
    } catch (err) {
      console.error('Failed to load farmer harvests:', err);
      setError(err.message || 'Unable to retrieve harvest lot listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvests();
  }, []);

  const handleOpenQuality = async (harvest) => {
    setSelectedHarvestForQuality(harvest);
    setQualityModalOpen(true);
    setQualityLoading(true);
    setSelectedQuality(null);

    try {
      const res = await farmerApi.getHarvestQuality(harvest.harvestId);
      // Backend returns ApiResponse { data: QualityAssessmentResponse }
      setSelectedQuality(res.data || null);
    } catch (err) {
      console.warn('Failed to load quality for harvest lot:', err);
    } finally {
      setQualityLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);

    try {
      await farmerApi.deleteHarvest(deleteId);
      setSuccessMsg(`Harvest lot #${deleteId} successfully removed.`);
      setDeleteId(null);
      fetchHarvests();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to delete harvest:', err);
      setError(err.message || 'Cannot delete harvest lot. Lots referenced in purchase orders cannot be deleted.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  // Filter and search computation
  const filteredHarvests = harvests.filter((h) => {
    const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;
    const matchesSearch =
      h.cropName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(h.harvestId).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="page-title">
            <Wheat size={26} color="var(--color-primary)" />
            <span>My Harvested Produce Lots</span>
          </h1>
          <p className="page-subtitle">
            Catalog of agricultural lots available for quality inspection, marketplace pricing, and commercial buyer matching.
          </p>
        </div>

        <Link to="/farmer/harvests/new" className="btn btn-primary">
          <Plus size={18} />
          <span>List New Harvest Lot</span>
        </Link>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by crop, location, or lot ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }} />
          </div>

          {/* Status Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.35rem',
            backgroundColor: 'var(--color-bg-alt)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto'
          }}>
            {['ALL', 'AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === status ? 'var(--color-surface)' : 'transparent',
                  color: statusFilter === status ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: statusFilter === status ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Harvest Listings */}
      {loading ? (
        <LoadingSpinner message="Fetching your harvest lots from database..." />
      ) : filteredHarvests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Wheat size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
            No Harvest Lots Found
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '380px', margin: '0.5rem auto 1.5rem' }}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'No harvest lots match your search query or status filter.'
              : 'You have not listed any agricultural harvest lots yet. Add your first lot to start receiving commercial orders.'}
          </p>
          <Link to="/farmer/harvests/new" className="btn btn-primary">
            <Plus size={18} />
            <span>List Harvest Lot</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredHarvests.map((h) => (
            <div key={h.harvestId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      LOT #{h.harvestId}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                      {h.cropName}
                    </h3>
                    {h.cropCategory && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        Category: {h.cropCategory}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={h.status} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  padding: '0.875rem',
                  backgroundColor: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  margin: '0.875rem 0'
                }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Available / Initial
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text)' }}>
                      {h.availableQuantity} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ {h.initialQuantity} kg</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Asking Price
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ₹{h.pricePerKg} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ kg</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={15} color="var(--color-text-muted)" />
                    <span>Harvest Date: <strong>{h.harvestDate}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={15} color="var(--color-text-muted)" />
                    <span>Origin: <strong>{h.location}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.25rem',
                paddingTop: '0.875rem',
                borderTop: '1px solid var(--color-border-subtle)'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenQuality(h)}
                >
                  <ShieldCheck size={16} color="var(--color-primary)" />
                  <span>Quality Audit</span>
                </button>

                {h.status === 'AVAILABLE' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeleteId(h.harvestId)}
                    style={{ color: 'var(--color-danger)' }}
                    title="Delete unreferenced harvest lot"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quality Details Modal */}
      <Modal
        isOpen={qualityModalOpen}
        onClose={() => setQualityModalOpen(false)}
        title={`Quality Audit: Lot #${selectedHarvestForQuality?.harvestId} (${selectedHarvestForQuality?.cropName})`}
        maxWidth="500px"
      >
        {qualityLoading ? (
          <LoadingSpinner message="Retrieving certified inspection details..." />
        ) : selectedQuality ? (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'var(--color-bg-alt)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>VERIFICATION GRADE</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={selectedQuality.qualityGrade} type="grade" />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>COMPOSITE SCORE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {selectedQuality.qualityScore} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>/ 100</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>STATUS</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge status={selectedQuality.verificationStatus} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                Freshness: <strong>{selectedQuality.freshness} / 10</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                Appearance: <strong>{selectedQuality.appearance} / 10</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                Size Caliber: <strong>{selectedQuality.size} / 10</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                Color Uniformity: <strong>{selectedQuality.color} / 10</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                Ripeness: <strong>{selectedQuality.ripeness} / 10</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                Damage Defect: <strong>{selectedQuality.damagePercentage}%</strong>
              </div>
            </div>

            {selectedQuality.inspectorNotes && (
              <div style={{
                padding: '0.875rem',
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--color-info)'
              }}>
                <strong>Inspector Remarks:</strong> {selectedQuality.inspectorNotes}
              </div>
            )}

            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              Inspected on {selectedQuality.assessmentDate} by authorized platform assessor.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Clock size={36} color="var(--color-warning)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Quality Inspection Pending
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
              This harvest lot is awaiting certified evaluation by the platform administrator. Once evaluated, verified grade and brix scores will be published here.
            </p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Harvest Lot"
        message={`Are you sure you want to delete harvest lot #${deleteId}? This action cannot be reversed. Lots already tied to purchase contracts cannot be deleted.`}
        confirmLabel="Yes, Delete Lot"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
};

export default FarmerHarvests;
