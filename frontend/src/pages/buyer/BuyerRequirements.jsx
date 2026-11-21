import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerRequirements = () => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [metrics, setMetrics] = useState(null);
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
      const [reqRes, metRes] = await Promise.all([
        buyerApi.getRequirements(),
        buyerApi.getRequirementMetrics().catch(() => ({ data: null }))
      ]);

      const reqData = reqRes.data?.data || reqRes.data || [];
      const metData = metRes.data?.data || metRes.data || null;

      setRequirements(Array.isArray(reqData) ? reqData : []);
      setMetrics(metData);
    } catch (err) {
      console.error('Error loading buyer requirements:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load commercial requirements.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered requirements
  const filteredRequirements = requirements.filter((req) => {
    const matchesStatus =
      statusFilter === 'ALL' || req.status === statusFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (req.cropName && req.cropName.toLowerCase().includes(term)) ||
      (req.preferredLocation && req.preferredLocation.toLowerCase().includes(term)) ||
      String(req.requirementId).includes(term);

    return matchesStatus && matchesSearch;
  });

  const totalReq = metrics?.totalRequirements ?? requirements.length;
  const openReq = metrics?.openRequirements ?? requirements.filter((r) => r.status === 'OPEN').length;
  const fulfilledReq = metrics?.fulfilledRequirements ?? requirements.filter((r) => r.status === 'FULFILLED').length;
  const expiredReq = metrics?.expiredRequirements ?? requirements.filter((r) => r.status === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commercial Crop Requirements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Specify desired commodity volume, price ceilings, and minimum quality standards to discover matching harvest lots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/buyer/requirements/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Post Requirement
          </button>
          <button
            onClick={loadRequirements}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadRequirements} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Posted"
          value={totalReq}
          subtitle="All recorded demands"
          icon="clipboard-list"
          color="emerald"
        />
        <DashboardCard
          title="Open for Matching"
          value={openReq}
          subtitle="Actively searching lots"
          icon="sparkles"
          color={openReq > 0 ? "emerald" : "gray"}
        />
        <DashboardCard
          title="Fulfilled Contracts"
          value={fulfilledReq}
          subtitle="Purchased & settled"
          icon="check-circle"
          color="blue"
        />
        <DashboardCard
          title="Expired / Closed"
          value={expiredReq}
          subtitle="Past required date"
          icon="clock"
          color={expiredReq > 0 ? "amber" : "gray"}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'OPEN', 'FULFILLED', 'EXPIRED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search crop, location, requirement #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Loading requirements..." />
      ) : filteredRequirements.length === 0 ? (
        <EmptyState
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Requirement ID</th>
                  <th className="px-4 py-3.5 text-left">Crop & Category</th>
                  <th className="px-4 py-3.5 text-right">Required Volume</th>
                  <th className="px-4 py-3.5 text-right">Max Price / kg</th>
                  <th className="px-4 py-3.5 text-center">Min Quality</th>
                  <th className="px-4 py-3.5 text-left">Preferred Destination</th>
                  <th className="px-4 py-3.5 text-left">Required By</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRequirements.map((req) => {
                  const isOpen = req.status === 'OPEN';
                  return (
                    <tr key={req.requirementId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">#REQ-{req.requirementId}</div>
                        <div className="text-[11px] text-gray-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{req.cropName}</div>
                        <div className="text-xs text-gray-500">{req.cropCategory || 'General'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-bold text-gray-900">{Number(req.requiredQuantity).toLocaleString()} kg</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-bold text-emerald-600">₹{Number(req.maxPricePerKg).toFixed(2)}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                          Grade {req.minQualityGrade}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs text-gray-700 max-w-[160px] truncate" title={req.preferredLocation}>
                          {req.preferredLocation}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        {req.requiredByDate
                          ? new Date(req.requiredByDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Flexible'}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                        {isOpen && (
                          <button
                            onClick={() => navigate(`/buyer/matches?requirementId=${req.requirementId}`)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                            title="Find Matching Harvests"
                          >
                            Matches &rarr;
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/buyer/requirements/${req.requirementId}`)}
                          className="px-2 py-1 text-xs font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerRequirements;
