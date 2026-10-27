from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Get real-time dashboard metrics (today's revenue, profit, stock valuation, top sellers)
    """
    return crud.get_dashboard_stats(db)
