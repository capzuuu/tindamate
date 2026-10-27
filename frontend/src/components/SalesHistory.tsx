import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Eye,
  Printer,
  Ban,
  Receipt
} from 'lucide-react';
import type { SaleResponse } from '../types';
import { voidSale } from '../api';

interface SalesHistoryProps {
  sales: SaleResponse[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  onRefresh,
  showToast
}) => {
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleResponse | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase();
      return (
        s.receipt_no.toLowerCase().includes(q) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        s.payment_method.toLowerCase().includes(q)
      );
    });
  }, [sales, search]);

  const handleVoid = async (sale: SaleResponse) => {
    if (!window.confirm(`Are you sure you want to VOID Sale #${sale.receipt_no}? This will restore all items back into inventory stock.`)) {
      return;
    }
    setIsVoiding(true);
    try {
      await voidSale(sale.id);
      showToast(`Sale #${sale.receipt_no} has been VOIDED and inventory restored.`, 'success');
      setSelectedReceipt(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to void sale', 'error');
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search Header */}
      <div className="neo-card" style={{ padding: '1.15rem' }}>
        <div style={{ position: 'relative', maxWidth: '450px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }}
          />
          <input
            type="text"
            className="input-neo"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by receipt number, customer, or payment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sales History Table */}
      <div className="tinda-table-wrap">
        <table className="tinda-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Items</th>
              <th>Total Amount (₱)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s) => (
              <tr key={s.id} style={{ opacity: s.is_voided ? 0.6 : 1 }}>
                <td>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{s.receipt_no}</strong>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(s.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td>{s.customer_name || 'Walk-in'}</td>
                <td>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid var(--border-outline)',
                      background: 'var(--bg-secondary)'
                    }}
                  >
                    {s.payment_method}
                  </span>
                </td>
                <td>{s.items.reduce((sum, it) => sum + it.quantity, 0)} pcs</td>
                <td>
                  <strong style={{ fontSize: '1.05rem', color: s.is_voided ? 'var(--text-hint)' : 'var(--color-accent)' }}>
                    ₱{s.total_amount.toFixed(2)}
                  </strong>
                </td>
                <td>
                  {s.is_voided ? (
                    <span style={{ color: 'var(--color-error)', fontWeight: 800, fontSize: '0.78rem' }}>
                      VOIDED
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '0.78rem' }}>
                      PAID
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    onClick={() => setSelectedReceipt(s)}
                  >
                    <Eye size={14} />
                    <span>Receipt</span>
                  </button>
                </td>
              </tr>
            ))}

            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-hint)' }}>
                  <History size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>No sales history transactions found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Details Modal */}
      {selectedReceipt && (
        <div className="modal-overlay-neo" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-box-neo" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--border-outline)', paddingBottom: '1rem' }}>
              <Receipt size={36} color="var(--color-primary)" style={{ margin: '0 auto 0.4rem' }} />
              <h2>TindaMate Official Receipt</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>
                {selectedReceipt.receipt_no}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(selectedReceipt.created_at).toLocaleString()}
              </div>
              {selectedReceipt.is_voided && (
                <div style={{ marginTop: '0.4rem', color: 'var(--color-error)', fontWeight: 800 }}>
                  *** THIS SALE IS VOIDED ***
                </div>
              )}
            </div>

            {selectedReceipt.customer_name && (
              <div>
                Customer: <strong>{selectedReceipt.customer_name}</strong>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {selectedReceipt.items.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{it.quantity}x {it.product_name}</span>
                  <span style={{ fontWeight: 700 }}>₱{it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed var(--border-outline)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--color-accent)' }}>₱{selectedReceipt.total_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <span>Method / Tendered:</span>
                <span>{selectedReceipt.payment_method} (₱{selectedReceipt.cash_tendered.toFixed(2)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#d97706', fontWeight: 700 }}>
                <span>Sukli (Change):</span>
                <span>₱{selectedReceipt.change_amount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn-neo btn-neo-surface"
                style={{ flex: 1 }}
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Print</span>
              </button>

              {!selectedReceipt.is_voided && (
                <button
                  className="btn-neo btn-neo-danger"
                  style={{ flex: 1 }}
                  onClick={() => handleVoid(selectedReceipt)}
                  disabled={isVoiding}
                >
                  <Ban size={16} />
                  <span>Void Sale</span>
                </button>
              )}

              <button
                className="btn-neo btn-neo-primary"
                style={{ flex: 1 }}
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
