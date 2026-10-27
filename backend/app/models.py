from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, default="General", index=True)
    barcode = Column(String(100), nullable=True, index=True)
    cost_price = Column(Float, nullable=False, default=0.0) # Puhunan
    selling_price = Column(Float, nullable=False, default=0.0) # Presyo
    wholesale_price = Column(Float, nullable=True) # Pakyawan presyo
    min_wholesale_qty = Column(Integer, nullable=True, default=12) # Minimum pieces for wholesale
    stock_quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(50), nullable=False, default="pcs") # pcs, pack, can, bottle, sachet, kg
    low_stock_threshold = Column(Integer, nullable=False, default=5)
    supplier = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    sale_items = relationship("SaleItem", back_populates="product")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    receipt_no = Column(String(50), unique=True, index=True, nullable=False)
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, nullable=False, default=0.0)
    cash_tendered = Column(Float, nullable=False, default=0.0)
    change_amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(String(50), nullable=False, default="Cash") # Cash, GCash, Maya, Utang
    customer_name = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_voided = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(255), nullable=False)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0.0)
    quantity = Column(Integer, nullable=False, default=1)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

class CustomerUtang(Base):
    __tablename__ = "customer_utangs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_name = Column(String(100), nullable=False, index=True)
    contact_number = Column(String(50), nullable=True)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False, default=0.0)
    balance = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="unpaid") # unpaid, partial, paid
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    payments = relationship("UtangPayment", back_populates="utang", cascade="all, delete-orphan")

class UtangPayment(Base):
    __tablename__ = "utang_payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    utang_id = Column(Integer, ForeignKey("customer_utangs.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False, default="Cash")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    utang = relationship("CustomerUtang", back_populates="payments")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, default="Supplies") # Utilities, Rent, Transportation, Supplies, Restock, Other
    amount = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    expense_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StoreSetting(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_name = Column(String(255), nullable=False, default="Aling Nena's Store")
    owner_name = Column(String(255), nullable=False, default="Aling Nena")
    contact_number = Column(String(50), nullable=True, default="0917-123-4567")
    address = Column(String(255), nullable=True, default="Brgy. San Jose, Quezon City")
    receipt_footer = Column(String(255), nullable=True, default="Salamat po sa pagtangkilik! Balik po kayo!")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="owner") # owner, cashier, staff
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

