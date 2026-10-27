import React from 'react';
import {
  TrendingUp,
  Receipt,
  Users,
  AlertTriangle,
  ShoppingBag,
  PlusCircle,
  Award,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import type { DashboardStats, SaleResponse } from '../types';
import type { ActiveTab } from './NavigationTabs';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentSales: SaleResponse[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddProduct: () => void;
  onOpenRecordExpense: () => void;
  onOpenRecordUtang: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentSales,
  onNavigate,
  onOpenAddProduct,
  onOpenRecordExpense,
  onOpenRecordUtang
}) => {
  const lowStock = stats?.low_stock_count || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metric Tiles - design.md @metric_tile */}
      <div className="metric-grid">
        <div className="metric-tile">
          <div className="metric-tile-header">
            <span className="metric-tile-label">Today's Sales</span>
            <span
              className="metric-tile-badge"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              <ArrowUpRight size={12} style={{ display: 'inline' }} /> +12%
            </span>
          </div>
          <span className="metric-tile-val">
            ₱{(stats?.today_sales || 0).toFixed(2)}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {stats?.today_transactions_count || 0} completed orders
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-tile-header">
            <span className="metric-tile-label">Net Operating Profit</span>
            <span
              className="metric-tile-badge"
              style={{ background: '#dbeafe', color: '#1e40af' }}
            >
              <ArrowUpRight size={12} style={{ display: 'inline' }} /> +5%
            </span>
          </div>
          <span className="metric-tile-val" style={{ color: 'var(--color-accent)' }}>
            ₱{(stats?.today_net_profit || 0).toFixed(2)}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Gross: ₱{(stats?.today_gross_profit || 0).toFixed(2)}
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-tile-header">
            <span className="metric-tile-label">Today's Store Expenses</span>
            <Receipt size={18} color="var(--color-error)" />
          </div>
          <span className="metric-tile-val" style={{ color: 'var(--color-error)' }}>
            ₱{(stats?.today_expenses || 0).toFixed(2)}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Electricity, supplies & freight
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-tile-header">
            <span className="metric-tile-label">Customer Utang Balance</span>
            <Users size={18} color="var(--color-secondary)" />
          </div>
          <span className="metric-tile-val" style={{ color: '#d97706' }}>
            ₱{(stats?.total_customer_utang || 0).toFixed(2)}
          </span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Total collectibles
          </div>
        </div>
      </div>

      {/* Warning Banner - design.md Warning Tile */}
      {lowStock > 0 && (
        <div className="alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--border-outline)',
                color: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem' }}>Low-Stock Alert</strong>
              <div style={{ fontSize: '0.88rem' }}>
                {lowStock} {lowStock === 1 ? 'product needs' : 'products need'} restocking
                soon to avoid stockouts.
              </div>
            </div>
          </div>

          <button
            className="btn-neo btn-neo-surface btn-neo-sm"
            onClick={() => onNavigate('inventory')}
          >
            <span>View Inventory</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Quick Action Tiles */}
      <div className="neo-card" style={{ padding: '1.15rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>
          Quick Store Actions
        </h3>
        <div className="quick-actions-grid">
          <div
            className="quick-action-tile"
            onClick={() => onNavigate('pos')}
            style={{ background: 'var(--color-primary-container)' }}
          >
            <ShoppingBag size={24} color="var(--color-primary)" />
            <span>Open POS</span>
          </div>

          <div className="quick-action-tile" onClick={onOpenAddProduct}>
            <PlusCircle size={24} color="var(--color-accent)" />
            <span>Add Product</span>
          </div>

          <div className="quick-action-tile" onClick={onOpenRecordUtang}>
            <Users size={24} color="#d97706" />
            <span>Record Utang</span>
          </div>

          <div className="quick-action-tile" onClick={onOpenRecordExpense}>
            <Receipt size={24} color="var(--color-error)" />
            <span>Record Expense</span>
          </div>

          <div
            className="quick-action-tile"
            onClick={() => onNavigate('reports')}
          >
            <TrendingUp size={24} color="var(--color-primary)" />
            <span>Reports</span>
          </div>
        </div>
      </div>

      {/* Dual Section: Best Sellers & Recent Transactions */}
      <div className="responsive-split-grid">
        {/* Best Sellers */}
        <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--color-secondary)" />
              <h3 style={{ fontSize: '1.1rem' }}>Best-Selling Products</h3>
            </div>
            <button
              className="btn-neo btn-neo-surface btn-neo-sm"
              onClick={() => onNavigate('reports')}
            >
              Details
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(!stats?.top_selling_products || stats.top_selling_products.length === 0) ? (
              <p style={{ color: 'var(--text-hint)', fontSize: '0.9rem', padding: '1rem 0' }}>
                No completed sales recorded yet today.
              </p>
            ) : (
              stats.top_selling_products.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-subtle)',
                    background: 'var(--bg-app)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--color-secondary)' : 'var(--bg-secondary)',
                        color: 'var(--border-outline)',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-outline)'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.product_name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                      {item.total_quantity_sold} sold
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ₱{item.total_revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Store Sales</h3>
            <button
              className="btn-neo btn-neo-surface btn-neo-sm"
              onClick={() => onNavigate('sales')}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentSales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-subtle)',
                  background: 'var(--bg-app)'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {sale.receipt_no}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {sale.customer_name || 'Walk-in'} ({sale.payment_method})
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-accent)' }}>
                  ₱{sale.total_amount.toFixed(2)}
                </div>
              </div>
            ))}

            {recentSales.length === 0 && (
              <p style={{ color: 'var(--text-hint)', fontSize: '0.9rem', padding: '1rem 0' }}>
                No sales transactions yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
