import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
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
            <h1 className="text-2xl font-bold text-gray-900">Harvest Lots Management</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Inventory
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Audit agricultural production lots listed across all registered farmers, stock levels, and inspection status.
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === status
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')} ({counts[status] || 0})
            </button>
          ))}
        </div>

        {/* Quality Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <label className="font-semibold uppercase">Quality:</label>
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Quality States</option>
              <option value="VERIFIED">Verified Lots</option>
              <option value="PENDING">Pending Verification</option>
              <option value="NOT_ASSESSED">Not Assessed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search crop, farmer, loc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Harvests Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying marketplace harvest inventory..." />
          </div>
        ) : filteredHarvests.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No harvest lots match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Lot ID</th>
                  <th className="py-3 px-4">Crop Commodity</th>
                  <th className="py-3 px-4">Producer / Farmer</th>
                  <th className="py-3 px-4">Farm Location</th>
                  <th className="py-3 px-4">Stock (Avail / Init)</th>
                  <th className="py-3 px-4">Price / kg</th>
                  <th className="py-3 px-4">Harvest Date</th>
                  <th className="py-3 px-4">Market Status</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                    <tr key={h.harvestId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">#HAR-{h.harvestId}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{h.cropName}</div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{h.cropCategory}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{h.farmerName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{h.farmerPhone || 'UID #' + h.farmerId}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />
                          <span>{h.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{Number(h.availableQuantity).toLocaleString()} kg</div>
                        <div className="text-[10px] text-gray-400">Total: {Number(h.initialQuantity).toLocaleString()} kg</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        ₹{Number(h.pricePerKg).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {h.harvestDate ? new Date(h.harvestDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={h.harvestStatus} />
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/admin/quality')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHarvests;
