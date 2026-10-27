import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
  ScanBarcode
} from 'lucide-react';
import type { Product, ProductCreate } from '../types';
import { createProduct, updateProduct, deleteProduct, adjustProductStock } from '../api';
import { BarcodeScannerModal, playScanAudio } from './BarcodeScannerModal';
import { InlineBarcodeScanner } from './InlineBarcodeScanner';

interface InventoryManagerProps {
  products: Product[];
  categories: string[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const InventoryManager = ({
  products,
  categories,
  onRefresh,
  showToast,
  isAddModalOpen = false,
  onCloseAddModal
}: InventoryManagerProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const isModalVisible = isAddModalOpen || internalModalOpen;

  const initialForm: ProductCreate = {
    name: '',
    category: 'General',
    barcode: '',
    cost_price: 0,
    selling_price: 0,
    wholesale_price: 0,
    min_wholesale_qty: 12,
    stock_quantity: 0,
    unit: 'pcs',
    low_stock_threshold: 5,
    supplier: '',
    description: ''
  };
  const [formData, setFormData] = useState<ProductCreate>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Barcode Scanner States (Continuous Batch Intake & Autofill)
  const [isInlineCameraActive, setIsInlineCameraActive] = useState(true);
  const [isBatchScannerOpen, setIsBatchScannerOpen] = useState(false);
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [newProductDraft, setNewProductDraft] = useState<ProductCreate | null>(null);
  const [sessionScannedItems, setSessionScannedItems] = useState<{
    code: string;
    name: string;
    qty: number;
    isNew: boolean;
    time: string;
  }[]>([]);
  const [batchScanFeedback, setBatchScanFeedback] = useState<{
    code: string;
    name?: string;
    price?: number;
    success: boolean;
  } | null>(null);

  // Quick Restock Dialog for clicking item card
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState<number>(10);

  // Auto-scan barcode handler for Add/Edit Product modal
  const handleInlineBarcodeScan = (code: string) => {
    setFormData((prev) => ({ ...prev, barcode: code }));
    const existing = products.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === code.trim().toLowerCase()
    );
    if (existing) {
      showToast(`Notice: Barcode already used by '${existing.name}'`, 'error');
    } else {
      showToast(`Scanned barcode: ${code}`, 'success');
    }
  };

  // Continuous Barcode Scan Handler (Adds multiple items without closing camera)
  const handleContinuousBarcodeScan = async (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;

    // While user is entering new product details, keep waiting
    if (newProductDraft) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.trim().toLowerCase() === code.toLowerCase()) ||
        (p.barcode && p.barcode.replace(/^0+/, '') === code.replace(/^0+/, ''))
    );

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (matched) {
      // 1. Product exists: automatically add stock and keep camera open!
      playScanAudio('success');
      try {
        await adjustProductStock(matched.id, batchMultiplier);
        setBatchScanFeedback({
          code,
          name: `${matched.name} (+${batchMultiplier})`,
          price: matched.selling_price,
          success: true
        });
        setSessionScannedItems((prev) => [
          { code, name: matched.name, qty: batchMultiplier, isNew: false, time: timeStr },
          ...prev.slice(0, 24)
        ]);
        showToast(`Stock +${batchMultiplier} for '${matched.name}' (Total: ${matched.stock_quantity + batchMultiplier})`, 'success');
        onRefresh();
      } catch (err: any) {
        showToast(err.message || 'Failed to adjust stock', 'error');
      }
    } else {
      // 2. Product is NEW: open inline quick register form right inside the camera modal!
      playScanAudio('error');
      setNewProductDraft({
        name: '',
        category: selectedCategory !== 'All' ? selectedCategory : 'General',
        barcode: code,
        cost_price: 0,
        selling_price: 0,
        wholesale_price: 0,
        min_wholesale_qty: 12,
        stock_quantity: batchMultiplier,
        unit: 'pcs',
        low_stock_threshold: 5,
        supplier: '',
        description: ''
      });
      setBatchScanFeedback({
        code,
        name: `New item detected (${code})! Enter details below:`,
        success: false
      });
    }
  };

  const handleSaveNewDraftProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductDraft || !newProductDraft.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createProduct(newProductDraft);
      playScanAudio('success');
      showToast(`'${newProductDraft.name}' added to inventory!`, 'success');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSessionScannedItems((prev) => [
        { code: newProductDraft.barcode || '', name: newProductDraft.name, qty: newProductDraft.stock_quantity, isNew: true, time: timeStr },
        ...prev.slice(0, 24)
      ]);
      setBatchScanFeedback({
        code: newProductDraft.barcode || '',
        name: `${newProductDraft.name} (Added!)`,
        price: newProductDraft.selling_price,
        success: true
      });
      setNewProductDraft(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to add product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Valuation summary
  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock_quantity <= p.low_stock_threshold).length;
  }, [products]);

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stock_quantity <= p.low_stock_threshold;
      if (stockFilter === 'out') matchStock = p.stock_quantity <= 0;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCategory, search, stockFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setIsInlineCameraActive(true);
    setInternalModalOpen(true);
  };

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsInlineCameraActive(false);
    setFormData({
      name: p.name,
      category: p.category,
      barcode: p.barcode || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      wholesale_price: p.wholesale_price || 0,
      min_wholesale_qty: p.min_wholesale_qty || 12,
      stock_quantity: p.stock_quantity,
      unit: p.unit,
      low_stock_threshold: p.low_stock_threshold,
      supplier: p.supplier || '',
      description: p.description || ''
    });
    setInternalModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast(`'${formData.name}' updated!`, 'success');
      } else {
        await createProduct(formData);
        showToast(`'${formData.name}' added to inventory!`, 'success');
      }
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product '${p.name}' from inventory?`)) return;
    try {
      await deleteProduct(p.id);
      showToast(`'${p.name}' deleted`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleQuickStock = async (p: Product, delta: number) => {
    try {
      await adjustProductStock(p.id, delta);
      showToast(`Stock updated for '${p.name}' (${delta > 0 ? '+' : ''}${delta})`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metrics Row */}
      <div className="metric-grid">
        <div className="metric-tile">
          <span className="metric-tile-label">Total Shelved Valuation</span>
          <span className="metric-tile-val" style={{ color: 'var(--color-primary)' }}>
            ₱{totalValuation.toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Cost value of total stock
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Total Product Lines</span>
          <span className="metric-tile-val">{products.length}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Distinct items registered
          </span>
        </div>

        <div className="metric-tile">
          <span className="metric-tile-label">Low Stock Alerts</span>
          <span className="metric-tile-val" style={{ color: lowStockCount > 0 ? 'var(--color-error)' : 'var(--color-accent)' }}>
            {lowStockCount}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Need restocking soon
          </span>
        </div>
      </div>

      {/* Controls Bar - Mobile Optimized & Zero Overlap */}
      <div className="neo-card stock-control-card">
        {/* Top Search & Category Row */}
        <div className="stock-control-top-row">
          <div className="stock-search-wrap">
            <Search
              size={18}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }}
            />
            <input
              type="text"
              className="input-neo"
              style={{ paddingLeft: '2.5rem', width: '100%', boxSizing: 'border-box' }}
              placeholder="Search products, barcode, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="pos-search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            className="input-neo stock-cat-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Pills & Actions Row */}
        <div className="stock-filter-row">
          <div className="stock-filter-pills">
            <button
              type="button"
              className={`btn-neo btn-neo-sm ${stockFilter === 'all' ? 'btn-neo-primary' : 'btn-neo-surface'}`}
              onClick={() => setStockFilter('all')}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              className={`btn-neo btn-neo-sm ${stockFilter === 'low' ? 'btn-neo-secondary' : 'btn-neo-surface'}`}
              onClick={() => setStockFilter('low')}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              type="button"
              className={`btn-neo btn-neo-sm ${stockFilter === 'out' ? 'btn-neo-secondary' : 'btn-neo-surface'}`}
              onClick={() => setStockFilter('out')}
            >
              Out of Stock ({products.filter((p) => p.stock_quantity <= 0).length})
            </button>
          </div>

          <div className="stock-actions-group">
            <button
              type="button"
              className="btn-neo btn-neo-secondary stock-action-btn"
              onClick={() => {
                setBatchScanFeedback(null);
                setNewProductDraft(null);
                setSessionScannedItems([]);
                setIsBatchScannerOpen(true);
              }}
              title="Continuous camera scanner to add or restock multiple products"
            >
              <ScanBarcode size={17} />
              <span>Scan & Add Products</span>
            </button>

            <button
              type="button"
              className="btn-neo btn-neo-primary stock-action-btn"
              onClick={handleOpenAdd}
              title="Add a new product manually"
            >
              <Plus size={17} />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile via CSS) */}
      <div className="stock-desktop-table tinda-table-wrap">
        <table className="tinda-table">
          <thead>
            <tr>
              <th>Product / SKU</th>
              <th>Category</th>
              <th>Puhunan (Cost)</th>
              <th>Presyo (Retail)</th>
              <th>Pakyawan (Wholesale)</th>
              <th>Stock Qty</th>
              <th>Quick Restock</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const isLow = p.stock_quantity <= p.low_stock_threshold;
              const isOut = p.stock_quantity <= 0;
              const margin = p.selling_price - p.cost_price;

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                      {p.barcode && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          Barcode: {p.barcode}
                        </span>
                      )}
                    </div>
                  </td>
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
                      {p.category}
                    </span>
                  </td>
                  <td>₱{p.cost_price.toFixed(2)}</td>
                  <td>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-accent)' }}>
                      ₱{p.selling_price.toFixed(2)}
                    </strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      +₱{margin.toFixed(2)}
                    </div>
                  </td>
                  <td>
                    {p.wholesale_price ? (
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        ₱{p.wholesale_price.toFixed(2)} (min {p.min_wholesale_qty || 12})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-hint)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: isOut ? '#ef4444' : isLow ? '#d97706' : 'inherit' }}>
                        {p.stock_quantity} {p.unit}
                      </strong>
                      {isLow && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: isOut ? '#fee2e2' : '#fef3c7',
                            color: isOut ? '#991b1b' : '#92400e',
                            border: '1px solid var(--border-outline)'
                          }}
                        >
                          {isOut ? 'OUT' : 'LOW'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn-neo btn-neo-surface btn-neo-sm"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                        onClick={() => handleQuickStock(p, 1)}
                        title="Add 1 piece"
                      >
                        +1
                      </button>
                      <button
                        className="btn-neo btn-neo-surface btn-neo-sm"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                        onClick={() => handleQuickStock(p, 10)}
                        title="Add 10 pieces"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button
                        className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                        onClick={() => handleOpenEdit(p)}
                        title="Edit product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                        onClick={() => handleDelete(p)}
                        title="Delete product"
                      >
                        <Trash2 size={14} color="var(--color-error)" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-hint)' }}>
                  <Package size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>No inventory products found matching your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Shown on screens <= 768px via CSS) */}
      <div className="stock-mobile-cards">
        {filteredProducts.map((p) => {
          const isLow = p.stock_quantity <= p.low_stock_threshold;
          const isOut = p.stock_quantity <= 0;
          const margin = p.selling_price - p.cost_price;

          return (
            <div key={p.id} className="neo-card stock-mobile-card">
              <div className="stock-mobile-card-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{p.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: '1px solid var(--border-outline)',
                        background: 'var(--bg-secondary)'
                      }}
                    >
                      {p.category}
                    </span>
                    {p.barcode && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {p.barcode}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : 'var(--color-primary-container)',
                      color: isOut ? '#991b1b' : isLow ? '#92400e' : 'var(--color-primary)',
                      border: '1px solid var(--border-outline)'
                    }}
                  >
                    {isOut ? 'OUT OF STOCK' : isLow ? `LOW: ${p.stock_quantity} ${p.unit}` : `${p.stock_quantity} ${p.unit}`}
                  </span>
                </div>
              </div>

              <div className="stock-mobile-card-prices">
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Presyo (Retail)</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-accent)' }}>₱{p.selling_price.toFixed(2)}</strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-hint)', marginLeft: '0.35rem' }}>+₱{margin.toFixed(2)}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Puhunan (Cost)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>₱{p.cost_price.toFixed(2)}</span>
                </div>
                {p.wholesale_price ? (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Pakyawan</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>₱{p.wholesale_price.toFixed(2)} (≥{p.min_wholesale_qty || 12})</span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-hint)' }}>No Pakyawan</span>
                  </div>
                )}
              </div>

              <div className="stock-mobile-card-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Add Stock:</span>
                  <button
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.8rem' }}
                    onClick={() => handleQuickStock(p, 1)}
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.8rem' }}
                    onClick={() => handleQuickStock(p, 10)}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setQuickRestockProduct(p);
                      setQuickRestockQty(10);
                    }}
                    title="More restock options"
                  >
                    More...
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                    onClick={() => handleOpenEdit(p)}
                    title="Edit product"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                    onClick={() => handleDelete(p)}
                    title="Delete product"
                  >
                    <Trash2 size={15} color="var(--color-error)" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="neo-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-hint)' }}>
            <Package size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 700 }}>No inventory products found</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>Try clearing your search or category filter.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal - design.md Frame 4 */}
      {isModalVisible && (
        <div className="modal-overlay-neo" onClick={handleCloseModal}>
          <div className="modal-box-neo" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                  {editingProduct ? 'Edit Product' : 'Add New Sari-Sari Product'}
                </h2>
                {!editingProduct && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Camera opened automatically — point barcode at screen to fill SKU
                  </p>
                )}
              </div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Embedded Live Auto-Scanner (Opens automatically on Add Product) */}
            <InlineBarcodeScanner
              isActive={isModalVisible && isInlineCameraActive}
              onScan={handleInlineBarcodeScan}
              lastScannedCode={formData.barcode}
              matchedProductName={
                formData.barcode
                  ? products.find((p) => p.barcode?.toLowerCase() === formData.barcode?.toLowerCase())?.name
                  : undefined
              }
            />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Product Name *</label>
                <input
                  type="text"
                  required
                  className="input-neo"
                  placeholder="e.g. Lucky Me! Pancit Canton Kalamansi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-row-2col">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Category</label>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="Beverages, Noodles, etc."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Barcode / SKU</label>
                    <button
                      type="button"
                      className="btn-neo btn-neo-surface btn-neo-sm"
                      style={{ padding: '0.12rem 0.45rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => setIsInlineCameraActive(!isInlineCameraActive)}
                      title={isInlineCameraActive ? 'Hide camera scanner' : 'Open camera scanner'}
                    >
                      <ScanBarcode size={13} />
                      <span>{isInlineCameraActive ? 'Camera On' : 'Turn On Camera'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="Auto-scanned or enter barcode"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Puhunan (Cost Price ₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    className="input-neo"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Presyo (Retail Price ₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    className="input-neo"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Wholesale / Tingi Config */}
              <div className="form-row-2col">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pakyawan Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-neo"
                    placeholder="Optional wholesale"
                    value={formData.wholesale_price || ''}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: parseFloat(e.target.value) || undefined })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Min Wholesale Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="input-neo"
                    value={formData.min_wholesale_qty || 12}
                    onChange={(e) => setFormData({ ...formData, min_wholesale_qty: parseInt(e.target.value) || 12 })}
                  />
                </div>
              </div>

              <div className="form-row-3col">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-neo"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Unit</label>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="pcs, pack, can"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Low Threshold</label>
                  <input
                    type="number"
                    min="0"
                    className="input-neo"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-form-actions">
                <button type="button" className="btn-neo btn-neo-surface" style={{ flex: 1 }} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-neo btn-neo-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Action Modal (When tapping "More..." on product card) */}
      {quickRestockProduct && (
        <div className="modal-overlay-neo" onClick={() => setQuickRestockProduct(null)}>
          <div className="modal-box-neo" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-primary-container)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--border-outline)'
                  }}
                >
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Restock Product</h3>
                  {quickRestockProduct.barcode && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Barcode: {quickRestockProduct.barcode}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                onClick={() => setQuickRestockProduct(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-outline)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{quickRestockProduct.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Category: <strong>{quickRestockProduct.category}</strong></span>
                <span>
                  Current Stock:{' '}
                  <strong
                    style={{
                      color:
                        quickRestockProduct.stock_quantity <= quickRestockProduct.low_stock_threshold
                          ? 'var(--color-error)'
                          : 'var(--color-accent)'
                    }}
                  >
                    {quickRestockProduct.stock_quantity} {quickRestockProduct.unit}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Quick Add Pack/Cases:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[1, 5, 10, 12, 24, 50].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ fontWeight: 800, padding: '0.55rem' }}
                    onClick={async () => {
                      await handleQuickStock(quickRestockProduct, qty);
                      playScanAudio('success');
                      setQuickRestockProduct(null);
                    }}
                  >
                    +{qty} {quickRestockProduct.unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (quickRestockQty <= 0) return;
                await handleQuickStock(quickRestockProduct, quickRestockQty);
                playScanAudio('success');
                setQuickRestockProduct(null);
              }}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <input
                type="number"
                min="1"
                className="input-neo"
                value={quickRestockQty}
                onChange={(e) => setQuickRestockQty(parseInt(e.target.value) || 0)}
                placeholder="Custom qty"
                style={{ flex: 1, padding: '0.55rem 0.75rem' }}
              />
              <button type="submit" className="btn-neo btn-neo-primary" style={{ padding: '0.55rem 1rem', whiteSpace: 'nowrap' }}>
                Add Stock
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1.5px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-neo btn-neo-surface"
                style={{ flex: 1 }}
                onClick={() => setQuickRestockProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Continuous Batch Intake Scanner (Scans multiple products with camera continuously open) */}
      <BarcodeScannerModal
        isOpen={isBatchScannerOpen}
        title="Continuous Product Scanner"
        subtitle="Keep camera open to scan & add multiple products"
        mode="continuous"
        onScan={handleContinuousBarcodeScan}
        onClose={() => {
          setIsBatchScannerOpen(false);
          setNewProductDraft(null);
          setBatchScanFeedback(null);
        }}
        lastScannedResult={batchScanFeedback}
      >
        {/* Multiplier / Step bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '0.65rem 0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border-outline)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
              Quantity per scan: <span style={{ color: 'var(--color-primary)' }}>+{batchMultiplier}</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Session scanned: <strong>{sessionScannedItems.length}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {[1, 5, 10, 12, 24].map((qty) => (
              <button
                key={qty}
                type="button"
                className={`btn-neo btn-neo-sm ${batchMultiplier === qty ? 'btn-neo-primary' : 'btn-neo-surface'}`}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.78rem', flex: 1, whiteSpace: 'nowrap' }}
                onClick={() => setBatchMultiplier(qty)}
              >
                +{qty} {qty === 12 ? '(Dozen)' : qty === 24 ? '(Case)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Inline Quick Product Registration if unrecognized barcode detected */}
        {newProductDraft && (
          <form
            onSubmit={handleSaveNewDraftProduct}
            className="neo-card"
            style={{
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              background: '#fef3c7',
              borderColor: '#d97706',
              boxShadow: '0 4px 0 #d97706'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} color="#92400e" />
                <strong style={{ fontSize: '0.9rem', color: '#92400e' }}>
                  Register New Product
                </strong>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  background: '#ffffff',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  border: '1px solid #d97706'
                }}
              >
                {newProductDraft.barcode}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'block', marginBottom: '0.2rem' }}>
                Product Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                className="input-neo"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', background: '#ffffff' }}
                placeholder="e.g. San Miguel Pale Pilsen 330ml"
                value={newProductDraft.name}
                onChange={(e) => setNewProductDraft({ ...newProductDraft, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'block', marginBottom: '0.2rem' }}>
                  Presyo (Retail ₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  className="input-neo"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', background: '#ffffff' }}
                  value={newProductDraft.selling_price || ''}
                  onChange={(e) =>
                    setNewProductDraft({ ...newProductDraft, selling_price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'block', marginBottom: '0.2rem' }}>
                  Puhunan (Cost ₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  className="input-neo"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', background: '#ffffff' }}
                  value={newProductDraft.cost_price || ''}
                  onChange={(e) =>
                    setNewProductDraft({ ...newProductDraft, cost_price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'block', marginBottom: '0.2rem' }}>
                  Category
                </label>
                <input
                  type="text"
                  className="input-neo"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', background: '#ffffff' }}
                  value={newProductDraft.category}
                  onChange={(e) => setNewProductDraft({ ...newProductDraft, category: e.target.value })}
                  placeholder="Beverages, Snacks..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'block', marginBottom: '0.2rem' }}>
                  Initial Stock Qty
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-neo"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', background: '#ffffff' }}
                  value={newProductDraft.stock_quantity}
                  onChange={(e) =>
                    setNewProductDraft({ ...newProductDraft, stock_quantity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn-neo btn-neo-surface btn-neo-sm"
                style={{ flex: 1, padding: '0.45rem' }}
                onClick={() => {
                  setNewProductDraft(null);
                  setBatchScanFeedback(null);
                }}
              >
                Skip Item
              </button>
              <button
                type="submit"
                className="btn-neo btn-neo-primary btn-neo-sm"
                style={{ flex: 1, padding: '0.45rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save & Scan Next'}
              </button>
            </div>
          </form>
        )}

        {/* Live Session Log of Scanned Items */}
        {sessionScannedItems.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              maxHeight: '140px',
              overflowY: 'auto',
              border: '1.5px solid var(--border-outline)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.65rem',
              background: 'var(--bg-surface)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              Items Scanned This Session ({sessionScannedItems.length}):
            </div>
            {sessionScannedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  padding: '0.2rem 0',
                  borderBottom: idx < sessionScannedItems.length - 1 ? '1px dashed var(--border-subtle)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.08rem 0.35rem',
                      borderRadius: '4px',
                      background: item.isNew ? '#fef3c7' : 'var(--color-primary-container)',
                      color: item.isNew ? '#92400e' : 'var(--color-primary)'
                    }}
                  >
                    {item.isNew ? 'NEW' : `+${item.qty}`}
                  </span>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-hint)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </BarcodeScannerModal>
    </div>
  );
};
