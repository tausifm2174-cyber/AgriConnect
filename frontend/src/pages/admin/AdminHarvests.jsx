import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SelectField from '../../components/SelectField';
import {
  Wheat,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Calendar
} from 'lucide-react';

export const AdminHarvests = () => {
  const navigate = useNavigate();
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHarvests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend /api/admin/quality/pending?status=ALL returns all harvests with quality summary
      const res = await adminApi.getHarvests('ALL');
      const list = res.data?.data || res.data || [];
      setHarvests(list);
    } catch (err) {
      console.error('Failed to load harvests:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve marketplace harvest lots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvests();
  }, []);

  // Filter client-side
  const filteredHarvests = harvests.filter((h) => {
    // Status filter
    if (statusFilter !== 'ALL' && h.harvestStatus !== statusFilter) return false;

    // Quality filter
    if (qualityFilter !== 'ALL') {
      if (qualityFilter === 'VERIFIED' && h.assessmentStatus !== 'VERIFIED') return false;
      if (qualityFilter === 'PENDING' && h.assessmentStatus !== 'PENDING') return false;
      if (qualityFilter === 'NOT_ASSESSED' && h.assessmentStatus !== 'NOT_ASSESSED') return false;
      if (qualityFilter === 'REJECTED' && h.assessmentStatus !== 'REJECTED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = h.cropName?.toLowerCase().includes(q);
      const matchFarmer = h.farmerName?.toLowerCase().includes(q);
      const matchLoc = h.location?.toLowerCase().includes(q);
      const matchId = String(h.harvestId).includes(q);
      if (!matchName && !matchFarmer && !matchLoc && !matchId) return false;
    }

    return true;
  });

  const counts = {
    ALL: harvests.length,
    AVAILABLE: harvests.filter((h) => h.harvestStatus === 'AVAILABLE').length,
    PARTIALLY_SOLD: harvests.filter((h) => h.harvestStatus === 'PARTIALLY_SOLD').length,
    SOLD_OUT: harvests.filter((h) => h.harvestStatus === 'SOLD_OUT').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Harvest Lots & Quality Status</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Quality Index
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Audit registered harvest lots, available stock levels, and quality assessment certification status across the marketplace.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/quality')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
        >
          <ShieldCheck size={16} />
          <span>Quality Verification Queue &rarr;</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Status Filter Tabs */}
        <div className="tab-group">
          {['ALL', 'AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`tab-btn ${statusFilter === status ? 'active' : ''}`}
            >
              {status.replace('_', ' ')} ({counts[status] || 0})
            </button>
          ))}
        </div>

        {/* Quality Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="w-48">
            <SelectField
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              size="sm"
              options={[
                { value: 'ALL', label: 'All Quality States' },
                { value: 'VERIFIED', label: 'Verified Lots' },
                { value: 'PENDING', label: 'Pending Verification' },
                { value: 'NOT_ASSESSED', label: 'Not Assessed' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search crop, farmer, loc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Harvests Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying marketplace harvest inventory..." />
          </div>
        ) : filteredHarvests.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No harvest lots match the selected filters.
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Crop Commodity</th>
                <th>Producer / Farmer</th>
                <th>Farm Location</th>
                <th>Stock (Avail / Init)</th>
                <th>Price / kg</th>
                <th>Harvest Date</th>
                <th>Market Status</th>
                <th>Quality Grade</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHarvests.map((h) => {
                const qualityBadgeColor =
                  h.assessmentStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : h.assessmentStatus === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : h.assessmentStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200';

                return (
                  <tr key={h.harvestId}>
                    <td className="font-mono font-bold text-gray-500">#HAR-{h.harvestId}</td>
                    <td>
                      <div className="font-bold text-gray-900">{h.cropName}</div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{h.cropCategory}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900">{h.farmerName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{h.farmerPhone || 'UID #' + h.farmerId}</div>
                    </td>
                    <td className="text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400" />
                        <span>{h.location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-gray-900">{Number(h.availableQuantity).toLocaleString()} kg</div>
                      <div className="text-[10px] text-gray-400">Total: {Number(h.initialQuantity).toLocaleString()} kg</div>
                    </td>
                    <td className="font-bold text-emerald-700">
                      ₹{Number(h.pricePerKg).toFixed(2)}
                    </td>
                    <td className="text-gray-500">
                      {h.harvestDate ? new Date(h.harvestDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <StatusBadge status={h.harvestStatus} />
                    </td>
                    <td>
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${qualityBadgeColor}`}>
                          {h.assessmentStatus}
                        </span>
                        {h.qualityGrade && (
                          <div className="text-[11px] font-bold text-gray-700">
                            Grade {h.qualityGrade} ({h.qualityScore ? `${Number(h.qualityScore).toFixed(1)} pts` : ''})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => navigate('/admin/quality')}
                        className="btn btn-secondary btn-sm"
                      >
                        <ShieldCheck size={12} />
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
    </div>
  );
};

export default AdminHarvests;
