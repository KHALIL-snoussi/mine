"""
Product and inventory endpoints for complete kit business
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from ....database import get_db
from ....models.product import (
    Product, KitBundle, InventoryItem, ProductType, FrameType, PaintSetType,
    STANDARD_PRODUCTS, STANDARD_KIT_BUNDLES
)
from pydantic import BaseModel

router = APIRouter()


# Pydantic schemas for API responses
class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    display_name: str
    product_type: str
    sell_price: float
    description: Optional[str]
    features: Optional[List[str]]
    specifications: Optional[dict]
    stock_quantity: int
    is_active: bool
    is_featured: bool
    image_url: Optional[str]

    class Config:
        from_attributes = True


class KitBundleResponse(BaseModel):
    id: int
    sku: str
    name: str
    display_name: str
    description: Optional[str]
    includes_frame: bool
    frame_type: Optional[str]
    includes_paints: bool
    paint_set_type: Optional[str]
    includes_brushes: bool
    brush_count: int
    includes_canvas: bool
    total_price: float
    discount_percentage: float
    paper_format: str
    is_popular: bool
    display_order: int
    is_active: bool
    image_url: Optional[str]

    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    product_id: int
    product_name: str
    quantity_available: int
    in_stock: bool

    class Config:
        from_attributes = True


# ==================== KIT BUNDLES ====================

@router.get("/kits/list", response_model=List[KitBundleResponse])
async def list_kit_bundles(
    include_inactive: bool = False,
    format: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all available kit bundles

    - **include_inactive**: Include inactive/disabled kits
    - **format**: Filter by paper format (a4, a3, etc.)
    """
    query = select(KitBundle)

    if not include_inactive:
        query = query.where(KitBundle.is_active == True)

    if format:
        query = query.where(KitBundle.paper_format == format)

    query = query.order_by(KitBundle.display_order, KitBundle.total_price)

    result = db.execute(query)
    kits = result.scalars().all()

    return kits


@router.get("/kits/{kit_id}", response_model=KitBundleResponse)
async def get_kit_bundle(
    kit_id: int,
    db: Session = Depends(get_db)
):
    """Get specific kit bundle details"""
    query = select(KitBundle).where(KitBundle.id == kit_id)
    result = db.execute(query)
    kit = result.scalar_one_or_none()

    if not kit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kit bundle with id {kit_id} not found"
        )

    return kit


@router.get("/kits/by-sku/{sku}", response_model=KitBundleResponse)
async def get_kit_by_sku(
    sku: str,
    db: Session = Depends(get_db)
):
    """Get kit bundle by SKU"""
    query = select(KitBundle).where(KitBundle.sku == sku)
    result = db.execute(query)
    kit = result.scalar_one_or_none()

    if not kit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kit with SKU '{sku}' not found"
        )

    return kit


# ==================== INDIVIDUAL PRODUCTS ====================

