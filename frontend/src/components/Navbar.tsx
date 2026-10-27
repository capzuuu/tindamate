import { ShoppingBag, Boxes, BarChart3, Database, Store, RefreshCw } from 'lucide-react';
import type { HealthStatus } from '../types';

interface NavbarProps {
  activeTab: 'pos' | 'inventory' | 'analytics' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'analytics' | 'settings') => void;
  health: HealthStatus | null;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onRefreshHealth
}) => {
  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('pos')}>
        <div className="brand-icon">
          <Store size={24} />
        </div>
        <div>
          <div className="brand-title">
            Tinda<span>Mate</span>
          </div>
        </div>
        <span className="brand-tag">Sari-Sari POS</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <ShoppingBag size={18} />
          <span>POS Register</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Boxes size={18} />
          <span>Inventory & Stock</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          <span>Analytics & Sales</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Database size={18} />
          <span>DB Config</span>
        </button>
      </nav>

      <div className="nav-status">
        {health ? (
          health.engine === 'mysql' && health.connected ? (
            <div className="badge-status connected-mysql" title={`Connected to MySQL at ${health.url}`}>
              <span className="pulse-dot green" />
              <span>MySQL Connected</span>
            </div>
          ) : (
            <div className="badge-status fallback-sqlite" title={health.warning || "Using SQLite Fallback"}>
              <span className="pulse-dot amber" />
              <span>SQLite Fallback</span>
            </div>
          )
        ) : (
          <div className="badge-status offline" title="Backend API unreachable">
            <span className="pulse-dot red" />
            <span>Connecting...</span>
          </div>
        )}

        <button
          className="btn btn-secondary btn-icon"
          title="Refresh DB status"
          onClick={onRefreshHealth}
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  );
};
