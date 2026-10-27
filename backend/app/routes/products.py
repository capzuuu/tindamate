from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[schemas.ProductResponse])
def read_products(
    search: Optional[str] = Query(None, description="Search by name, category, or barcode"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Filter only low stock products"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List products with optional search, category filter, and low-stock filter
    """
    return crud.get_products(db, search=search, category=category, low_stock_only=low_stock_only, skip=skip, limit=limit)

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """
    Get distinct list of existing product categories
    """
    products = crud.get_products(db, limit=1000)
    categories = sorted(list({p.category for p in products if p.category}))
    return categories

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=schemas.ProductResponse, status_code=201)
def create_new_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product_in)

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_existing_product(product_id: int, product_in: schemas.ProductUpdate, db: Session = Depends(get_db)):
    updated = crud.update_product(db, product_id, product_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/{product_id}")
def delete_existing_product(product_id: int, db: Session = Depends(get_db)):
    success = crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product successfully deleted", "id": product_id}

@router.patch("/{product_id}/stock", response_model=schemas.ProductResponse)
def adjust_product_stock(
    product_id: int,
    change: int = Query(..., description="Quantity to add (positive) or deduct (negative)"),
    db: Session = Depends(get_db)
):
    updated = crud.adjust_stock(db, product_id, change)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated
