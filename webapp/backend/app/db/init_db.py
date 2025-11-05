"""
Database initialization and seeding script
Run this to set up initial data for the application
"""

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import SessionLocal, engine
from app.models.template import Base as TemplateBase
from app.models.user import Base as UserBase
from app.models.product import (
    Base as ProductBase,
    Product, KitBundle, InventoryItem,
    STANDARD_PRODUCTS, STANDARD_KIT_BUNDLES
)


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")

    # Create all tables
    TemplateBase.metadata.create_all(bind=engine)
    UserBase.metadata.create_all(bind=engine)
    ProductBase.metadata.create_all(bind=engine)

    print("✓ Tables created successfully")


def seed_products(db: Session):
    """Seed standard products into database"""
    print("\nSeeding standard products...")

    # Check if products already exist
    existing = db.execute(select(Product)).first()
    if existing:
        print("⚠️  Products already exist, skipping...")
        return

    # Add all standard products
    count = 0
    for product_key, product_data in STANDARD_PRODUCTS.items():
        product = Product(**product_data)
        db.add(product)
        count += 1

    db.commit()
    print(f"✓ Seeded {count} standard products")


def seed_kit_bundles(db: Session):
    """Seed standard kit bundles into database"""
    print("\nSeeding kit bundles...")

    # Check if kits already exist
    existing = db.execute(select(KitBundle)).first()
    if existing:
        print("⚠️  Kit bundles already exist, skipping...")
        return

    # Add all standard kit bundles
    count = 0
    for kit_key, kit_data in STANDARD_KIT_BUNDLES.items():
        kit = KitBundle(**kit_data)
        db.add(kit)
        count += 1

    db.commit()
    print(f"✓ Seeded {count} kit bundles")


def initialize_inventory(db: Session):
    """Initialize inventory for all products"""
    print("\nInitializing inventory...")

    # Get all products
    products = db.execute(select(Product)).scalars().all()

    if not products:
        print("⚠️  No products found, cannot initialize inventory")
        return

    count = 0
    for product in products:
        # Check if inventory already exists for this product
        existing_inventory = db.execute(
            select(InventoryItem).where(InventoryItem.product_id == product.id)
        ).first()

        if existing_inventory:
            continue

        # Create initial inventory
        inventory = InventoryItem(
            product_id=product.id,
            quantity_on_hand=1000,  # Start with 1000 units
            quantity_reserved=0,
            quantity_available=1000,
            reorder_point=100,
            reorder_quantity=500,
            warehouse_location=f"A-{product.sku[:3]}-{count % 10 + 1}"
        )
        db.add(inventory)
        count += 1

    db.commit()
    print(f"✓ Initialized inventory for {count} products")


def init_db():
    """Initialize database with tables and seed data"""
    print("=" * 60)
    print("DATABASE INITIALIZATION")
    print("=" * 60)

    # Create tables
    create_tables()

    # Get database session
    db = SessionLocal()

    try:
        # Seed data
        seed_products(db)
        seed_kit_bundles(db)
        initialize_inventory(db)

        print("\n" + "=" * 60)
        print("✓ DATABASE INITIALIZATION COMPLETE")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise

    finally:
        db.close()


def reset_db():
    """
    WARNING: Drop all tables and recreate them
    This will delete all data!
    """
    print("\n⚠️  WARNING: This will delete ALL data!")
    response = input("Type 'DELETE ALL DATA' to confirm: ")

    if response != "DELETE ALL DATA":
        print("Aborted.")
        return

    print("\nDropping all tables...")
    TemplateBase.metadata.drop_all(bind=engine)
    UserBase.metadata.drop_all(bind=engine)
    ProductBase.metadata.drop_all(bind=engine)
    print("✓ All tables dropped")

    # Reinitialize
    init_db()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        reset_db()
    else:
        init_db()
