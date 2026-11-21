import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import farmerApi from '../../services/farmerApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { User, MapPin, Wheat, Calendar, Phone, Mail, Award, Edit3, Save, CheckCircle2 } from 'lucide-react';

export const FarmerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');
  const [experienceYears, setExperienceYears] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await farmerApi.getProfile();
      // Backend returns ApiResponse { data: FarmerProfileDetailResponse }
      const p = res.data;
      setProfile(p);
      setFarmLocation(p.farmLocation || '');
      setFarmSizeAcres(p.farmSizeAcres || '');
      setExperienceYears(p.experienceYears || '');
    } catch (err) {
      console.error('Failed to load farmer profile:', err);
      setError(err.message || 'Unable to retrieve farmer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updatePayload = {
        farmLocation: farmLocation.trim(),
        farmSizeAcres: farmSizeAcres ? parseFloat(farmSizeAcres) : undefined,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
      };

      const res = await farmerApi.updateProfile(updatePayload);
      setProfile(res.data);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Failed to update farm details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="page-title">
            <User size={26} color="var(--color-primary)" />
            <span>Farmer Profile & Farm Specifications</span>
          </h1>
          <p className="page-subtitle">
            Manage your registered farm location, cultivation acreage, and verified farming experience.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={16} />
            <span>Edit Farm Details</span>
          </button>
        )}
      </div>

      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} />
          <span>Farm profile details updated successfully!</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading farmer profile..." />
      ) : profile ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Account & Personal Information Card */}
          <div className="card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}>
                {profile.fullName?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {profile.fullName}
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  ROLE: FARMER
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} color="var(--color-text-muted)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Email Address</div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{profile.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={18} color="var(--color-text-muted)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Phone Number</div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{profile.phone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} color="var(--color-text-muted)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Member Since</div>
                  <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                    {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'Active Member'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)'
            }}>
              Security Notice: Password credentials and JWT authentication tokens are strictly protected and never displayed in client views.
            </div>
          </div>

          {/* Farm Specifications Card */}
          <div className="card">
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Wheat size={18} color="var(--color-primary)" />
              <span>Cultivation Specifications & Metrics</span>
            </h3>

            {isEditing ? (
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label" htmlFor="farmLocation">Farm Location (City / District / State)</label>
                  <input
                    id="farmLocation"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Nashik, Maharashtra"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="farmSizeAcres">Cultivation Land Size (Acres)</label>
                  <input
                    id="farmSizeAcres"
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-control"
                    placeholder="e.g. 15.5"
                    value={farmSizeAcres}
                    onChange={(e) => setFarmSizeAcres(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="experienceYears">Farming Experience (Years)</label>
                  <input
                    id="experienceYears"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 12"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <MapPin size={24} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Farm Geographic Location</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {profile.farmLocation || 'Location not specified'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-bg-alt)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Farm Area</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                      {profile.farmSizeAcres ? `${profile.farmSizeAcres} Acres` : '--'}
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-bg-alt)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Experience</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                      {profile.experienceYears ? `${profile.experienceYears} Years` : '--'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-primary-subtle)',
                    border: '1px solid var(--color-primary-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>Total Harvest Lots</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                      {profile.totalHarvestsCount}
                    </div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>Active Produce Lots</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                      {profile.activeHarvestsCount}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FarmerProfile;
