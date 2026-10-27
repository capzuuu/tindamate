import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type { StoreSetting } from '../types';

interface AccountModalProps {
  setting: StoreSetting | null;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  setting,
  onClose,
  showToast
}) => {
  const ownerName = setting?.owner_name || 'Aling Nena';
  const storeName = setting?.store_name || "Aling Nena's Store";

  return (
    <div className="modal-overlay-neo" onClick={onClose}>
      <div className="modal-box-neo" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Owner Account Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem', padding: '1rem 0' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--color-secondary)',
              color: 'var(--border-outline)',
              border: '3px solid var(--border-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {ownerName.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <h3 style={{ fontSize: '1.35rem' }}>{ownerName}</h3>
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                background: '#dcfce7',
                color: '#166534',
                border: '1.5px solid var(--border-outline)',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginTop: '0.25rem'
              }}
            >
              STORE OWNER & ADMIN
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-app)',
            border: '2px solid var(--border-outline)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.88rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Store Name:</span>
            <strong>{storeName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Role:</span>
            <strong>Sole Proprietor</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Data Security:</span>
            <strong style={{ color: 'var(--color-accent)' }}>Private Store Data</strong>
          </div>
        </div>

        <button
          className="btn-neo btn-neo-surface"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={() => {
            showToast('Account is currently locked in local single-store owner mode.', 'success');
            onClose();
          }}
        >
          <ShieldCheck size={18} />
          <span>Account Settings Secured</span>
        </button>
      </div>
    </div>
  );
};
