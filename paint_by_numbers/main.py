"""
Paint by Numbers Generator - Main Application
Inspired by Qbrix system design principles

A complete paint-by-numbers generation system that converts images into
numbered templates with intelligent color quantization, region detection,
and number placement.
"""

import sys
import argparse
from pathlib import Path
import cv2
import numpy as np

from config import Config
from core.image_processor import ImageProcessor
from core.color_quantizer import ColorQuantizer
from core.region_detector import RegionDetector
from core.contour_builder import ContourBuilder
from core.number_placer import NumberPlacer
from output.template_generator import TemplateGenerator
from output.legend_generator import LegendGenerator


class PaintByNumbersGenerator:
    """Main application class for paint-by-numbers generation"""

    def __init__(self, config=None):
        """
        Initialize the generator

        Args:
            config: Configuration object
        """
        self.config = config or Config()

        # Initialize components
        self.image_processor = ImageProcessor(self.config)
        self.color_quantizer = ColorQuantizer(self.config)
        self.region_detector = RegionDetector(self.config)
        self.contour_builder = ContourBuilder(self.config)
        self.number_placer = NumberPlacer(self.config)
        self.template_generator = TemplateGenerator(self.config)
        self.legend_generator = LegendGenerator(self.config)

        # Storage for intermediate results
        self.original_image = None
        self.processed_image = None
        self.quantized_image = None
        self.palette = None
        self.regions = None
        self.contour_image = None
        self.numbered_image = None
        self.template = None
        self.legend = None

    def generate(self, input_path: str, output_dir: str = "output",
                n_colors: int = None, merge_similar: bool = True,
                add_grid: bool = False, legend_style: str = "grid") -> dict:
        """
        Generate complete paint-by-numbers package from input image

        Args:
            input_path: Path to input image
            output_dir: Directory for output files
            n_colors: Number of colors (None uses default)
            merge_similar: Merge nearby regions of same color
            add_grid: Add reference grid to template
            legend_style: Style of legend ("grid", "list", or "compact")

        Returns:
            Dictionary with paths to generated files
        """
        print("=" * 60)
        print("PAINT BY NUMBERS GENERATOR")
        print("=" * 60)

        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Step 1: Load and preprocess image
        print("\n[1/8] Loading and preprocessing image...")
        self.original_image = self.image_processor.load_image(input_path)
        self.processed_image = self.image_processor.preprocess(
            apply_bilateral=True,
            apply_gaussian=True
        )

        # Display image info
        info = self.image_processor.get_image_info()
        print(f"  Image size: {info['width']}x{info['height']}")
        print(f"  File size: {info['size_mb']:.2f} MB")

        # Step 2: Color quantization
        print(f"\n[2/8] Performing color quantization...")
        if n_colors is None:
            n_colors = self.config.DEFAULT_NUM_COLORS

        self.quantized_image, self.palette = self.color_quantizer.quantize(
            self.processed_image,
            n_colors=n_colors,
            sort_palette=True
        )

        # Display color statistics
        percentages = self.color_quantizer.get_color_percentages()
        print(f"  Colors used: {len(self.palette)}")
        print(f"  Dominant color: {max(percentages.values()):.1f}% of image")

        # Step 3: Detect regions
        print(f"\n[3/8] Detecting regions...")
        self.regions = self.region_detector.detect_regions(
            self.quantized_image,
            self.palette,
            self.color_quantizer.labels
        )

        # Merge nearby regions if requested
        if merge_similar:
            print("  Merging nearby regions...")
            self.regions = self.region_detector.merge_nearby_regions(
                same_color=True,
                distance_threshold=5
            )

        # Filter small regions
        self.regions = self.region_detector.filter_small_regions()

        stats = self.region_detector.get_region_statistics()
        print(f"  Total regions: {stats['total_regions']}")
        print(f"  Average region size: {stats['mean_area']:.0f} pixels")

        # Step 4: Build contours
        print(f"\n[4/8] Building contours...")
        self.contour_image = self.contour_builder.build_contours_from_regions(
            self.regions,
            self.processed_image.shape[:2],
            smooth=True
        )

        contour_stats = self.contour_builder.get_contour_statistics()
        print(f"  Contours created: {contour_stats['total_contours']}")

        # Step 5: Place numbers
        print(f"\n[5/8] Placing numbers...")
        self.numbered_image = self.number_placer.place_numbers(
            self.contour_image.copy(),
            self.regions,
            self.palette
        )

        placement_stats = self.number_placer.get_placement_statistics()
        print(f"  Numbers placed: {placement_stats['total_placed']}")

        # Step 6: Generate template
        print(f"\n[6/8] Generating template...")
        self.template = self.template_generator.generate_advanced_template(
            self.contour_image,
            self.numbered_image,
            add_grid=add_grid
        )

        # Create printable version
        printable_template = self.template_generator.create_printable_template(
            self.template,
            title="Paint by Numbers",
            add_border=True
        )

        # Step 7: Generate legend
        print(f"\n[7/8] Generating color legend...")
        self.legend = self.legend_generator.generate_legend(
            self.palette,
            include_hex=True,
            include_rgb=False,
            style=legend_style
        )

        # Step 8: Save outputs
        print(f"\n[8/8] Saving outputs...")

        # Get base filename
        input_name = Path(input_path).stem

        # Save main template
        template_path = output_path / f"{input_name}_template.png"
        self.template_generator.save_template(printable_template, str(template_path))

        # Save legend
        legend_path = output_path / f"{input_name}_legend.png"
        self.legend_generator.save_legend(self.legend, str(legend_path))

        # Save solution (colored reference)
        solution = self.template_generator.create_solution_image(
            self.quantized_image,
            self.contour_image
        )
        solution_path = output_path / f"{input_name}_solution.png"
        cv2.imwrite(str(solution_path), cv2.cvtColor(solution, cv2.COLOR_RGB2BGR))
        print(f"  Solution saved to: {solution_path}")

        # Save coloring guide (faded colors)
        guide = self.template_generator.create_coloring_guide(
            self.quantized_image,
            self.contour_image,
            alpha=0.3
        )
        guide_path = output_path / f"{input_name}_guide.png"
        cv2.imwrite(str(guide_path), cv2.cvtColor(guide, cv2.COLOR_RGB2BGR))
        print(f"  Coloring guide saved to: {guide_path}")

        # Save comparison
        comparison = self.template_generator.create_comparison_image(
            self.original_image,
            printable_template,
            solution,
            layout="horizontal"
        )
        comparison_path = output_path / f"{input_name}_comparison.png"
        cv2.imwrite(str(comparison_path), cv2.cvtColor(comparison, cv2.COLOR_RGB2BGR))
        print(f"  Comparison saved to: {comparison_path}")

        print("\n" + "=" * 60)
        print("GENERATION COMPLETE!")
        print("=" * 60)
        print(f"\nOutput directory: {output_path.absolute()}")
        print(f"\nFiles generated:")
        print(f"  • Template: {template_path.name}")
        print(f"  • Legend: {legend_path.name}")
        print(f"  • Solution: {solution_path.name}")
        print(f"  • Guide: {guide_path.name}")
        print(f"  • Comparison: {comparison_path.name}")

        return {
            "template": str(template_path),
            "legend": str(legend_path),
            "solution": str(solution_path),
            "guide": str(guide_path),
            "comparison": str(comparison_path)
        }


