import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SelectField from '../../components/SelectField';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Filter,
  DollarSign,
  BarChart2,
  RefreshCw,
  Search
} from 'lucide-react';

export const AdminPriceHistory = () => {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [sourceType, setSourceType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, recRes] = await Promise.all([
        adminApi.getPriceHistorySummary(),
        adminApi.getPriceHistory()
      ]);
      setSummary(sumRes.data?.data || sumRes.data || null);
      setRecords(recRes.data?.data || recRes.data || []);
    } catch (err) {
      console.error('Failed to load price history analytics:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve price history data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (sourceType !== 'ALL' && r.sourceType !== sourceType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCrop = r.cropName?.toLowerCase().includes(q);
      const matchLoc = r.marketLocation?.toLowerCase().includes(q);
      if (!matchCrop && !matchLoc) return false;
    }
    return true;
  });

  const cropAnalytics = summary?.cropAnalytics || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Price History & Macro Analytics</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Market Intelligence
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            APMC Mandi official market benchmarks vs verified platform sales transactions across agricultural crops.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPriceData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Overall Average Benchmark</div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              ₹{Number(summary.overallAveragePrice || 0).toFixed(2)}
              <span className="text-xs text-gray-400 font-normal"> / kg</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{summary.overallTransactionCount || 0} price recordings</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
            <div className="text-xs uppercase tracking-wider text-emerald-600 font-bold">Highest Value Commodity</div>
            <div className="text-base font-bold text-gray-900 mt-1 truncate" title={summary.highestPricedCrop}>
              {summary.highestPricedCrop || 'N/A'}
            </div>
            <div className="text-sm font-black text-emerald-700">
              Avg ₹{Number(summary.highestCropAveragePrice || 0).toFixed(2)} / kg
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
            <div className="text-xs uppercase tracking-wider text-blue-600 font-bold">Lowest Value Commodity</div>
            <div className="text-base font-bold text-gray-900 mt-1 truncate" title={summary.lowestPricedCrop}>
              {summary.lowestPricedCrop || 'N/A'}
            </div>
            <div className="text-sm font-black text-blue-700">
              Avg ₹{Number(summary.lowestCropAveragePrice || 0).toFixed(2)} / kg
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Total Monitored Crops</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{cropAnalytics.length} Crops</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Active market telemetry</div>
          </div>
        </div>
      )}

      {/* Per-Crop Macro Analytics Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-gray-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Commodity Price Intelligence & Variance Matrix
            </h2>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Aggregated across all APMC & Platform transactions</span>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Calculating commodity analytics..." />
          </div>
        ) : cropAnalytics.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No crop price analytics available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Commodity Crop</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Average Benchmark</th>
                  <th className="py-3 px-4">Price Range (Min - Max)</th>
                  <th className="py-3 px-4">Latest Recorded</th>
                  <th className="py-3 px-4">Recorded Samples</th>
                  <th className="py-3 px-4 text-right">Trend Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cropAnalytics.map((c) => {
                  const isUpward = c.recentTrend === 'UPWARD';
                  const isDownward = c.recentTrend === 'DOWNWARD';

                  return (
                    <tr key={c.cropId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.cropName}</td>
                      <td className="py-3 px-4 text-gray-500 uppercase text-[10px] font-semibold">{c.cropCategory}</td>
                      <td className="py-3 px-4 font-black text-gray-900">
                        ₹{Number(c.averagePrice || 0).toFixed(2)} / kg
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        ₹{Number(c.minimumPrice || 0).toFixed(2)} — ₹{Number(c.maximumPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                        ₹{Number(c.latestPrice || 0).toFixed(2)} / kg
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {c.transactionCount || 0} pts
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isUpward
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDownward
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isUpward ? <TrendingUp size={12} /> : isDownward ? <TrendingDown size={12} /> : <Activity size={12} />}
                          <span>{c.recentTrend || 'STABLE'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Price Points Table */}
      <div className="table-wrapper">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Price Observation Log
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Source Type Filter */}
            <div className="w-52">
              <SelectField
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                size="sm"
                options={[
                  { value: 'ALL', label: 'All Price Sources' },
                  { value: 'MARKET_MANDI', label: 'Official APMC Mandi' },
                  { value: 'TRANSACTION_SALE', label: 'Closed Platform Sale' },
                ]}
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* Search */}
            <div className="search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search crop, mandi location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying historical price observation log..." />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No price records found matching the filter criteria.
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Price ID</th>
                <th>Commodity</th>
                <th>Data Source Type</th>
                <th>Effective Price</th>
                <th>Mandi Range (Min - Max)</th>
                <th>Market Location</th>
                <th>Recorded Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => {
                const isMandi = r.sourceType === 'MARKET_MANDI';

                return (
                  <tr key={r.priceId}>
                    <td className="font-mono font-bold text-gray-500">#PRC-{r.priceId}</td>
                    <td>
                      <div className="font-bold text-gray-900">{r.cropName}</div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{r.cropCategory}</span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isMandi
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isMandi ? 'APMC MANDI' : 'PLATFORM SALE'}
                      </span>
                    </td>
                    <td className="font-black text-gray-900">
                      ₹{Number(r.effectivePrice || r.modalPricePerKg || r.unitPrice || 0).toFixed(2)}
                      <span className="text-xs font-normal text-gray-400"> / kg</span>
                    </td>
                    <td className="font-mono text-gray-600">
                      {r.minPricePerKg != null && r.maxPricePerKg != null
                        ? `₹${Number(r.minPricePerKg).toFixed(2)} — ₹${Number(r.maxPricePerKg).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="text-gray-600">
                      {r.marketLocation || 'AgriConnect Platform'}
                    </td>
                    <td className="text-gray-500">
                      {r.recordedDate ? new Date(r.recordedDate).toLocaleDateString('en-IN') : '—'}
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

export default AdminPriceHistory;
