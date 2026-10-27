import datetime
import random
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app import models, schemas
from fastapi import HTTPException

# ==================== PRODUCT CRUD ====================

def get_products(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 150
) -> List[models.Product]:
    query = db.query(models.Product)

    if not include_archived:
        query = query.filter(models.Product.is_archived == False)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(search_filter),
                models.Product.barcode.ilike(search_filter),
                models.Product.category.ilike(search_filter)
            )
        )

    if category and category.lower() != "all":
        query = query.filter(models.Product.category == category)

    if low_stock_only:
        query = query.filter(models.Product.stock_quantity <= models.Product.low_stock_threshold)

    return query.order_by(models.Product.name.asc()).offset(skip).limit(limit).all()

def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def create_product(db: Session, product_in: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_in: schemas.ProductUpdate) -> Optional[models.Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(db_product, field, val)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True

def adjust_stock(db: Session, product_id: int, quantity_change: int) -> Optional[models.Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    new_quantity = db_product.stock_quantity + quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    db_product.stock_quantity = new_quantity
    db.commit()
    db.refresh(db_product)
    return db_product

# ==================== SALE CRUD ====================

def generate_receipt_no() -> str:
    now_str = datetime.datetime.now().strftime("%Y%m%d")
    rand_suffix = random.randint(1000, 9999)
    return f"TM-{now_str}-{rand_suffix}"

def create_sale(db: Session, sale_in: schemas.SaleCreate) -> models.Sale:
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must contain at least one item")

    gross_total = 0.0
    items_to_create = []

    for item in sale_in.items:
        cost_price = 0.0
        if item.product_id:
            product = get_product(db, item.product_id)
            if product:
                if product.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough stock for '{product.name}'. Available: {product.stock_quantity}, requested: {item.quantity}"
                    )
                product.stock_quantity -= item.quantity
                cost_price = product.cost_price

        subtotal = round(item.unit_price * item.quantity, 2)
        gross_total += subtotal

        sale_item = models.SaleItem(
            product_id=item.product_id,
            product_name=item.product_name,
            unit_price=item.unit_price,
            cost_price=cost_price,
            quantity=item.quantity,
            subtotal=subtotal
        )
        items_to_create.append(sale_item)

    total_amount = max(0.0, round(gross_total - sale_in.discount_amount, 2))
    change_amount = round(max(0.0, sale_in.cash_tendered - total_amount), 2)
    receipt_no = generate_receipt_no()

    db_sale = models.Sale(
        receipt_no=receipt_no,
        total_amount=total_amount,
        discount_amount=sale_in.discount_amount,
        cash_tendered=sale_in.cash_tendered,
        change_amount=change_amount,
        payment_method=sale_in.payment_method,
        customer_name=sale_in.customer_name,
        notes=sale_in.notes
    )
    db.add(db_sale)
    db.flush()

    for item in items_to_create:
        item.sale_id = db_sale.id
        db.add(item)

    # If payment method is Utang, also automatically record in CustomerUtang table!
    if sale_in.payment_method.lower() == "utang" and sale_in.customer_name:
        utang = models.CustomerUtang(
            customer_name=sale_in.customer_name,
            total_amount=total_amount,
            paid_amount=0.0,
            balance=total_amount,
            status="unpaid",
            notes=f"POS Sale #{receipt_no}"
        )
        db.add(utang)

    db.commit()
    db.refresh(db_sale)
    return db_sale

def get_sales(db: Session, skip: int = 0, limit: int = 100) -> List[models.Sale]:
    return db.query(models.Sale).order_by(models.Sale.created_at.desc()).offset(skip).limit(limit).all()

def get_sale(db: Session, sale_id: int) -> Optional[models.Sale]:
    return db.query(models.Sale).filter(models.Sale.id == sale_id).first()

def void_sale(db: Session, sale_id: int) -> models.Sale:
    db_sale = get_sale(db, sale_id)
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if db_sale.is_voided:
        raise HTTPException(status_code=400, detail="Sale is already voided")

    # Restore inventory stock
    for item in db_sale.items:
        if item.product_id:
            prod = get_product(db, item.product_id)
            if prod:
                prod.stock_quantity += item.quantity

    db_sale.is_voided = True
    db.commit()
    db.refresh(db_sale)
    return db_sale

# ==================== UTANG CRUD ====================

def get_utangs(db: Session, status: Optional[str] = None, search: Optional[str] = None) -> List[models.CustomerUtang]:
    query = db.query(models.CustomerUtang)
    if status and status.lower() != "all":
        query = query.filter(models.CustomerUtang.status == status.lower())
    if search:
        query = query.filter(models.CustomerUtang.customer_name.ilike(f"%{search}%"))
    return query.order_by(models.CustomerUtang.balance.desc()).all()

def create_utang(db: Session, utang_in: schemas.CustomerUtangCreate) -> models.CustomerUtang:
    utang = models.CustomerUtang(
        customer_name=utang_in.customer_name,
        contact_number=utang_in.contact_number,
        total_amount=utang_in.total_amount,
        paid_amount=0.0,
        balance=utang_in.total_amount,
        due_date=utang_in.due_date,
        status="unpaid",
        notes=utang_in.notes
    )
    db.add(utang)
    db.commit()
    db.refresh(utang)
    return utang

def record_utang_payment(db: Session, utang_id: int, payment_in: schemas.UtangPaymentCreate) -> models.CustomerUtang:
    utang = db.query(models.CustomerUtang).filter(models.CustomerUtang.id == utang_id).first()
    if not utang:
        raise HTTPException(status_code=404, detail="Utang record not found")

    payment = models.UtangPayment(
        utang_id=utang.id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        notes=payment_in.notes
    )
    db.add(payment)

    utang.paid_amount = round(utang.paid_amount + payment_in.amount, 2)
    utang.balance = round(max(0.0, utang.total_amount - utang.paid_amount), 2)
    utang.status = "paid" if utang.balance <= 0.01 else "partial"

    db.commit()
    db.refresh(utang)
    return utang

def delete_utang(db: Session, utang_id: int) -> bool:
    utang = db.query(models.CustomerUtang).filter(models.CustomerUtang.id == utang_id).first()
    if not utang:
        return False
    db.delete(utang)
    db.commit()
    return True

# ==================== EXPENSE CRUD ====================

def get_expenses(db: Session, skip: int = 0, limit: int = 100) -> List[models.Expense]:
    return db.query(models.Expense).order_by(models.Expense.expense_date.desc()).offset(skip).limit(limit).all()

def create_expense(db: Session, exp_in: schemas.ExpenseCreate) -> models.Expense:
    exp = models.Expense(
        title=exp_in.title,
        category=exp_in.category,
        amount=exp_in.amount,
        notes=exp_in.notes,
        expense_date=exp_in.expense_date or datetime.datetime.now()
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

def delete_expense(db: Session, expense_id: int) -> bool:
    exp = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not exp:
        return False
    db.delete(exp)
    db.commit()
    return True

# ==================== SETTINGS CRUD ====================

def get_or_create_store_setting(db: Session) -> models.StoreSetting:
    setting = db.query(models.StoreSetting).first()
    if not setting:
        setting = models.StoreSetting(
            store_name="Aling Nena's Store",
            owner_name="Aling Nena",
            contact_number="0917-123-4567",
            address="Brgy. San Jose, Quezon City",
            receipt_footer="Salamat po sa pagtangkilik! Balik po kayo!"
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

def update_store_setting(db: Session, setting_in: schemas.StoreSettingUpdate) -> models.StoreSetting:
    setting = get_or_create_store_setting(db)
    for field, val in setting_in.model_dump(exclude_unset=True).items():
        setattr(setting, field, val)
    db.commit()
    db.refresh(setting)
    return setting

# ==================== DASHBOARD & ANALYTICS ====================

def get_dashboard_stats(db: Session) -> schemas.DashboardStats:
    today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Today's sales (non-voided)
    today_sales_query = db.query(
        func.coalesce(func.sum(models.Sale.total_amount), 0.0),
        func.count(models.Sale.id)
    ).filter(models.Sale.created_at >= today_start, models.Sale.is_voided == False).first()

    today_sales = float(today_sales_query[0])
    today_transactions_count = int(today_sales_query[1])

    # Today's gross profit
    profit_query = db.query(
        func.coalesce(func.sum((models.SaleItem.unit_price - models.SaleItem.cost_price) * models.SaleItem.quantity), 0.0)
    ).join(models.Sale, models.Sale.id == models.SaleItem.sale_id)\
     .filter(models.Sale.created_at >= today_start, models.Sale.is_voided == False).scalar()
    
    today_gross_profit = round(float(profit_query or 0.0), 2)

    # Today's expenses
    expenses_query = db.query(
        func.coalesce(func.sum(models.Expense.amount), 0.0)
    ).filter(models.Expense.expense_date >= today_start).scalar()

    today_expenses = round(float(expenses_query or 0.0), 2)
    today_net_profit = round(today_gross_profit - today_expenses, 2)

    # Total inventory valuation
    inv_query = db.query(
        func.count(models.Product.id),
        func.coalesce(func.sum(models.Product.cost_price * models.Product.stock_quantity), 0.0)
    ).filter(models.Product.is_archived == False).first()

    total_products_count = int(inv_query[0])
    total_inventory_value = round(float(inv_query[1]), 2)

    # Low stock items count
    low_stock_count = db.query(func.count(models.Product.id))\
        .filter(models.Product.stock_quantity <= models.Product.low_stock_threshold, models.Product.is_archived == False).scalar() or 0

    # Total outstanding utang
    total_utang = db.query(
        func.coalesce(func.sum(models.CustomerUtang.balance), 0.0)
    ).filter(models.CustomerUtang.status != "paid").scalar() or 0.0

    # Top selling products
    top_items = db.query(
        models.SaleItem.product_id,
        models.SaleItem.product_name,
        func.sum(models.SaleItem.quantity).label("total_qty"),
        func.sum(models.SaleItem.subtotal).label("total_rev")
    ).join(models.Sale, models.Sale.id == models.SaleItem.sale_id)\
     .filter(models.Sale.is_voided == False)\
     .group_by(models.SaleItem.product_id, models.SaleItem.product_name)\
     .order_by(desc("total_qty"))\
     .limit(5).all()

    top_selling = [
        schemas.TopProductStat(
            product_id=row.product_id,
            product_name=row.product_name,
            total_quantity_sold=int(row.total_qty),
            total_revenue=round(float(row.total_rev), 2)
        )
        for row in top_items
    ]

    # Payment method breakdown
    payment_rows = db.query(
        models.Sale.payment_method,
        func.sum(models.Sale.total_amount).label("method_total"),
        func.count(models.Sale.id).label("method_count")
    ).filter(models.Sale.is_voided == False)\
     .group_by(models.Sale.payment_method).all()

    breakdown = [
        schemas.PaymentBreakdown(
            method=row.payment_method,
            total=round(float(row.method_total), 2),
            count=int(row.method_count)
        )
        for row in payment_rows
    ]

    return schemas.DashboardStats(
        today_sales=today_sales,
        today_gross_profit=today_gross_profit,
        today_expenses=today_expenses,
        today_net_profit=today_net_profit,
        today_transactions_count=today_transactions_count,
        total_inventory_value=total_inventory_value,
        total_products_count=total_products_count,
        low_stock_count=int(low_stock_count),
        total_customer_utang=round(float(total_utang), 2),
        top_selling_products=top_selling,
        payment_breakdown=breakdown
    )
