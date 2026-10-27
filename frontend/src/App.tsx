import { useState, useEffect, useCallback } from 'react';
import { HeaderBanner } from './components/HeaderBanner';
import { NavigationTabs, type ActiveTab } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { PosRegister } from './components/PosRegister';
import { InventoryManager } from './components/InventoryManager';
import { UtangTracker } from './components/UtangTracker';
import { StoreSettingsView, type SettingsSubTab } from './components/StoreSettingsView';
import { AccountModal } from './components/AccountModal';
import { AuthModal } from './components/AuthModal';
import type {
  Product,
  SaleResponse,
  CustomerUtang,
  Expense,
  StoreSetting,
  DashboardStats,
  HealthStatus,
  User
} from './types';
import {
  checkHealth,
  fetchProducts,
  fetchCategories,
  fetchSales,
  fetchUtangs,
  fetchExpenses,
  fetchStoreSettings,
  fetchDashboardStats,
  getAuthToken,
  getAuthMe,
  getAuthStatus,
  logoutUser
} from './api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('profile');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modals & Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [utangs, setUtangs] = useState<CustomerUtang[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [storeSetting, setStoreSetting] = useState<StoreSetting | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [prods, cats, salesData, utangsData, expData, settingData, statsData] =
        await Promise.allSettled([
          fetchProducts(),
          fetchCategories(),
          fetchSales(),
          fetchUtangs(),
          fetchExpenses(),
          fetchStoreSettings(),
          fetchDashboardStats()
        ]);

      if (prods.status === 'fulfilled') setProducts(prods.value);
      if (cats.status === 'fulfilled') setCategories(cats.value);
      if (salesData.status === 'fulfilled') setSales(salesData.value);
      if (utangsData.status === 'fulfilled') setUtangs(utangsData.value);
      if (expData.status === 'fulfilled') setExpenses(expData.value);
      if (settingData.status === 'fulfilled') setStoreSetting(settingData.value);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
    } catch (err) {
      console.error('Error fetching TindaMate data:', err);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    loadAllData();

    // Check existing JWT authentication session
    const token = getAuthToken();
    if (token) {
      getAuthMe()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          setCurrentUser(null);
        });
    } else {
      getAuthStatus()
        .then((st) => {
          if (!st.has_users) {
            setIsAuthOpen(true);
          }
        })
        .catch(() => {});
    }

    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, [loadHealth, loadAllData]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast('Signed out of store account');
  };

  const unpaidUtangsCount = utangs.filter((u) => u.status !== 'paid').length;

  return (
    <div className="tinda-container">
      {/* Header Banner */}
      <HeaderBanner
        storeSetting={storeSetting}
        health={health}
        theme={theme}
        currentUser={currentUser}
        onToggleTheme={toggleTheme}
        onRefreshHealth={loadHealth}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Tab Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'settings') {
            setSettingsSubTab('profile');
          }
        }}
        lowStockCount={stats?.low_stock_count}
        unpaidUtangCount={unpaidUtangsCount}
      />

      {/* Main Content Sections */}
      <main style={{ minHeight: 'calc(100vh - 240px)' }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            recentSales={sales}
            onNavigate={(tab) => {
              if (tab === 'sales' || tab === 'reports' || tab === 'expenses') {
                setActiveTab('settings');
                setSettingsSubTab(tab as SettingsSubTab);
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenAddProduct={() => {
              setActiveTab('inventory');
              setIsAddProductOpen(true);
            }}
            onOpenRecordExpense={() => {
              setActiveTab('settings');
              setSettingsSubTab('expenses');
            }}
            onOpenRecordUtang={() => setActiveTab('utang')}
          />
        )}

        {activeTab === 'pos' && (
          <PosRegister
            products={products}
            categories={categories}
            onSaleCompleted={loadAllData}
            showToast={showToast}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            categories={categories}
            onRefresh={loadAllData}
            showToast={showToast}
            isAddModalOpen={isAddProductOpen}
            onCloseAddModal={() => setIsAddProductOpen(false)}
          />
        )}

        {activeTab === 'utang' && (
          <UtangTracker
            utangs={utangs}
            onRefresh={loadAllData}
            showToast={showToast}
          />
        )}

        {(activeTab === 'settings' || activeTab === 'sales' || activeTab === 'reports' || activeTab === 'expenses') && (
          <StoreSettingsView
            setting={storeSetting}
            health={health}
            sales={sales}
            expenses={expenses}
            stats={stats}
            activeSubTab={settingsSubTab}
            onChangeSubTab={setSettingsSubTab}
            onRefreshHealth={loadHealth}
            onRefreshSetting={loadAllData}
            onRefreshSales={loadAllData}
            onRefreshExpenses={loadAllData}
            showToast={showToast}
          />
        )}
      </main>

      {/* Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          loadAllData();
        }}
        showToast={showToast}
      />

      {/* Account Owner Modal */}
      {isAccountOpen && (
        <AccountModal
          setting={storeSetting}
          onClose={() => setIsAccountOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Toast Notification Container */}
      <div className="tinda-toast-box">
        {toasts.map((t) => (
          <div key={t.id} className={`tinda-toast ${t.type}`}>
            {t.type === 'success' ? (
              <CheckCircle2 size={18} color="var(--color-accent)" />
            ) : (
              <AlertCircle size={18} color="var(--color-error)" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
