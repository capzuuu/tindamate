import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Users,
  Settings
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'utang'
  | 'expenses'
  | 'sales'
  | 'reports'
  | 'settings';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lowStockCount?: number;
  unpaidUtangCount?: number;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount = 0,
  unpaidUtangCount = 0
}) => {
  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Register', shortLabel: 'POS', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', shortLabel: 'Stock', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: '#EF4444' },
    { id: 'utang', label: 'Utang Tracker', shortLabel: 'Utang', icon: Users, badge: unpaidUtangCount > 0 ? unpaidUtangCount : undefined, badgeColor: '#FBBF24' },
    { id: 'settings', label: 'Settings & Reports', shortLabel: 'Settings', icon: Settings }
  ];

  const isTabActive = (tabId: ActiveTab) => {
    if (tabId === 'settings') {
      return activeTab === 'settings' || activeTab === 'expenses' || activeTab === 'sales' || activeTab === 'reports';
    }
    return activeTab === tabId;
  };

  return (
    <nav className="tinda-nav-bar">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = isTabActive(t.id);
        return (
          <button
            key={t.id}
            className={`tinda-nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(t.id as ActiveTab)}
            title={t.label}
          >
            <div className="tinda-nav-tab-icon-wrap">
              <Icon size={20} />
              {t.badge && (
                <span
                  className="tinda-nav-badge"
                  style={{ background: t.badgeColor }}
                >
                  {t.badge}
                </span>
              )}
            </div>
            <span className="tinda-nav-tab-label-desktop">{t.label}</span>
            <span className="tinda-nav-tab-label-mobile">{t.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
};
