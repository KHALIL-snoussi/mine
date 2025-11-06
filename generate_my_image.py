#!/usr/bin/env python3
"""
💎 Generate Ultra HD from YOUR image
"""

import sys
from pathlib import Path

# Check if image provided
if len(sys.argv) < 2:
    print("=" * 70)
    print("💎 ULTRA DETAILED HD PRO - Generate from YOUR image")
    print("=" * 70)
    print()
    print("Usage:")
    print(f"  python3 {sys.argv[0]} YOUR_IMAGE.jpg")
    print()
    print("Example:")
    print(f"  python3 {sys.argv[0]} portrait.jpg")
    print(f"  python3 {sys.argv[0]} family_photo.png")
    print()
    print("Works with ANY size image - even small ones!")
    print("Auto-upscales, detects faces, and enhances quality!")
    sys.exit(1)

image_path = sys.argv[1]

# Check if image exists
if not Path(image_path).exists():
    print(f"❌ Error: Image not found: {image_path}")
    sys.exit(1)

print("=" * 70)
print("💎 ULTRA DETAILED HD PRO - AI-POWERED")
print("=" * 70)
print()
print(f"📸 Input: {image_path}")
print()

try:
    from paint_by_numbers.main import PaintByNumbersGenerator
    from paint_by_numbers.models import ModelRegistry

    model = ModelRegistry.get_model('ultra_detailed')
    print(f"🚀 Using: {model.display_name}")
    print(f"   • Max Resolution: {model.max_image_size[0]}x{model.max_image_size[1]}px (A2 @ 300 DPI)")
    print(f"   • {model.num_colors} colors for maximum detail")
    print(f"   • AI face detection & optimization")
    print(f"   • Automatic intelligent upscaling")
    print()

    # Output directory
    input_name = Path(image_path).stem
    output_dir = f'output_{input_name}_ultra_hd'

    print(f"📁 Output: {output_dir}/")
    print()
    print("⚙️  Processing... (this may take 60-180 seconds)")
    print()

    # Generate!
    generator = PaintByNumbersGenerator()
    result = generator.generate(
        input_path=image_path,
        output_dir=output_dir,
        model='ultra_detailed',
        paper_format='a4'  # Change to 'a3' for larger prints
    )

    print()
    print("=" * 70)
    print("✅ SUCCESS!")
    print("=" * 70)
    print()
    print(f"📁 Check: {output_dir}/")
    print()

    # List files
    output_path = Path(output_dir)
    if output_path.exists():
        print("📄 Generated files:")
        for file in sorted(output_path.glob('*')):
            size = file.stat().st_size / 1024
            print(f"   • {file.name:40} ({size:>8.1f} KB)")

    print()
    print("🖨️  Ready for A4/A3/A2 printing @ 300 DPI")
    print("💎 Crystal-clear quality with face optimization!")
    print()

except Exception as e:
    print()
    print("❌ Error:", e)
    import traceback
    traceback.print_exc()
    sys.exit(1)
