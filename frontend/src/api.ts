import type {
  Product,
  ProductCreate,
  SaleCreate,
  SaleResponse,
  CustomerUtang,
  CustomerUtangCreate,
  Expense,
  ExpenseCreate,
  StoreSetting,
  DashboardStats,
  HealthStatus,
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials
} from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('tindamate_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('tindamate_token', token);
  } else {
    localStorage.removeItem('tindamate_token');
  }
}

export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...additionalHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==================== AUTHENTICATION ====================
export async function getAuthStatus(): Promise<{ has_users: boolean; users_count: number }> {
  const res = await fetch(`${API_BASE}/auth/status`);
  if (!res.ok) throw new Error('Failed to get auth status');
  return res.json();
}

export async function loginUser(creds: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.access_token);
  return data;
}

export async function registerUser(creds: RegisterCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.access_token);
  return data;
}

export async function getAuthMe(): Promise<User> {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token');
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    setAuthToken(null);
    throw new Error('Session expired. Please log in again.');
  }
  return res.json();
}

export function logoutUser() {
  setAuthToken(null);
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

// ==================== PRODUCTS ====================
export async function fetchProducts(params?: {
  search?: string;
  category?: string;
  low_stock_only?: boolean;
}): Promise<Product[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/products`);
  if (params?.search) url.searchParams.append('search', params.search);
  if (params?.category && params.category !== 'All') url.searchParams.append('category', params.category);
  if (params?.low_stock_only) url.searchParams.append('low_stock_only', 'true');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/products/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createProduct(data: ProductCreate): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id: number, data: Partial<ProductCreate>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update product');
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<{ message: string; id: number }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function adjustProductStock(id: number, change: number): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/stock?change=${change}`, {
    method: 'PATCH'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to adjust stock');
  }
  return res.json();
}

// ==================== SALES ====================
export async function processSale(data: SaleCreate): Promise<SaleResponse> {
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to process sale');
  }
  return res.json();
}

export async function fetchSales(): Promise<SaleResponse[]> {
  const res = await fetch(`${API_BASE}/sales?limit=100`);
  if (!res.ok) throw new Error('Failed to fetch sales history');
  return res.json();
}

export async function voidSale(id: number): Promise<SaleResponse> {
  const res = await fetch(`${API_BASE}/sales/${id}/void`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to void sale');
  }
  return res.json();
}

// ==================== UTANGS ====================
export async function fetchUtangs(params?: { status?: string; search?: string }): Promise<CustomerUtang[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/utangs`);
  if (params?.status && params.status !== 'all') url.searchParams.append('status', params.status);
  if (params?.search) url.searchParams.append('search', params.search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch utangs');
  return res.json();
}

export async function createUtang(data: CustomerUtangCreate): Promise<CustomerUtang> {
  const res = await fetch(`${API_BASE}/utangs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to record utang');
  }
  return res.json();
}

export async function recordUtangPayment(utangId: number, data: { amount: number; payment_method: string; notes?: string }): Promise<CustomerUtang> {
  const res = await fetch(`${API_BASE}/utangs/${utangId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to record payment');
  }
  return res.json();
}

export async function deleteUtang(utangId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/utangs/${utangId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete utang');
  return res.json();
}

// ==================== EXPENSES ====================
export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch(`${API_BASE}/expenses?limit=100`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to record expense');
  }
  return res.json();
}

export async function deleteExpense(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete expense');
  return res.json();
}

// ==================== SETTINGS & ANALYTICS ====================
export async function fetchStoreSettings(): Promise<StoreSetting> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateStoreSettings(data: Partial<StoreSetting>): Promise<StoreSetting> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/analytics/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}
