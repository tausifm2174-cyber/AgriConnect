import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { Sprout, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, redirect to role-specific dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      if (role === 'FARMER') navigate('/farmer', { replace: true });
      else if (role === 'BUYER') navigate('/buyer', { replace: true });
      else if (role === 'ADMIN') navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      const destination = location.state?.from?.pathname || (
        loggedInUser.role === 'FARMER' ? '/farmer' :
        loggedInUser.role === 'BUYER' ? '/buyer' : '/admin'
      );
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--color-bg)',
      padding: '2rem 1rem'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '1rem'
        }}>
          <Sprout size={32} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          AgriConnect
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Quality-Aware Agricultural Marketplace & Direct Trading Platform
        </p>
      </div>

      {/* Login Card */}
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.25rem 2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text)' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Please enter your credentials to access your dashboard.
        </p>

        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@kisan.in or agro.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)'
              }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to AgriConnect</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)'
        }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register here
          </Link>
        </div>

        {/* Demo Credentials Helper for College Evaluators */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-border-subtle)',
          fontSize: '0.75rem'
        }}>
          <div style={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem'
          }}>
            Quick Fill Demo Accounts:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('rajesh.patel@kisan.in', 'Farmer@123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>🌾 Farmer:</span>
              <span>rajesh.patel@kisan.in</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('vikas.gupta@freshmarts.com', 'Buyer@123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>🛒 Buyer:</span>
              <span>vikas.gupta@freshmarts.com</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill('priya.sharma@agriconnect.org', 'Admin@123')}
              style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>⚙️ Admin:</span>
              <span>priya.sharma@agriconnect.org</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