@router.get("/products/list", response_model=List[ProductResponse])
async def list_products(
    product_type: Optional[ProductType] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all products

    - **product_type**: Filter by product type (frame, paint_set, brush_set, canvas)
    - **include_inactive**: Include inactive products
    """
    query = select(Product)

    if product_type:
        query = query.where(Product.product_type == product_type)

    if not include_inactive:
        query = query.where(Product.is_active == True)

    query = query.order_by(Product.product_type, Product.sell_price)

    result = db.execute(query)
    products = result.scalars().all()

    return products


@router.get("/products/frames", response_model=List[ProductResponse])
async def list_frames(db: Session = Depends(get_db)):
    """Get all available frames"""
    query = select(Product).where(
        Product.product_type == ProductType.FRAME,
        Product.is_active == True
    ).order_by(Product.sell_price)

    result = db.execute(query)
    frames = result.scalars().all()

    return frames


@router.get("/products/paints", response_model=List[ProductResponse])
async def list_paint_sets(db: Session = Depends(get_db)):
    """Get all available paint sets"""
    query = select(Product).where(
        Product.product_type == ProductType.PAINT_SET,
        Product.is_active == True
    ).order_by(Product.sell_price)

    result = db.execute(query)
    paints = result.scalars().all()

    return paints


@router.get("/products/brushes", response_model=List[ProductResponse])
async def list_brush_sets(db: Session = Depends(get_db)):
    """Get all available brush sets"""
    query = select(Product).where(
        Product.product_type == ProductType.BRUSH_SET,
        Product.is_active == True
    ).order_by(Product.sell_price)

    result = db.execute(query)
    brushes = result.scalars().all()

    return brushes


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get specific product details"""
    query = select(Product).where(Product.id == product_id)
    result = db.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    return product


# ==================== INVENTORY ====================

@router.get("/inventory/check", response_model=List[InventoryResponse])
async def check_inventory(
    product_ids: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Check inventory for products

    - **product_ids**: Comma-separated product IDs (e.g., "1,2,3")
    """
    query = select(InventoryItem).join(Product)

    if product_ids:
        ids = [int(id.strip()) for id in product_ids.split(',')]
        query = query.where(InventoryItem.product_id.in_(ids))

    result = db.execute(query)
    inventory_items = result.scalars().all()

    # Format response
    inventory_response = []
    for item in inventory_items:
        product = db.execute(
            select(Product).where(Product.id == item.product_id)
        ).scalar_one()

        inventory_response.append({
            "product_id": item.product_id,
            "product_name": product.name,
            "quantity_available": item.quantity_available,
            "in_stock": item.quantity_available > 0
        })

    return inventory_response


@router.get("/inventory/low-stock", response_model=List[InventoryResponse])
async def get_low_stock_items(db: Session = Depends(get_db)):
    """Get products that are low in stock"""
    query = select(InventoryItem).join(Product).where(
        InventoryItem.quantity_available <= InventoryItem.reorder_point,
        InventoryItem.quantity_available > 0
    )

    result = db.execute(query)
    inventory_items = result.scalars().all()

    inventory_response = []
    for item in inventory_items:
        product = db.execute(
            select(Product).where(Product.id == item.product_id)
        ).scalar_one()

        inventory_response.append({
            "product_id": item.product_id,
            "product_name": product.name,
            "quantity_available": item.quantity_available,
            "in_stock": True
        })

    return inventory_response


# ==================== RECOMMENDATIONS ====================

@router.get("/recommendations/bundle")
async def recommend_bundle(
    template_format: str = "a4",
    difficulty_level: str = "intermediate",
    db: Session = Depends(get_db)
):
    """
    Recommend a kit bundle based on template characteristics

    - **template_format**: Paper format (a4, a3)
    - **difficulty_level**: Template difficulty (beginner, intermediate, advanced)
    """
    # Recommendation logic
    recommendations = {
        ("a4", "beginner"): "kit_basic_a4",
        ("a4", "intermediate"): "kit_basic_a4",
        ("a4", "advanced"): "kit_premium_a4",
        ("a3", "beginner"): "kit_basic_a3",
        ("a3", "intermediate"): "kit_basic_a3",
        ("a3", "advanced"): "kit_premium_a3",
    }

    recommended_sku = recommendations.get(
        (template_format, difficulty_level),
        "kit_basic_a4"
    )

    # Get the kit
    query = select(KitBundle).where(KitBundle.sku == recommended_sku)
    result = db.execute(query)
    kit = result.scalar_one_or_none()

    if not kit:
        # Return default kit
        query = select(KitBundle).where(KitBundle.is_popular == True)
        result = db.execute(query)
        kit = result.scalar_one_or_none()

    return {
        "recommended_kit": KitBundleResponse.from_orm(kit) if kit else None,
        "reason": f"Recommended for {difficulty_level} level {template_format.upper()} templates",
        "alternatives": [
            {
                "sku": "template_digital",
                "reason": "Already have paints and frame? Get just the digital PDF"
            },
            {
                "sku": "template_only",
                "reason": "Already have paints? Get just the canvas"
            }
        ]
    }


# ==================== ADMIN/SEEDING ====================

@router.post("/admin/seed-products")
async def seed_products(db: Session = Depends(get_db)):
    """
    Seed database with standard products (Admin only - should be protected)
    """
    # Check if products already exist
    existing = db.execute(select(Product)).first()
    if existing:
        return {"message": "Products already seeded"}

    # Seed products
    for key, product_data in STANDARD_PRODUCTS.items():
        product = Product(**product_data)
        db.add(product)

    db.commit()

    return {"message": f"Seeded {len(STANDARD_PRODUCTS)} products"}


@router.post("/admin/seed-kits")
async def seed_kits(db: Session = Depends(get_db)):
    """
    Seed database with standard kit bundles (Admin only - should be protected)
    """
    # Check if kits already exist
    existing = db.execute(select(KitBundle)).first()
    if existing:
        return {"message": "Kits already seeded"}

    # Seed kits
    for key, kit_data in STANDARD_KIT_BUNDLES.items():
        kit = KitBundle(**kit_data)
        db.add(kit)

    db.commit()

    return {"message": f"Seeded {len(STANDARD_KIT_BUNDLES)} kit bundles"}
