import React, { useState, useEffect } from 'react';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const FarmerPriceHistory = () => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [marketplaceSummary, setMarketplaceSummary] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [cropAnalytics, setCropAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab filter: ALL, TRANSACTION_SALE, MANDI_BENCHMARK
  const [sourceFilter, setSourceFilter] = useState('ALL');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [histRes, sumRes, cropRes] = await Promise.all([
        farmerApi.getPriceHistory(),
        farmerApi.getMarketplacePriceSummary(),
        farmerApi.getCrops()
      ]);

      const histData = histRes.data?.data || histRes.data || [];
      const sumData = sumRes.data?.data || sumRes.data || null;
      const cropData = cropRes.data?.data || cropRes.data || [];

      setHistoryRecords(Array.isArray(histData) ? histData : []);
      setMarketplaceSummary(sumData);
      setCrops(Array.isArray(cropData) ? cropData : []);
    } catch (err) {
      console.error('Error loading price history & analytics:', err);
      setError(err.response?.data?.message || 'Failed to load historical price and benchmark records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelect = async (cropId) => {
    setSelectedCropId(cropId);
    if (!cropId) {
      setCropAnalytics(null);
      // Reload unfiltered
      try {
        const res = await farmerApi.getPriceHistory();
        setHistoryRecords(res.data?.data || res.data || []);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      const [histRes, analRes] = await Promise.all([
        farmerApi.getPriceHistory({ cropId }),
        farmerApi.getCropPriceAnalytics(cropId)
      ]);
      setHistoryRecords(histRes.data?.data || histRes.data || []);
      setCropAnalytics(analRes.data?.data || analRes.data || null);
    } catch (err) {
      console.error('Error loading crop analytics:', err);
    }
  };

  // Filtered records
  const filteredRecords = historyRecords.filter((rec) => {
    if (sourceFilter === 'ALL') return true;
    return rec.sourceType === sourceFilter;
  });

  // Calculate Farmer's Realized Pricing KPIs
  const realizedSales = historyRecords.filter((r) => r.sourceType === 'TRANSACTION_SALE');
  const totalRealizedAmount = realizedSales.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const totalRealizedQuantity = realizedSales.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const avgRealizedPrice =
    totalRealizedQuantity > 0 ? (totalRealizedAmount / totalRealizedQuantity).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price History & Market Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare your realized commercial transaction prices against APMC mandi benchmark rates and historical trends.
          </p>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Crop Filter:</label>
          <select
            value={selectedCropId}
            onChange={(e) => handleCropSelect(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Cultivated Crops</option>
            {crops.map((c) => (
              <option key={c.cropId} value={c.cropId}>
                {c.cropName} ({c.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Realized Sales"
          value={`₹${totalRealizedAmount.toLocaleString('en-IN')}`}
          subtitle={`${realizedSales.length} commercial transactions`}
          icon="currency-rupee"
          color="emerald"
        />
        <DashboardCard
          title="Avg Realized Price"
          value={`₹${avgRealizedPrice}/kg`}
          subtitle={`Across ${totalRealizedQuantity.toLocaleString()} kg sold`}
          icon="chart-bar"
          color="blue"
        />
        <DashboardCard
          title="Market Avg Benchmark"
          value={
            cropAnalytics?.averagePrice
              ? `₹${Number(cropAnalytics.averagePrice).toFixed(2)}/kg`
              : marketplaceSummary?.overallAveragePrice
              ? `₹${Number(marketplaceSummary.overallAveragePrice).toFixed(2)}/kg`
              : '₹—'
          }
          subtitle={selectedCropId ? 'Selected crop benchmark' : 'Marketplace-wide modal average'}
          icon="scale"
          color="amber"
        />
        <DashboardCard
          title="Pricing Trend"
          value={cropAnalytics?.priceTrend || (realizedSales.length > 0 ? 'STABLE' : 'NEUTRAL')}
          subtitle={
            cropAnalytics
              ? `Min: ₹${Number(cropAnalytics.minPrice).toFixed(2)} | Max: ₹${Number(cropAnalytics.maxPrice).toFixed(2)}`
              : 'Based on official APMC mandi records'
          }
          icon="trending-up"
          color="emerald"
        />
      </div>

      {/* Crop Analytics Highlight Banner (when crop selected) */}
      {cropAnalytics && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Detailed Analytics for {cropAnalytics.cropName}
              </span>
              <div className="text-sm text-gray-700 mt-1">
                Volume Analyzed: <strong>{Number(cropAnalytics.totalVolumeKg || 0).toLocaleString()} kg</strong> across{' '}
                <strong>{cropAnalytics.totalTransactions || 0}</strong> records.
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-gray-800 shadow-sm">
                Min: ₹{Number(cropAnalytics.minPrice).toFixed(2)}/kg
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-700 shadow-sm">
                Modal: ₹{Number(cropAnalytics.averagePrice).toFixed(2)}/kg
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-gray-800 shadow-sm">
                Max: ₹{Number(cropAnalytics.maxPrice).toFixed(2)}/kg
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Source Filter Tabs */}
      <div className="filter-bar">
        <div className="tab-group">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'TRANSACTION_SALE', label: 'My Realized Sales' },
            { id: 'MANDI_BENCHMARK', label: 'APMC Mandi Benchmarks' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`tab-btn ${sourceFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading price records and market intelligence..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadInitialData} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No price history records found"
          description={
            sourceFilter === 'TRANSACTION_SALE'
              ? 'You have not completed any commercial sales yet. Once orders are delivered, realized sale records appear here.'
              : 'No historical price records match the selected filter.'
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Date & Market</th>
                <th>Produce</th>
                <th style={{ textAlign: 'center' }}>Record Type</th>
                <th style={{ textAlign: 'right' }}>Unit / Modal Price</th>
                <th style={{ textAlign: 'right' }}>Mandi Range (Min - Max)</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
                <th style={{ textAlign: 'right' }}>Total Realization</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const isSale = rec.sourceType === 'TRANSACTION_SALE';
                return (
                  <tr key={rec.priceId}>
                    <td>
                      <div className="font-semibold text-gray-900">
                        {rec.recordedDate ? new Date(rec.recordedDate).toLocaleDateString('en-IN') : '—'}
                      </div>
                      <div className="text-xs text-gray-500">{rec.marketLocation || 'Direct Farm'}</div>
                    </td>
                    <td>
                      <div className="font-bold text-gray-900">{rec.cropName}</div>
                      <div className="text-xs text-gray-400 font-mono">ID #{rec.cropId}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSale
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isSale ? 'REALIZED SALE' : 'APMC MANDI'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono font-bold text-gray-900">
                      ₹{Number(rec.effectivePrice || rec.modalPricePerKg || 0).toFixed(2)}
                      <span className="text-xs font-normal text-gray-400">/kg</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono text-xs text-gray-500">
                      {rec.minPricePerKg != null && rec.maxPricePerKg != null
                        ? `₹${Number(rec.minPricePerKg).toFixed(2)} — ₹${Number(rec.maxPricePerKg).toFixed(2)}`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono text-gray-700">
                      {rec.quantity ? `${Number(rec.quantity).toLocaleString()} kg` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="font-mono font-black text-emerald-700">
                      {rec.totalAmount ? `₹${Number(rec.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
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

export default FarmerPriceHistory;
