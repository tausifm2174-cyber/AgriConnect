import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerPriceHistory = () => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [marketplaceSummary, setMarketplaceSummary] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [cropAnalytics, setCropAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab filter: ALL, MANDI_BENCHMARK, TRANSACTION_SALE
  const [sourceFilter, setSourceFilter] = useState('ALL');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [histRes, sumRes, cropRes] = await Promise.all([
        buyerApi.getPriceHistory(),
        buyerApi.getMarketplaceSummary(),
        buyerApi.getCrops(),
      ]);

      const histData = histRes.data?.data || histRes.data || [];
      const sumData = sumRes.data?.data || sumRes.data || null;
      const cropData = cropRes.data?.data || cropRes.data || [];

      setHistoryRecords(Array.isArray(histData) ? histData : []);
      setMarketplaceSummary(sumData);
      setCrops(Array.isArray(cropData) ? cropData : []);
    } catch (err) {
      console.error('Error loading price history & analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load historical price and benchmark records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCropSelect = async (cropId) => {
    setSelectedCropId(cropId);
    if (!cropId) {
      setCropAnalytics(null);
      try {
        const res = await buyerApi.getPriceHistory();
        setHistoryRecords(res.data?.data || res.data || []);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      const [histRes, analRes] = await Promise.all([
        buyerApi.getPriceHistory({ cropId }),
        buyerApi.getCropPriceAnalytics(cropId),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Price History & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare official APMC mandi benchmark reference rates against actual AgriConnect platform transactions.
          </p>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Crop Filter:</label>
          <select
            value={selectedCropId}
            onChange={(e) => handleCropSelect(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Commodities</option>
            {crops.map((c) => (
              <option key={c.cropId} value={c.cropId}>
                {c.cropName} ({c.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadInitialData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Market Benchmark Average"
          value={
            cropAnalytics?.averagePrice
              ? `₹${Number(cropAnalytics.averagePrice).toFixed(2)}/kg`
              : marketplaceSummary?.overallAveragePrice
              ? `₹${Number(marketplaceSummary.overallAveragePrice).toFixed(2)}/kg`
              : '₹—'
          }
          subtitle={selectedCropId ? 'Selected commodity average' : 'Marketplace-wide modal rate'}
          icon="scale"
          color="emerald"
        />
        <DashboardCard
          title="Benchmark Range"
          value={
            cropAnalytics
              ? `₹${Number(cropAnalytics.minPrice).toFixed(2)} - ₹${Number(cropAnalytics.maxPrice).toFixed(2)}`
              : 'Multi-mandi spread'
          }
          subtitle="Min to max APMC trading price"
          icon="chart-bar"
          color="blue"
        />
        <DashboardCard
          title="Market Trend"
          value={cropAnalytics?.priceTrend || 'STABLE'}
          subtitle={selectedCropId ? 'Based on latest market data' : 'Calculated across APMC reports'}
          icon="trending-up"
          color="amber"
        />
        <DashboardCard
          title="Volume Analyzed"
          value={
            cropAnalytics?.totalVolumeKg
              ? `${(Number(cropAnalytics.totalVolumeKg) / 1000).toFixed(1)} MT`
              : `${historyRecords.length} records`
          }
          subtitle="Tracked in DBMS analytics"
          icon="document-text"
          color="emerald"
        />
      </div>

      {/* Crop Analytics Highlight (when selected) */}
      {cropAnalytics && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Detailed Econometric Analysis: {cropAnalytics.cropName}
              </span>
              <div className="text-sm text-gray-700 mt-1">
                Total Trading Volume: <strong>{Number(cropAnalytics.totalVolumeKg || 0).toLocaleString()} kg</strong> across{' '}
                <strong>{cropAnalytics.totalTransactions || 0}</strong> market transactions.
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-gray-700 shadow-sm">
                Min: ₹{Number(cropAnalytics.minPrice).toFixed(2)}/kg
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-700 shadow-sm">
                Modal: ₹{Number(cropAnalytics.averagePrice).toFixed(2)}/kg
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-gray-700 shadow-sm">
                Max: ₹{Number(cropAnalytics.maxPrice).toFixed(2)}/kg
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Source Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'ALL', label: 'All Price Records' },
            { id: 'MANDI_BENCHMARK', label: 'APMC Mandi Benchmarks' },
            { id: 'TRANSACTION_SALE', label: 'AgriConnect Platform Sales' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                sourceFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner message="Auditing market price history & APMC trends..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No price history records found"
          description="No historical pricing records match the selected filter."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Date & Market</th>
                  <th className="px-4 py-3.5 text-left">Produce</th>
                  <th className="px-4 py-3.5 text-center">Data Source</th>
                  <th className="px-4 py-3.5 text-right">Modal / Unit Price</th>
                  <th className="px-4 py-3.5 text-right">Mandi Range (Min - Max)</th>
                  <th className="px-4 py-3.5 text-right">Volume</th>
                  <th className="px-4 py-3.5 text-right">Transaction Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRecords.map((rec) => {
                  const isSale = rec.sourceType === 'TRANSACTION_SALE';
                  return (
                    <tr key={rec.priceId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {rec.recordedDate
                            ? new Date(rec.recordedDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">{rec.marketLocation || 'National Mandi'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{rec.cropName}</div>
                        <div className="text-xs text-gray-500">{rec.cropCategory}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isSale
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isSale ? 'AgriConnect Sale' : 'APMC Mandi'}
                        </span>
                        {isSale && rec.orderId && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">#ORD-{rec.orderId}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="font-bold text-gray-900">
                          ₹{Number(rec.effectivePrice || rec.unitPrice || rec.modalPricePerKg).toFixed(2)}
                          <span className="text-xs font-normal text-gray-500"> / kg</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        {rec.minPricePerKg && rec.maxPricePerKg ? (
                          <div className="text-xs text-gray-600 font-mono">
                            ₹{Number(rec.minPricePerKg).toFixed(2)} - ₹{Number(rec.maxPricePerKg).toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        {rec.quantity ? (
                          <span className="font-medium text-gray-900">{Number(rec.quantity).toLocaleString()} kg</span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Market Benchmark</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        {isSale && rec.totalAmount ? (
                          <span className="font-bold text-emerald-600">
                            ₹{Number(rec.totalAmount).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
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

export default BuyerPriceHistory;
