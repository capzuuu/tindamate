from fastapi import APIRouter
from app.database import check_db_health
from app.schemas import HealthStatus

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthStatus)
def get_health():
    """
    Returns API health and MySQL connection status
    """
    return check_db_health()
