from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/settings", tags=["Store Settings"])

@router.get("", response_model=schemas.StoreSettingResponse)
def get_settings(db: Session = Depends(get_db)):
    return crud.get_or_create_store_setting(db)

@router.put("", response_model=schemas.StoreSettingResponse)
def update_settings(setting_in: schemas.StoreSettingUpdate, db: Session = Depends(get_db)):
    return crud.update_store_setting(db, setting_in)
