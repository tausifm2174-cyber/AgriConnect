import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import buyerApi from '../../services/buyerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live state
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

  // KPIs
  const activeReqCount = metrics?.openRequirements ?? requirements.filter((r) => r.status === 'OPEN').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeDeliveriesCount = deliveries.filter((d) => ['DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
  const completedPurchasesCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalPurchaseValue = orders
    .filter((o) => ['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Recent lists
  const recentOrders = orders.slice(0, 5);
  const activeDeliveriesList = deliveries
    .filter((d) => ['PENDING', 'DISPATCHED', 'IN_TRANSIT'].includes(d.deliveryStatus))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Procurement Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, <span className="font-semibold text-gray-700">{user?.fullName || 'Commercial Buyer'}</span>. Monitor requirements, quality-matched lots, and active shipments.
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
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadDashboardData} />}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DashboardCard
          title="Active Demands"
          value={activeReqCount}
          subtitle="Open requirements"
          icon="clipboard-list"
          color="emerald"
        />
        <DashboardCard
          title="Total Posted"
          value={metrics?.totalRequirements ?? requirements.length}
          subtitle="All requirements"
          icon="document-text"
          color="blue"
        />
        <DashboardCard
          title="Pending Approval"
          value={pendingOrdersCount}
          subtitle="Farmer response pending"
          icon="clock"
          color={pendingOrdersCount > 0 ? "amber" : "gray"}
        />
        <DashboardCard
          title="Active Shipments"
          value={activeDeliveriesCount}
          subtitle="Dispatched / transit"
          icon="truck"
          color="blue"
        />
        <DashboardCard
          title="Fulfilled Lots"
          value={completedPurchasesCount}
          subtitle="Delivered contracts"
          icon="check-circle"
          color="emerald"
        />
        <DashboardCard
          title="Procurement Spend"
          value={`₹${(totalPurchaseValue / 1000).toFixed(1)}k`}
          subtitle={`₹${totalPurchaseValue.toLocaleString('en-IN')}`}
          icon="currency-rupee"
          color="emerald"
        />
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1">Quick Actions:</span>
        <button
          onClick={() => navigate('/buyer/requirements/new')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          + Post Requirement
        </button>
        <button
          onClick={() => navigate('/buyer/matches')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
        >
          ⚡ Quality-Aware Matches
        </button>
        <button
          onClick={() => navigate('/buyer/orders')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          📦 Purchase Orders
        </button>
        <button
          onClick={() => navigate('/buyer/deliveries')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          🚚 Track Deliveries
        </button>
        <button
          onClick={() => navigate('/buyer/payments')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
        >
          💳 Payment Ledger
        </button>
        <button
          onClick={() => navigate('/buyer/price-history')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          📊 Mandi Benchmarks
        </button>
      </div>

      {/* Main Dual Grid: Recent Orders & Active Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Recent Purchase Orders</h3>
              <p className="text-xs text-gray-500">Commercial procurement orders with verified farmers</p>
            </div>
            <Link to="/buyer/orders" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">
              View All Orders &rarr;
            </Link>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <LoadingSpinner message="Loading orders..." />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                title="No orders placed yet"
                description="Match available harvest lots with your crop requirements to place purchase orders."
                actionLabel="Explore Matching Harvests"
                onAction={() => navigate('/buyer/matches')}
              />
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    onClick={() => navigate(`/buyer/orders/${ord.orderId}`)}
                    className="p-3 bg-gray-50 hover:bg-emerald-50/40 rounded-lg border border-gray-100 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">#ORD-{ord.orderId}</span>
                        <span className="text-xs text-gray-500">• {ord.cropName}</span>
                        <StatusBadge status={ord.status} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Farmer: <span className="font-medium text-gray-700">{ord.farmerName}</span> • Placed on{' '}
                        {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-sm">
                        ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {Number(ord.quantity).toLocaleString()} kg @ ₹{ord.agreedPricePerKg}/kg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Deliveries Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Active Shipment Telemetry</h3>
              <p className="text-xs text-gray-500">Live logistics, vehicle tracking, and dispatch status</p>
            </div>
            <Link to="/buyer/deliveries" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">
              Track All Deliveries &rarr;
            </Link>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <LoadingSpinner message="Loading deliveries..." />
            ) : activeDeliveriesList.length === 0 ? (
              <EmptyState
                title="No active shipments"
                description="Once farmers dispatch accepted purchase orders, shipment tracking details appear here."
              />
            ) : (
              <div className="space-y-3">
                {activeDeliveriesList.map((del) => (
                  <div
                    key={del.deliveryId}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">#DEL-{del.deliveryId}</span>
                        <span className="text-xs text-gray-500">(Order #ORD-{del.orderId})</span>
                        <StatusBadge status={del.deliveryStatus} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Produce: <strong>{del.cropName}</strong> ({Number(del.quantity).toLocaleString()} kg)
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Vehicle: {del.vehicleNumber || 'Unassigned'} • Tracking: {del.trackingNumber || 'Unassigned'}
                      </div>
                    </div>

                    <div className="text-right">
                      <Link
                        to="/buyer/deliveries"
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      >
                        Track & Confirm &rarr;
                      </Link>
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
