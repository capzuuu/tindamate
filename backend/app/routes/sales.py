from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("", response_model=List[schemas.SaleResponse])
def read_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Get sales transaction history
    """
    return crud.get_sales(db, skip=skip, limit=limit)

@router.post("", response_model=schemas.SaleResponse, status_code=201)
def process_new_sale(
    sale_in: schemas.SaleCreate,
    db: Session = Depends(get_db)
):
    """
    Record a new POS sale, deduct inventory stock, and issue receipt
    """
    return crud.create_sale(db, sale_in)

@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def read_sale_details(sale_id: int, db: Session = Depends(get_db)):
    sale = crud.get_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale transaction not found")
    return sale

@router.post("/{sale_id}/void", response_model=schemas.SaleResponse)
def void_existing_sale(sale_id: int, db: Session = Depends(get_db)):
    """
    Void a sale transaction and restore inventory stock
    """
    return crud.void_sale(db, sale_id)
