#!/usr/bin/env python3
"""
Premium Paint-by-Numbers Generator
Professional-grade image-to-paint-by-numbers conversion with AI-ready features

Features:
- 6 difficulty presets (Kids to Master)
- Named color mapping (350+ CSS colors)
- Intelligent number placement (pole-of-inaccessibility)
- Quality validation and sanity checks
- High-resolution canvas output (300 DPI)
- SVG vector + PDF kit generation
- Print-ready output for professional shops
"""

import sys
import argparse
from pathlib import Path
from typing import Optional, Dict

# Add paint_by_numbers to path
sys.path.insert(0, str(Path(__file__).parent))

from paint_by_numbers.main import PaintByNumbersGenerator
from paint_by_numbers.config import Config
from paint_by_numbers.presets import (
    get_difficulty_preset,
    difficulty_preset_to_config,
    print_difficulty_presets,
    DIFFICULTY_PRESETS
)
from paint_by_numbers.utils.color_names import get_color_names_for_palette
from paint_by_numbers.quality import TemplateValidator, print_validation_report
from paint_by_numbers.logger import logger


class PremiumPaintByNumbersGenerator:
    """
    Premium paint-by-numbers generator with advanced features
    """

    def __init__(self, difficulty: str = 'medium', config: Optional[Config] = None):
        """
        Initialize premium generator

        Args:
            difficulty: Difficulty preset ID
            config: Optional custom config (overrides difficulty preset)
        """
        self.difficulty_preset = get_difficulty_preset(difficulty)

        if self.difficulty_preset is None:
            logger.warning(f"Unknown difficulty '{difficulty}', using 'medium'")
            self.difficulty_preset = get_difficulty_preset('medium')

        # Create config from difficulty preset or use provided
        if config is None:
            self.config = difficulty_preset_to_config(self.difficulty_preset)
        else:
            self.config = config

        # Create base generator
        self.generator = PaintByNumbersGenerator(self.config)
        self.validation_report = None

    def generate(
        self,
        input_path: str,
        output_dir: str = "output_premium",
        canvas_size: Optional[str] = None,
        num_colors: Optional[int] = None,
        validate: bool = True,
        use_named_colors: bool = True,
        **kwargs
    ) -> Dict:
        """
        Generate premium paint-by-numbers template

        Args:
            input_path: Path to input image
            output_dir: Output directory
            canvas_size: Canvas format (e.g., 'canvas_50x35')
            num_colors: Override number of colors
            validate: Run quality validation
            use_named_colors: Use CSS color names in legend
            **kwargs: Additional arguments for generator

        Returns:
            Dictionary with output files and metadata
        """
        # Display configuration
        self._print_header(input_path, canvas_size)

        # Override num_colors if specified
        if num_colors is not None:
            self.config.DEFAULT_NUM_COLORS = num_colors

        # Determine canvas format
        paper_format = self._determine_canvas_format(canvas_size)

        # Generate the template
        logger.info(f"\n🎨 Generating with {self.difficulty_preset.display_name} preset...")
        logger.info(f"   Colors: {self.config.DEFAULT_NUM_COLORS}")
        logger.info(f"   Min Region Size: {self.config.MIN_REGION_SIZE} pixels")
        logger.info(f"   Estimated Time: {self.difficulty_preset.estimated_hours}")

        result_files = self.generator.generate(
            input_path=input_path,
            output_dir=output_dir,
            n_colors=self.config.DEFAULT_NUM_COLORS,
            paper_format=paper_format,
            **kwargs
        )

        # Add named colors to legend if requested
        if use_named_colors and self.generator.palette is not None:
            logger.info("\n🏷️  Adding named colors to legend...")
            color_names = get_color_names_for_palette(self.generator.palette)
            result_files['color_names'] = color_names

            # Save named color mapping
            self._save_named_colors(color_names, self.generator.palette, output_dir, Path(input_path).stem)

        # Run quality validation if requested
        if validate and self.generator.regions is not None:
            logger.info("\n✅ Running quality validation...")
            validator = TemplateValidator()
            self.validation_report = validator.validate(
                self.generator.regions,
                self.generator.palette,
                self.generator.processed_image.shape[:2]
            )

            # Print validation report
            print_validation_report(self.validation_report)

            # Save validation report
            result_files['validation'] = self._save_validation_report(
                self.validation_report,
                output_dir,
                Path(input_path).stem
            )

        # Print final summary
        self._print_summary(result_files, canvas_size)

        return result_files

    def _print_header(self, input_path: str, canvas_size: Optional[str]):
        """Print generation header"""
        print("\n" + "="*80)
        print("🎨 PREMIUM PAINT-BY-NUMBERS GENERATOR")
        print("="*80)
        print(f"📁 Input: {input_path}")
        print(f"🎯 Difficulty: {self.difficulty_preset.display_name}")
        print(f"🎨 Colors: {self.config.DEFAULT_NUM_COLORS}")
        print(f"⏱️  Estimated Time: {self.difficulty_preset.estimated_hours}")
        print(f"🎓 Skill Level: {self.difficulty_preset.skill_level}")

        if canvas_size:
            print(f"📐 Canvas: {canvas_size}")

        print(f"💡 Best For: {', '.join(self.difficulty_preset.best_for[:3])}")
        print("="*80)

    def _determine_canvas_format(self, canvas_size: Optional[str]) -> Optional[str]:
        """Determine paper format from canvas size or difficulty"""
        if canvas_size:
            # Map common names to format IDs
            canvas_map = {
                '50x35': 'canvas_50x35',
                '60x40': 'canvas_60x40',
                '70x50': 'canvas_70x50',
                'a4': 'a4',
                'a3': 'a3'
            }
            return canvas_map.get(canvas_size, canvas_size)

        # Use default based on difficulty
        if self.difficulty_preset.difficulty_score >= 90:
            return 'canvas_50x35'  # Master level gets large canvas
        elif self.difficulty_preset.difficulty_score >= 75:
            return 'a3'  # Expert gets A3
        else:
            return 'a4'  # Others get A4

    def _save_named_colors(self, color_names, palette, output_dir, input_name):
        """Save named color mapping as JSON"""
        import json
        import numpy as np

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        color_data = []
        for i, (name, color) in enumerate(zip(color_names, palette)):
            rgb = tuple(color.tolist()) if isinstance(color, np.ndarray) else color
            color_data.append({
                'number': i + 1,
                'name': name,
                'rgb': rgb,
                'hex': '#{:02x}{:02x}{:02x}'.format(*rgb)
            })

        json_path = output_path / f"{input_name}_named_colors.json"
        with open(json_path, 'w') as f:
            json.dump({
                'colors': color_data,
                'total_colors': len(color_names)
            }, f, indent=2)

        logger.info(f"  Named colors saved to: {json_path}")
        return str(json_path)

    def _save_validation_report(self, report, output_dir, input_name):
        """Save validation report as JSON"""
        import json

        output_path = Path(output_dir)
        json_path = output_path / f"{input_name}_validation.json"

        with open(json_path, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"  Validation report saved to: {json_path}")
        return str(json_path)

    def _print_summary(self, result_files, canvas_size):
        """Print generation summary"""
        print("\n" + "="*80)
        print("✅ GENERATION COMPLETE!")
        print("="*80)

        if self.validation_report:
            if self.validation_report['valid']:
                print("\n✅ Quality Validation: PASSED")
            else:
                print("\n⚠️  Quality Validation: ISSUES FOUND")
                print(f"   Errors: {len(self.validation_report['errors'])}")
                print(f"   Warnings: {len(self.validation_report['warnings'])}")

        print("\n📄 Generated Files:")
        file_list = [
            ('template', 'Template (with numbers & outlines)'),
            ('legend', 'Color Legend'),
            ('solution', 'Solution (colored reference)'),
            ('guide', 'Painting Guide (faded)'),
            ('comparison', 'Comparison (original/template/solution)'),
        ]

        for key, desc in file_list:
            if key in result_files:
                print(f"  ✓ {desc}: {Path(result_files[key]).name}")

        if 'svg_template' in result_files:
            print(f"  ✓ SVG Template (vector): {Path(result_files['svg_template']).name}")
            print(f"  ✓ SVG Legend: {Path(result_files['svg_legend']).name}")

        if 'pdf' in result_files:
            print(f"  ✓ PDF Complete Kit: {Path(result_files['pdf']).name}")

        if 'color_names' in result_files:
            print(f"  ✓ Named Colors: Available ({len(result_files['color_names'])} colors)")

        print("\n📐 Output Specifications:")
        print(f"  • Resolution: 300 DPI (embedded in files)")
        print(f"  • Difficulty: {self.difficulty_preset.name} ({self.difficulty_preset.difficulty_score}/100)")
        print(f"  • Colors: {self.config.DEFAULT_NUM_COLORS}")

        if canvas_size:
            print(f"  • Canvas Size: {canvas_size}")

        print("\n💡 Next Steps:")
        print("  1. Review the template and validation report")
        print("  2. Check the named_colors.json for paint matching")
        print("  3. Print the template at 100% scale (no scaling in print dialog)")
        print("  4. Use PNG for most print shops, SVG for maximum quality")

        if self.difficulty_preset.difficulty_score >= 75:
            print("\n⚠️  Advanced Template:")
            print(f"  • This is a {self.difficulty_preset.skill_level} level template")
            print(f"  • Estimated time: {self.difficulty_preset.estimated_hours}")
            print("  • Take breaks and work in sections")

        print("\n" + "="*80)


