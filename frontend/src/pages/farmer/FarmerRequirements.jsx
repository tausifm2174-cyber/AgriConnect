import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import farmerApi from '../../services/farmerApi';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export const FarmerRequirements = () => {
  const [orders, setOrders] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        farmerApi.getCrops(),
      ]);

      const ordData = ordersRes.data?.data || ordersRes.data || [];
      const cropData = cropsRes.data?.data || cropsRes.data || [];

      setOrders(Array.isArray(ordData) ? ordData : []);
      setCrops(Array.isArray(cropData) ? cropData : []);
    } catch (err) {
      console.error('Failed to load market demand telemetry:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve buyer demand intelligence.');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders (representing buyer procurement contracts and matched demand)
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ['PENDING', 'ACCEPTED', 'SHIPPED'].includes(o.status)) ||
      (statusFilter === 'DELIVERED' && o.status === 'DELIVERED') ||
      o.status === statusFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (o.cropName && o.cropName.toLowerCase().includes(term)) ||
      (o.buyerName && o.buyerName.toLowerCase().includes(term)) ||
      (o.farmLocation && o.farmLocation.toLowerCase().includes(term)) ||
      String(o.orderId).includes(term) ||
      (o.requirementId && String(o.requirementId).includes(term));

    return matchesStatus && matchesSearch;
  });

  // KPIs
  const totalDemandLots = orders.length;
  const totalVolumeDemanded = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const totalContractVal = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const activeDemands = orders.filter((o) => ['PENDING', 'ACCEPTED', 'SHIPPED'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Demand & Buyer Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real commercial purchase demands matched to your verified harvest lots via AgriConnect Quality-Aware Matching.
          </p>
        </div>

        <button
          onClick={fetchDemandData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Demand
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchDemandData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Procurement Demands"
          value={totalDemandLots}
          subtitle="Orders placed by buyers"
          icon="shopping-bag"
          color="emerald"
        />
        <DashboardCard
          title="Active Contracts"
          value={activeDemands}
          subtitle="Pending, accepted, in-transit"
          icon="clock"
          color="blue"
        />
        <DashboardCard
          title="Volume Contracted"
          value={`${(totalVolumeDemanded / 1000).toFixed(1)} MT`}
          subtitle={`${totalVolumeDemanded.toLocaleString()} kg total`}
          icon="scale"
          color="amber"
        />
        <DashboardCard
          title="Total Contract Value"
          value={`₹${totalContractVal.toLocaleString('en-IN')}`}
          subtitle="Realized & pending orders"
          icon="currency-rupee"
          color="emerald"
        />
      </div>

      {/* Quality-Aware Matching Architecture Notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-emerald-900">How Commercial Buyer Demands Reach Farmers</h4>
          <p className="text-emerald-800 text-xs mt-1 leading-relaxed">
            Commercial buyers specify crop requirements with required volume, maximum buying price, and quality grade standards. AgriConnect's matching engine evaluates available harvest lots and pairs qualified produce. When an agreement occurs, commercial contracts appear here as incoming purchase orders.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'ACTIVE', 'DELIVERED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'ACTIVE' ? 'Active Demands' : tab === 'DELIVERED' ? 'Fulfilled Contracts' : 'All Demands'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search crop, buyer, location, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Content: Real Buyer Demands Table */}
      {loading ? (
        <LoadingSpinner message="Auditing buyer procurement inquiries..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Demand Ref / Order</th>
                  <th className="px-4 py-3.5 text-left">Crop & Category</th>
                  <th className="px-4 py-3.5 text-left">Buyer & Location</th>
                  <th className="px-4 py-3.5 text-right">Required Volume</th>
                  <th className="px-4 py-3.5 text-right">Agreed Price</th>
                  <th className="px-4 py-3.5 text-center">Quality Grade</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">#ORD-{ord.orderId}</div>
                      {ord.requirementId && (
                        <div className="text-[11px] font-mono text-emerald-700">Req: #REQ-{ord.requirementId}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ord.cropName}</div>
                      <div className="text-xs text-gray-500">{ord.cropCategory}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900">{ord.buyerName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]" title={ord.farmLocation || ord.businessName}>
                        {ord.farmLocation || ord.businessName || 'Wholesale Buyer'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="font-semibold text-gray-900">{Number(ord.quantity).toLocaleString()} kg</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="font-bold text-gray-900">₹{Number(ord.agreedPricePerKg).toFixed(2)} / kg</div>
                      <div className="text-xs text-emerald-600 font-semibold">
                        Total: ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      {ord.qualityGrade ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                          Grade {ord.qualityGrade} ({Number(ord.qualityScore || 0).toFixed(1)}/5)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unrated</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <StatusBadge status={ord.status} />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <Link
                        to="/farmer/orders"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        Review Order &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monitored Agricultural Commodity Catalog */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Marketplace Commodities Under Active Demand Monitoring
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Crops cataloged by AgriConnect for commercial demand matching and APMC mandi benchmark indexing.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {crops.map((c) => (
            <div key={c.cropId} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
              <div className="font-semibold text-gray-900 text-sm">{c.cropName}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{c.category}</div>
              <div className="text-[10px] text-emerald-700 font-medium mt-1">{c.season}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerRequirements;
