from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, models
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/status")
def get_auth_status(db: Session = Depends(get_db)):
    """
    Check if any user accounts exist.
    Helps frontend determine if initial store setup or login is needed.
    """
    count = db.query(models.User).count()
    return {
        "has_users": count > 0,
        "users_count": count
    }

@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Register a new store user (Owner or Cashier) and return JWT access token.
    """
    # Check if username already exists
    existing = db.query(models.User).filter(models.User.username == user_in.username.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_in.username}' is already taken"
        )

    # First user automatically becomes owner
    user_count = db.query(models.User).count()
    role = "owner" if user_count == 0 else user_in.role

    new_user = models.User(
        username=user_in.username.strip().lower(),
        full_name=user_in.full_name.strip(),
        email=user_in.email.strip().lower() if user_in.email else None,
        hashed_password=hash_password(user_in.password),
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    token = create_access_token(data={"sub": new_user.username, "role": new_user.role, "id": new_user.id})

    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user with username and password, returns JWT token.
    """
    user = db.query(models.User).filter(models.User.username == login_in.username.strip().lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    token = create_access_token(data={"sub": user.username, "role": user.role, "id": user.id})

    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserResponse.model_validate(user)
    )

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """
    Get profile of currently logged-in user from JWT token.
    """
    return current_user
