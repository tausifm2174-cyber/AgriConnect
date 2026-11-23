import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import farmerApi from '../../services/farmerApi';
import api from '../../services/api';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Scale,
  CreditCard,
  RefreshCw,
  Search,
  Info,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

export const FarmerRequirements = () => {
  const [demandOrders, setDemandOrders] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchDemandData();
  }, []);

  const fetchDemandData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, cropsRes] = await Promise.all([
        farmerApi.getOrders(),
        farmerApi.getCrops().catch(() => ({ data: [] })),
      ]);

      setDemandOrders(ordersRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (err) {
      console.error('Failed to load farmer market demands:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load buyer demand data.');
    } finally {
      setLoading(false);
    }
  };

  // KPI computations from actual order/demand records
  const totalDemandLots = demandOrders.length;
  const activeDemands = demandOrders.filter((o) =>
    ['PENDING', 'ACCEPTED', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT'].includes(o.status)
  ).length;

  const totalVolumeDemanded = demandOrders.reduce(
    (sum, o) => sum + (Number(o.quantity) || 0),
    0
  );

  const totalContractVal = demandOrders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0
  );

  // Filter demand items
  const filteredOrders = demandOrders.filter((ord) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? ['PENDING', 'ACCEPTED', 'CONFIRMED', 'SHIPPED'].includes(ord.status)
        : ord.status === statusFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      ord.cropName?.toLowerCase().includes(term) ||
      ord.buyerName?.toLowerCase().includes(term) ||
      ord.farmLocation?.toLowerCase().includes(term) ||
      String(ord.orderId).includes(term) ||
      (ord.requirementId && String(ord.requirementId).includes(term));

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ClipboardList size={26} color="var(--color-primary)" />
            <span>Buyer Demand — What Buyers Are Looking For</span>
          </h1>
          <p className="page-subtitle">
            Commercial crop requirements and procurement orders posted by verified buyers. Review specifications, desired volumes, and maximum price thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDemandData}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Demand</span>
        </button>
      </div>

      <div className="info-banner" style={{ marginBottom: '1.5rem' }}>
        <Info size={18} className="info-banner-icon" />
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <strong>Understanding Buyer Demand:</strong> These are purchase requirements created by registered institutional and wholesale buyers. When a buyer's criteria match your harvest lots, you will receive purchase orders to accept and ship directly.
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* KPI Cards Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Procurement Demands"
          value={loading ? '...' : totalDemandLots}
          description="Inquiries and purchase demands"
          icon={ShoppingBag}
          variant="primary"
        />
        <DashboardCard
          title="Active Contracts"
          value={loading ? '...' : activeDemands}
          description="Pending, accepted, and in transit"
          icon={Clock}
          variant="accent"
        />
        <DashboardCard
          title="Volume Contracted"
          value={loading ? '...' : `${(totalVolumeDemanded / 1000).toFixed(1)} MT`}
          description={`${Number(totalVolumeDemanded).toLocaleString()} kg total volume`}
          icon={Scale}
          variant="secondary"
        />
        <DashboardCard
          title="Total Contract Value"
          value={loading ? '...' : `₹${Number(totalContractVal).toLocaleString('en-IN')}`}
          description="Realized and pending contract value"
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Quality-Aware Matching Architecture Notice */}
      <div className="info-banner">
        <div className="info-banner-icon">
          <Info size={20} />
        </div>
        <div style={{ fontSize: '0.8125rem' }}>
          <h4 style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.2rem' }}>
            How Commercial Buyer Demands Reach Farmers
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Commercial buyers specify crop requirements with required volume, maximum buying price, and quality grade standards. AgriConnect's matching engine evaluates available harvest lots and pairs qualified produce. When an agreement occurs, commercial contracts appear here as incoming purchase orders.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="filter-bar">
        <div className="tab-group">
          {['ALL', 'ACTIVE', 'DELIVERED'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
            >
              {tab === 'ACTIVE' ? 'Active Demands' : tab === 'DELIVERED' ? 'Fulfilled Contracts' : 'All Demands'}
            </button>
          ))}
        </div>

        <div className="search-wrapper">
          <span className="search-icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search crop, buyer, location, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Main Content: Real Buyer Demands Table */}
      {loading ? (
        <LoadingSpinner message="Auditing buyer procurement inquiries..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No procurement inquiries found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No commercial demands match your filter criteria.'
              : 'You have not received buyer demands yet. Maintain high verified quality ratings on your harvests to attract buyer matches.'
          }
          actionLabel="View Harvest Lots"
          onAction={() => {}}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Demand Ref / Order</th>
                <th>Crop & Category</th>
                <th>Buyer & Location</th>
                <th style={{ textAlign: 'right' }}>Required Volume</th>
                <th style={{ textAlign: 'right' }}>Agreed Price</th>
                <th style={{ textAlign: 'center' }}>Quality Grade</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord.orderId}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>#ORD-{ord.orderId}</div>
                    {ord.requirementId && (
                      <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                        Req: #REQ-{ord.requirementId}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ord.cropName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ord.cropCategory}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ord.buyerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.farmLocation || ord.businessName}>
                      {ord.farmLocation || ord.businessName || 'Wholesale Buyer'}
                    </div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 600 }}>
                    {Number(ord.quantity).toLocaleString()} kg
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                      ₹{Number(ord.agreedPricePerKg).toFixed(2)} / kg
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      Total: ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                    {ord.qualityGrade ? (
                      <StatusBadge status={ord.qualityGrade} type="grade" />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unrated</span>
                    )}
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                    <StatusBadge status={ord.status} />
                  </td>

                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <Link
                      to="/farmer/orders"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.65rem' }}
                    >
                      Review Order &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monitored Agricultural Commodity Catalog */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          Marketplace Commodities Under Active Demand Monitoring
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Crops cataloged by AgriConnect for commercial demand matching and APMC mandi benchmark indexing.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          {crops.map((c) => (
            <div key={c.cropId} style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text)' }}>{c.cropName}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{c.category}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.25rem' }}>{c.season}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerRequirements;
