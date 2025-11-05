"""
Example script demonstrating the Paint by Numbers Generator

This script shows various ways to use the system with different configurations.
"""

import numpy as np
from pathlib import Path

try:
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    from utils.opencv import require_cv2

from main import PaintByNumbersGenerator
from config import Config


def create_test_image(filename="test_image.png", size=(600, 600)):
    """
    Create a simple test image if no input image is available

    Args:
        filename: Output filename
        size: Image size (width, height)

    Returns:
        Path to created image
    """
    print("Creating test image...")

    w, h = size
    image = np.zeros((h, w, 3), dtype=np.uint8)
    cv2 = require_cv2()

    # Create colorful geometric shapes

    # Sky (blue gradient)
    for y in range(h // 2):
        intensity = int(100 + (155 * y / (h // 2)))
        image[y, :] = [intensity, intensity, 255]

    # Ground (green)
    image[h // 2:, :] = [50, 200, 50]

    # Sun (yellow circle)
    cv2.circle(image, (w // 4, h // 4), 60, (255, 255, 100), -1)

    # House body (red rectangle)
    house_x = w // 2
    house_y = h // 2 + 50
    cv2.rectangle(image, (house_x - 80, house_y), (house_x + 80, house_y + 120),
                 (180, 50, 50), -1)

    # Roof (brown triangle)
    roof_pts = np.array([
        [house_x - 100, house_y],
        [house_x + 100, house_y],
        [house_x, house_y - 80]
    ], np.int32)
    cv2.fillPoly(image, [roof_pts], (100, 60, 30))

    # Door (dark brown rectangle)
    cv2.rectangle(image, (house_x - 20, house_y + 60), (house_x + 20, house_y + 120),
                 (60, 30, 10), -1)

    # Windows (yellow squares)
    cv2.rectangle(image, (house_x - 60, house_y + 30), (house_x - 30, house_y + 60),
                 (255, 255, 150), -1)
    cv2.rectangle(image, (house_x + 30, house_y + 30), (house_x + 60, house_y + 60),
                 (255, 255, 150), -1)

    # Tree (brown trunk and green foliage)
    cv2.rectangle(image, (50, h - 150), (80, h - 50), (100, 60, 30), -1)
    cv2.circle(image, (65, h - 170), 50, (50, 150, 50), -1)

    # Clouds (white circles)
    cv2.circle(image, (w - 100, 80), 30, (255, 255, 255), -1)
    cv2.circle(image, (w - 70, 75), 25, (255, 255, 255), -1)
    cv2.circle(image, (w - 50, 85), 20, (255, 255, 255), -1)

    # Save image
    cv2.imwrite(filename, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    print(f"Test image created: {filename}")

    return filename


def example_basic():
    """Example 1: Basic usage with default settings"""
    print("\n" + "=" * 60)
    print("EXAMPLE 1: Basic Usage")
    print("=" * 60)

    # Create or use test image
    test_image = create_test_image("test_simple.png")

    # Generate with defaults
    generator = PaintByNumbersGenerator()
    results = generator.generate(
        input_path=test_image,
        output_dir="output/example1_basic"
    )

    print("\n✓ Basic example complete!")
    print(f"  Check output/example1_basic/ for results")


def example_custom_colors():
    """Example 2: Custom number of colors"""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Custom Colors")
    print("=" * 60)

    test_image = create_test_image("test_colors.png")

    # Generate with different color counts
    generator = PaintByNumbersGenerator()

    # Few colors (simple)
    print("\nGenerating with 8 colors (simple)...")
    generator.generate(
        input_path=test_image,
        output_dir="output/example2_simple",
        n_colors=8,
        legend_style="compact"
    )

    # More colors (complex)
    print("\nGenerating with 20 colors (complex)...")
    generator.generate(
        input_path=test_image,
        output_dir="output/example2_complex",
        n_colors=20,
        legend_style="list"
    )

    print("\n✓ Custom colors example complete!")
    print(f"  Compare output/example2_simple/ and output/example2_complex/")


def example_custom_config():
    """Example 3: Custom configuration"""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Custom Configuration")
    print("=" * 60)

    test_image = create_test_image("test_config.png", size=(800, 800))

    # Create custom config
    config = Config()
    config.MIN_REGION_SIZE = 200  # Larger regions
    config.FONT_SCALE = 0.7       # Larger numbers
    config.CONTOUR_THICKNESS = 3  # Thicker lines

    # Generate with custom config
    generator = PaintByNumbersGenerator(config)
    generator.generate(
        input_path=test_image,
        output_dir="output/example3_custom",
        n_colors=12,
        add_grid=True
    )

    print("\n✓ Custom configuration example complete!")
    print(f"  Check output/example3_custom/ for results with larger regions and thicker lines")


def example_programmatic():
    """Example 4: Programmatic usage with individual components"""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Programmatic Usage")
    print("=" * 60)

    test_image = create_test_image("test_programmatic.png")

    # Use individual components
    from core.image_processor import ImageProcessor
    from core.color_quantizer import ColorQuantizer
    from output.legend_generator import LegendGenerator

    print("\nUsing individual components...")

    # Process image
    processor = ImageProcessor()
    original = processor.load_image(test_image)
    processed = processor.preprocess(apply_bilateral=True)

    print(f"  Image loaded: {processor.get_image_info()['width']}x{processor.get_image_info()['height']}")

    # Quantize colors
    quantizer = ColorQuantizer()
    quantized, palette = quantizer.quantize(processed, n_colors=10)

    print(f"  Colors quantized: {len(palette)} colors")

    # Get color statistics
    percentages = quantizer.get_color_percentages()
    print(f"  Color distribution:")
    for color_idx, pct in sorted(percentages.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"    Color {color_idx + 1}: {pct:.1f}%")

    # Create legend
    legend_gen = LegendGenerator()
    legend = legend_gen.generate_legend(palette, style="list")

    # Save outputs
    output_dir = Path("output/example4_programmatic")
    output_dir.mkdir(parents=True, exist_ok=True)

    cv2.imwrite(str(output_dir / "quantized.png"), cv2.cvtColor(quantized, cv2.COLOR_RGB2BGR))
    legend_gen.save_legend(legend, str(output_dir / "legend.png"))

    print("\n✓ Programmatic example complete!")
    print(f"  Check output/example4_programmatic/ for results")


def example_comparison():
    """Example 5: Generate comparison with different settings"""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Settings Comparison")
    print("=" * 60)

    test_image = create_test_image("test_comparison.png", size=(700, 700))

    generator = PaintByNumbersGenerator()

    settings = [
        ("5_colors", 5, False, "compact"),
        ("10_colors", 10, False, "grid"),
        ("15_colors", 15, True, "grid"),
        ("20_colors", 20, True, "list"),
    ]

    for name, colors, grid, legend_style in settings:
        print(f"\nGenerating with {colors} colors...")
        generator.generate(
            input_path=test_image,
            output_dir=f"output/example5_comparison/{name}",
            n_colors=colors,
            add_grid=grid,
            legend_style=legend_style
        )

    print("\n✓ Comparison example complete!")
    print(f"  Compare different settings in output/example5_comparison/")


def main():
    """Run all examples"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           PAINT BY NUMBERS GENERATOR - EXAMPLES              ║
║                                                              ║
║  This script demonstrates various usage patterns and         ║
║  configurations for the paint-by-numbers generator system    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)

    try:
        # Run all examples
        example_basic()
        example_custom_colors()
        example_custom_config()
        example_programmatic()
        example_comparison()

        print("\n" + "=" * 60)
        print("ALL EXAMPLES COMPLETE! ✓")
        print("=" * 60)
        print("\nGenerated outputs in:")
        print("  • output/example1_basic/")
        print("  • output/example2_simple/")
        print("  • output/example2_complex/")
        print("  • output/example3_custom/")
        print("  • output/example4_programmatic/")
        print("  • output/example5_comparison/")
        print("\nExplore the different outputs to see how settings affect results!")

    except Exception as e:
        print(f"\n❌ Error running examples: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
