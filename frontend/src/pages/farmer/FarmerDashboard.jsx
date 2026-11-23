import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  Wheat,
  ShoppingBag,
  Truck,
  CreditCard,
  Plus,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [harvests, setHarvests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, harvestsRes, ordersRes, deliveriesRes, paymentsRes] = await Promise.all([
          farmerApi.getProfile(),
          farmerApi.getHarvests(),
          farmerApi.getOrders(),
          farmerApi.getDeliveries(),
          farmerApi.getPayments(),
        ]);

        setProfile(profileRes.data || null);
        setHarvests(harvestsRes.data || []);
        setOrders(ordersRes.data || []);
        setDeliveries(deliveriesRes.data || []);
        setPayments(paymentsRes.data || []);
      } catch (err) {
        console.error('Error fetching farmer dashboard data:', err);
        setError(err.message || 'Failed to load farmer operational telemetry.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute operational aggregates from real backend data
  const totalHarvests = profile?.totalHarvestsCount ?? harvests.length;
  const availableLots = harvests.filter(h => h.status === 'AVAILABLE').length;
  const availableStockKg = harvests
    .filter(h => h.status === 'AVAILABLE')
    .reduce((sum, h) => sum + (Number(h.availableQuantity) || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const activeDeliveries = deliveries.filter(d => ['DISPATCHED', 'IN_TRANSIT', 'READY_FOR_PICKUP'].includes(d.deliveryStatus)).length;

  const totalSettledRevenue = payments
    .filter(p => ['COMPLETED', 'PAID'].includes(p.paymentStatus))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="page-title">
            <Wheat size={26} color="var(--color-primary)" />
            <span>Farmer Operations Dashboard</span>
          </h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.fullName}</strong>. Manage lots, accept buyer contracts, track logistics, and audit settlements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/farmer/harvests/new" className="btn btn-primary">
            <Plus size={18} />
            <span>List New Harvest Lot</span>
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Prominent Action Required Section */}
      {!loading && pendingOrders > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#92400e' }}>
                Action Required: {pendingOrders} Pending Order{pendingOrders > 1 ? 's' : ''} Awaiting Acceptance
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                Wholesale buyers have placed purchase contracts against your harvest lots. Review terms and reserve stock.
              </div>
            </div>
          </div>
          <Link to="/farmer/orders" className="btn" style={{
            backgroundColor: '#d97706',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.8125rem',
            padding: '0.5rem 1rem'
          }}>
            <span>Review Orders &rarr;</span>
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid-cards">
        <DashboardCard
          title="Total Harvest Lots"
          value={loading ? '...' : totalHarvests}
          description={`${availableLots} Lots Available for Trade`}
          icon={Wheat}
          variant="primary"
        />
        <DashboardCard
          title="Available Stock"
          value={loading ? '...' : `${Number(availableStockKg).toLocaleString('en-IN')} kg`}
          description="Verified produce in inventory"
          icon={CheckCircle2}
          variant="success"
        />
        <DashboardCard
          title="Pending Orders"
          value={loading ? '...' : pendingOrders}
          description={pendingOrders > 0 ? 'Requires your acceptance' : 'Inbox up to date'}
          icon={ShoppingBag}
          variant="secondary"
          trend={pendingOrders > 0 ? `+${pendingOrders}` : null}
          trendLabel={pendingOrders > 0 ? 'Action Needed' : null}
        />
        <DashboardCard
          title="Active Shipments"
          value={loading ? '...' : activeDeliveries}
          description="Produce in transit to buyers"
          icon={Truck}
          variant="accent"
        />
        <DashboardCard
          title="Settled Revenue"
          value={loading ? '...' : `₹${Number(totalSettledRevenue).toLocaleString('en-IN')}`}
          description={`${payments.length} total payment receipts`}
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        margin: '1.5rem 0'
      }}>
        <Link to="/farmer/harvests" className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
            <Wheat size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>My Harvests</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Manage lots & prices</div>
          </div>
        </Link>

        <Link to="/farmer/orders" className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--color-secondary-light)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-secondary)' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Incoming Orders</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Accept or reject</div>
          </div>
        </Link>

        <Link to="/farmer/deliveries" className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--color-accent-light)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-accent)' }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Deliveries</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ship & track transit</div>
          </div>
        </Link>

        <Link to="/farmer/price-history" className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Mandi Benchmarks</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Live market rates</div>
          </div>
        </Link>
      </div>

      {/* Two Column Layout: Recent Harvests & Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Harvest Lots */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wheat size={18} color="var(--color-primary)" />
              <span>Recent Harvest Lots</span>
            </h3>
            <Link to="/farmer/harvests" style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="small" message="Loading harvest lots..." />
          ) : harvests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              No harvest lots listed yet.{' '}
              <Link to="/farmer/harvests/new" style={{ fontWeight: 600 }}>Create your first listing</Link>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {harvests.slice(0, 4).map((h) => (
                <div key={h.harvestId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                      {h.cropName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                      Lot #{h.harvestId} • Harvested {h.harvestDate} • {h.location}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {h.availableQuantity} kg @ ₹{h.pricePerKg}/kg
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <StatusBadge status={h.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Incoming Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="var(--color-secondary)" />
              <span>Incoming Buyer Orders</span>
            </h3>
            <Link to="/farmer/orders" style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="small" message="Loading orders..." />
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              No commercial orders received yet. Keep your harvest inventory active to receive buyer demand.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orders.slice(0, 4).map((o) => (
                <div key={o.orderId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                      Order #{o.orderId} — {o.cropName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                      Buyer: {o.buyerName || 'Commercial Buyer'} • {o.quantity} kg
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                      ₹{Number(o.totalAmount).toLocaleString('en-IN')}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
