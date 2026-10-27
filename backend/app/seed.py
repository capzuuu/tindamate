from sqlalchemy.orm import Session
from app import models

SAMPLE_PRODUCTS = [
    {
        "name": "Lucky Me! Pancit Canton Extra Hot 80g",
        "category": "Noodles",
        "barcode": "480777027001",
        "cost_price": 14.00,
        "selling_price": 18.00,
        "stock_quantity": 48,
        "unit": "pack",
        "low_stock_threshold": 10,
        "description": "Philippines' favorite instant noodle stir-fry"
    },
    {
        "name": "Lucky Me! Pancit Canton Kalamansi 80g",
        "category": "Noodles",
        "barcode": "480777027002",
        "cost_price": 14.00,
        "selling_price": 18.00,
        "stock_quantity": 36,
        "unit": "pack",
        "low_stock_threshold": 10,
        "description": "Zesty citrus flavored noodles"
    },
    {
        "name": "Kopiko Blanca 3-in-1 Coffee 30g",
        "category": "Beverages",
        "barcode": "899600130101",
        "cost_price": 10.50,
        "selling_price": 14.00,
        "stock_quantity": 60,
        "unit": "sachet",
        "low_stock_threshold": 15,
        "description": "Creamy coffee mix sachet"
    },
    {
        "name": "Nescafe Classic Stick 2g",
        "category": "Beverages",
        "barcode": "480036130202",
        "cost_price": 4.00,
        "selling_price": 6.00,
        "stock_quantity": 80,
        "unit": "sachet",
        "low_stock_threshold": 20,
        "description": "100% Pure instant coffee"
    },
    {
        "name": "San Miguel Pale Pilsen 330ml Can",
        "category": "Beverages",
        "barcode": "480101010101",
        "cost_price": 48.00,
        "selling_price": 60.00,
        "stock_quantity": 24,
        "unit": "can",
        "low_stock_threshold": 6,
        "description": "Classic premium pilsen beer"
    },
    {
        "name": "Coca-Cola Original Taste 1.5L",
        "category": "Beverages",
        "barcode": "480198111001",
        "cost_price": 65.00,
        "selling_price": 80.00,
        "stock_quantity": 12,
        "unit": "bottle",
        "low_stock_threshold": 4,
        "description": "Chilled refreshing cola"
    },
    {
        "name": "Purefoods Corned Beef 150g",
        "category": "Canned Goods",
        "barcode": "480019415001",
        "cost_price": 45.00,
        "selling_price": 55.00,
        "stock_quantity": 18,
        "unit": "can",
        "low_stock_threshold": 5,
        "description": "Premium 100% pure beef"
    },
    {
        "name": "555 Sardines in Tomato Sauce 155g",
        "category": "Canned Goods",
        "barcode": "480055515501",
        "cost_price": 22.00,
        "selling_price": 28.00,
        "stock_quantity": 24,
        "unit": "can",
        "low_stock_threshold": 8,
        "description": "Nutritious sardines with rich sauce"
    },
    {
        "name": "Silver Swan Soy Sauce 385ml",
        "category": "Condiments",
        "barcode": "480016838501",
        "cost_price": 25.00,
        "selling_price": 32.00,
        "stock_quantity": 15,
        "unit": "bottle",
        "low_stock_threshold": 5,
        "description": "Tamang-tamang timpla toyo"
    },
    {
        "name": "Datu Puti Vinegar 385ml",
        "category": "Condiments",
        "barcode": "480016838502",
        "cost_price": 20.00,
        "selling_price": 26.00,
        "stock_quantity": 15,
        "unit": "bottle",
        "low_stock_threshold": 5,
        "description": "Pure cane vinegar suka"
    },
    {
        "name": "Piattos Cheese Flavored Potato Crisps 85g",
        "category": "Snacks",
        "barcode": "480001608501",
        "cost_price": 32.00,
        "selling_price": 40.00,
        "stock_quantity": 20,
        "unit": "pack",
        "low_stock_threshold": 5,
        "description": "Hexagonal potato chips"
    },
    {
        "name": "Safeguard Pure White Soap 130g",
        "category": "Toiletries",
        "barcode": "490243013001",
        "cost_price": 42.00,
        "selling_price": 52.00,
        "stock_quantity": 10,
        "unit": "bar",
        "low_stock_threshold": 4,
        "description": "Family germ protection soap"
    },
    {
        "name": "Dinorado Special Rice (Per Kilo)",
        "category": "Rice & Grains",
        "barcode": "RICE-DINORADO-KG",
        "cost_price": 48.00,
        "selling_price": 56.00,
        "stock_quantity": 50,
        "unit": "kg",
        "low_stock_threshold": 15,
        "description": "Fragrant and soft Philippine rice"
    }
]

def seed_products_if_empty(db: Session):
    existing_count = db.query(models.Product).count()
    if existing_count == 0:
        for p_data in SAMPLE_PRODUCTS:
            product = models.Product(**p_data)
            db.add(product)
        db.commit()

        # Seed sample store settings
        if not db.query(models.StoreSetting).first():
            setting = models.StoreSetting(
                store_name="Aling Nena's Store",
                owner_name="Aling Nena",
                contact_number="0917-123-4567",
                address="Brgy. San Jose, Quezon City",
                receipt_footer="Salamat po sa pagtangkilik! Balik po kayo!"
            )
            db.add(setting)

        # Seed sample customer utang
        if db.query(models.CustomerUtang).count() == 0:
            sample_utangs = [
                models.CustomerUtang(
                    customer_name="Mang Kanor",
                    contact_number="0920-555-1122",
                    total_amount=650.00,
                    paid_amount=200.00,
                    balance=450.00,
                    status="partial",
                    notes="Noodles, kape, and bigas"
                ),
                models.CustomerUtang(
                    customer_name="Aling Marites",
                    contact_number="0918-444-3322",
                    total_amount=580.00,
                    paid_amount=0.00,
                    balance=580.00,
                    status="unpaid",
                    notes="Sardines and mantika"
                ),
                models.CustomerUtang(
                    customer_name="Kuya Jun",
                    contact_number="0995-123-9988",
                    total_amount=250.00,
                    paid_amount=0.00,
                    balance=250.00,
                    status="unpaid",
                    notes="Cigarettes and energy drink"
                )
            ]
            for u in sample_utangs:
                db.add(u)

        # Seed sample expenses
        if db.query(models.Expense).count() == 0:
            sample_expenses = [
                models.Expense(
                    title="Meralco Electricity Bill",
                    category="Utilities",
                    amount=1450.00,
                    notes="Store lights and beverage chiller"
                ),
                models.Expense(
                    title="Store Plastic Bags & Pouch Supplies",
                    category="Supplies",
                    amount=280.00,
                    notes="Balot / supot supplies"
                ),
                models.Expense(
                    title="Tricycle Freight for Balintawak Market Restock",
                    category="Transportation",
                    amount=150.00,
                    notes="Pamasahe hakot ng paninda"
                )
            ]
            for exp in sample_expenses:
                db.add(exp)

        db.commit()
        return True
    return False
