import React from 'react';
import { Database, Sun, Moon, Store, RefreshCw, LogOut, LogIn, ShieldCheck } from 'lucide-react';
import type { HealthStatus, StoreSetting, User } from '../types';

interface HeaderBannerProps {
  storeSetting: StoreSetting | null;
  health: HealthStatus | null;
  theme: 'light' | 'dark';
  currentUser: User | null;
  onToggleTheme: () => void;
  onRefreshHealth: () => void;
  onOpenAccount: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  storeSetting,
  health,
  theme,
  currentUser,
  onToggleTheme,
  onRefreshHealth,
  onOpenAccount,
  onOpenAuth,
  onLogout
}) => {
  const storeName = storeSetting?.store_name || "Aling Nena's Store";
  const initials = storeSetting?.owner_name
    ? storeSetting.owner_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AN';

  const isMysql = health?.engine === 'mysql' && health?.connected;

  return (
    <header className="tinda-header">
      <div className="tinda-header-left">
        <div className="tinda-logo-badge" title="TindaMate POS">
          <Store size={28} />
        </div>
        <div className="tinda-header-title">
          <span className="tinda-header-sub">TindaMate Store Management</span>
          <h1 className="tinda-header-name">{storeName}</h1>
        </div>
      </div>

      <div className="tinda-header-right">
        {/* MySQL Connectivity Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: isMysql ? '#dcfce7' : '#fef3c7',
            color: isMysql ? '#166534' : '#92400e',
            border: '2px solid var(--border-outline)',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: '0 2px 0 var(--border-outline)'
          }}
          title={health ? `${health.engine.toUpperCase()} (${health.url})` : 'Connecting...'}
        >
          <Database size={15} />
          <span>{isMysql ? 'MySQL Connected' : 'SQLite Fallback'}</span>
          <button
            onClick={onRefreshHealth}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              display: 'flex',
              padding: 0,
              marginLeft: '2px'
            }}
            title="Refresh status"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {/* User Auth Status Pill */}
        {currentUser ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-outline)',
              borderRadius: '9999px',
              padding: '0.25rem 0.5rem 0.25rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              boxShadow: '0 2px 0 var(--border-outline)'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={15} color="var(--color-primary)" />
              <span>{currentUser.full_name}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  background: currentUser.role === 'owner' ? 'var(--color-secondary)' : '#e0e7ff',
                  color: 'var(--border-outline)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  border: '1px solid var(--border-outline)'
                }}
              >
                {currentUser.role}
              </span>
            </span>

            <button
              onClick={onLogout}
              className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
              style={{ width: '26px', height: '26px', padding: 0 }}
              title="Sign Out"
            >
              <LogOut size={13} color="var(--color-error)" />
            </button>
          </div>
        ) : (
          <button
            className="btn-neo btn-neo-secondary btn-neo-sm"
            onClick={onOpenAuth}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          className="btn-neo btn-neo-surface btn-neo-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Avatar Badge - design.md Frame 1 */}
        <div
          onClick={onOpenAccount}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--color-secondary)',
            color: 'var(--border-outline)',
            border: '2px solid var(--border-outline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 0 var(--border-outline)'
          }}
          title="Account Profile"
        >
          {initials}
        </div>
      </div>
    </header>
  );
};
