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
  ArrowUpRight,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Admin Command Center</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Operations
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time platform oversight: stakeholders, quality audits, marketplace volume, freight tracking, and settlement telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Secondary Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
          Marketplace Operations Shortcuts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Users', path: '/admin/users', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Harvests', path: '/admin/harvests', icon: Wheat, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Quality', path: '/admin/quality', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'Orders', path: '/admin/orders', icon: ShoppingBag, color: 'text-purple-600 bg-purple-50 border-purple-100' },
            { label: 'Deliveries', path: '/admin/deliveries', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
            { label: 'Payments', path: '/admin/payments', icon: CreditCard, color: 'text-teal-600 bg-teal-50 border-teal-100' },
            { label: 'Price History', path: '/admin/price-history', icon: TrendingUp, color: 'text-rose-600 bg-rose-50 border-rose-100' },
            { label: 'DBMS Reports', path: '/admin/reports', icon: FileText, color: 'text-gray-700 bg-gray-50 border-gray-200' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-transform hover:-translate-y-0.5 text-center ${item.color}`}
              >
                <Icon size={20} />
                <span className="text-xs font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-gray-600" />
            <h2 className="text-base font-bold text-gray-900">Recent Marketplace Activity</h2>
          </div>
          <span className="text-xs font-medium text-gray-500">Live Transaction Stream</span>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading live operational activity stream..." />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No recent platform activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((act, index) => (
              <div key={index} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-gray-100 text-gray-700 font-bold text-xs uppercase">
                    {act.activityType}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{act.description}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>Actor: <strong className="text-gray-700">{act.actorName}</strong></span>
                      {act.referenceId && <span>• Ref #{act.referenceId}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right">
                  <StatusBadge status={act.status} />
                  <span className="text-xs text-gray-400 whitespace-nowrap font-mono">
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
