import { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Layers, Award, Receipt, Eye } from 'lucide-react';
import type { DashboardStats, SaleResponse } from '../types';

interface AnalyticsDashboardProps {
  stats: DashboardStats | null;
  sales: SaleResponse[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ stats, sales }) => {
  const [selectedReceipt, setSelectedReceipt] = useState<SaleResponse | null>(null);

  if (!stats) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div
            className="metric-icon-box"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
          >
            <DollarSign size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-title">Today's Gross Sales</span>
            <span className="metric-val">₱{stats.today_sales.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div
            className="metric-icon-box"
            style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}
          >
            <TrendingUp size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-title">Today's Net Profit</span>
            <span className="metric-val" style={{ color: '#34d399' }}>
              ₱{stats.today_net_profit.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div
            className="metric-icon-box"
            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}
          >
            <ShoppingBag size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-title">Today's Customers</span>
            <span className="metric-val">{stats.today_transactions_count}</span>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div
            className="metric-icon-box"
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}
          >
            <Layers size={26} />
          </div>
          <div className="metric-data">
            <span className="metric-title">Stock Asset Value</span>
            <span className="metric-val">₱{stats.total_inventory_value.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Grid: Top Sellers & Sales History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Top Sellers Leaderboard */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={22} color="#fbbf24" />
            <h3 style={{ fontSize: '1.1rem' }}>Best Sellers</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.top_selling_products.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
                    background: 'rgba(10, 15, 26, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                        color: idx === 0 ? '#000' : '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {item.product_name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#34d399' }}>
                      {item.total_quantity_sold} sold
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      ₱{item.total_revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={22} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem' }}>Recent Transactions</h3>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 8).map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                        {sale.receipt_no}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{sale.customer_name || 'Walk-in'}</td>
                    <td>
                      <span className="pill-btn" style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>
                        ₱{sale.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => setSelectedReceipt(sale)}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '1rem' }}>
              <Receipt size={36} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <h2>Receipt Details</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {selectedReceipt.receipt_no}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(selectedReceipt.created_at).toLocaleString()}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {selectedReceipt.items.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{it.quantity}x {it.product_name}</span>
                  <span>₱{it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total Amount:</span>
                <span style={{ color: '#34d399' }}>₱{selectedReceipt.total_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>Method / Tendered:</span>
                <span>{selectedReceipt.payment_method} (₱{selectedReceipt.cash_tendered.toFixed(2)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', fontSize: '0.85rem' }}>
                <span>Change (Sukli):</span>
                <span>₱{selectedReceipt.change_amount.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedReceipt(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
