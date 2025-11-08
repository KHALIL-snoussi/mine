#!/usr/bin/env python3
"""
Quick test of the Ultra Detailed HD model.
Wrapped in a main() guard so pytest will not attempt to execute it during collection.
"""

import sys
from pathlib import Path

# Add paint_by_numbers to path
sys.path.insert(0, str(Path(__file__).parent))


def main() -> None:
    print("=" * 70)
    print("🖼️  ULTRA DETAILED HD MODEL - QUICK TEST")
    print("=" * 70)
    print()

    # Step 1: Test loading the model
    print("Step 1: Loading Ultra Detailed HD model...")
    try:
        from paint_by_numbers.models import ModelRegistry
        from paint_by_numbers.config import Config  # noqa: F401 - imported for side-effects

        model = ModelRegistry.get_model('ultra_detailed')
        if model:
            print(f"✅ Model loaded: {model.display_name}")
            print(f"   Max Resolution: {model.max_image_size} pixels")
            print(f"   Colors: {model.num_colors}")
            print(f"   Detail Level: {model.detail_level}")
            print(f"   Min Region Size: {model.min_region_size} pixels")
            print()
        else:
            print("❌ Model 'ultra_detailed' not found!")
            sys.exit(1)

    except Exception as exc:  # pragma: no cover - script utility
        print(f"❌ Error loading model: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Step 2: Create test image (if not exists)
    print("Step 2: Creating test image...")
    try:
        import numpy as np
        import cv2

        test_image_path = Path("man.jpg")

        if not test_image_path.exists():
            print("Creating synthetic test image...")

            # Create a synthetic portrait
            img = np.zeros((800, 600, 3), dtype=np.uint8)
            img[:] = (200, 210, 220)

            # Draw face
            cv2.circle(img, (300, 350), 200, (240, 215, 200), -1)
            cv2.circle(img, (210, 300), 30, (255, 255, 255), -1)
            cv2.circle(img, (390, 300), 30, (255, 255, 255), -1)
            cv2.circle(img, (210, 300), 12, (50, 60, 80), -1)
            cv2.circle(img, (390, 300), 12, (50, 60, 80), -1)
            cv2.ellipse(img, (300, 420), (90, 70), 0, 0, 180, (150, 80, 90), 12)

            # Draw jacket
            cv2.rectangle(img, (120, 500), (480, 780), (40, 30, 25), -1)

            cv2.imwrite(str(test_image_path), img)
            print(f"✅ Test image created: {test_image_path}")
        else:
            print(f"Test image already exists: {test_image_path}")

    except Exception as exc:  # pragma: no cover - script utility
        print(f"❌ Error creating test image: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Step 3: Generate template using Ultra Detailed HD model
    print("Step 3: Generating paint-by-numbers template...")
    try:
        from paint_by_numbers.main import PaintByNumbersGenerator

        generator = PaintByNumbersGenerator()
        results = generator.generate(
            input_path=str(test_image_path),
            output_dir="ultra_detailed_output",
            model="ultra_detailed",
            n_colors=32,
            paper_format="a4"
        )

        print("✅ Generation complete!")
        print("Generated files:")
        for key, value in results.items():
            print(f"  {key}: {value}")

    except Exception as exc:  # pragma: no cover - script utility
        print(f"❌ Error generating template: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    print()
    print("🎉 Ultra Detailed HD test completed successfully!")
    print("Check the 'ultra_detailed_output' folder for results.")


if __name__ == "__main__":
    main()
