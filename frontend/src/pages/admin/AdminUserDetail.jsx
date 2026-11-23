import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Sprout,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getUserById(id);
        setUser(res.data?.data || res.data || null);
      } catch (err) {
        console.error('Failed to load user detail:', err);
        setError(err.response?.data?.message || err.message || 'User not found or inaccessible.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Retrieving user audit profile..." />;
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to User Directory
        </button>
        <ErrorMessage message={error || 'User not found.'} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          title="Back to User Directory"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="text-xs text-gray-500 font-medium">Platform Users / Stakeholder Inspector</div>
          <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Identity Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-2xl">
              {user.fullName ? user.fullName.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user.fullName}</h2>
              <span className="font-mono text-xs text-gray-400">UID #{user.userId}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {user.role}
                </span>
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} className="text-gray-400" />
              <span className="font-mono">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} className="text-gray-400" />
              <span className="font-mono">{user.phone || 'No phone recorded'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              <span>Registered: <strong>{user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN') : 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} className="text-gray-400" />
              <span>Last Modified: <strong>{user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-IN') : 'N/A'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Role Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {user.farmerProfile && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Sprout size={20} />
                <h3 className="text-base font-bold text-gray-900">Farmer Enterprise Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Farm Location</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.farmerProfile.farmLocation || 'Not specified'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Acreage / Farm Size</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.farmerProfile.farmSizeAcres ?? '—'} Acres</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Farming Experience</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.farmerProfile.experienceYears ?? '—'} Years</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Farmer Profile ID</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5 font-mono">#{user.farmerProfile.farmerId}</div>
                </div>
              </div>
            </div>
          )}

          {user.buyerProfile && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-700">
                <ShoppingBag size={20} />
                <h3 className="text-base font-bold text-gray-900">Corporate Buyer Profile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Registered Business Name</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.buyerProfile.businessName || 'Not specified'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Commercial Business Type</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.buyerProfile.businessType || 'Not specified'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">GSTIN Registration</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5 font-mono">
                    {user.buyerProfile.gstin || user.buyerProfile.gstNumber || 'Not provided'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Business Address</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{user.buyerProfile.businessAddress || 'Not specified'}</div>
                </div>
              </div>
            </div>
          )}

          {!user.farmerProfile && !user.buyerProfile && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center py-12 text-gray-500 text-sm">
              <Shield size={36} className="mx-auto text-purple-600 mb-2 opacity-80" />
              <div className="font-bold text-gray-900">Platform System Administrator</div>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Holds global operations privileges including quality verification, user auditing, order dispute mediation, and financial settlements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
