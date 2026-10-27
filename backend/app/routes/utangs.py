from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/utangs", tags=["Customer Utang"])

@router.get("", response_model=List[schemas.CustomerUtangResponse])
def list_utangs(
    status: Optional[str] = Query(None, description="Filter by status: unpaid, partial, paid, or all"),
    search: Optional[str] = Query(None, description="Search by customer name"),
    db: Session = Depends(get_db)
):
    return crud.get_utangs(db, status=status, search=search)

@router.post("", response_model=schemas.CustomerUtangResponse, status_code=201)
def add_utang(utang_in: schemas.CustomerUtangCreate, db: Session = Depends(get_db)):
    return crud.create_utang(db, utang_in)

@router.post("/{utang_id}/payments", response_model=schemas.CustomerUtangResponse)
def add_utang_payment(utang_id: int, payment_in: schemas.UtangPaymentCreate, db: Session = Depends(get_db)):
    return crud.record_utang_payment(db, utang_id, payment_in)

@router.delete("/{utang_id}")
def remove_utang(utang_id: int, db: Session = Depends(get_db)):
    success = crud.delete_utang(db, utang_id)
    if not success:
        raise HTTPException(status_code=404, detail="Utang not found")
    return {"message": "Utang record deleted"}
