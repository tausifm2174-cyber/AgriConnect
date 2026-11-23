import React, { useState, useEffect } from 'react';
import buyerApi from '../../services/buyerApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

export const BuyerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await buyerApi.getProfile();
      // Backend returns UserResponse directly or inside data
      const data = res.data?.data || res.data || res;
      setProfile(data);
    } catch (err) {
      console.error('Failed to load buyer profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve buyer account details.');
    } finally {
      setLoading(false);
    }
  };

  const buyerData = profile?.buyerProfile || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commercial Buyer Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verified corporate procurement credentials, tax registration (GSTIN), and delivery destination specifications.
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadProfile} />}

      {loading ? (
        <LoadingSpinner message="Loading corporate credentials..." />
      ) : profile ? (
        <div className="space-y-6">
          {/* Identity & Account Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'B'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{profile.fullName}</h2>
                  <p className="text-xs text-gray-500">Authorized Purchasing Officer</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ROLE: {profile.role}
                </span>
                <StatusBadge status={profile.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase">Registered Email</span>
                <p className="font-semibold text-gray-900 mt-0.5">{profile.email}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase">Contact Phone</span>
                <p className="font-semibold text-gray-900 mt-0.5">{profile.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Business & Corporate Specifications Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Corporate Business Entity</h3>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Verified Business
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase">Enterprise Name</span>
                <p className="font-bold text-gray-900 mt-0.5">{buyerData.businessName || 'Not specified'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase">Commercial Category</span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {buyerData.businessType ? buyerData.businessType.replace('_', ' ') : 'COMMERCIAL BUYER'}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase">GSTIN / Tax Identifier</span>
                <p className="font-mono font-bold text-gray-900 mt-0.5">
                  {buyerData.gstin || 'Not provided'}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-gray-500 uppercase">Buyer Reference ID</span>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">
                  #BUYER-{buyerData.buyerId || profile.userId}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Default Delivery / Warehouse Destination</span>
              <p className="text-gray-800 font-medium mt-1 leading-relaxed">
                {buyerData.businessAddress || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Compliance & Quality Protocol Notice */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
            <h4 className="font-bold text-emerald-950 mb-1">AgriConnect Buyer Trade Protection</h4>
            <p>
              All purchases initiated from this account are backed by AgriConnect verified quality inspection certifications. Order dispatches and delivery milestones are tracked with transaction audit references.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BuyerProfile;
