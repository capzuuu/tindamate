import React from 'react';
import {
  Download,
  CreditCard,
  Award
} from 'lucide-react';
import type { DashboardStats, SaleResponse } from '../types';

interface ReportsAnalyticsProps {
  stats: DashboardStats | null;
  sales: SaleResponse[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  stats,
  sales,
  showToast
}) => {
  const handleExportCSV = () => {
    if (sales.length === 0) {
      showToast('No sales records to export', 'error');
      return;
    }

    const headers = ['Receipt #', 'Date', 'Customer', 'Payment Method', 'Total (PHP)', 'Voided'];
    const rows = sales.map((s) => [
      s.receipt_no,
      new Date(s.created_at).toISOString(),
      `"${s.customer_name || 'Walk-in'}"`,
      s.payment_method,
      s.total_amount,
      s.is_voided ? 'YES' : 'NO'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tindamate_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales report exported to CSV successfully!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Export Header */}
      <div
        className="neo-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.15rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Store Financial Reports & Analytics</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Real-time operating income, profit margins, and payment breakdown
          </p>
        </div>

        <button className="btn-neo btn-neo-primary" onClick={handleExportCSV}>
          <Download size={18} />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Financial Performance Tiles */}
      <div className="metric-grid">
        <div className="metric-tile">
          <span className="metric-tile-label">Today's Gross Sales</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-primary)' }}>
            ₱{(stats?.today_sales || 0).toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Total revenue collected
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Estimated Gross Profit</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-accent)' }}>
            ₱{(stats?.today_gross_profit || 0).toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Sales minus inventory cost (COGS)
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Store Operating Expenses</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-error)' }}>
            ₱{(stats?.today_expenses || 0).toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Utilities, bags, and freight
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Net Store Profit</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-accent)' }}>
            ₱{(stats?.today_net_profit || 0).toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Take-home store profit
          </span>
        </div>
      </div>

      {/* Payment Breakdown & Top Selling */}
      <div className="responsive-split-grid">
        {/* Payment Methods */}
        <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Payment Method Breakdown</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(!stats?.payment_breakdown || stats.payment_breakdown.length === 0) ? (
              <p style={{ color: 'var(--text-hint)', fontSize: '0.88rem' }}>No payments logged yet.</p>
            ) : (
              stats.payment_breakdown.map((pm, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-outline)',
                    background: 'var(--bg-app)'
                  }}
                >
                  <div>
                    <strong>{pm.method}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {pm.count} transaction{pm.count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-accent)' }}>
                    ₱{pm.total.toFixed(2)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Leaderboard */}
        <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: '1.1rem' }}>Best-Selling Store Items</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(!stats?.top_selling_products || stats.top_selling_products.length === 0) ? (
              <p style={{ color: 'var(--text-hint)', fontSize: '0.88rem' }}>No sales data available yet.</p>
            ) : (
              stats.top_selling_products.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-outline)',
                    background: 'var(--bg-app)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--color-secondary)' : 'var(--bg-secondary)',
                        color: 'var(--border-outline)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid var(--border-outline)'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <strong>{p.product_name}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--color-accent)' }}>
                      {p.total_quantity_sold} sold
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ₱{p.total_revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