def main():
    """Main entry point for premium CLI"""
    parser = argparse.ArgumentParser(
        description="Premium Paint-by-Numbers Generator with Advanced Features",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
🎨 DIFFICULTY LEVELS:
  kids      - 8 colors,  1-2 hours   (Children 6+, first-timers)
  easy      - 12 colors, 2-4 hours   (Beginners, relaxation)
  medium    - 18 colors, 4-8 hours   (Casual painters, portraits) ⭐ Default
  hard      - 24 colors, 8-15 hours  (Experienced, complex images)
  expert    - 30 colors, 15-25 hours (Expert painters, fine art)
  master    - 36 colors, 25-40 hours (Masters, large canvas prints)

📐 CANVAS SIZES:
  50x35     - 5906×4134 px @ 300 DPI (50×35 cm print canvas)
  60x40     - 7087×4724 px @ 300 DPI (60×40 cm extra large)
  70x50     - 8268×5906 px @ 300 DPI (70×50 cm premium)
  a4        - Standard A4 paper
  a3        - Large A3 paper

🎯 EXAMPLES:

  # Easy template for beginners
  python generate_premium.py image.jpg --difficulty easy

  # Medium difficulty with 20 colors
  python generate_premium.py image.jpg --difficulty medium --colors 20

  # Master level for 50×35 cm canvas printing
  python generate_premium.py image.jpg --difficulty master --canvas-size 50x35

  # Expert level with custom output directory
  python generate_premium.py image.jpg --difficulty expert -o my_masterpiece/

  # List all difficulty presets
  python generate_premium.py --list-difficulties

  # Skip validation (faster)
  python generate_premium.py image.jpg --no-validate

✨ FEATURES:
  ✓ 6 difficulty presets with auto-configuration
  ✓ Named colors (e.g., "Sky Blue" instead of RGB values)
  ✓ Intelligent number placement (pole-of-inaccessibility)
  ✓ Quality validation with detailed reports
  ✓ 300 DPI output with embedded metadata
  ✓ SVG vector + PDF kit generation
  ✓ Print-ready for professional shops
        """
    )

    # Input/Output
    parser.add_argument(
        'input',
        type=str,
        nargs='?',
        help='Input image path'
    )

    parser.add_argument(
        '-o', '--output',
        type=str,
        default='output_premium',
        help='Output directory (default: output_premium)'
    )

    # Difficulty
    parser.add_argument(
        '--difficulty',
        type=str,
        choices=list(DIFFICULTY_PRESETS.keys()),
        default='medium',
        help='Difficulty preset (default: medium)'
    )

    parser.add_argument(
        '--list-difficulties',
        action='store_true',
        help='List all available difficulty presets and exit'
    )

    # Canvas
    parser.add_argument(
        '--canvas-size',
        type=str,
        choices=['50x35', '60x40', '70x50', 'a4', 'a3'],
        help='Canvas size for printing'
    )

    # Colors
    parser.add_argument(
        '--colors',
        type=int,
        help='Number of colors (overrides difficulty preset)'
    )

    # Features
    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='Skip quality validation (faster)'
    )

    parser.add_argument(
        '--no-named-colors',
        action='store_true',
        help='Skip named color mapping'
    )

    parser.add_argument(
        '--no-svg',
        action='store_true',
        help='Skip SVG generation'
    )

    parser.add_argument(
        '--no-pdf',
        action='store_true',
        help='Skip PDF generation'
    )

    # Additional options
    parser.add_argument(
        '--merge-regions',
        action='store_true',
        default=True,
        help='Merge nearby regions of same color (default: True)'
    )

    parser.add_argument(
        '--grid',
        action='store_true',
        help='Add reference grid to template'
    )

    args = parser.parse_args()

    # List difficulties if requested
    if args.list_difficulties:
        print_difficulty_presets()
        sys.exit(0)

    # Validate input
    if not args.input:
        parser.print_help()
        print("\n❌ Error: Input image required")
        print("\n💡 Quick start:")
        print("   python generate_premium.py your_image.jpg")
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {args.input}")
        sys.exit(1)

    try:
        # Create premium generator
        generator = PremiumPaintByNumbersGenerator(difficulty=args.difficulty)

        # Override SVG/PDF settings
        if args.no_svg:
            generator.config.GENERATE_SVG = False
        if args.no_pdf:
            generator.config.GENERATE_PDF = False

        # Generate
        result = generator.generate(
            input_path=str(input_path),
            output_dir=args.output,
            canvas_size=args.canvas_size,
            num_colors=args.colors,
            validate=not args.no_validate,
            use_named_colors=not args.no_named_colors,
            merge_similar=args.merge_regions,
            add_grid=args.grid
        )

        # Success!
        sys.exit(0)

    except Exception as e:
        print(f"\n❌ Error during generation: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