def main():
    """Main entry point for command-line interface"""
    parser = argparse.ArgumentParser(
        description="Paint by Numbers Generator - Convert images to paint-by-numbers templates",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python main.py input.jpg

  # Specify number of colors
  python main.py input.jpg -c 20

  # Custom output directory
  python main.py input.jpg -o my_output

  # Add reference grid
  python main.py input.jpg --grid

  # Compact legend style
  python main.py input.jpg -l compact
        """
    )

    parser.add_argument(
        "input",
        type=str,
        help="Input image path"
    )

    parser.add_argument(
        "-o", "--output",
        type=str,
        default="output",
        help="Output directory (default: output)"
    )

    parser.add_argument(
        "-c", "--colors",
        type=int,
        default=None,
        help=f"Number of colors (default: {Config.DEFAULT_NUM_COLORS})"
    )

    parser.add_argument(
        "--no-merge",
        action="store_true",
        help="Don't merge nearby regions of same color"
    )

    parser.add_argument(
        "--grid",
        action="store_true",
        help="Add reference grid to template"
    )

    parser.add_argument(
        "-l", "--legend-style",
        type=str,
        choices=["grid", "list", "compact"],
        default="grid",
        help="Legend style (default: grid)"
    )

    args = parser.parse_args()

    # Validate input file
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    # Create generator and run
    try:
        generator = PaintByNumbersGenerator()
        generator.generate(
            input_path=args.input,
            output_dir=args.output,
            n_colors=args.colors,
            merge_similar=not args.no_merge,
            add_grid=args.grid,
            legend_style=args.legend_style
        )
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
