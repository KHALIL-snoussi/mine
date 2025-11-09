#!/usr/bin/env python3
"""
High-Quality Canvas Generator for Paint-by-Numbers
Generates print-ready templates for 50×35 cm, 60×40 cm, and 70×50 cm canvases at 300 DPI
"""

import sys
from pathlib import Path

# Add paint_by_numbers to path
sys.path.insert(0, str(Path(__file__).parent))

from paint_by_numbers.main import PaintByNumbersGenerator
from paint_by_numbers.config import Config


def generate_print_quality_canvas(
    input_image: str,
    output_dir: str = "output_hq",
    canvas_size: str = "50x35",
    num_colors: int = 36,
    generate_svg: bool = True
):
    """
    Generate high-quality print canvas for paint-by-numbers

    Args:
        input_image: Path to input image file
        output_dir: Output directory for generated files
        canvas_size: Canvas size ("50x35", "60x40", or "70x50")
        num_colors: Number of colors (default 36 for high-quality)
        generate_svg: Generate SVG vector output (recommended for print)
    """

    # Map canvas size to preset and format
    canvas_configs = {
        "50x35": {
            "preset": "print_quality_50x35",
            "format": "canvas_50x35",
            "display_name": "50×35 cm Canvas (5906×4134 px @ 300 DPI)"
        },
        "60x40": {
            "preset": "print_quality_60x40",
            "format": "canvas_60x40",
            "display_name": "60×40 cm Canvas (7087×4724 px @ 300 DPI)"
        },
        "70x50": {
            "preset": "print_quality_70x50",
            "format": "canvas_70x50",
            "display_name": "70×50 cm Canvas (8268×5906 px @ 300 DPI)"
        }
    }

    if canvas_size not in canvas_configs:
        print(f"❌ Invalid canvas size: {canvas_size}")
        print(f"   Available sizes: {', '.join(canvas_configs.keys())}")
        sys.exit(1)

    config_info = canvas_configs[canvas_size]

    print("=" * 80)
    print("🎨 HIGH-QUALITY PRINT CANVAS GENERATOR")
    print("=" * 80)
    print(f"📐 Canvas Size: {config_info['display_name']}")
    print(f"🎨 Colors: {num_colors}")
    print(f"📁 Input: {input_image}")
    print(f"📂 Output: {output_dir}/")
    print(f"📊 SVG Vector Output: {'✓ Enabled' if generate_svg else '✗ Disabled'}")
    print("=" * 80)
    print()

    # Create config with preset
    config = Config(preset=config_info['preset'])

    # Override settings if needed
    config.DEFAULT_NUM_COLORS = num_colors
    config.GENERATE_SVG = generate_svg
    config.GENERATE_PDF = True  # Always generate PDF for print kits

    # Create generator
    generator = PaintByNumbersGenerator(config)

    # Generate the paint-by-numbers template
    print("🚀 Starting generation...")
    print()

    result_files = generator.generate(
        input_path=input_image,
        output_dir=output_dir,
        n_colors=num_colors,
        merge_similar=True,
        add_grid=False,
        paper_format=config_info['format']
    )

    print()
    print("=" * 80)
    print("✅ HIGH-QUALITY CANVAS GENERATION COMPLETE!")
    print("=" * 80)
    print()
    print("📄 Generated Files:")
    print(f"  ✓ Template (with numbers): {Path(result_files['template']).name}")
    print(f"  ✓ Color Legend: {Path(result_files['legend']).name}")
    print(f"  ✓ Solution (colored reference): {Path(result_files['solution']).name}")
    print(f"  ✓ Coloring Guide (faded): {Path(result_files['guide']).name}")
    print(f"  ✓ Comparison: {Path(result_files['comparison']).name}")

    if 'svg_template' in result_files:
        print(f"  ✓ SVG Template (vector): {Path(result_files['svg_template']).name}")
        print(f"  ✓ SVG Legend: {Path(result_files['svg_legend']).name}")

    if 'pdf' in result_files:
        print(f"  ✓ PDF Complete Kit: {Path(result_files['pdf']).name}")

    print()
    print("📐 PRINT SPECIFICATIONS:")
    print(f"  • Resolution: 300 DPI (embedded in files)")
    print(f"  • Canvas Size: {canvas_size} cm")
    print(f"  • Colors: {num_colors}")
    print(f"  • Format: PNG with DPI metadata + SVG vector")
    print()
    print("💡 PRINTING TIPS:")
    print("  1. Use the PNG files for direct printing at print shops")
    print("  2. Use SVG files for maximum scalability and sharpness")
    print("  3. Verify DPI settings in your print dialog (should show 300 DPI)")
    print("  4. Print on high-quality canvas or thick paper (250-300 gsm)")
    print("  5. Consider professional printing services for best results")
    print()
    print(f"📂 All files saved to: {Path(output_dir).absolute()}")
    print("=" * 80)

    return result_files


def main():
    """Main entry point for command-line usage"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate high-quality print canvas for paint-by-numbers",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate 50×35 cm canvas with 36 colors
  python generate_hq_canvas.py input.jpg

  # Generate 60×40 cm canvas
  python generate_hq_canvas.py input.jpg --canvas-size 60x40

  # Generate 70×50 cm canvas with 30 colors
  python generate_hq_canvas.py input.jpg --canvas-size 70x50 --colors 30

  # Custom output directory
  python generate_hq_canvas.py input.jpg -o my_prints/

  # Disable SVG output
  python generate_hq_canvas.py input.jpg --no-svg

Canvas Sizes:
  50x35 - 5906×4134 pixels @ 300 DPI (default)
  60x40 - 7087×4724 pixels @ 300 DPI
  70x50 - 8268×5906 pixels @ 300 DPI

Features:
  ✓ 300 DPI embedded metadata for perfect printing
  ✓ Up to 36 colors for rich, detailed output
  ✓ SVG vector output for infinite scalability
  ✓ PDF complete kit with all materials
  ✓ Optimized for professional print shops
        """
    )

    parser.add_argument(
        "input",
        type=str,
        help="Input image file path"
    )

    parser.add_argument(
        "-o", "--output",
        type=str,
        default="output_hq",
        help="Output directory (default: output_hq)"
    )

    parser.add_argument(
        "--canvas-size",
        type=str,
        choices=["50x35", "60x40", "70x50"],
        default="50x35",
        help="Canvas size in cm (default: 50x35)"
    )

    parser.add_argument(
        "--colors",
        type=int,
        default=36,
        help="Number of colors (default: 36, max: 36)"
    )

    parser.add_argument(
        "--no-svg",
        action="store_true",
        help="Disable SVG vector output"
    )

    args = parser.parse_args()

    # Validate input file
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {args.input}")
        sys.exit(1)

    # Validate colors
    if args.colors < 5 or args.colors > 36:
        print(f"❌ Error: Number of colors must be between 5 and 36")
        sys.exit(1)

    # Generate canvas
    try:
        generate_print_quality_canvas(
            input_image=args.input,
            output_dir=args.output,
            canvas_size=args.canvas_size,
            num_colors=args.colors,
            generate_svg=not args.no_svg
        )
    except Exception as e:
        print(f"\n❌ Error during generation: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
