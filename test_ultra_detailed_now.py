#!/usr/bin/env python3
"""
Quick test of the Ultra Detailed HD model
This creates a test image and generates a paint-by-numbers template
optimized for A4/A3 printing with crystal-clear faces
"""

import sys
import os
from pathlib import Path

# Add paint_by_numbers to path
sys.path.insert(0, str(Path(__file__).parent))

print("=" * 70)
print("🖼️  ULTRA DETAILED HD MODEL - QUICK TEST")
print("=" * 70)
print()

# Step 1: Test loading the model
print("Step 1: Loading Ultra Detailed HD model...")
try:
    from paint_by_numbers.models import ModelRegistry
    from paint_by_numbers.config import Config

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

except Exception as e:
    print(f"❌ Error loading model: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 2: Test loading preset
print("Step 2: Testing ultra_detailed preset...")
try:
    config = Config(preset='ultra_detailed')
    print(f"✅ Preset loaded successfully!")
    print(f"   MAX_IMAGE_SIZE: {config.MAX_IMAGE_SIZE}")
    print(f"   DEFAULT_NUM_COLORS: {config.DEFAULT_NUM_COLORS}")
    print(f"   MIN_REGION_SIZE: {config.MIN_REGION_SIZE}")
    print(f"   SHARPEN_AMOUNT: {config.SHARPEN_AMOUNT}")
    print(f"   CLAHE_CLIP_LIMIT: {config.CLAHE_CLIP_LIMIT}")
    print()
except Exception as e:
    print(f"❌ Error loading preset: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 3: List all available models
print("Step 3: Listing all available models...")
try:
    all_models = ModelRegistry.get_all_models()
    print(f"✅ Found {len(all_models)} models:")
    for model_id, m in all_models.items():
        print(f"   • {model_id:15} - {m.max_image_size[0]:4}x{m.max_image_size[1]:4} - {m.num_colors:2} colors - {m.detail_level}")
    print()
except Exception as e:
    print(f"❌ Error listing models: {e}")

# Step 4: Create a test image
print("Step 4: Creating test portrait image...")
try:
    import numpy as np
    import cv2

    # Create a simple test image with a "face" (circle)
    test_img = np.zeros((2000, 2000, 3), dtype=np.uint8)

    # Background - sky blue
    test_img[0:1000, :] = [135, 206, 235]

    # Ground - green
    test_img[1000:, :] = [34, 139, 34]

    # "Face" - skin tone circle
    cv2.circle(test_img, (1000, 600), 300, (220, 180, 140), -1)

    # Eyes
    cv2.circle(test_img, (900, 550), 40, (70, 50, 30), -1)
    cv2.circle(test_img, (1100, 550), 40, (70, 50, 30), -1)

    # Smile
    cv2.ellipse(test_img, (1000, 650), (120, 80), 0, 0, 180, (150, 50, 50), 10)

    # Save test image
    test_image_path = 'test_portrait_for_ultra_hd.jpg'
    cv2.imwrite(test_image_path, test_img)
    print(f"✅ Test portrait created: {test_image_path}")
    print(f"   Size: 2000x2000 pixels (perfect for ultra_detailed model)")
    print()

except Exception as e:
    print(f"❌ Error creating test image: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Generate with Ultra Detailed model
print("Step 5: Generating paint-by-numbers template...")
print("⚙️  This will take 60-120 seconds with the ultra_detailed model...")
print()

try:
    from paint_by_numbers.main import PaintByNumbersGenerator

    # Load ultra_detailed model config
    model = ModelRegistry.get_model('ultra_detailed')
    config = model.to_config()

    # Optional: Enable PDF and SVG
    config.GENERATE_PDF = True
    config.GENERATE_SVG = True

    # Create output directory
    output_dir = 'ultra_detailed_output'

    print(f"📁 Output directory: {output_dir}")
    print(f"🎨 Processing with {config.DEFAULT_NUM_COLORS} colors")
    print(f"📐 Max resolution: {config.MAX_IMAGE_SIZE}")
    print()

    # Generate!
    generator = PaintByNumbersGenerator(config=config)

    result = generator.generate(
        input_path=test_image_path,
        output_dir=output_dir,
        model='ultra_detailed',
        paper_format='a4'
    )

    # Success!
    print()
    print("=" * 70)
    print("✅ GENERATION COMPLETE!")
    print("=" * 70)
    print()
    print(f"📁 Output directory: {output_dir}")
    print(f"🎨 Colors used: {len(result.get('palette', []))} colors")
    print(f"🖨️  Ready for A4/A3 printing @ 300 DPI")
    print()

    # List generated files
    print("📄 Generated files:")
    output_path = Path(output_dir)
    if output_path.exists():
        for file in sorted(output_path.glob('*')):
            size = file.stat().st_size / 1024  # KB
            print(f"   • {file.name:30} ({size:>8.1f} KB)")

    print()
    print("=" * 70)
    print("🎉 SUCCESS! Your ultra-detailed template is ready!")
    print("=" * 70)
    print()
    print("📝 Next steps:")
    print("   1. Check the 'ultra_detailed_output' directory")
    print("   2. Open 'template.png' - this is your numbered template")
    print("   3. Open 'legend.png' - this shows the color key")
    print("   4. Print on A4 or A3 paper @ 300 DPI")
    print()
    print("💡 For real portraits:")
    print("   - Replace 'test_portrait_for_ultra_hd.jpg' with your portrait")
    print("   - Recommended: Use high-quality images (3000x3000px or larger)")
    print("   - Perfect for faces - no more blurry results!")
    print()

except Exception as e:
    print()
    print("=" * 70)
    print("❌ ERROR DURING GENERATION")
    print("=" * 70)
    print(f"Error: {e}")
    print()
    import traceback
    traceback.print_exc()
    sys.exit(1)
