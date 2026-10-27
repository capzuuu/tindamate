export interface Product {
  id: number;
  name: string;
  category: string;
  barcode?: string | null;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number | null;
  min_wholesale_qty?: number | null;
  stock_quantity: number;
  unit: string;
  low_stock_threshold: number;
  supplier?: string | null;
  description?: string | null;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCreate {
  name: string;
  category: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  stock_quantity: number;
  unit: string;
  low_stock_threshold: number;
  supplier?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItemCreate {
  product_id?: number;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface SaleCreate {
  items: SaleItemCreate[];
  discount_amount?: number;
  cash_tendered: number;
  payment_method: string;
  customer_name?: string;
  notes?: string;
}

export interface SaleItemResponse {
  id: number;
  product_id?: number | null;
  product_name: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  receipt_no: string;
  total_amount: number;
  discount_amount: number;
  cash_tendered: number;
  change_amount: number;
  payment_method: string;
  customer_name?: string | null;
  notes?: string | null;
  is_voided: boolean;
  created_at: string;
  items: SaleItemResponse[];
}

export interface UtangPayment {
  id: number;
  utang_id: number;
  amount: number;
  payment_method: string;
  notes?: string | null;
  created_at: string;
}

export interface CustomerUtang {
  id: number;
  customer_name: string;
  contact_number?: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date?: string | null;
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string | null;
  created_at: string;
  payments: UtangPayment[];
}

export interface CustomerUtangCreate {
  customer_name: string;
  contact_number?: string;
  total_amount: number;
  due_date?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  notes?: string | null;
  expense_date: string;
  created_at: string;
}

export interface ExpenseCreate {
  title: string;
  category: string;
  amount: number;
  notes?: string;
  expense_date?: string;
}

export interface StoreSetting {
  id: number;
  store_name: string;
  owner_name: string;
  contact_number?: string | null;
  address?: string | null;
  receipt_footer?: string | null;
}

export interface TopProductStat {
  product_id?: number | null;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface PaymentBreakdown {
  method: string;
  total: number;
  count: number;
}

export interface DashboardStats {
  today_sales: number;
  today_gross_profit: number;
  today_expenses: number;
  today_net_profit: number;
  today_transactions_count: number;
  total_inventory_value: number;
  total_products_count: number;
  low_stock_count: number;
  total_customer_utang: number;
  top_selling_products: TopProductStat[];
  payment_breakdown: PaymentBreakdown[];
}

export interface HealthStatus {
  status: string;
  engine: string;
  connected: boolean;
  url: string;
  warning?: string | null;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  email?: string | null;
  role: 'owner' | 'cashier' | string;
  is_active: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  role?: string;
}

