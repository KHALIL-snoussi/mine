"""
Paint Kit Product System - Business Model Implementation
Defines standardized paint kits for recurring revenue and simplified inventory
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
import json
from pathlib import Path


@dataclass
class PaintKit:
    """Represents a physical paint kit product"""
    id: str
    name: str
    display_name: str
    description: str
    palette_name: str  # Links to palettes.py
    num_colors: int
    price_usd: float
    sku: str

    # Marketing
    target_audience: str
    difficulty_level: str
    best_for: List[str]

    # Product details
    includes: List[str]
    paint_volume_ml: int  # Per bottle
    estimated_projects: int  # How many templates can be completed

    # E-commerce
    shopify_product_id: Optional[str] = None
    stripe_price_id: Optional[str] = None
    weight_grams: int = 250

    # Upselling
    upgrade_to: Optional[str] = None  # Next tier kit ID
    complementary_products: List[str] = None

    def __post_init__(self):
        if self.complementary_products is None:
            self.complementary_products = []


# ==========================================
# PRODUCT CATALOG - PAINT KITS
# ==========================================

PAINT_KITS = {
    "starter_kit": PaintKit(
        id="starter_kit",
        name="Starter Kit",
        display_name="Paint by Numbers - Starter Kit",
        description="Perfect for beginners! Everything you need to start your paint by numbers journey.",
        palette_name="classic_12",
        num_colors=12,
        price_usd=24.99,
        sku="PBN-START-12",

        target_audience="Beginners, Kids (8+), Gift Buyers",
        difficulty_level="Easy",
        best_for=[
            "First-time painters",
            "Simple portraits",
            "Children's projects",
            "Quick weekend projects"
        ],

        includes=[
            "12 premium acrylic paint bottles (30ml each)",
            "3 quality paint brushes (fine, medium, broad)",
            "Printed color reference card",
            "Step-by-step instruction guide",
            "Bonus: Digital templates access"
        ],
        paint_volume_ml=30,
        estimated_projects=3,  # 3 templates with this kit
        weight_grams=450,

        upgrade_to="creative_kit",
        complementary_products=["canvas_pack", "brush_set_premium", "easel_basic"]
    ),

    "creative_kit": PaintKit(
        id="creative_kit",
        name="Creative Kit",
        display_name="Paint by Numbers - Creative Kit",
        description="For the passionate painter! More colors for richer, more detailed artwork.",
        palette_name="classic_18",
        num_colors=18,
        price_usd=39.99,
        sku="PBN-CREATE-18",

        target_audience="Hobbyists, Art Enthusiasts, Adults",
        difficulty_level="Intermediate",
        best_for=[
            "Detailed portraits",
            "Landscape paintings",
            "Pet portraits",
            "Home decor projects"
        ],

        includes=[
            "18 premium acrylic paint bottles (30ml each)",
            "5 quality paint brushes (various sizes)",
            "Color mixing guide",
            "Printed color reference card",
            "Palette tray for mixing",
            "Premium: 10 digital template credits"
        ],
        paint_volume_ml=30,
        estimated_projects=5,
        weight_grams=680,

        upgrade_to="professional_kit",
        complementary_products=["canvas_pack_large", "brush_set_pro", "easel_adjustable", "frame_kit"]
    ),

    "professional_kit": PaintKit(
        id="professional_kit",
        name="Professional Kit",
        display_name="Paint by Numbers - Professional Kit",
        description="The ultimate collection for serious artists. Professional-grade paints and maximum color range.",
        palette_name="classic_24",
        num_colors=24,
        price_usd=59.99,
        sku="PBN-PRO-24",

        target_audience="Advanced Painters, Professional Artists, Sellers",
        difficulty_level="Advanced",
        best_for=[
            "Complex artwork",
            "Gallery-quality pieces",
            "Commission work",
            "Multiple large projects",
            "Teaching workshops"
        ],

        includes=[
            "24 professional acrylic paint bottles (50ml each)",
            "8 premium paint brushes (complete range)",
            "Advanced color mixing guide",
            "Professional color reference poster",
            "Large palette tray",
            "Paint storage organizer",
            "Premium: Unlimited digital templates for 1 year"
        ],
        paint_volume_ml=50,
        estimated_projects=10,
        weight_grams=1200,

        upgrade_to=None,  # Top tier
        complementary_products=["canvas_pack_xl", "frame_custom", "easel_professional", "varnish_kit"]
    ),

    "pastel_dreams_kit": PaintKit(
        id="pastel_dreams_kit",
        name="Pastel Dreams Kit",
        display_name="Paint by Numbers - Pastel Dreams Edition",
        description="Soft, beautiful pastel colors perfect for delicate artwork and nursery decor.",
        palette_name="pastel_12",
        num_colors=12,
        price_usd=29.99,
        sku="PBN-PASTEL-12",

        target_audience="Women 25-45, Nursery Decorators, Soft Aesthetic",
        difficulty_level="Easy to Intermediate",
        best_for=[
            "Baby nursery art",
            "Soft portraits",
            "Floral artwork",
            "Feminine decor",
            "Wedding gifts"
        ],

        includes=[
            "12 premium pastel acrylic paints (30ml each)",
            "3 soft-bristle brushes",
            "Pastel color guide",
            "Printed reference card",
            "Bonus: 5 pastel-themed templates"
        ],
        paint_volume_ml=30,
        estimated_projects=4,
        weight_grams=450,

        upgrade_to="creative_kit",
        complementary_products=["canvas_pack", "frame_white", "ribbon_hangers"]
    ),

    "nature_collection_kit": PaintKit(
        id="nature_collection_kit",
        name="Nature Collection Kit",
        display_name="Paint by Numbers - Nature Collection",
        description="Earth tones and natural colors for landscapes, wildlife, and outdoor scenes.",
        palette_name="nature_15",
        num_colors=15,
        price_usd=34.99,
        sku="PBN-NATURE-15",

        target_audience="Nature Lovers, Outdoor Enthusiasts, Landscape Painters",
        difficulty_level="Intermediate",
        best_for=[
            "Landscape paintings",
            "Wildlife portraits",
            "Forest scenes",
            "Beach artwork",
            "Mountain vistas"
        ],

        includes=[
            "15 nature-inspired acrylic paints (30ml each)",
            "4 landscape brushes",
            "Nature color mixing guide",
            "Outdoor scene templates (3 included)",
            "Color reference card"
        ],
        paint_volume_ml=30,
        estimated_projects=4,
        weight_grams=550,

        upgrade_to="creative_kit",
        complementary_products=["canvas_pack", "easel_outdoor", "nature_template_pack"]
    ),

    "vibrant_artist_kit": PaintKit(
        id="vibrant_artist_kit",
        name="Vibrant Artist Kit",
        display_name="Paint by Numbers - Vibrant Artist Edition",
        description="Bold, vivid colors for modern art, pop art, and eye-catching designs.",
        palette_name="vibrant_18",
        num_colors=18,
        price_usd=42.99,
        sku="PBN-VIBRANT-18",

        target_audience="Young Adults 18-35, Modern Art Fans, Bold Aesthetic",
        difficulty_level="Intermediate to Advanced",
        best_for=[
            "Pop art style",
            "Modern portraits",
            "Abstract designs",
            "Colorful animals",
            "Statement pieces"
        ],

        includes=[
            "18 vivid acrylic paints (40ml each)",
            "5 precision brushes",
            "Color theory guide",
            "Neon & metallic accent colors (2 bonus)",
            "Modern art templates (5 included)"
        ],
        paint_volume_ml=40,
        estimated_projects=5,
        weight_grams=800,

        upgrade_to="professional_kit",
        complementary_products=["canvas_pack_large", "frame_black", "led_lighting"]
    ),
}


# ==========================================
# SUBSCRIPTION PLANS
# ==========================================

@dataclass
class SubscriptionPlan:
    """Monthly subscription for templates + paint refills"""
    id: str
    name: str
    description: str
    price_monthly_usd: float
    paint_kit_included: str  # Which kit they get
    template_credits_monthly: int
    paint_refill_frequency: str  # "monthly", "quarterly", "as-needed"
    savings_percent: int

    includes: List[str]
    stripe_subscription_id: Optional[str] = None


SUBSCRIPTION_PLANS = {
    "creative_monthly": SubscriptionPlan(
        id="creative_monthly",
        name="Creative Monthly",
        description="Paint a new masterpiece every month!",
        price_monthly_usd=29.99,
        paint_kit_included="creative_kit",  # One-time on signup
        template_credits_monthly=4,  # 4 new templates per month
        paint_refill_frequency="quarterly",  # Refill every 3 months
        savings_percent=25,

        includes=[
            "Creative Kit on signup (18 colors)",
            "4 new premium templates monthly",
            "Paint refills every quarter",
            "Exclusive member-only templates",
            "10% discount on accessories",
            "Priority customer support"
        ]
    ),

    "professional_monthly": SubscriptionPlan(
        id="professional_monthly",
        name="Professional Unlimited",
        description="For serious artists - unlimited templates!",
        price_monthly_usd=49.99,
        paint_kit_included="professional_kit",
        template_credits_monthly=999,  # Unlimited
        paint_refill_frequency="monthly",
        savings_percent=40,

        includes=[
            "Professional Kit on signup (24 colors)",
            "UNLIMITED templates monthly",
            "Monthly paint refills",
            "Early access to new features",
            "Custom template requests (1 per month)",
            "20% discount on all products",
            "Premium customer support"
        ]
    ),
}


# ==========================================
# ACCESSORY PRODUCTS
# ==========================================

ACCESSORIES = {
    "canvas_pack": {
        "name": "Premium Canvas Pack (5 pack)",
        "price_usd": 19.99,
        "sku": "PBN-CANVAS-5",
        "description": "5 pre-stretched canvases, 12x16 inches"
    },
    "canvas_pack_large": {
        "name": "Large Canvas Pack (3 pack)",
        "price_usd": 29.99,
        "sku": "PBN-CANVAS-L3",
        "description": "3 pre-stretched canvases, 16x20 inches"
    },
    "brush_set_premium": {
        "name": "Premium Brush Set (10 pieces)",
        "price_usd": 14.99,
        "sku": "PBN-BRUSH-P10"
    },
    "easel_adjustable": {
        "name": "Adjustable Tabletop Easel",
        "price_usd": 24.99,
        "sku": "PBN-EASEL-ADJ"
    },
    "frame_kit": {
        "name": "Floating Frame Kit",
        "price_usd": 18.99,
        "sku": "PBN-FRAME-FLOAT"
    },
    "varnish_kit": {
        "name": "Professional Varnish & Finishing Kit",
        "price_usd": 16.99,
        "sku": "PBN-VARNISH"
    },
}


# ==========================================
# BUSINESS LOGIC
# ==========================================

class PaintKitManager:
    """Manages paint kit products and recommendations"""

    def __init__(self):
        self.kits = PAINT_KITS
        self.subscriptions = SUBSCRIPTION_PLANS
        self.accessories = ACCESSORIES

    def get_all_kits(self) -> Dict[str, PaintKit]:
        """Get all available paint kits"""
        return self.kits

    def get_kit_by_id(self, kit_id: str) -> Optional[PaintKit]:
        """Get paint kit by ID"""
        return self.kits.get(kit_id)

    def get_kit_by_palette(self, palette_name: str) -> Optional[PaintKit]:
        """Get paint kit that uses a specific palette"""
        for kit in self.kits.values():
            if kit.palette_name == palette_name:
                return kit
        return None

    def recommend_kit_for_image(self, difficulty_score: float, num_colors_needed: int) -> PaintKit:
        """
        Recommend a paint kit based on image analysis

        Args:
            difficulty_score: 0-100 difficulty rating
            num_colors_needed: Number of unique colors in analysis

        Returns:
            Recommended PaintKit
        """
        # Simple logic - can be enhanced with ML
        if difficulty_score < 30 or num_colors_needed <= 12:
            return self.kits["starter_kit"]
        elif difficulty_score < 60 or num_colors_needed <= 18:
            return self.kits["creative_kit"]
        else:
            return self.kits["professional_kit"]

    def get_upsell_recommendations(self, current_kit_id: str) -> List[Dict]:
        """Get upsell product recommendations"""
        kit = self.kits.get(current_kit_id)
        if not kit:
            return []

        recommendations = []

        # Upgrade kit
        if kit.upgrade_to:
            upgrade_kit = self.kits[kit.upgrade_to]
            recommendations.append({
                "type": "upgrade",
                "product": upgrade_kit,
                "message": f"Upgrade to {upgrade_kit.display_name} for {upgrade_kit.num_colors - kit.num_colors} more colors!"
            })

        # Accessories
        for acc_id in kit.complementary_products[:3]:  # Top 3
            if acc_id in self.accessories:
                recommendations.append({
                    "type": "accessory",
                    "product": self.accessories[acc_id],
                    "message": "Complete your setup!"
                })

        # Subscription
        recommendations.append({
            "type": "subscription",
            "product": self.subscriptions["creative_monthly"],
            "message": "Save 25% with monthly subscription!"
        })

        return recommendations

    def calculate_lifetime_value(self, kit_id: str, includes_subscription: bool = False) -> Dict:
        """
        Calculate customer lifetime value

        Returns metrics for business planning
        """
        kit = self.kits[kit_id]

        # Initial purchase
        initial_revenue = kit.price_usd

        # Average additional purchases
        avg_accessory_revenue = 30.00  # Estimated
        avg_template_purchases = 15.00  # If not subscribed

        if includes_subscription:
            # 12 month average retention
            subscription_revenue = 29.99 * 12  # Conservative estimate
            total_ltv = initial_revenue + subscription_revenue + avg_accessory_revenue
            churn_rate = 0.15  # 15% per year
        else:
            # One-time buyer
            total_ltv = initial_revenue + avg_template_purchases + (avg_accessory_revenue * 0.3)
            churn_rate = 1.0  # Will churn eventually

        return {
            "initial_revenue": initial_revenue,
            "ltv_1year": total_ltv,
            "estimated_margin": total_ltv * 0.65,  # 65% margin
            "churn_risk": churn_rate
        }

    def export_product_catalog(self, filepath: str):
        """Export product catalog for e-commerce platform"""
        catalog = {
            "paint_kits": {},
            "subscriptions": {},
            "accessories": self.accessories,
            "generated_at": str(Path(filepath).stem)
        }

        # Convert dataclasses to dicts
        for kit_id, kit in self.kits.items():
            catalog["paint_kits"][kit_id] = {
                "id": kit.id,
                "name": kit.name,
                "display_name": kit.display_name,
                "description": kit.description,
                "palette_name": kit.palette_name,
                "num_colors": kit.num_colors,
                "price_usd": kit.price_usd,
                "sku": kit.sku,
                "target_audience": kit.target_audience,
                "difficulty_level": kit.difficulty_level,
                "best_for": kit.best_for,
                "includes": kit.includes,
                "estimated_projects": kit.estimated_projects,
                "weight_grams": kit.weight_grams,
                "upgrade_to": kit.upgrade_to,
                "complementary_products": kit.complementary_products
            }

        for sub_id, sub in self.subscriptions.items():
            catalog["subscriptions"][sub_id] = {
                "id": sub.id,
                "name": sub.name,
                "description": sub.description,
                "price_monthly_usd": sub.price_monthly_usd,
                "paint_kit_included": sub.paint_kit_included,
                "template_credits_monthly": sub.template_credits_monthly,
                "savings_percent": sub.savings_percent,
                "includes": sub.includes
            }

        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(catalog, f, indent=2)

    def get_marketing_copy(self, kit_id: str) -> Dict[str, str]:
        """Generate marketing copy for a paint kit"""
        kit = self.kits[kit_id]

        return {
            "headline": f"🎨 {kit.display_name} - ${kit.price_usd}",
            "subheadline": kit.description,
            "value_prop": f"Paint {kit.estimated_projects}+ beautiful artworks with {kit.num_colors} perfect colors",
            "cta_primary": "Add to Cart - Start Painting Today!",
            "cta_secondary": f"Upgrade to {self.kits[kit.upgrade_to].name}" if kit.upgrade_to else "View Professional Kit",
            "social_proof": f"Perfect for {kit.target_audience}",
            "urgency": "🎁 Free shipping on orders over $50!",
            "guarantee": "30-day money-back guarantee • 100% satisfaction"
        }
