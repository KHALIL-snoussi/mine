"""
Product and inventory models for complete kit business

Manages physical products: frames, paints, brushes, canvas
Handles kit bundles and add-ons
Tracks inventory for fulfillment
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy import DateTime
import enum

Base = declarative_base()


class ProductType(str, enum.Enum):
    """Product category types"""
    FRAME = "frame"
    PAINT_SET = "paint_set"
    BRUSH_SET = "brush_set"
    CANVAS = "canvas"
    KIT_BUNDLE = "kit_bundle"
    TEMPLATE_ONLY = "template_only"
    ADDON = "addon"


class FrameType(str, enum.Enum):
    """Frame quality tiers"""
    NONE = "none"
    BASIC_WOOD = "basic_wood"
    PREMIUM_WOOD = "premium_wood"
    LUXURY_FRAMED = "luxury_framed"


class PaintSetType(str, enum.Enum):
    """Paint set palette options"""
    CLASSIC_12 = "classic_12"
    CLASSIC_18 = "classic_18"
    CLASSIC_24 = "classic_24"
    VIBRANT_18 = "vibrant_18"
    PASTEL_12 = "pastel_12"
    EARTH_15 = "earth_15"
    NATURE_15 = "nature_15"


class Product(Base):
    """Physical product in inventory"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)  # e.g., "FRM-A4-BAS"
    name = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    product_type = Column(SQLEnum(ProductType), nullable=False)

    # Pricing
    cost_price = Column(Float, default=0.0)  # What you pay
    sell_price = Column(Float, nullable=False)  # What customer pays

    # Description
    description = Column(Text)
    features = Column(JSON)  # List of feature bullets

    # Specifications
    specifications = Column(JSON)  # Size, material, etc.

    # Inventory
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)

    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)

    # Metadata
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class KitBundle(Base):
    """Pre-configured product bundles (Complete Kits)"""
    __tablename__ = "kit_bundles"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)  # e.g., "KIT-BAS-A4"
    name = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    description = Column(Text)

    # What's included
    includes_frame = Column(Boolean, default=True)
    frame_type = Column(SQLEnum(FrameType), default=FrameType.BASIC_WOOD)

    includes_paints = Column(Boolean, default=True)
    paint_set_type = Column(SQLEnum(PaintSetType), default=PaintSetType.CLASSIC_18)

    includes_brushes = Column(Boolean, default=True)
    brush_count = Column(Integer, default=3)

    includes_canvas = Column(Boolean, default=True)

    # Pricing
    total_price = Column(Float, nullable=False)
    discount_percentage = Column(Float, default=0)  # Bundle discount

    # Format
    paper_format = Column(String, default="a4")  # Links to formats.py

    # Popularity
    is_popular = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class InventoryItem(Base):
    """Inventory tracking for physical products"""
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))

    # Quantities
    quantity_on_hand = Column(Integer, default=0)
    quantity_reserved = Column(Integer, default=0)  # In pending orders
    quantity_available = Column(Integer, default=0)  # on_hand - reserved

    # Restocking
    reorder_point = Column(Integer, default=10)
    reorder_quantity = Column(Integer, default=100)

    # Location
    warehouse_location = Column(String)  # Shelf/bin location

    # Tracking
    last_restocked = Column(DateTime)
    last_checked = Column(DateTime)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Pre-configured products for easy setup
STANDARD_PRODUCTS = {
    # FRAMES
    "frame_a4_basic": {
        "sku": "FRM-A4-BAS",
        "name": "A4 Basic Wood Frame",
        "display_name": "Basic Wooden Frame (A4)",
        "product_type": ProductType.FRAME,
        "cost_price": 3.00,
        "sell_price": 12.00,
        "description": "Simple wooden frame, perfect for desk display",
        "features": ["Natural wood finish", "A4 size (8.3×11.7\")", "Easy hanging hardware"],
        "specifications": {"size": "a4", "material": "wood", "color": "natural"},
    },
    "frame_a4_premium": {
        "sku": "FRM-A4-PRE",
        "name": "A4 Premium Wood Frame",
        "display_name": "Premium Frame with Glass (A4)",
        "product_type": ProductType.FRAME,
        "cost_price": 5.50,
        "sell_price": 18.00,
        "description": "High-quality frame with protective glass",
        "features": ["Premium wood finish", "Protective glass", "Mat board included", "Gallery quality"],
        "specifications": {"size": "a4", "material": "wood", "color": "black", "glass": True},
    },
    "frame_a3_basic": {
        "sku": "FRM-A3-BAS",
        "name": "A3 Basic Wood Frame",
        "display_name": "Basic Wooden Frame (A3)",
        "product_type": ProductType.FRAME,
        "cost_price": 4.50,
        "sell_price": 18.00,
        "description": "Large wooden frame for wall display",
        "features": ["Natural wood finish", "A3 size (11.7×16.5\")", "Sturdy construction"],
        "specifications": {"size": "a3", "material": "wood", "color": "natural"},
    },
    "frame_a3_premium": {
        "sku": "FRM-A3-PRE",
        "name": "A3 Premium Wood Frame",
        "display_name": "Premium Frame with Glass (A3)",
        "product_type": ProductType.FRAME,
        "cost_price": 8.00,
        "sell_price": 28.00,
        "description": "Gallery-quality large frame",
        "features": ["Premium wood", "UV-protective glass", "Mat board", "Museum quality"],
        "specifications": {"size": "a3", "material": "wood", "color": "black", "glass": True},
    },

    # PAINT SETS
    "paint_classic_18": {
        "sku": "PNT-CLS-18",
        "name": "Classic 18-Color Paint Set",
        "display_name": "Classic Paint Set (18 colors)",
        "product_type": ProductType.PAINT_SET,
        "cost_price": 8.00,
        "sell_price": 24.00,
        "description": "Complete acrylic paint set for any template",
        "features": [
            "18 premium acrylic colors",
            "Works with ALL Classic templates",
            "Long-lasting, won't dry out",
            "Non-toxic, water-based",
            "Includes color mixing guide"
        ],
        "specifications": {"colors": 18, "volume_per_color": "12ml", "type": "acrylic"},
    },
    "paint_vibrant_18": {
        "sku": "PNT-VIB-18",
        "name": "Vibrant 18-Color Paint Set",
        "display_name": "Vibrant Paint Set (18 colors)",
        "product_type": ProductType.PAINT_SET,
        "cost_price": 8.00,
        "sell_price": 24.00,
        "description": "Bold, bright colors for vibrant templates",
        "features": [
            "18 vibrant acrylic colors",
            "Works with Vibrant & Artistic templates",
            "High pigment concentration",
            "Eye-catching results"
        ],
        "specifications": {"colors": 18, "volume_per_color": "12ml", "type": "acrylic"},
    },

    # BRUSH SETS
    "brushes_basic": {
        "sku": "BRU-BAS-3",
        "name": "Basic Brush Set",
        "display_name": "Basic Brush Set (3 pieces)",
        "product_type": ProductType.BRUSH_SET,
        "cost_price": 2.00,
        "sell_price": 8.00,
        "description": "Essential brushes for paint by numbers",
        "features": ["3 different sizes", "Fine detail work", "Easy to clean"],
        "specifications": {"count": 3, "sizes": ["small", "medium", "large"]},
    },
    "brushes_premium": {
        "sku": "BRU-PRE-5",
        "name": "Premium Brush Set",
        "display_name": "Premium Brush Set (5 pieces)",
        "product_type": ProductType.BRUSH_SET,
        "cost_price": 4.00,
        "sell_price": 15.00,
        "description": "Professional-grade brushes for detailed work",
        "features": ["5 artist-grade brushes", "Ultra-fine detail", "Durable synthetic bristles"],
        "specifications": {"count": 5, "sizes": ["extra fine", "fine", "small", "medium", "large"]},
    },
}

