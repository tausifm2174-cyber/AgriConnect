import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  LayoutDashboard,
  Wheat,
  ShoppingBag,
  Truck,
  CreditCard,
  TrendingUp,
  ClipboardList,
  Sparkles,
  Users,
  ShieldCheck,
  Activity,
  FileText
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const farmerNav = [
    { label: 'Overview', path: '/farmer', icon: LayoutDashboard, end: true },
    { label: 'Farmer Profile', path: '/farmer/profile', icon: Activity },
    { label: 'My Harvest Lots', path: '/farmer/harvests', icon: Wheat },
    { label: 'Quality Reports', path: '/farmer/quality', icon: ShieldCheck },
    { label: 'Buyer Demand', path: '/farmer/requirements', icon: ClipboardList },
    { label: 'Incoming Orders', path: '/farmer/orders', icon: ShoppingBag },
    { label: 'Deliveries', path: '/farmer/deliveries', icon: Truck },
    { label: 'Payment Ledger', path: '/farmer/payments', icon: CreditCard },
    { label: 'Market Prices', path: '/farmer/price-history', icon: TrendingUp },
  ];

  const buyerNav = [
    { label: 'Dashboard', path: '/buyer', icon: LayoutDashboard, end: true },
    { label: 'Profile', path: '/buyer/profile', icon: Users },
    { label: 'Requirements', path: '/buyer/requirements', icon: ClipboardList },
    { label: 'Matching', path: '/buyer/matches', icon: Sparkles },
    { label: 'Orders', path: '/buyer/orders', icon: ShoppingBag },
    { label: 'Deliveries', path: '/buyer/deliveries', icon: Truck },
    { label: 'Payments', path: '/buyer/payments', icon: CreditCard },
    { label: 'Price History', path: '/buyer/price-history', icon: TrendingUp },
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Harvests', path: '/admin/harvests', icon: Wheat },
    { label: 'Quality', path: '/admin/quality', icon: ShieldCheck },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Deliveries', path: '/admin/deliveries', icon: Truck },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Price History', path: '/admin/price-history', icon: TrendingUp },
    { label: 'Reports', path: '/admin/reports', icon: FileText },
  ];

  const navItems = role === 'FARMER' ? farmerNav : role === 'BUYER' ? buyerNav : adminNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 40,
            display: 'block'
          }}
        />
      )}

      <aside style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: isOpen ? 0 : 'calc(-1 * var(--sidebar-width))',
        zIndex: 50,
        transition: 'left 0.25s ease',
        boxShadow: isOpen ? 'var(--shadow-lg)' : 'none'
      }}>
        {/* Brand Header */}
        <div style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sprout size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              AgriConnect
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Farmer-to-Market
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.5rem 0.75rem 0.75rem'
          }}>
            Main Menu
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer info */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Phase 15 — React UI</span>
          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>● Online</span>
        </div>
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          aside {
            left: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
