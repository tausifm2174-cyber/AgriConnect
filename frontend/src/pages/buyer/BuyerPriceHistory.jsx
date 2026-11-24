import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SelectField from '../../components/SelectField';
import {
  TrendingUp,
  Scale,
  BarChart3,
  FileText,
  Layers,
  CheckCircle2
} from 'lucide-react';

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
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TrendingUp size={26} color="var(--color-primary)" />
            <span>Market Price History & Analytics</span>
          </h1>
          <p className="page-subtitle">
            Compare official APMC mandi benchmark reference rates against actual AgriConnect platform transactions.
          </p>
        </div>

        {/* Crop Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Crop Filter:
          </span>
          <SelectField
            value={selectedCropId}
            onChange={(e) => handleCropSelect(e.target.value)}
            size="sm"
            style={{ marginBottom: 0, minWidth: '190px' }}
            options={[
              { value: '', label: 'All Commodities' },
              ...crops.map((c) => ({ value: c.cropId, label: `${c.cropName} (${c.category})` }))
            ]}
          />
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Market Benchmark Average"
          value={
            cropAnalytics?.averagePrice
              ? `₹${Number(cropAnalytics.averagePrice).toFixed(2)}/kg`
              : marketplaceSummary?.overallAveragePrice
              ? `₹${Number(marketplaceSummary.overallAveragePrice).toFixed(2)}/kg`
              : '₹—'
          }
          description={selectedCropId ? 'Selected commodity average' : 'Marketplace modal rate'}
          icon={Scale}
          variant="primary"
        />
        <DashboardCard
          title="Benchmark Range"
          value={
            cropAnalytics
              ? `₹${Number(cropAnalytics.minPrice).toFixed(2)} - ₹${Number(cropAnalytics.maxPrice).toFixed(2)}`
              : 'Multi-mandi spread'
          }
          description="Min to max APMC trading price"
          icon={BarChart3}
          variant="accent"
        />
        <DashboardCard
          title="Market Trend"
          value={cropAnalytics?.priceTrend || 'STABLE'}
          description={selectedCropId ? 'Based on latest market data' : 'Calculated across APMC reports'}
          icon={TrendingUp}
          variant="secondary"
        />
        <DashboardCard
          title="Volume Analyzed"
          value={
            cropAnalytics?.totalVolumeKg
              ? `${(Number(cropAnalytics.totalVolumeKg) / 1000).toFixed(1)} MT`
              : `${historyRecords.length} records`
          }
          description="Tracked in DBMS analytics"
          icon={FileText}
          variant="success"
        />
      </div>

      {/* Crop Analytics Highlight (when selected) */}
      {cropAnalytics && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-primary-subtle)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
              Detailed Econometric Analysis: {cropAnalytics.cropName}
            </span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '0.25rem' }}>
              Total Trading Volume: <strong>{Number(cropAnalytics.totalVolumeKg || 0).toLocaleString()} kg</strong> across{' '}
              <strong>{cropAnalytics.totalTransactions || 0}</strong> market transactions.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ padding: '0.35rem 0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              Min: ₹{Number(cropAnalytics.minPrice).toFixed(2)}/kg
            </span>
            <span style={{ padding: '0.35rem 0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)', color: 'var(--color-primary)' }}>
              Modal: ₹{Number(cropAnalytics.averagePrice).toFixed(2)}/kg
            </span>
            <span style={{ padding: '0.35rem 0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              Max: ₹{Number(cropAnalytics.maxPrice).toFixed(2)}/kg
            </span>
          </div>
        </div>
      )}

      {/* Source Filter Tabs */}
      <div className="filter-bar">
        <div className="tab-group">
          {[
            { id: 'ALL', label: 'All Price Records' },
            { id: 'MANDI_BENCHMARK', label: 'APMC Mandi Benchmarks' },
            { id: 'TRANSACTION_SALE', label: 'AgriConnect Platform Sales' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSourceFilter(tab.id)}
              className={`tab-btn ${sourceFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner message="Auditing market price history & APMC trends..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No price history records found"
          description="No historical pricing records match the selected filter."
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Date & Market</th>
                <th>Produce</th>
                <th style={{ textAlign: 'center' }}>Data Source</th>
                <th style={{ textAlign: 'right' }}>Modal / Unit Price</th>
                <th style={{ textAlign: 'right' }}>Mandi Range (Min - Max)</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
                <th style={{ textAlign: 'right' }}>Transaction Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const isSale = rec.sourceType === 'TRANSACTION_SALE';
                return (
                  <tr key={rec.priceId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        {rec.recordedDate
                          ? new Date(rec.recordedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {rec.marketLocation || 'National Mandi'}
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{rec.cropName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rec.cropCategory}</div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: isSale ? 'var(--color-primary-light)' : 'var(--color-accent-light)',
                        color: isSale ? 'var(--color-primary)' : 'var(--color-accent)',
                        border: `1px solid ${isSale ? 'var(--color-primary-border)' : '#7dd3fc'}`
                      }}>
                        {isSale ? 'AgriConnect Sale' : 'APMC Mandi'}
                      </span>
                      {isSale && rec.orderId && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                          #ORD-{rec.orderId}
                        </div>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        ₹{Number(rec.effectivePrice || rec.unitPrice || rec.modalPricePerKg).toFixed(2)}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}> / kg</span>
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {rec.minPricePerKg && rec.maxPricePerKg ? (
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                          ₹{Number(rec.minPricePerKg).toFixed(2)} - ₹{Number(rec.maxPricePerKg).toFixed(2)}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {rec.quantity ? (
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{Number(rec.quantity).toLocaleString()} kg</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Market Benchmark</span>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {isSale && rec.totalAmount ? (
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          ₹{Number(rec.totalAmount).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>
                      )}
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

export default BuyerPriceHistory;
