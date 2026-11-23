import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Users,
  Search,
  Eye,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  UserCheck,
  Building,
  MapPin,
  Sprout
} from 'lucide-react';

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Status toggle confirmation
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusConfirmUser, setStatusConfirmUser] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [statusSuccess, setStatusSuccess] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedRole !== 'ALL') params.role = selectedRole;
      if (searchQuery.trim()) params.query = searchQuery.trim();

      const res = await adminApi.getUsers(params);
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load user directory:', err);
      setError(err.response?.data?.message || err.message || 'Unable to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

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
      setDetailData(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Failed to load user detail profile:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = (user) => {
    setStatusError(null);
    setStatusConfirmUser(user);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusConfirmUser) return;
    const userId = statusConfirmUser.userId;
    const nextStatus = statusConfirmUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setStatusActionLoading(true);
    setStatusError(null);
    try {
      await adminApi.updateUserStatus(userId, nextStatus);
      if (selectedUser && selectedUser.userId === userId) {
        setSelectedUser({ ...selectedUser, status: nextStatus });
      }
      setStatusConfirmUser(null);
      setStatusSuccess(`User #${userId} status updated to ${nextStatus}.`);
      setTimeout(() => setStatusSuccess(null), 4000);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
      setStatusError(err.response?.data?.message || err.message || 'Status update failed.');
    } finally {
      setStatusActionLoading(false);
    }
  };

  const roleCounts = {
    ALL: users.length,
    FARMER: users.filter((u) => u.role === 'FARMER').length,
    BUYER: users.filter((u) => u.role === 'BUYER').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="page-title">
              <Users size={26} color="var(--color-primary)" />
              <span>User Directory</span>
            </h1>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              border: '1px solid #7dd3fc',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Stakeholders
            </span>
          </div>
          <p className="page-subtitle">
            Browse and inspect verified Farmers, Commercial Buyers, and System Administrators registered on AgriConnect.
          </p>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />
      {statusError && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{statusError}</span>
          <button type="button" onClick={() => setStatusError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}
      {statusSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{statusSuccess}</span>
          <button type="button" onClick={() => setStatusSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Role Tabs */}
        <div className="tab-group">
          {['ALL', 'FARMER', 'BUYER', 'ADMIN'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`tab-btn ${selectedRole === role ? 'active' : ''}`}
            >
              {role} {selectedRole === 'ALL' && role !== 'ALL' ? '' : `(${roleCounts[role] || 0})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="search-wrapper">
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Querying platform stakeholder directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No registered stakeholders match your filter criteria."
        />
      ) : (
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleColor =
                  u.role === 'ADMIN'
                    ? { bg: '#f3e8ff', text: '#7c3aed', border: '#ddd6fe' }
                    : u.role === 'FARMER'
                    ? { bg: 'var(--color-primary-light)', text: 'var(--color-primary)', border: 'var(--color-primary-border)' }
                    : { bg: 'var(--color-accent-light)', text: 'var(--color-accent)', border: '#7dd3fc' };

                return (
                  <tr key={u.userId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      #{u.userId}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                      {u.fullName}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {u.email}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {u.phone || '—'}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        backgroundColor: roleColor.bg,
                        color: roleColor.text,
                        border: `1px solid ${roleColor.border}`
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge status={u.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.65rem' }}
                        >
                          <Eye size={13} />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${u.userId}`)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="Open dedicated page"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {detailModalOpen && selectedUser && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`User Profile — ${selectedUser.fullName}`}
          maxWidth="560px"
        >
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            {loadingDetail ? (
              <LoadingSpinner message="Loading user details..." />
            ) : (
              <>
                {/* Core User Meta */}
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      User ID #{selectedUser.userId}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)'
                    }}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    {selectedUser.fullName}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={14} color="var(--color-text-muted)" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} color="var(--color-text-muted)" />
                      <span>{selectedUser.phone || 'No phone recorded'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="var(--color-text-muted)" />
                      <span>Joined: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <StatusBadge status={selectedUser.status} />
                    </div>
                  </div>
                </div>

                {/* Role Profile Specifics */}
                {detailData?.farmerProfile && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      🌾 Farmer Operational Profile
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                      <div>Location: <strong>{detailData.farmerProfile.farmLocation || 'Unspecified'}</strong></div>
                      <div>Farm Size: <strong>{detailData.farmerProfile.farmSizeAcres || '0'} Acres</strong></div>
                      <div>Experience: <strong>{detailData.farmerProfile.experienceYears || '0'} Years</strong></div>
                    </div>
                  </div>
                )}

                {detailData?.buyerProfile && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      🏢 Commercial Buyer Profile
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                      <div>Business: <strong>{detailData.buyerProfile.businessName || 'Not specified'}</strong></div>
                      <div>Type: <strong>{detailData.buyerProfile.businessType ? detailData.buyerProfile.businessType.replace('_', ' ') : 'Not specified'}</strong></div>
                      <div>GSTIN: <strong style={{ fontFamily: 'monospace' }}>{detailData.buyerProfile.gstin || detailData.buyerProfile.gstNumber || 'Not provided'}</strong></div>
                      <div>Address: <strong>{detailData.buyerProfile.businessAddress || 'Not specified'}</strong></div>
                    </div>
                  </div>
                )}

                {/* Status Toggle & Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedUser)}
                    disabled={statusActionLoading}
                    className={`btn btn-sm ${selectedUser.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {selectedUser.status === 'ACTIVE' ? 'Deactivate Stakeholder' : 'Activate Stakeholder'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Status Change */}
      <ConfirmDialog
        isOpen={!!statusConfirmUser}
        onClose={() => setStatusConfirmUser(null)}
        onConfirm={handleConfirmToggleStatus}
        title="Confirm Status Change"
        message={
          statusConfirmUser
            ? `Are you sure you want to change status of ${statusConfirmUser.fullName} (ID #${statusConfirmUser.userId}) to ${
                statusConfirmUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
              }?`
            : ''
        }
        confirmLabel={statusConfirmUser?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        isDanger={statusConfirmUser?.status === 'ACTIVE'}
        isLoading={statusActionLoading}
      />
    </div>
  );
};

export default AdminUsers;
