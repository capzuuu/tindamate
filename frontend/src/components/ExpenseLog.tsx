import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import type { Expense, ExpenseCreate } from '../types';
import { createExpense, deleteExpense } from '../api';

interface ExpenseLogProps {
  expenses: Expense[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ExpenseLog: React.FC<ExpenseLogProps> = ({
  expenses,
  onRefresh,
  showToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExp, setNewExp] = useState<ExpenseCreate>({
    title: '',
    category: 'Utilities',
    amount: 0,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Utilities', 'Rent', 'Supplies', 'Transportation', 'Restock', 'Other'];

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title.trim() || newExp.amount <= 0) {
      showToast('Please enter a valid title and expense amount', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createExpense(newExp);
      showToast(`Expense '${newExp.title}' recorded!`, 'success');
      setIsAddOpen(false);
      setNewExp({ title: '', category: 'Utilities', amount: 0, notes: '' });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete expense '${title}'?`)) return;
    try {
      await deleteExpense(id);
      showToast('Expense removed', 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metrics Row */}
      <div className="metric-grid">
        <div className="metric-tile">
          <span className="metric-tile-label">Total Store Expenses</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-error)' }}>
            ₱{totalExpenses.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Operating costs recorded
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Recorded Receipts</span>
          <span className="metric-tile-val">{expenses.length}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Transactions logged
          </span>
        </div>

        <div className="metric-tile" style={{ justifyContent: 'center' }}>
          <button
            className="btn-neo btn-neo-danger"
            style={{ width: '100%', padding: '0.85rem' }}
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={18} />
            <span>Record Store Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="tinda-table-wrap">
        <table className="tinda-table">
          <thead>
            <tr>
              <th>Expense Description</th>
              <th>Category</th>
              <th>Date</th>
              <th>Amount (₱)</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.title}</strong>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1.5px solid var(--border-outline)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {e.category}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(e.expense_date).toLocaleDateString()}
                </td>
                <td>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-error)' }}>
                    ₱{e.amount.toFixed(2)}
                  </strong>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {e.notes || '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                    onClick={() => handleDelete(e.id, e.title)}
                    title="Delete expense"
                  >
                    <Trash2 size={14} color="var(--color-error)" />
                  </button>
                </td>
              </tr>
            ))}

            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-hint)' }}>
                  <Receipt size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>No store expenses recorded yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {isAddOpen && (
        <div className="modal-overlay-neo" onClick={() => setIsAddOpen(false)}>
          <div className="modal-box-neo" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Record Store Expense</h2>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Expense Title *</label>
                <input
                  type="text"
                  required
                  className="input-neo"
                  placeholder="e.g. Meralco electricity, Plastic bags"
                  value={newExp.title}
                  onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Category</label>
                <select
                  className="input-neo"
                  value={newExp.category}
                  onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Amount (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.5"
                  className="input-neo"
                  placeholder="0.00"
                  value={newExp.amount || ''}
                  onChange={(e) => setNewExp({ ...newExp, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Notes / Receipt Reference</label>
                <input
                  type="text"
                  className="input-neo"
                  placeholder="Optional details or official receipt #"
                  value={newExp.notes || ''}
                  onChange={(e) => setNewExp({ ...newExp, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-neo btn-neo-surface" style={{ flex: 1 }} onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-neo btn-neo-danger" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
