import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Receipt,
  AlertCircle,
  ShoppingBag,
  Coffee,
  Utensils,
  Package,
  Cookie,
  Layers,
  Droplets,
  Shield,
  Check,
  ArrowLeft,
  X,
  ScanBarcode
} from 'lucide-react';
import type { Product, CartItem, SaleResponse } from '../types';
import { processSale } from '../api';
import { BarcodeScannerModal, playScanAudio } from './BarcodeScannerModal';

interface PosRegisterProps {
  products: Product[];
  categories: string[];
  onSaleCompleted: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('noodle')) return <Utensils size={13} />;
  if (cat.includes('beverage') || cat.includes('drink') || cat.includes('coffee') || cat.includes('beer')) return <Coffee size={13} />;
  if (cat.includes('canned')) return <Package size={13} />;
  if (cat.includes('snack') || cat.includes('biscuit') || cat.includes('chip')) return <Cookie size={13} />;
  if (cat.includes('rice') || cat.includes('grain')) return <Layers size={13} />;
  if (cat.includes('condiment') || cat.includes('sauce') || cat.includes('vinegar') || cat.includes('oil')) return <Droplets size={13} />;
  if (cat.includes('toilet') || cat.includes('soap')) return <Shield size={13} />;
  return <ShoppingBag size={13} />;
};

