import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User, Sprout } from 'lucide-react';

export const Navbar = ({ onToggleSidebar, title }) => {
  const { user, role, logout } = useAuth();

  const roleLabels = {
    FARMER: { text: 'Farmer Portal', bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
    BUYER: { text: 'Buyer Portal', bg: '#eff6ff', color: '#2563eb' },
    ADMIN: { text: 'Admin Console', bg: '#f1f5f9', color: '#0f172a' },
  };

  const currentRole = roleLabels[role] || { text: role, bg: 'var(--color-bg-alt)', color: 'var(--color-text)' };

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        {title && (
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {title}
          </h2>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '0.25rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: currentRole.bg,
          color: currentRole.color,
        }}>
          {currentRole.text}
        </span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          paddingLeft: '0.75rem',
          borderLeft: '1px solid var(--color-border)'
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: currentRole.bg,
            color: currentRole.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem'
          }}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {user?.fullName || 'User'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {user?.email}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: '0.5rem', padding: '0.35rem 0.65rem' }}
            title="Sign out of AgriConnect"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
