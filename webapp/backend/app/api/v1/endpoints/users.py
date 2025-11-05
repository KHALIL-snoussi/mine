"""
User management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.api.v1.endpoints.auth import get_password_hash

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user information
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update current user
    """
    # Update fields if provided
    if user_update.email is not None:
        # Check if email is already taken
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/usage", response_model=dict)
def get_usage_stats(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user's usage statistics
    """
    # Determine limits based on role
    limits = {
        "FREE": 3,
        "BASIC": 25,
        "PRO": float('inf'),
        "ADMIN": float('inf'),
    }

    limit = limits.get(current_user.role.value, 3)

    return {
        "role": current_user.role.value,
        "templates_used_this_month": current_user.templates_used_this_month,
        "monthly_limit": limit if limit != float('inf') else None,
        "unlimited": limit == float('inf'),
        "remaining": max(0, limit - current_user.templates_used_this_month) if limit != float('inf') else None,
    }
