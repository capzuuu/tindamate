from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[schemas.ExpenseResponse])
def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db)
):
    return crud.get_expenses(db, skip=skip, limit=limit)

@router.post("", response_model=schemas.ExpenseResponse, status_code=201)
def add_expense(exp_in: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    return crud.create_expense(db, exp_in)

@router.delete("/{expense_id}")
def remove_expense(expense_id: int, db: Session = Depends(get_db)):
    success = crud.delete_expense(db, expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}
