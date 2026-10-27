import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import type { CustomerUtang, CustomerUtangCreate } from '../types';
import { createUtang, recordUtangPayment, deleteUtang } from '../api';

interface UtangTrackerProps {
  utangs: CustomerUtang[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const UtangTracker: React.FC<UtangTrackerProps> = ({
  utangs,
  onRefresh,
  showToast
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [paymentModalUtang, setPaymentModalUtang] = useState<CustomerUtang | null>(null);

  // Form states
  const [newUtang, setNewUtang] = useState<CustomerUtangCreate>({
    customer_name: '',
    contact_number: '',
    total_amount: 0,
    notes: ''
  });
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Summary Metrics
  const totalBalance = useMemo(() => {
    return utangs.reduce((sum, u) => sum + (u.status !== 'paid' ? u.balance : 0), 0);
  }, [utangs]);

  const totalCollected = useMemo(() => {
    return utangs.reduce((sum, u) => sum + u.paid_amount, 0);
  }, [utangs]);

  // Filtered List
  const filteredUtangs = useMemo(() => {
    return utangs.filter((u) => {
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchSearch = u.customer_name.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [utangs, statusFilter, search]);

  const handleCreateUtang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUtang.customer_name.trim() || newUtang.total_amount <= 0) {
      showToast('Please provide a valid customer name and amount', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createUtang(newUtang);
      showToast(`Utang record for '${newUtang.customer_name}' added!`, 'success');
      setIsAddOpen(false);
      setNewUtang({ customer_name: '', contact_number: '', total_amount: 0, notes: '' });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to add utang', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalUtang) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await recordUtangPayment(paymentModalUtang.id, {
        amount: amt,
        payment_method: paymentMethod,
        notes: 'Customer payment'
      });
      showToast(`Payment of ₱${amt.toFixed(2)} recorded for '${paymentModalUtang.customer_name}'!`, 'success');
      setPaymentModalUtang(null);
      setPaymentAmount('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u: CustomerUtang) => {
    if (!window.confirm(`Delete utang record for '${u.customer_name}'?`)) return;
    try {
      await deleteUtang(u.id);
      showToast('Utang record deleted', 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete utang', 'error');
    }
  };

  const handleShareReminder = (u: CustomerUtang) => {
    const text = `Magandang araw po ${u.customer_name}! Paalala lang po mula sa tindahan patungkol sa inyong natitirang utang balance na ₱${u.balance.toFixed(2)}. Maraming salamat po!`;
    navigator.clipboard.writeText(text);
    showToast('Reminder message copied to clipboard! (Ready to paste in SMS/Messenger)', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metrics Row */}
      <div className="metric-grid">
        <div className="metric-tile">
          <span className="metric-tile-label">Total Collectibles (Utang)</span>
          <span className="metric-tile-val" style={{ color: '#d97706' }}>
            ₱{totalBalance.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Outstanding customer balances
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Total Payments Collected</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-accent)' }}>
            ₱{totalCollected.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Paid so far
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Active Debtors</span>
          <span className="metric-tile-val">
            {utangs.filter((u) => u.status !== 'paid').length}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Customers with pending balance
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="neo-card utang-control-card">
        <div className="utang-control-bar">
          <div className="utang-search-box">
            <Search
              size={18}
              className="utang-search-icon"
            />
            <input
              type="text"
              className="input-neo utang-search-input"
              placeholder="Search customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="utang-search-clear"
                onClick={() => setSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="utang-filter-pills">
            {['all', 'unpaid', 'partial', 'paid'].map((st) => (
              <button
                key={st}
                className={`btn-neo btn-neo-sm ${statusFilter === st ? 'btn-neo-primary' : 'btn-neo-surface'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-neo btn-neo-secondary utang-add-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={18} />
          <span>Record New Utang</span>
        </button>
      </div>

      {/* Mobile Card List (Visible on Mobile <= 768px) */}
      <div className="utang-mobile-cards">
        {filteredUtangs.map((u) => {
          const isPaid = u.status === 'paid';
          return (
            <div key={u.id} className="neo-card utang-mobile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1.05rem' }}>{u.customer_name}</strong>
                  {u.contact_number && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      📞 {u.contact_number}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    border: '1.5px solid var(--border-outline)',
                    background: u.status === 'paid' ? '#dcfce7' : u.status === 'partial' ? '#fef3c7' : '#fee2e2',
                    color: u.status === 'paid' ? '#166534' : u.status === 'partial' ? '#92400e' : '#991b1b'
                  }}
                >
                  {u.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.65rem 0', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Total</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>₱{u.total_amount.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Paid</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}>₱{u.paid_amount.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Balance</div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isPaid ? 'var(--color-accent)' : '#d97706' }}>
                    ₱{u.balance.toFixed(2)}
                  </div>
                </div>
              </div>

              {u.notes && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  📝 {u.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                {!isPaid && (
                  <button
                    className="btn-neo btn-neo-accent btn-neo-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setPaymentModalUtang(u);
                      setPaymentAmount(u.balance.toString());
                    }}
                  >
                    <DollarSign size={14} />
                    <span>Pay</span>
                  </button>
                )}

                <button
                  className="btn-neo btn-neo-surface btn-neo-sm"
                  onClick={() => handleShareReminder(u)}
                  title="Copy SMS/Messenger Reminder"
                >
                  <Share2 size={14} />
                  <span>Remind</span>
                </button>

                <button
                  className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                  onClick={() => handleDelete(u)}
                  title="Delete record"
                >
                  <Trash2 size={14} color="var(--color-error)" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredUtangs.length === 0 && (
          <div className="neo-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-hint)' }}>
            <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p>No customer credit records found.</p>
          </div>
        )}
      </div>

      {/* Desktop Utang Table (Visible on Desktop > 768px) */}
      <div className="tinda-table-wrap utang-desktop-table">
        <table className="tinda-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Total Utang</th>
              <th>Paid</th>
              <th>Remaining Balance</th>
              <th>Status</th>
              <th>Notes / Due</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtangs.map((u) => {
              const isPaid = u.status === 'paid';
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1rem' }}>{u.customer_name}</strong>
                      {u.contact_number && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          📞 {u.contact_number}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>₱{u.total_amount.toFixed(2)}</td>
                  <td>₱{u.paid_amount.toFixed(2)}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: isPaid ? 'var(--color-accent)' : '#d97706'
                      }}
                    >
                      ₱{u.balance.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: '1px solid var(--border-outline)',
                        background:
                          u.status === 'paid'
                            ? '#dcfce7'
                            : u.status === 'partial'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          u.status === 'paid'
                            ? '#166534'
                            : u.status === 'partial'
                            ? '#92400e'
                            : '#991b1b'
                      }}
                    >
                      {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {u.notes || '—'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      {!isPaid && (
                        <button
                          className="btn-neo btn-neo-accent btn-neo-sm"
                          onClick={() => {
                            setPaymentModalUtang(u);
                            setPaymentAmount(u.balance.toString());
                          }}
                          title="Record payment"
                        >
                          <DollarSign size={14} />
                          <span>Pay</span>
                        </button>
                      )}

                      {!isPaid && (
                        <button
                          className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                          onClick={() => handleShareReminder(u)}
                          title="Copy SMS reminder"
                        >
                          <Share2 size={14} />
                        </button>
                      )}

                      <button
                        className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                        onClick={() => handleDelete(u)}
                        title="Delete record"
                      >
                        <Trash2 size={14} color="var(--color-error)" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredUtangs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-hint)' }}>
                  <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>No customer credit records found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record New Utang Modal */}
      {isAddOpen && (
        <div className="modal-overlay-neo" onClick={() => setIsAddOpen(false)}>
          <div className="modal-box-neo" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Record Customer Credit (Utang)</h2>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUtang} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  className="input-neo"
                  placeholder="e.g. Aling Marites"
                  value={newUtang.customer_name}
                  onChange={(e) => setNewUtang({ ...newUtang, customer_name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Contact Number</label>
                <input
                  type="text"
                  className="input-neo"
                  placeholder="e.g. 0917-000-0000"
                  value={newUtang.contact_number || ''}
                  onChange={(e) => setNewUtang({ ...newUtang, contact_number: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Total Utang Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  className="input-neo"
                  placeholder="0.00"
                  value={newUtang.total_amount || ''}
                  onChange={(e) => setNewUtang({ ...newUtang, total_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Items / Notes</label>
                <input
                  type="text"
                  className="input-neo"
                  placeholder="e.g. 2 Pancit Canton, 1 Coke"
                  value={newUtang.notes || ''}
                  onChange={(e) => setNewUtang({ ...newUtang, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-neo btn-neo-surface" style={{ flex: 1 }} onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-neo btn-neo-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Record Utang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalUtang && (
        <div className="modal-overlay-neo" onClick={() => setPaymentModalUtang(null)}>
          <div className="modal-box-neo" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Accept Utang Payment</h2>
              <button onClick={() => setPaymentModalUtang(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-outline)' }}>
              <div>Customer: <strong>{paymentModalUtang.customer_name}</strong></div>
              <div>Current Balance: <strong style={{ color: '#d97706' }}>₱{paymentModalUtang.balance.toFixed(2)}</strong></div>
            </div>

            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Payment Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={paymentModalUtang.balance}
                  className="input-neo"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-neo btn-neo-surface btn-neo-sm"
                  style={{ marginTop: '0.4rem' }}
                  onClick={() => setPaymentAmount(paymentModalUtang.balance.toString())}
                >
                  Pay Full Balance (₱{paymentModalUtang.balance.toFixed(2)})
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Payment Method</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {['Cash', 'GCash', 'Maya'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`btn-neo btn-neo-sm ${paymentMethod === m ? 'btn-neo-primary' : 'btn-neo-surface'}`}
                      style={{ flex: 1 }}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-neo btn-neo-surface" style={{ flex: 1 }} onClick={() => setPaymentModalUtang(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-neo btn-neo-accent" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
