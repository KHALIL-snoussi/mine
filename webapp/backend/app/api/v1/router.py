"""
API v1 Router - Combines all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import templates, auth, users, products

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
