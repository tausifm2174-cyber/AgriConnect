import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Shield,
  Sprout,
  ShoppingBag,
  Eye,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedRole !== 'ALL') params.role = selectedRole;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminApi.getUsers(params);
      const userList = res.data?.data || res.data || [];
      setUsers(userList);
    } catch (err) {
      console.error('Failed to fetch platform users:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenDetail = async (user) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await adminApi.getUserById(user.userId);
      setSelectedUser(res.data?.data || res.data || user);
    } catch (err) {
      console.error('Failed to fetch detailed profile:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const roleCounts = {
    ALL: users.length,
    FARMER: users.filter((u) => u.role === 'FARMER').length,
    BUYER: users.filter((u) => u.role === 'BUYER').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">User Directory</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Stakeholders
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Browse and inspect verified Farmers, Commercial Buyers, and System Administrators registered on AgriConnect.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'FARMER', 'BUYER', 'ADMIN'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedRole === role
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {role} {selectedRole === 'ALL' && role !== 'ALL' ? '' : `(${roleCounts[role] || 0})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Querying platform stakeholder directory..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No users match the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const roleBadgeColor =
                    u.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : u.role === 'FARMER'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                  return (
                    <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-500">#{u.userId}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{u.fullName}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{u.email}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono">{u.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${roleBadgeColor}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          <Eye size={12} />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${u.userId}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-700 rounded-md"
                          title="Open dedicated page"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {detailModalOpen && selectedUser && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`User Profile — ${selectedUser.fullName}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-sm">
            {loadingDetail ? (
              <LoadingSpinner message="Loading user details..." />
            ) : (
              <>
                {/* Core User Meta */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-400">User ID #{selectedUser.userId}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                      {selectedUser.role}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.fullName}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} className="text-gray-400" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      <span>{selectedUser.phone || 'No phone recorded'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck size={14} className="text-gray-400" />
                      <span>Account Status: <strong>{selectedUser.status}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      <span>
                        Joined:{' '}
                        <strong>
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Farmer Profile Specialization */}
                {selectedUser.farmerProfile && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <Sprout size={16} />
                      Farmer Profile Specialization
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div>Farm Location: <strong>{selectedUser.farmerProfile.farmLocation || 'N/A'}</strong></div>
                      <div>Farm Size: <strong>{selectedUser.farmerProfile.farmSizeAcres ?? 'N/A'} Acres</strong></div>
                      <div>Experience: <strong>{selectedUser.farmerProfile.experienceYears ?? 'N/A'} Years</strong></div>
                      <div>Farmer ID Ref: <strong>#{selectedUser.farmerProfile.farmerId}</strong></div>
                    </div>
                  </div>
                )}

                {/* Buyer Profile Specialization */}
                {selectedUser.buyerProfile && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                      <ShoppingBag size={16} />
                      Commercial Buyer Profile Specialization
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div>Company Name: <strong>{selectedUser.buyerProfile.businessName || 'N/A'}</strong></div>
                      <div>Business Type: <strong>{selectedUser.buyerProfile.businessType || 'N/A'}</strong></div>
                      <div>GSTIN: <strong className="font-mono">{selectedUser.buyerProfile.gstNumber || 'N/A'}</strong></div>
                      <div>Business Address: <strong>{selectedUser.buyerProfile.businessAddress || 'N/A'}</strong></div>
                    </div>
                  </div>
                )}

                {/* Dedicated Page Link */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      navigate(`/admin/users/${selectedUser.userId}`);
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                  >
                    <span>Open Dedicated Inspector</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;
