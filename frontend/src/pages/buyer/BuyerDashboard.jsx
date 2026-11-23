import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Plus,
  RefreshCw,
  ClipboardList,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';

export const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live telemetry state
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [requirements, setRequirements] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, ordersRes, deliveriesRes, reqRes] = await Promise.all([
        buyerApi.getRequirementMetrics().catch(() => ({ data: null })),
        buyerApi.getOrders().catch(() => ({ data: [] })),
        buyerApi.getDeliveries().catch(() => ({ data: [] })),
        buyerApi.getRequirements().catch(() => ({ data: [] })),
      ]);

      const mData = metricsRes.data?.data || metricsRes.data || null;
      const oData = ordersRes.data?.data || ordersRes.data || [];
      const dData = deliveriesRes.data?.data || deliveriesRes.data || [];
      const rData = reqRes.data?.data || reqRes.data || [];

      setMetrics(mData);
      setOrders(Array.isArray(oData) ? oData : []);
      setDeliveries(Array.isArray(dData) ? dData : []);
      setRequirements(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error('Failed to load buyer dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load buyer procurement dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // KPI computations from real backend data
  const activeReqCount = metrics?.openRequirements ?? requirements.filter((r) => r.status === 'OPEN').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeDeliveriesCount = deliveries.filter((d) => ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
  const completedPurchasesCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalPurchaseValue = orders
    .filter((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Slice recent items
  const recentOrders = orders.slice(0, 5);
  const recentRequirements = requirements.slice(0, 5);

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building2 size={26} color="var(--color-primary)" />
            <span>Buyer Procurement Center</span>
          </h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.fullName || 'Commercial Buyer'}</strong>. Monitor demand inquiries, quality-matched harvest lots, and active freight dispatches.
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
            onClick={loadDashboardData}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Primary KPI Grid (4 Columns Desktop, 2 Tablet, 1 Mobile) */}
      <div className="grid-cards">
        <DashboardCard
          title="Open Requirements"
          value={loading ? '...' : activeReqCount}
          description={`${requirements.length} total demand requirements posted`}
          icon={ClipboardList}
          variant="primary"
        />
        <DashboardCard
          title="Pending Contracts"
          value={loading ? '...' : pendingOrdersCount}
          description={pendingOrdersCount > 0 ? 'Awaiting farmer acceptance' : 'All contracts acknowledged'}
          icon={ShoppingBag}
          variant="secondary"
          trend={pendingOrdersCount > 0 ? `+${pendingOrdersCount}` : null}
          trendLabel={pendingOrdersCount > 0 ? 'Pending' : null}
        />
        <DashboardCard
          title="Inbound Shipments"
          value={loading ? '...' : activeDeliveriesCount}
          description={`${completedPurchasesCount} fulfilled orders delivered`}
          icon={Truck}
          variant="accent"
        />
        <DashboardCard
          title="Procurement Spend"
          value={loading ? '...' : `₹${Number(totalPurchaseValue).toLocaleString('en-IN')}`}
          description={`${orders.length} commercial purchase orders placed`}
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Quick Action Navigation Grid (AgriConnect Design System) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.75rem'
        }}>
          Procurement Operations & Actions
        </div>

        <div className="grid-quick-actions">
          <Link to="/buyer/requirements/new" className="action-card">
            <div className="action-card-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Plus size={20} />
            </div>
            <div>
              <div className="action-card-title">Post Requirement</div>
              <div className="action-card-subtitle">Broadcast crop demand</div>
            </div>
          </Link>

          <Link to="/buyer/matches" className="action-card">
            <div className="action-card-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className="action-card-title">Quality Matches</div>
              <div className="action-card-subtitle">AI-scored harvest lots</div>
            </div>
          </Link>

          <Link to="/buyer/orders" className="action-card">
            <div className="action-card-icon" style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="action-card-title">Purchase Orders</div>
              <div className="action-card-subtitle">Contracts & fulfillment</div>
            </div>
          </Link>

          <Link to="/buyer/deliveries" className="action-card">
            <div className="action-card-icon" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              <Truck size={20} />
            </div>
            <div>
              <div className="action-card-title">Track Deliveries</div>
              <div className="action-card-subtitle">Real-time freight status</div>
            </div>
          </Link>

          <Link to="/buyer/payments" className="action-card">
            <div className="action-card-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div className="action-card-title">Payment Ledger</div>
              <div className="action-card-subtitle">Receipts & settlements</div>
            </div>
          </Link>

          <Link to="/buyer/price-history" className="action-card">
            <div className="action-card-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--color-success)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="action-card-title">Mandi Benchmarks</div>
              <div className="action-card-subtitle">Market rates & trends</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Two-Column Responsive Layout: Recent Orders & Recent Requirements */}
      <div className="grid-2">
        {/* Recent Purchase Orders */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ShoppingBag size={18} color="var(--color-secondary)" />
                <span>Recent Purchase Orders</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Commercial purchase orders with verified farmers
              </p>
            </div>
            <Link to="/buyer/orders" style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div>
            {loading ? (
              <LoadingSpinner message="Loading orders..." size="small" />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders placed yet"
                description="Match available harvest lots with your crop requirements to place purchase orders."
                actionLabel="Explore Matching Harvests"
                onAction={() => navigate('/buyer/matches')}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    onClick={() => navigate(`/buyer/orders/${ord.orderId}`)}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-border)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          #ORD-{ord.orderId}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          • {ord.cropName}
                        </span>
                        <StatusBadge status={ord.status} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Farmer: <strong style={{ color: 'var(--color-text)' }}>{ord.farmerName}</strong> •{' '}
                        {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN') : 'Recent'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--color-primary)' }}>
                        ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                        {Number(ord.quantity).toLocaleString()} kg @ ₹{ord.agreedPricePerKg}/kg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Requirements */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ClipboardList size={18} color="var(--color-primary)" />
                <span>Active Demand Requirements</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Open procurement demands broadcast to agricultural producers
              </p>
            </div>
            <Link to="/buyer/requirements" style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div>
            {loading ? (
              <LoadingSpinner message="Loading requirements..." size="small" />
            ) : recentRequirements.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No requirements posted yet"
                description="Specify the crop volume, quality grade, and maximum price to discover qualified harvest lots."
                actionLabel="Post New Requirement"
                onAction={() => navigate('/buyer/requirements/new')}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentRequirements.map((req) => (
                  <div
                    key={req.requirementId}
                    onClick={() => navigate(`/buyer/requirements/${req.requirementId}`)}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-border)';
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          #REQ-{req.requirementId}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          • {req.cropName}
                        </span>
                        <StatusBadge status={req.status} />
                        {req.minQualityGrade && (
                          <StatusBadge status={req.minQualityGrade} type="grade" />
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Required: <strong style={{ color: 'var(--color-text)' }}>{Number(req.requiredQuantity).toLocaleString()} kg</strong> • Max Price: ₹{req.maxPricePerKg}/kg
                      </div>
                    </div>

                    <div>
                      <span className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                        Matches &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
