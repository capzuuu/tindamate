from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field("General", max_length=100)
    barcode: Optional[str] = None
    cost_price: float = Field(..., ge=0)
    selling_price: float = Field(..., ge=0)
    wholesale_price: Optional[float] = Field(None, ge=0)
    min_wholesale_qty: Optional[int] = Field(12, ge=1)
    stock_quantity: int = Field(0, ge=0)
    unit: str = Field("pcs", max_length=50)
    low_stock_threshold: int = Field(5, ge=0)
    supplier: Optional[str] = None
    description: Optional[str] = None
    is_archived: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    min_wholesale_qty: Optional[int] = None
    stock_quantity: Optional[int] = None
    unit: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    supplier: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ==================== SALE SCHEMAS ====================
class SaleItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    unit_price: float = Field(..., ge=0)
    quantity: int = Field(..., gt=0)

class SaleItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    unit_price: float
    cost_price: float
    quantity: int
    subtotal: float

    model_config = ConfigDict(from_attributes=True)

class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1)
    discount_amount: float = Field(0.0, ge=0)
    cash_tendered: float = Field(..., ge=0)
    payment_method: str = Field("Cash")
    customer_name: Optional[str] = None
    notes: Optional[str] = None

class SaleResponse(BaseModel):
    id: int
    receipt_no: str
    total_amount: float
    discount_amount: float
    cash_tendered: float
    change_amount: float
    payment_method: str
    customer_name: Optional[str] = None
    notes: Optional[str] = None
    is_voided: bool = False
    created_at: datetime
    items: List[SaleItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

# ==================== UTANG SCHEMAS ====================
class UtangPaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: str = Field("Cash")
    notes: Optional[str] = None

class UtangPaymentResponse(BaseModel):
    id: int
    utang_id: int
    amount: float
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CustomerUtangCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    contact_number: Optional[str] = None
    total_amount: float = Field(..., gt=0)
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class CustomerUtangResponse(BaseModel):
    id: int
    customer_name: str
    contact_number: Optional[str] = None
    total_amount: float
    paid_amount: float
    balance: float
    due_date: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    payments: List[UtangPaymentResponse] = []

    model_config = ConfigDict(from_attributes=True)

# ==================== EXPENSE SCHEMAS ====================
class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1)
    category: str = Field("Supplies")
    amount: float = Field(..., gt=0)
    notes: Optional[str] = None
    expense_date: Optional[datetime] = None

class ExpenseResponse(BaseModel):
    id: int
    title: str
    category: str
    amount: float
    notes: Optional[str] = None
    expense_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ==================== SETTINGS SCHEMAS ====================
class StoreSettingUpdate(BaseModel):
    store_name: Optional[str] = None
    owner_name: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    receipt_footer: Optional[str] = None

class StoreSettingResponse(BaseModel):
    id: int
    store_name: str
    owner_name: str
    contact_number: Optional[str] = None
    address: Optional[str] = None
    receipt_footer: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ==================== ANALYTICS SCHEMAS ====================
class TopProductStat(BaseModel):
    product_id: Optional[int]
    product_name: str
    total_quantity_sold: int
    total_revenue: float

class PaymentBreakdown(BaseModel):
    method: str
    total: float
    count: int

class DashboardStats(BaseModel):
    today_sales: float
    today_gross_profit: float
    today_expenses: float
    today_net_profit: float
    today_transactions_count: int
    total_inventory_value: float
    total_products_count: int
    low_stock_count: int
    total_customer_utang: float
    top_selling_products: List[TopProductStat] = []
    payment_breakdown: List[PaymentBreakdown] = []

class HealthStatus(BaseModel):
    status: str
    engine: str
    connected: bool
    url: str
    warning: Optional[str] = None

# ==================== AUTH & USER SCHEMAS ====================
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=1, max_length=150)
    email: Optional[str] = None
    role: str = Field("owner")

class UserLogin(BaseModel):
    username: str = Field(...)
    password: str = Field(...)

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