export const PosRegister = ({
  products,
  categories,
  onSaleCompleted,
  showToast
}: PosRegisterProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);
  const [posMobileView, setPosMobileView] = useState<'catalog' | 'register'>('catalog');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    code: string;
    name?: string;
    price?: number;
    success: boolean;
  } | null>(null);

  // Barcode Scan Handler for POS (Supports live camera scan and hardware scanner)
  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;

    const product = products.find(
      (p) =>
        (p.barcode && p.barcode.trim().toLowerCase() === code.toLowerCase()) ||
        (p.barcode && p.barcode.replace(/^0+/, '') === code.replace(/^0+/, ''))
    );

    if (product) {
      if (product.stock_quantity <= 0) {
        playScanAudio('error');
        setLastScanResult({
          code,
          name: `${product.name} (OUT OF STOCK)`,
          success: false
        });
        showToast(`'${product.name}' is out of stock!`, 'error');
      } else {
        addToCart(product);
        setLastScanResult({
          code,
          name: product.name,
          price: product.selling_price,
          success: true
        });
        showToast(`Added '${product.name}' to cart (₱${product.selling_price.toFixed(2)})`, 'success');
      }
    } else {
      playScanAudio('error');
      setLastScanResult({
        code,
        name: `Barcode not found (${code})`,
        success: false
      });
      showToast(`No item with barcode "${code}" found in catalog`, 'error');
    }
  };

  // Hardware Scanner / Enter key press on search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = search.trim();
      if (!code) return;
      const product = products.find(
        (p) =>
          (p.barcode && p.barcode.trim().toLowerCase() === code.toLowerCase()) ||
          (p.barcode && p.barcode.replace(/^0+/, '') === code.replace(/^0+/, ''))
      );
      if (product) {
        e.preventDefault();
        handleBarcodeScanned(code);
        setSearch('');
      }
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      showToast(`'${product.name}' is out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast(`Only ${product.stock_quantity} available in stock`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock_quantity) {
              showToast(`Only ${item.product.stock_quantity} available`, 'error');
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered('');
    setDiscountAmount('0');
    setCustomerName('');
  };

  // Calculations
  const grossTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  }, [cart]);

  const discountNum = parseFloat(discountAmount) || 0;
  const netTotal = Math.max(0, grossTotal - discountNum);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - netTotal);
  const isCash = paymentMethod === 'Cash';
  const isUtang = paymentMethod === 'Utang';

  const canCheckout =
    cart.length > 0 &&
    (!isCash || tenderedNum >= netTotal) &&
    (!isUtang || customerName.trim().length > 0) &&
    !isSubmitting;

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setIsSubmitting(true);

    try {
      const salePayload = {
        items: cart.map((c) => ({
          product_id: c.product.id,
          product_name: c.product.name,
          unit_price: c.product.selling_price,
          quantity: c.quantity
        })),
        discount_amount: discountNum,
        cash_tendered: isCash ? tenderedNum : netTotal,
        payment_method: paymentMethod,
        customer_name: customerName || undefined
      };

      const result = await processSale(salePayload);
      setCompletedSale(result);
      clearCart();
      setPosMobileView('catalog');
      onSaleCompleted();
      showToast(`Sale #${result.receipt_no} completed!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to process sale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pos-container">
      {/* Mobile Top View Switcher (Visible on screens <= 1024px) */}
      <div className="pos-mobile-view-toggle">
        <button
          type="button"
          className={`pos-mobile-view-btn ${posMobileView === 'catalog' ? 'active' : ''}`}
          onClick={() => setPosMobileView('catalog')}
        >
          <ShoppingBag size={17} />
          <span>Catalog ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          className={`pos-mobile-view-btn ${posMobileView === 'register' ? 'active' : ''}`}
          onClick={() => setPosMobileView('register')}
        >
          <Receipt size={17} />
          <span>Register</span>
          {cart.length > 0 && (
            <span className="pos-badge-total">
              {cart.reduce((s, it) => s + it.quantity, 0)} • ₱{netTotal.toFixed(0)}
            </span>
          )}
        </button>
      </div>

      {/* Product Catalog */}
      <div className={`catalog-section ${posMobileView === 'register' ? 'pos-mobile-hidden' : ''}`}>
        {/* Search Input Bar with Scan Barcode Button */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="pos-search-wrap" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} className="pos-search-icon" />
            <input
              type="text"
              className="search-bar-neo"
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
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

          <button
            type="button"
            className="btn-neo btn-neo-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.72rem 1rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onClick={() => {
              setLastScanResult(null);
              setIsScannerOpen(true);
            }}
            title="Scan product barcode with camera"
          >
            <ScanBarcode size={18} />
            <span className="pos-scan-btn-text">Scan Barcode</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="pos-cat-filter-scroll">
          <button
            className={`btn-neo btn-neo-sm ${selectedCategory === 'All' ? 'btn-neo-primary' : 'btn-neo-surface'}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Items ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`btn-neo btn-neo-sm ${selectedCategory === c ? 'btn-neo-primary' : 'btn-neo-surface'}`}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Products Grid with Fixed & Enhanced Cards */}
        <div className="products-grid-neo">
          {filteredProducts.map((p) => {
            const isOut = p.stock_quantity <= 0;
            const isLow = p.stock_quantity <= p.low_stock_threshold && !isOut;
            const cartItem = cart.find((c) => c.product.id === p.id);
            const inCartCount = cartItem?.quantity || 0;

            return (
              <div
                key={p.id}
                className={`product-tile-neo ${isOut ? 'out-stock' : ''} ${inCartCount > 0 ? 'in-cart-active' : ''}`}
                onClick={() => !isOut && addToCart(p)}
              >
                {/* Top Row: Category Icon/Badge + Cart Count */}
                <div className="product-tile-header">
                  <div className="product-tile-cat-badge">
                    {getCategoryIcon(p.category)}
                    <span className="product-tile-cat-text">
                      {p.category}
                    </span>
                  </div>

                  {inCartCount > 0 && (
                    <div className="product-tile-cart-badge" title={`${inCartCount} in cart`}>
                      <Check size={10} />
                      <span>{inCartCount}</span>
                    </div>
                  )}
                </div>

                {/* Product Name (2-line clamp) */}
                <div className="product-tile-title">
                  {p.name}
                </div>

                {/* Optional Wholesale badge */}
                {p.wholesale_price && p.wholesale_price > 0 && (
                  <div className="product-tile-wholesale">
                    ₱{p.wholesale_price.toFixed(0)} ws ({p.min_wholesale_qty}+)
                  </div>
                )}

                {/* Bottom Row: Price & Stock Tag */}
                <div className="product-tile-footer">
                  <span className="product-price-bold">
                    ₱{p.selling_price % 1 === 0 ? p.selling_price.toFixed(0) : p.selling_price.toFixed(2)}
                  </span>

                  <div className="product-tile-stock-wrap">
                    <span
                      className={`product-tile-stock-tag ${isOut ? 'out' : isLow ? 'low' : ''}`}
                    >
                      {isOut ? 'OUT' : p.stock_quantity}
                    </span>

                    {!isOut && (
                      <div
                        className="product-tile-add-btn"
                        title="Add to cart"
                      >
                        <Plus size={12} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="neo-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-hint)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>No products found matching your search.</p>
            </div>
          )}
        </div>

        {/* Floating Mobile Cart Bar */}
        {cart.length > 0 && (
          <div
            className="pos-mobile-cart-bar"
            onClick={() => {
              setPosMobileView('register');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'var(--color-secondary)',
                  color: 'var(--border-outline)',
                  border: '2px solid var(--border-outline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.88rem'
                }}
              >
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Cart Total
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  ₱{netTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <button className="btn-neo btn-neo-secondary btn-neo-sm">
              <span>View Register</span>
              <Receipt size={14} />
            </button>
          </div>
        )}
      </div>

      {/* POS Cart Aside */}
      <aside
        id="pos-cart-panel"
        className={`neo-card pos-cart-aside ${posMobileView === 'catalog' ? 'pos-mobile-hidden' : ''}`}
      >
        {/* Mobile Back Button to return to products */}
        <div className="pos-mobile-back-row">
          <button
            type="button"
            className="btn-neo btn-neo-surface btn-neo-sm"
            onClick={() => setPosMobileView('catalog')}
          >
            <ArrowLeft size={15} />
            <span>Back to Products</span>
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {cart.reduce((s, it) => s + it.quantity, 0)} {cart.reduce((s, it) => s + it.quantity, 0) === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-outline)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={22} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem' }}>Current Register</h3>
          </div>
          {cart.length > 0 && (
            <button className="btn-neo btn-neo-surface btn-neo-sm" onClick={clearCart}>
              Clear
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-hint)' }}>
              <p style={{ fontWeight: 700 }}>Register is empty</p>
              <p style={{ fontSize: '0.85rem' }}>Click items on the left to charge customer</p>
            </div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-outline)',
                  background: 'var(--bg-app)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{product.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ₱{product.selling_price.toFixed(2)} × {quantity}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0 0.5rem' }}>
                  <button
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                    onClick={() => updateQuantity(product.id, -1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                    onClick={() => updateQuantity(product.id, 1)}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <span style={{ fontWeight: 800, color: 'var(--color-accent)', minWidth: '60px', textAlign: 'right' }}>
                  ₱{(product.selling_price * quantity).toFixed(2)}
                </span>

                <button
                  onClick={() => removeFromCart(product.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.35rem' }}
                  title="Remove item"
                >
                  <Trash2 size={14} color="var(--color-error)" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Calculations & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderTop: '2px solid var(--border-outline)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span style={{ fontWeight: 700 }}>₱{grossTotal.toFixed(2)}</span>
          </div>

          {/* Discount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discount (₱):</span>
            <input
              type="number"
              min="0"
              step="1"
              className="input-neo"
              style={{ width: '90px', padding: '0.3rem 0.5rem', textAlign: 'right' }}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
            <span>Total:</span>
            <span style={{ color: 'var(--color-accent)' }}>₱{netTotal.toFixed(2)}</span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginTop: '0.25rem' }}>
              {['Cash', 'GCash', 'Maya', 'Utang'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`btn-neo btn-neo-sm ${paymentMethod === m ? 'btn-neo-primary' : 'btn-neo-surface'}`}
                  style={{ padding: '0.4rem 0.2rem', fontSize: '0.78rem' }}
                  onClick={() => {
                    setPaymentMethod(m);
                    if (m !== 'Cash') {
                      setCashTendered(netTotal.toString());
                    }
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              Customer Name {isUtang ? '(Required for Utang)' : '(Optional)'}
            </label>
            <input
              type="text"
              className="input-neo"
              placeholder="e.g. Aling Nena / Mang Kanor"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Cash Tendered & Sukli */}
          {isCash && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Cash Tendered (Bayad)</label>
              <input
                type="number"
                step="any"
                className="input-neo"
                placeholder="₱ 0.00"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
              />

              {/* Quick Bill Pills */}
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                {[20, 50, 100, 200, 500, 1000].map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    className="btn-neo btn-neo-surface btn-neo-sm"
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                    onClick={() => handleQuickCash(bill)}
                  >
                    ₱{bill}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-neo btn-neo-surface btn-neo-sm"
                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                  onClick={() => handleQuickCash(netTotal)}
                >
                  Exact
                </button>
              </div>

              {netTotal > 0 && tenderedNum >= netTotal && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '2px solid var(--border-outline)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 0.75rem',
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <span>Sukli (Change):</span>
                  <span>₱{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button
            className="btn-neo btn-neo-accent"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1.1rem', marginTop: '0.35rem' }}
            disabled={!canCheckout}
            onClick={handleCheckout}
          >
            {isSubmitting ? 'Charging...' : `Charge ₱${netTotal.toFixed(2)}`}
          </button>
        </div>
      </aside>

      {/* Sale Receipt Modal */}
      {completedSale && (
        <div className="modal-overlay-neo" onClick={() => setCompletedSale(null)}>
          <div className="modal-box-neo" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--border-outline)', paddingBottom: '1rem' }}>
              <CheckCircle2 size={42} color="var(--color-accent)" style={{ margin: '0 auto 0.4rem' }} />
              <h2>TindaMate Official Receipt</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{completedSale.receipt_no}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(completedSale.created_at).toLocaleString()}
              </div>
            </div>

            {completedSale.customer_name && (
              <div>
                Customer: <strong>{completedSale.customer_name}</strong>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {completedSale.items.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{it.quantity}x {it.product_name}</span>
                  <strong>₱{it.subtotal.toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed var(--border-outline)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--color-accent)' }}>₱{completedSale.total_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Payment ({completedSale.payment_method}):</span>
                <span>₱{completedSale.cash_tendered.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#d97706', fontWeight: 800 }}>
                <span>Sukli (Change):</span>
                <span>₱{completedSale.change_amount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn-neo btn-neo-surface" style={{ flex: 1 }} onClick={() => window.print()}>
                Print
              </button>
              <button className="btn-neo btn-neo-primary" style={{ flex: 1 }} onClick={() => setCompletedSale(null)}>
                Done / Next Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continuous Barcode Scanner Modal for POS */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        title="POS Barcode Scanner"
        subtitle="Point camera at product barcode. Scans will be instantly added to cart."
        mode="continuous"
        onScan={handleBarcodeScanned}
        onClose={() => setIsScannerOpen(false)}
        lastScannedResult={lastScanResult}
      />
    </div>
  );
};
