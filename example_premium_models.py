"""
Premium 4-Model System - Example Showcase

This script demonstrates the premium model system:
🎨 ORIGINAL - Natural photorealistic colors (20 colors)
📸 VINTAGE - Warm nostalgic tones (18 colors)
🎭 POP-ART - Bold vibrant colors (16 colors)
💎 FULL COLOR HD - QBRIX-quality maximum realism (38 colors!)

Each model is professionally calibrated for stunning results.
"""

import numpy as np
from pathlib import Path

try:
    from paint_by_numbers.utils.opencv import require_cv2
    from paint_by_numbers.main import PaintByNumbersGenerator
    from paint_by_numbers.models import ModelRegistry, get_model_comparison
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent / 'paint_by_numbers'))
    from utils.opencv import require_cv2
    from main import PaintByNumbersGenerator
    from models import ModelRegistry, get_model_comparison


def create_sample_photo(filename="sample_photo.png", size=(800, 800)):
    """
    Create a sample photo for demonstration

    Args:
        filename: Output filename
        size: Image size (width, height)

    Returns:
        Path to created image
    """
    print("Creating sample photo...")

    w, h = size
    image = np.zeros((h, w, 3), dtype=np.uint8)
    cv2 = require_cv2()

    # Create a portrait-style scene

    # Sky with gradient
    for y in range(h // 3):
        blue = int(180 + (75 * y / (h // 3)))
        image[y, :] = [120, 160, blue]

    # Mountains in background
    for y in range(h // 3, h // 2):
        green = int(150 - (50 * (y - h // 3) / (h // 6)))
        image[y, :] = [60, green, 80]

    # Foreground grass
    for y in range(h // 2, h):
        green = int(180 - (30 * (y - h // 2) / (h // 2)))
        image[y, :] = [50, green, 60]

    # Add a simple "face" representation
    face_center_x, face_center_y = w // 2, h // 2
    face_radius = 120

    # Face (skin tone)
    cv2.circle(image, (face_center_x, face_center_y), face_radius, (220, 180, 160), -1)

    # Eyes
    eye_y = face_center_y - 30
    cv2.circle(image, (face_center_x - 40, eye_y), 15, (70, 100, 140), -1)
    cv2.circle(image, (face_center_x + 40, eye_y), 15, (70, 100, 140), -1)
    cv2.circle(image, (face_center_x - 40, eye_y), 8, (0, 0, 0), -1)
    cv2.circle(image, (face_center_x + 40, eye_y), 8, (0, 0, 0), -1)

    # Smile
    smile_pts = []
    for angle in range(-30, 31, 5):
        rad = np.radians(angle)
        x = int(face_center_x + 50 * np.sin(rad))
        y = int(face_center_y + 30 + 20 * np.cos(rad))
        smile_pts.append([x, y])
    cv2.polylines(image, [np.array(smile_pts)], False, (180, 100, 100), 3)

    # Hair
    cv2.ellipse(image, (face_center_x, face_center_y - 80), (100, 60), 0, 180, 360, (80, 60, 40), -1)

    # Add some flowers in foreground
    flower_positions = [
        (w // 4, h - 100),
        (w // 3, h - 150),
        (w // 2 + 100, h - 120),
        (w - 150, h - 130),
    ]

    for fx, fy in flower_positions:
        # Flower petals
        cv2.circle(image, (fx, fy), 20, (255, 180, 200), -1)
        cv2.circle(image, (fx - 15, fy), 20, (255, 180, 200), -1)
        cv2.circle(image, (fx + 15, fy), 20, (255, 180, 200), -1)
        cv2.circle(image, (fx, fy - 15), 20, (255, 180, 200), -1)
        cv2.circle(image, (fx, fy + 15), 20, (255, 180, 200), -1)
        # Center
        cv2.circle(image, (fx, fy), 10, (255, 220, 100), -1)

    # Save image
    cv2.imwrite(filename, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    print(f"✓ Sample photo created: {filename}")

    return filename


def showcase_models():
    """Showcase all 3 premium models"""
    print("\n" + "=" * 70)
    print("             PREMIUM 3-MODEL SYSTEM SHOWCASE")
    print("=" * 70)

    # Get model information
    models_info = ModelRegistry.get_models_list()

    print("\n📋 AVAILABLE MODELS:\n")
    for i, model in enumerate(models_info, 1):
        print(f"{model['preview_icon']} {i}. {model['display_name']}")
        print(f"   {model['description']}")
        print(f"   Colors: {model['color_range']} | Detail: {model['detail_level']}")
        print()

    # Create sample image
    sample_image = create_sample_photo("sample_portrait.png", size=(1000, 1000))

    # Generate with each model
    model_ids = ['original', 'vintage', 'pop_art', 'full_color_hd']

    for model_id in model_ids:
        model = ModelRegistry.get_model(model_id)

        print("\n" + "-" * 70)
        print(f"{model.preview_icon} Processing with: {model.display_name}")
        print("-" * 70)

        # Create generator with this model
        generator = PaintByNumbersGenerator()
        generator.apply_model(model_id)

        # Generate output
        output_dir = f"output/premium_models/{model_id}"
        print(f"Generating to: {output_dir}")

        try:
            results = generator.generate(
                input_path=sample_image,
                output_dir=output_dir,
                output_name=f"sample_{model_id}"
            )

            print(f"✓ {model.display_name} completed successfully!")
            print(f"  Template: {output_dir}/sample_{model_id}_template.png")
            print(f"  Legend: {output_dir}/sample_{model_id}_legend.png")

        except Exception as e:
            print(f"❌ Error with {model.display_name}: {str(e)}")
            import traceback
            traceback.print_exc()


def compare_all_models():
    """Generate a comparison showing all 3 models side by side"""
    print("\n" + "=" * 70)
    print("            GENERATING COMPARISON FOR ALL MODELS")
    print("=" * 70)

    # Create comparison image
    comparison_image = create_sample_photo("comparison_photo.png", size=(1200, 1200))

    generator = PaintByNumbersGenerator()

    print("\n🎨 Processing with all 4 models for comparison...\n")

    for model_id in ['original', 'vintage', 'pop_art', 'full_color_hd']:
        model = ModelRegistry.get_model(model_id)
        print(f"  {model.preview_icon} {model.name}...")

        generator.apply_model(model_id)
        generator.generate(
            input_path=comparison_image,
            output_dir=f"output/comparison/{model_id}",
            output_name=f"comparison_{model_id}"
        )

    print("\n✓ Comparison complete!")
    print("\nCompare results in:")
    print("  • output/comparison/original/ (20 colors)")
    print("  • output/comparison/vintage/ (18 colors)")
    print("  • output/comparison/pop_art/ (16 colors)")
    print("  • output/comparison/full_color_hd/ (38 colors - QBRIX QUALITY!)")


def main():
    """Run premium models showcase"""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║            PREMIUM 4-MODEL PAINT-BY-NUMBERS SYSTEM               ║
║                                                                  ║
║  🎨 ORIGINAL       - Natural photorealistic (20 colors)          ║
║  📸 VINTAGE        - Warm nostalgic tones (18 colors)            ║
║  🎭 POP-ART        - Bold vibrant colors (16 colors)             ║
║  💎 FULL COLOR HD  - QBRIX maximum realism (38 colors!)          ║
║                                                                  ║
║  Each model is professionally calibrated for stunning results    ║
║  with crystal-clear numbers and A4 print quality (40×50 cm)      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
    """)

    try:
        # Show model comparison info
        comparison = get_model_comparison()
        print(f"\n{comparison['title']}")
        print(f"{comparison['subtitle']}")
        print(f"\nℹ️  {comparison['note']}\n")

        # Showcase all models
        showcase_models()

        # Generate comparison
        compare_all_models()

        print("\n" + "=" * 70)
        print("            ALL DEMONSTRATIONS COMPLETE! ✓")
        print("=" * 70)
        print("\n📁 Generated outputs:")
        print("  • output/premium_models/original/ (20 colors - natural)")
        print("  • output/premium_models/vintage/ (18 colors - warm retro)")
        print("  • output/premium_models/pop_art/ (16 colors - bold vibrant)")
        print("  • output/premium_models/full_color_hd/ (38 colors - QBRIX QUALITY!)")
        print("  • output/comparison/ (all 4 models side-by-side)")
        print("\n💡 TIP: Compare the different styles to see how each model")
        print("   transforms the same image with unique characteristics!")
        print("\n🌟 FULL COLOR HD uses 38 colors for maximum realism - ")
        print("   perfect for complex portraits like QBRIX premium kits!")

    except Exception as e:
        print(f"\n❌ Error running showcase: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
