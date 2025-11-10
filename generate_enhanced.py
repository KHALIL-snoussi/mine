#!/usr/bin/env python3
"""
Enhanced Paint-by-Numbers Generator
Next-generation image-to-paint-by-numbers conversion with all premium features

NEW FEATURES:
- Dynamic color palettes (matched to your image)
- Black avoidance (no large dark voids)
- Vibrancy boost (rich, vibrant colors)
- Detail level control (1-5)
- Background simplification
- Professional-Plus and 5 more premium presets
- Up to 72 colors for ultra-realistic results
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
    get_premium_preset,
    premium_preset_to_config,
    print_premium_presets,
    PREMIUM_PRESETS,
    get_detail_level_by_number,
    detail_level_preset_to_config
)
from paint_by_numbers.utils.color_names import get_color_names_for_palette
from paint_by_numbers.quality import TemplateValidator, print_validation_report
from paint_by_numbers.logger import logger


class EnhancedPaintByNumbersGenerator:
    """
    Enhanced paint-by-numbers generator with all new features
    """

    def __init__(self, preset: str = 'balanced_quality', config: Optional[Config] = None):
        """
        Initialize enhanced generator

        Args:
            preset: Premium preset ID
            config: Optional custom config (overrides preset)
        """
        self.premium_preset = get_premium_preset(preset)

        if self.premium_preset is None:
            logger.warning(f"Unknown preset '{preset}', using 'balanced_quality'")
            self.premium_preset = get_premium_preset('balanced_quality')

        # Create config from premium preset or use provided
        if config is None:
            self.config = premium_preset_to_config(self.premium_preset)
        else:
            self.config = config

        # Create base generator
        self.generator = PaintByNumbersGenerator(self.config)
        self.validation_report = None

    def generate(
        self,
        input_path: str,
        output_dir: str = "output_enhanced",
        canvas_size: Optional[str] = None,
        num_colors: Optional[int] = None,
        detail_level: Optional[int] = None,
        vibrancy: Optional[float] = None,
        validate: bool = True,
        use_named_colors: bool = True,
        **kwargs
    ) -> Dict:
        """
        Generate enhanced paint-by-numbers template

        Args:
            input_path: Path to input image
            output_dir: Output directory
            canvas_size: Canvas format (e.g., 'canvas_50x35')
            num_colors: Override number of colors
            detail_level: Override detail level (1-5)
            vibrancy: Override vibrancy boost
            validate: Run quality validation
            use_named_colors: Use CSS color names in legend
            **kwargs: Additional arguments for generator

        Returns:
            Dictionary with output files and metadata
        """
        # Display configuration
        self._print_header(input_path)

        # Apply overrides
        if num_colors is not None:
            self.config.DEFAULT_NUM_COLORS = num_colors
            logger.info(f"Override: Using {num_colors} colors")

        if detail_level is not None:
            detail_preset = get_detail_level_by_number(detail_level)
            self.config = detail_level_preset_to_config(detail_preset, self.config)
            logger.info(f"Override: Using detail level {detail_level}/5")

        if vibrancy is not None:
            self.config.VIBRANCY_BOOST = vibrancy
            logger.info(f"Override: Vibrancy boost {vibrancy}x")

        # Determine canvas format
        paper_format = self._determine_canvas_format(canvas_size)

        # Generate the template
        logger.info(f"\n🎨 Generating with {self.premium_preset.display_name} preset...")
        logger.info(f"   Colors: {self.config.DEFAULT_NUM_COLORS} (dynamic palette)")
        logger.info(f"   Detail Level: {self.config.DETAIL_LEVEL}/5")
        logger.info(f"   Vibrancy: {self.config.VIBRANCY_BOOST}x")
        logger.info(f"   Min Region: {self.config.MIN_REGION_SIZE} pixels")
        logger.info(f"   Black Avoidance: {'Enabled' if self.config.AVOID_PURE_BLACK else 'Disabled'}")
        logger.info(f"   Background Simplification: {'Enabled' if self.config.SIMPLIFY_BACKGROUND else 'Disabled'}")
        logger.info(f"   Estimated Time: {self.premium_preset.estimated_hours}")

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

        # Print final summary
        self._print_summary(result_files, canvas_size)

        return result_files

    def _print_header(self, input_path: str):
        """Print generation header"""
        print("\n" + "="*80)
        print("✨ ENHANCED PAINT-BY-NUMBERS GENERATOR")
        print("="*80)
        print(f"📁 Input: {Path(input_path).name}")
        print(f"🎨 Preset: {self.premium_preset.display_name}")
        print(f"📝 {self.premium_preset.description}")
        print("="*80 + "\n")

    def _determine_canvas_format(self, canvas_size: Optional[str]) -> Optional[str]:
        """Determine paper format from canvas size"""
        if not canvas_size:
            return None

        canvas_map = {
            '50x35': 'canvas_50x35',
            '60x40': 'canvas_60x40',
            '70x50': 'canvas_70x50',
            'a4': 'a4',
            'a3': 'a3',
            'a2': 'a2'
        }

        return canvas_map.get(canvas_size)

    def _save_named_colors(self, color_names: list, palette, output_dir: str, stem: str):
        """Save named colors to JSON file"""
        import json

        output_path = Path(output_dir) / f"{stem}_named_colors.json"
        color_data = []

        for i, (color_name, color_rgb) in enumerate(zip(color_names, palette)):
            color_data.append({
                "number": i + 1,
                "name": color_name,
                "rgb": color_rgb.tolist()
            })

        with open(output_path, 'w') as f:
            json.dump(color_data, f, indent=2)

        logger.info(f"Saved named colors to: {output_path}")

    def _print_summary(self, result_files: Dict, canvas_size: Optional[str]):
        """Print generation summary"""
        print("\n" + "="*80)
        print("✅ GENERATION COMPLETE")
        print("="*80)

        print("\n📦 Output Files:")

        file_list = [
            ('template', 'Template (numbered)'),
            ('legend', 'Color Legend'),
            ('solution', 'Solution Image'),
            ('guide', 'Color Guide'),
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

        print("\n✨ Enhanced Features Applied:")
        print(f"  ✓ Dynamic color palette (matched to your image)")
        print(f"  ✓ Vibrancy boost: {self.config.VIBRANCY_BOOST}x")
        print(f"  ✓ Detail level: {self.config.DETAIL_LEVEL}/5")
        print(f"  ✓ Black avoidance: {'Enabled' if self.config.AVOID_PURE_BLACK else 'Disabled'}")
        print(f"  ✓ Background simplification: {'Enabled' if self.config.SIMPLIFY_BACKGROUND else 'Disabled'}")

        print("\n📐 Output Specifications:")
        print(f"  • Resolution: 300 DPI")
        print(f"  • Colors: {self.config.DEFAULT_NUM_COLORS} (dynamic)")
        print(f"  • Estimated Time: {self.premium_preset.estimated_hours}")

        if canvas_size:
            print(f"  • Canvas Size: {canvas_size}")

        print("\n💡 Next Steps:")
        print("  1. Review the template and solution image")
        print("  2. Check the named_colors.json for paint matching")
        print("  3. Print the template at 100% scale (no scaling)")
        print("  4. Use PNG for most print shops, SVG for maximum quality")
        print("  5. Enjoy painting your masterpiece!")

        print("\n" + "="*80)


def main():
    """Main entry point for enhanced CLI"""
    parser = argparse.ArgumentParser(
        description="Enhanced Paint-by-Numbers Generator - Next Generation Features",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
✨ PREMIUM PRESETS (with dynamic palettes & enhancements):
  balanced_quality     - 30 colors, level 3 detail, 8-15 hours  ⭐ Recommended
  professional_plus    - 36 colors, level 4 detail, 12-20 hours (maximum quality)
  ultra_realistic      - 60 colors, level 5 detail, 30-50 hours (photorealistic)
  vibrant_art          - 24 colors, level 2 detail, 6-12 hours  (pop art style)
  quick_masterpiece    - 18 colors, level 2 detail, 3-6 hours   (beginners)
  print_ready_large    - 48 colors, level 4 detail, 40-60 hours (70x50 cm prints)
  upaint_style         - 30 colors, artistic simplification, 12-18 hours (smooth painterly look) 🎨 NEW!

📊 DETAIL LEVELS (control segment complexity):
  1 - Very Simple    (50-150 regions,  bold poster-like)
  2 - Simple         (150-300 regions, smooth appearance)
  3 - Balanced       (300-600 regions, natural balance) ⭐ Default
  4 - Detailed       (600-1200 regions, fine textures)
  5 - Very Detailed  (1200+ regions, maximum detail)

🎨 NEW FEATURES:
  ✓ Dynamic color palettes (matched to your image)
  ✓ Black avoidance (no large dark voids)
  ✓ Vibrancy boost (rich, vibrant colors)
  ✓ Background simplification (lighter backgrounds)
  ✓ Up to 72 colors for ultra-realistic results
  ✓ Single detail level control (1-5)
  ✓ Professional-Plus preset for best results

📐 CANVAS SIZES:
  50x35 - 5906×4134 px @ 300 DPI (50×35 cm)
  60x40 - 7087×4724 px @ 300 DPI (60×40 cm)
  70x50 - 8268×5906 px @ 300 DPI (70×50 cm)
  a4, a3, a2 - Standard paper sizes

🎯 EXAMPLES:

  # Recommended: Balanced quality preset
  python generate_enhanced.py image.jpg

  # Professional Plus preset (best quality)
  python generate_enhanced.py image.jpg --preset professional_plus

  # Ultra realistic with 60 colors
  python generate_enhanced.py image.jpg --preset ultra_realistic

  # Custom: 40 colors with detail level 5
  python generate_enhanced.py image.jpg --colors 40 --detail-level 5

  # Vibrant pop art style
  python generate_enhanced.py image.jpg --preset vibrant_art

  # Large canvas print (70x50 cm)
  python generate_enhanced.py image.jpg --preset print_ready_large --canvas-size 70x50

  # Custom vibrancy boost
  python generate_enhanced.py image.jpg --vibrancy 1.3

  # List all premium presets
  python generate_enhanced.py --list-presets

💡 TIPS:
  • Start with 'balanced_quality' preset for best results
  • Use 'professional_plus' for gifts and framing
  • Try 'vibrant_art' for colorful subjects
  • Use 'ultra_realistic' for portraits and photos
  • Increase detail level for complex images
  • Decrease detail level for easier, faster painting
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
        default='output_enhanced',
        help='Output directory (default: output_enhanced)'
    )

    # Premium Presets
    parser.add_argument(
        '--preset',
        type=str,
        choices=list(PREMIUM_PRESETS.keys()),
        default='balanced_quality',
        help='Premium preset (default: balanced_quality)'
    )

    parser.add_argument(
        '--list-presets',
        action='store_true',
        help='List all available premium presets and exit'
    )

    # Canvas
    parser.add_argument(
        '--canvas-size',
        type=str,
        choices=['50x35', '60x40', '70x50', 'a4', 'a3', 'a2'],
        help='Canvas size for printing'
    )

    # Color Control
    parser.add_argument(
        '--colors',
        type=int,
        help='Number of colors (5-72, overrides preset)'
    )

    parser.add_argument(
        '--detail-level',
        type=int,
        choices=[1, 2, 3, 4, 5],
        help='Detail level (1=very simple, 5=very detailed, overrides preset)'
    )

    parser.add_argument(
        '--vibrancy',
        type=float,
        help='Vibrancy boost (0.8-1.5, default: 1.15). Higher = more saturated colors'
    )

    # Feature Toggles
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

    parser.add_argument(
        '--use-unified-palette',
        action='store_true',
        help='Use fixed unified palette instead of dynamic (for business use)'
    )

    parser.add_argument(
        '--no-simplify-background',
        action='store_true',
        help='Disable background simplification'
    )

    parser.add_argument(
        '--artistic-simplification',
        action='store_true',
        help='Enable artistic region merging for painterly effect (uPaint style)'
    )

    parser.add_argument(
        '--min-color-distance',
        type=float,
        help='Minimum perceptual distance between colors (15-40, default: 25)'
    )

    parser.add_argument(
        '--no-skin-clutter-reduction',
        action='store_true',
        help='Disable automatic reduction of dark spots in skin tones'
    )

    # Additional options
    parser.add_argument(
        '--grid',
        action='store_true',
        help='Add reference grid to template'
    )

    args = parser.parse_args()

    # List presets if requested
    if args.list_presets:
        print_premium_presets()
        sys.exit(0)

    # Validate input
    if not args.input:
        parser.print_help()
        print("\n❌ Error: Input image required")
        print("\n💡 Quick start:")
        print("   python generate_enhanced.py your_image.jpg")
        print("\n   Or with professional-plus preset:")
        print("   python generate_enhanced.py your_image.jpg --preset professional_plus")
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {args.input}")
        sys.exit(1)

    try:
        # Create enhanced generator
        generator = EnhancedPaintByNumbersGenerator(preset=args.preset)

        # Apply overrides
        if args.no_svg:
            generator.config.GENERATE_SVG = False
        if args.no_pdf:
            generator.config.GENERATE_PDF = False
        if args.use_unified_palette:
            generator.config.USE_UNIFIED_PALETTE = True
            logger.info("Override: Using unified palette (business mode)")
        if args.no_simplify_background:
            generator.config.SIMPLIFY_BACKGROUND = False
        if args.artistic_simplification:
            generator.config.ARTISTIC_SIMPLIFICATION = True
            logger.info("Override: Artistic simplification enabled")
        if args.min_color_distance:
            generator.config.MIN_COLOR_DISTANCE = args.min_color_distance
            logger.info(f"Override: Min color distance = {args.min_color_distance}")
        if args.no_skin_clutter_reduction:
            generator.config.REDUCE_SKIN_CLUTTER = False

        # Validate color count
        if args.colors is not None:
            if args.colors < 5 or args.colors > 72:
                print(f"❌ Error: Colors must be between 5 and 72")
                sys.exit(1)

        # Validate vibrancy
        if args.vibrancy is not None:
            if args.vibrancy < 0.8 or args.vibrancy > 1.5:
                print(f"❌ Error: Vibrancy must be between 0.8 and 1.5")
                sys.exit(1)

        # Generate
        result = generator.generate(
            input_path=str(input_path),
            output_dir=args.output,
            canvas_size=args.canvas_size,
            num_colors=args.colors,
            detail_level=args.detail_level,
            vibrancy=args.vibrancy,
            validate=not args.no_validate,
            use_named_colors=not args.no_named_colors,
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
