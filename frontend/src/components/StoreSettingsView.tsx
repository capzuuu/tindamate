import React, { useState, useEffect } from 'react';
import {
  Store,
  Database,
  RefreshCw,
  Save,
  CheckCircle,
  AlertTriangle,
  History,
  BarChart3,
  Receipt
} from 'lucide-react';
import type {
  StoreSetting,
  HealthStatus,
  SaleResponse,
  Expense,
  DashboardStats
} from '../types';
import { updateStoreSettings } from '../api';
import { SalesHistory } from './SalesHistory';
import { ReportsAnalytics } from './ReportsAnalytics';
import { ExpenseLog } from './ExpenseLog';

export type SettingsSubTab = 'profile' | 'sales' | 'reports' | 'expenses';

interface StoreSettingsViewProps {
  setting: StoreSetting | null;
  health: HealthStatus | null;
  sales: SaleResponse[];
  expenses: Expense[];
  stats: DashboardStats | null;
  activeSubTab?: SettingsSubTab;
  onChangeSubTab?: (tab: SettingsSubTab) => void;
  onRefreshHealth: () => void;
  onRefreshSetting: () => void;
  onRefreshSales: () => void;
  onRefreshExpenses: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  setting,
  health,
  sales,
  expenses,
  stats,
  activeSubTab = 'profile',
  onChangeSubTab,
  onRefreshHealth,
  onRefreshSetting,
  onRefreshSales,
  onRefreshExpenses,
  showToast
}) => {
  const [subTab, setSubTab] = useState<SettingsSubTab>(activeSubTab);
  const [formData, setFormData] = useState<Partial<StoreSetting>>({
    store_name: '',
    owner_name: '',
    contact_number: '',
    address: '',
    receipt_footer: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (setting) {
      setFormData({
        store_name: setting.store_name,
        owner_name: setting.owner_name,
        contact_number: setting.contact_number || '',
        address: setting.address || '',
        receipt_footer: setting.receipt_footer || ''
      });
    }
  }, [setting]);

  const handleSelectSubTab = (tab: SettingsSubTab) => {
    setSubTab(tab);
    onChangeSubTab?.(tab);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStoreSettings(formData);
      showToast('Store profile settings updated!', 'success');
      onRefreshSetting();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isMysql = health?.engine === 'mysql' && health?.connected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Sub-Navigation Tabs */}
      <div className="settings-sub-tabs">
        <button
          type="button"
          className={`settings-sub-tab-btn ${subTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleSelectSubTab('profile')}
        >
          <Store size={18} />
          <span>Store Profile</span>
        </button>

        <button
          type="button"
          className={`settings-sub-tab-btn ${subTab === 'sales' ? 'active' : ''}`}
          onClick={() => handleSelectSubTab('sales')}
        >
          <History size={18} />
          <span>Sales History</span>
        </button>

        <button
          type="button"
          className={`settings-sub-tab-btn ${subTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleSelectSubTab('reports')}
        >
          <BarChart3 size={18} />
          <span>Reports & Analytics</span>
        </button>

        <button
          type="button"
          className={`settings-sub-tab-btn ${subTab === 'expenses' ? 'active' : ''}`}
          onClick={() => handleSelectSubTab('expenses')}
        >
          <Receipt size={18} />
          <span>Expenses Log</span>
        </button>
      </div>

      {/* Render Selected View */}
      {subTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
          {/* Store Profile Card */}
          <div className="neo-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <Store size={22} color="var(--color-primary)" />
              <h2>Store Profile & Receipt Branding</h2>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row-2col">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Store Name *</label>
                  <input
                    type="text"
                    required
                    className="input-neo"
                    value={formData.store_name || ''}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Owner Name *</label>
                  <input
                    type="text"
                    required
                    className="input-neo"
                    value={formData.owner_name || ''}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Contact Number</label>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="e.g. 0917-123-4567"
                    value={formData.contact_number || ''}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Store Address / Location</label>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="Barangay, City"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Receipt Footer Message</label>
                <input
                  type="text"
                  className="input-neo"
                  placeholder="e.g. Salamat po sa pagtangkilik! Balik po kayo!"
                  value={formData.receipt_footer || ''}
                  onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-neo btn-neo-primary"
                style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}
                disabled={isSaving}
              >
                <Save size={18} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Store Profile'}</span>
              </button>
            </form>
          </div>

          {/* Database Diagnostic Card */}
          <div className="neo-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Database size={22} color="var(--color-primary)" />
                <h2>MySQL Database Diagnostics</h2>
              </div>

              <button
                className="btn-neo btn-neo-surface btn-neo-sm"
                onClick={onRefreshHealth}
              >
                <RefreshCw size={14} />
                <span>Test Ping</span>
              </button>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border-outline)',
                background: isMysql ? '#dcfce7' : '#fef3c7',
                color: isMysql ? '#166534' : '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              {isMysql ? (
                <>
                  <CheckCircle size={22} />
                  <div>
                    <strong>Connected to Live MySQL Database (localhost:3306)</strong>
                    <div style={{ fontSize: '0.82rem' }}>Target Database: tindamate_db • Driver: PyMySQL</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle size={22} />
                  <div>
                    <strong>Running with SQLite Development Fallback</strong>
                    <div style={{ fontSize: '0.82rem' }}>
                      MySQL service on port 3306 is not detected. Using local SQLite zero-friction mode.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'sales' && (
        <SalesHistory
          sales={sales}
          onRefresh={onRefreshSales}
          showToast={showToast}
        />
      )}

      {subTab === 'reports' && (
        <ReportsAnalytics
          stats={stats}
          sales={sales}
          showToast={showToast}
        />
      )}

      {subTab === 'expenses' && (
        <ExpenseLog
          expenses={expenses}
          onRefresh={onRefreshExpenses}
          showToast={showToast}
        />
      )}
    </div>
  );
};
