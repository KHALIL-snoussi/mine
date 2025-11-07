#!/usr/bin/env python3
"""
Product Catalog Exporter
Exports all paint kits, subscriptions, and accessories to JSON for e-commerce integration
"""

from paint_kits import PaintKitManager
from pathlib import Path

def main():
    """Export complete product catalog"""
    manager = PaintKitManager()

    # Export to JSON
    output_dir = Path(__file__).parent / "exports"
    output_dir.mkdir(exist_ok=True)

    catalog_path = output_dir / "product_catalog.json"
    manager.export_product_catalog(str(catalog_path))

    print("=" * 60)
    print("PRODUCT CATALOG EXPORTED")
    print("=" * 60)
    print(f"\n📁 File: {catalog_path}")
    print(f"📊 Products exported:")
    print(f"   • {len(manager.kits)} Paint Kits")
    print(f"   • {len(manager.subscriptions)} Subscription Plans")
    print(f"   • {len(manager.accessories)} Accessory Products")
    print(f"\n✅ Ready to import into Shopify/Stripe/etc!")
    print("\nProduct Summary:")
    print("-" * 60)

    for kit_id, kit in manager.kits.items():
        print(f"\n🎨 {kit.display_name}")
        print(f"   Price: ${kit.price_usd} | Colors: {kit.num_colors} | SKU: {kit.sku}")
        print(f"   Target: {kit.target_audience}")
        print(f"   Est. Projects: {kit.estimated_projects}")

    print("\n" + "=" * 60)
    print("SUBSCRIPTION PLANS")
    print("=" * 60)

    for sub_id, sub in manager.subscriptions.items():
        print(f"\n💰 {sub.name}")
        print(f"   Price: ${sub.price_monthly_usd}/month")
        print(f"   Templates: {sub.template_credits_monthly if sub.template_credits_monthly < 999 else 'Unlimited'}/month")
        print(f"   Savings: {sub.savings_percent}%")
        print(f"   Includes: {sub.paint_kit_included}")

    print("\n" + "=" * 60)
    print("BUSINESS METRICS")
    print("=" * 60)

    # Calculate potential revenue
    avg_kit_price = sum(k.price_usd for k in manager.kits.values()) / len(manager.kits)
    avg_subscription = sum(s.price_monthly_usd for s in manager.subscriptions.values()) / len(manager.subscriptions)

    print(f"\nAverage Kit Price: ${avg_kit_price:.2f}")
    print(f"Average Subscription: ${avg_subscription:.2f}/month")
    print(f"\nProjected Monthly Revenue (100 customers):")
    print(f"   Kit Sales (50): ${avg_kit_price * 50:,.2f}")
    print(f"   Subscriptions (30): ${avg_subscription * 30:,.2f}")
    print(f"   Accessories (20): ${20 * 15:,.2f} (est)")
    print(f"   TOTAL: ${(avg_kit_price * 50) + (avg_subscription * 30) + (20 * 15):,.2f}/month")

    print(f"\nProjected Annual Revenue (1000 customers, 30% subscribers):")
    print(f"   ${((avg_kit_price * 1000) + (avg_subscription * 12 * 300)):,.2f}/year")

    print("\n✅ Export complete!\n")

if __name__ == "__main__":
    main()