# Pre-configured kit bundles
STANDARD_KIT_BUNDLES = {
    "kit_basic_a4": {
        "sku": "KIT-BAS-A4",
        "name": "Basic Canvas Kit (A4)",
        "display_name": "Basic Canvas Kit",
        "description": "Everything you need to start painting - best value!",
        "includes_frame": True,
        "frame_type": FrameType.BASIC_WOOD,
        "includes_paints": True,
        "paint_set_type": PaintSetType.CLASSIC_18,
        "includes_brushes": True,
        "brush_count": 3,
        "includes_canvas": True,
        "total_price": 49.99,
        "paper_format": "a4",
        "is_popular": True,
        "display_order": 2,
    },
    "kit_premium_a4": {
        "sku": "KIT-PRE-A4",
        "name": "Premium Canvas Kit (A4)",
        "display_name": "Premium Canvas Kit",
        "description": "Premium frame with glass - gallery quality!",
        "includes_frame": True,
        "frame_type": FrameType.PREMIUM_WOOD,
        "includes_paints": True,
        "paint_set_type": PaintSetType.CLASSIC_18,
        "includes_brushes": True,
        "brush_count": 5,
        "includes_canvas": True,
        "total_price": 69.99,
        "paper_format": "a4",
        "is_popular": False,
        "display_order": 3,
    },
    "kit_basic_a3": {
        "sku": "KIT-BAS-A3",
        "name": "Basic Canvas Kit (A3)",
        "display_name": "Large Canvas Kit",
        "description": "Large format for more detailed painting",
        "includes_frame": True,
        "frame_type": FrameType.BASIC_WOOD,
        "includes_paints": True,
        "paint_set_type": PaintSetType.CLASSIC_18,
        "includes_brushes": True,
        "brush_count": 3,
        "includes_canvas": True,
        "total_price": 79.99,
        "paper_format": "a3",
        "is_popular": False,
        "display_order": 4,
    },
    "kit_premium_a3": {
        "sku": "KIT-PRE-A3",
        "name": "Premium Canvas Kit (A3)",
        "display_name": "Premium Large Kit",
        "description": "Our finest kit - perfect for special projects",
        "includes_frame": True,
        "frame_type": FrameType.PREMIUM_WOOD,
        "includes_paints": True,
        "paint_set_type": PaintSetType.CLASSIC_18,
        "includes_brushes": True,
        "brush_count": 5,
        "includes_canvas": True,
        "total_price": 99.99,
        "paper_format": "a3",
        "is_popular": False,
        "display_order": 5,
    },
    "template_digital": {
        "sku": "TMP-DIG-PDF",
        "name": "Digital PDF Template",
        "display_name": "Digital PDF Only",
        "description": "Print at home - perfect if you have supplies",
        "includes_frame": False,
        "includes_paints": False,
        "includes_brushes": False,
        "includes_canvas": False,
        "total_price": 19.99,
        "paper_format": "a4",
        "is_popular": False,
        "display_order": 1,
    },
    "template_only": {
        "sku": "TMP-CNV-ONLY",
        "name": "Printed Canvas Only",
        "display_name": "Canvas Only (Already Have Paints)",
        "description": "Just the canvas - for customers who have paint sets",
        "includes_frame": False,
        "includes_paints": False,
        "includes_brushes": False,
        "includes_canvas": True,
        "total_price": 14.99,
        "paper_format": "a4",
        "is_popular": False,
        "display_order": 6,
    },
}
