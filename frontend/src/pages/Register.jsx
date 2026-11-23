import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../services/authApi';
import ErrorMessage from '../components/ErrorMessage';
import SelectField from '../components/SelectField';
import { Sprout, CheckCircle2, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('FARMER'); // FARMER or BUYER only (ADMIN strictly prohibited)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Farmer-specific fields
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');
  const [experienceYears, setExperienceYears] = useState('');

  // Buyer-specific fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('WHOLESALER');
  const [gstin, setGstin] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    setLoading(true);

    const payload = {
      fullName,
      email,
      phone,
      password,
      role,
      ...(role === 'FARMER' ? {
        farmLocation: farmLocation.trim() || undefined,
        farmSizeAcres: farmSizeAcres ? parseFloat(farmSizeAcres) : undefined,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
      } : {
        businessName: businessName.trim() || undefined,
        businessType: businessType || undefined,
        gstin: gstin.trim() || undefined,
        businessAddress: businessAddress.trim() || undefined,
      })
    };

    try {
      await authApi.register(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please verify your details.');
      setFieldErrors(err.errors || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--color-bg)',
      padding: '2.5rem 1rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50px',
          height: '50px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '0.75rem'
        }}>
          <Sprout size={28} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          Create an AgriConnect Account
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Join India's premiere verified agricultural produce marketplace
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '580px', padding: '2.25rem' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Registration Successful!
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Your account has been created. Redirecting you to the sign-in screen...
            </p>
          </div>
        ) : (
          <>
            {/* Role Switcher Tab */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              backgroundColor: 'var(--color-bg-alt)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.75rem'
            }}>
              <button
                type="button"
                onClick={() => setRole('FARMER')}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: role === 'FARMER' ? 'var(--color-surface)' : 'transparent',
                  color: role === 'FARMER' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: role === 'FARMER' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🌾 I am a Farmer
              </button>
              <button
                type="button"
                onClick={() => setRole('BUYER')}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: role === 'BUYER' ? 'var(--color-surface)' : 'transparent',
                  color: role === 'BUYER' ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
                  boxShadow: role === 'BUYER' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🛒 I am a Commercial Buyer
              </button>
            </div>

            <ErrorMessage
              message={error}
              errors={fieldErrors}
              onDismiss={() => { setError(null); setFieldErrors(null); }}
            />

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ramesh Patil"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="ramesh@kisan.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    className="form-control"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Role-specific sections */}
              {role === 'FARMER' ? (
                <div style={{
                  backgroundColor: 'var(--color-primary-subtle)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  margin: '0.75rem 0 1.25rem'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    Farmer Profile Details (Optional)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Farm Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Nashik, Maharashtra"
                        value={farmLocation}
                        onChange={(e) => setFarmLocation(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Farm Size (Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 12.5"
                        value={farmSizeAcres}
                        onChange={(e) => setFarmSizeAcres(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 15"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  border: '1px solid var(--color-secondary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  margin: '0.75rem 0 1.25rem'
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '0.75rem' }}>
                    Commercial Buyer Profile (Optional)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Business Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. AgroFoods India Pvt Ltd"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <SelectField
                      label="Business Type"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{ marginBottom: 0 }}
                      options={[
                        { value: 'WHOLESALER', label: 'Wholesaler' },
                        { value: 'RETAILER', label: 'Retailer' },
                        { value: 'FOOD_PROCESSOR', label: 'Food Processor' },
                        { value: 'EXPORTER', label: 'Exporter' },
                        { value: 'INSTITUTIONAL_BUYER', label: 'Institutional Buyer' },
                      ]}
                    />
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">GSTIN (15 Digits)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 27AABCU9603R1ZX"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                {loading ? 'Registering Account...' : 'Complete Registration'}
              </button>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: 600 }}>
                Sign in here
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
