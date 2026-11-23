import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  LayoutDashboard,
  Users,
  Wheat,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  TrendingUp,
  Activity,
  RefreshCw,
  ClipboardList,
  FileText
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, actRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRecentActivity(15)
      ]);
      setData(statsRes.data?.data || statsRes.data || null);
      setActivities(actRes.data?.data || actRes.data || []);
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve administrative metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userStats = data?.userStats || {};
  const harvestStats = data?.harvestStats || {};
  const qualityStats = data?.qualityStats || {};
  const requirementStats = data?.requirementStats || {};
  const orderStats = data?.orderStats || {};
  const deliveryStats = data?.deliveryStats || {};
  const paymentStats = data?.paymentStats || {};
  const priceHistoryStats = data?.priceHistoryStats || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="page-title">
              <LayoutDashboard size={26} color="var(--color-primary)" />
              <span>Admin Operations Center</span>
            </h1>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              border: '1px solid #ddd6fe',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Operations
            </span>
          </div>
          <p className="page-subtitle">
            Real-time platform oversight: stakeholders, quality audits, marketplace volume, freight tracking, and payment transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Prominent Operational Attention Section */}
      {!loading && (qualityStats.pendingAssessments > 0 || orderStats.pendingOrders > 0 || deliveryStats.inTransitDeliveries > 0) && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#dc2626'
              }}></span>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Action Required — Operational Attention
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Administrative action recommended</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
            {Number(qualityStats.pendingAssessments || 0) > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fff', border: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#c2410c' }}>
                    {qualityStats.pendingAssessments} Quality Inspection{qualityStats.pendingAssessments > 1 ? 's' : ''} Pending
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#78350f' }}>Lots awaiting Grade A/B/C verification</div>
                </div>
                <button onClick={() => navigate('/admin/quality')} className="btn btn-sm" style={{ backgroundColor: '#ea580c', color: '#fff', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                  Inspect &rarr;
                </button>
              </div>
            )}
            {Number(orderStats.pendingOrders || 0) > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fff', border: '1px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#7e22ce' }}>
                    {orderStats.pendingOrders} Order{orderStats.pendingOrders > 1 ? 's' : ''} Pending Acceptance
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#581c87' }}>Awaiting farmer harvest reservation</div>
                </div>
                <button onClick={() => navigate('/admin/orders')} className="btn btn-sm" style={{ backgroundColor: '#9333ea', color: '#fff', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                  Audit &rarr;
                </button>
              </div>
            )}
            {Number(deliveryStats.inTransitDeliveries || 0) > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fff', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1d4ed8' }}>
                    {deliveryStats.inTransitDeliveries} Active Shipment{deliveryStats.inTransitDeliveries > 1 ? 's' : ''} In Transit
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>Vehicle shipments moving to buyer docks</div>
                </div>
                <button onClick={() => navigate('/admin/deliveries')} className="btn btn-sm" style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                  Track &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary KPI Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Users"
          value={userStats.totalUsers ?? (loading ? '...' : '--')}
          description={`${userStats.totalFarmers || 0} Farmers • ${userStats.totalBuyers || 0} Buyers`}
          icon={Users}
          variant="primary"
        />
        <DashboardCard
          title="Active Harvests"
          value={harvestStats.availableHarvests ?? (loading ? '...' : '--')}
          description={`${harvestStats.totalHarvests || 0} Total • ${harvestStats.soldOutHarvests || 0} Sold Out`}
          icon={Wheat}
          variant="success"
        />
        <DashboardCard
          title="Marketplace Orders"
          value={orderStats.totalOrders ?? (loading ? '...' : '--')}
          description={`${orderStats.deliveredOrders || 0} Delivered • ${orderStats.pendingOrders || 0} Pending`}
          icon={ShoppingBag}
          variant="secondary"
        />
        <DashboardCard
          title="Gross Trade Volume"
          value={orderStats.totalOrderAmount ? `₹${Number(orderStats.totalOrderAmount).toLocaleString('en-IN')}` : (loading ? '...' : '₹0')}
          description={`₹${Number(paymentStats.totalSettledAmount || 0).toLocaleString('en-IN')} Settled`}
          icon={CreditCard}
          variant="accent"
        />
      </div>

      {/* Secondary Operational Metrics Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Quality Inspections"
          value={qualityStats.totalAssessments ?? (loading ? '...' : '0')}
          description={`${qualityStats.verifiedAssessments || 0} Verified • ${qualityStats.pendingAssessments || 0} Pending`}
          icon={ShieldCheck}
          variant="warning"
        />
        <DashboardCard
          title="Logistics Deliveries"
          value={deliveryStats.totalDeliveries ?? (loading ? '...' : '0')}
          description={`${deliveryStats.deliveredDeliveries || 0} Completed • ${deliveryStats.inTransitDeliveries || 0} In Transit`}
          icon={Truck}
          variant="primary"
        />
        <DashboardCard
          title="Buyer Requirements"
          value={requirementStats.totalRequirements ?? (loading ? '...' : '0')}
          description={`${requirementStats.activeRequirements || 0} Open • ${requirementStats.fulfilledRequirements || 0} Fulfilled`}
          icon={ClipboardList}
          variant="accent"
        />
        <DashboardCard
          title="Mandi Price Points"
          value={priceHistoryStats.totalRecords ?? (loading ? '...' : '0')}
          description={`Avg ₹${Number(priceHistoryStats.overallAveragePrice || 0).toFixed(2)}/kg Benchmark`}
          icon={TrendingUp}
          variant="secondary"
        />
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h2 style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--color-text-muted)',
          marginBottom: '1rem'
        }}>
          Marketplace Operations Shortcuts
        </h2>
        <div className="grid-quick-actions">
          {[
            { label: 'Users', sub: 'Stakeholder registry', path: '/admin/users', icon: Users, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
            { label: 'Harvests', sub: 'Crop lot inventory', path: '/admin/harvests', icon: Wheat, color: 'var(--color-secondary)', bg: 'var(--color-secondary-light)' },
            { label: 'Quality', sub: 'Verification audits', path: '/admin/quality', icon: ShieldCheck, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
            { label: 'Orders', sub: 'Purchase contracts', path: '/admin/orders', icon: ShoppingBag, color: '#7c3aed', bg: '#f3e8ff' },
            { label: 'Deliveries', sub: 'Logistics tracking', path: '/admin/deliveries', icon: Truck, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
            { label: 'Payments', sub: 'Payment ledger', path: '/admin/payments', icon: CreditCard, color: '#0d9488', bg: '#ccfbf1' },
            { label: 'Price History', sub: 'APMC benchmarks', path: '/admin/price-history', icon: TrendingUp, color: '#e11d48', bg: '#ffe4e6' },
            { label: 'DBMS Reports', sub: 'Views & queries', path: '/admin/reports', icon: FileText, color: 'var(--color-text-secondary)', bg: 'var(--color-bg-alt)' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className="action-card"
              >
                <div className="action-card-icon" style={{ backgroundColor: item.bg, color: item.color }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="action-card-title">{item.label}</div>
                  <div className="action-card-subtitle">{item.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--color-primary)" />
            <h2 className="card-title">Recent Marketplace Activity</h2>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Live Transaction Stream
          </span>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading live operational activity stream..." />
        ) : activities.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No recent platform activity recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activities.map((act, index) => (
              <div
                key={index}
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {act.activityType}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      Actor: <strong style={{ color: 'var(--color-text)' }}>{act.actorName}</strong>
                      {act.referenceId && <span> • Ref #{act.referenceId}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <StatusBadge status={act.status} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    {act.timestamp ? new Date(act.timestamp).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
