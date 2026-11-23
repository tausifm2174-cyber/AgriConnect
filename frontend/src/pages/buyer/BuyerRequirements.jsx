import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';

export const BuyerRequirements = () => {
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await buyerApi.getRequirements();
      const data = res.data?.data || res.data || [];
      setRequirements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load buyer requirements:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalReq = requirements.length;
  const openReq = requirements.filter((r) => r.status === 'OPEN').length;
  const fulfilledReq = requirements.filter((r) => r.status === 'FULFILLED').length;
  const expiredReq = requirements.filter((r) => ['EXPIRED', 'CANCELLED'].includes(r.status)).length;

  // Filter
  const filteredRequirements = requirements.filter((req) => {
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(req.requirementId).includes(term) ||
      req.cropName?.toLowerCase().includes(term) ||
      req.preferredLocation?.toLowerCase().includes(term) ||
      req.cropCategory?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ClipboardList size={26} color="var(--color-primary)" />
            <span>Commercial Crop Requirements</span>
          </h1>
          <p className="page-subtitle">
            Specify desired commodity volume, price ceilings, and minimum quality standards to discover matching harvest lots.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/buyer/requirements/new')}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Post Requirement</span>
          </button>
          <button
            type="button"
            onClick={loadRequirements}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Posted"
          value={loading ? '...' : totalReq}
          description="All recorded demands"
          icon={ClipboardList}
          variant="primary"
        />
        <DashboardCard
          title="Open for Matching"
          value={loading ? '...' : openReq}
          description="Actively searching lots"
          icon={Sparkles}
          variant="accent"
          trend={openReq > 0 ? `+${openReq}` : null}
          trendLabel={openReq > 0 ? 'Active' : null}
        />
        <DashboardCard
          title="Fulfilled Contracts"
          value={loading ? '...' : fulfilledReq}
          description="Purchased and settled"
          icon={CheckCircle2}
          variant="success"
        />
        <DashboardCard
          title="Expired / Closed"
          value={loading ? '...' : expiredReq}
          description="Past required date"
          icon={Clock}
          variant="secondary"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="tab-group">
          {['ALL', 'OPEN', 'FULFILLED', 'EXPIRED', 'CANCELLED'].map((tab) => (
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
            placeholder="Search crop, location, requirement #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Loading requirements..." />
      ) : filteredRequirements.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No crop requirements found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No requirements match your filter criteria.'
              : 'You have not posted any crop requirements yet. Post your first requirement to automatically find matching verified farmer harvests.'
          }
          actionLabel="Post New Requirement"
          onAction={() => navigate('/buyer/requirements/new')}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Requirement ID</th>
                <th>Crop & Category</th>
                <th style={{ textAlign: 'right' }}>Required Volume</th>
                <th style={{ textAlign: 'right' }}>Max Price / kg</th>
                <th style={{ textAlign: 'center' }}>Min Quality</th>
                <th>Preferred Destination</th>
                <th>Required By</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((req) => {
                const isOpen = req.status === 'OPEN';
                return (
                  <tr key={req.requirementId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#REQ-{req.requirementId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{req.cropName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{req.cropCategory || 'General'}</div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600 }}>
                      {Number(req.requiredQuantity).toLocaleString()} kg
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{Number(req.maxPricePerKg).toFixed(2)}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {req.minQualityGrade ? (
                        <StatusBadge status={req.minQualityGrade} type="grade" />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Any Grade</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.preferredLocation}>
                        {req.preferredLocation || 'Any Location'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {req.requiredByDate
                        ? new Date(req.requiredByDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Flexible'}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <StatusBadge status={req.status} />
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {isOpen && (
                          <button
                            type="button"
                            onClick={() => navigate(`/buyer/matches?requirementId=${req.requirementId}`)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.3rem 0.65rem' }}
                            title="Find Matching Harvests"
                          >
                            Matches &rarr;
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/buyer/requirements/${req.requirementId}`)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.65rem' }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BuyerRequirements;
