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
from typing import Optional
from tqdm import tqdm

from config import Config
from logger import setup_logger, logger
from palettes import PaletteManager
from core.image_processor import ImageProcessor
from core.color_quantizer import ColorQuantizer
from core.region_detector import RegionDetector
from core.contour_builder import ContourBuilder
from core.number_placer import NumberPlacer
from output.template_generator import TemplateGenerator
from output.legend_generator import LegendGenerator
from output.svg_exporter import SVGExporter
from output.pdf_generator import PDFGenerator
from batch_processor import BatchProcessor
from intelligence.palette_selector import IntelligentPaletteSelector
from intelligence.difficulty_analyzer import DifficultyAnalyzer
from intelligence.quality_scorer import QualityScorer
from intelligence.color_optimizer import ColorOptimizer


class PaintByNumbersGenerator:
    """Main application class for paint-by-numbers generation"""

    def __init__(self, config=None):
        """
        Initialize the generator

        Args:
            config: Configuration object
        """
        self.config = config or Config()

        # Setup logger
        setup_logger(
            level=getattr(__import__('logging'), self.config.LOG_LEVEL),
            log_file=self.config.LOG_FILE
        )

        # Initialize components
        self.image_processor = ImageProcessor(self.config)
        self.color_quantizer = ColorQuantizer(self.config)
        self.region_detector = RegionDetector(self.config)
        self.contour_builder = ContourBuilder(self.config)
        self.number_placer = NumberPlacer(self.config)
        self.template_generator = TemplateGenerator(self.config)
        self.legend_generator = LegendGenerator(self.config)
        self.svg_exporter = SVGExporter(self.config)
        self.pdf_generator = PDFGenerator(self.config)
        self.palette_manager = PaletteManager()

        # Initialize intelligence modules
        self.palette_selector = IntelligentPaletteSelector()
        self.difficulty_analyzer = DifficultyAnalyzer()
        self.quality_scorer = QualityScorer()
        self.color_optimizer = ColorOptimizer()

        # Storage for intermediate results
        self.original_image = None
        self.processed_image = None
        self.quantized_image = None
        self.palette = None
        self.color_names = []
        self.regions = None
        self.contour_image = None
        self.numbered_image = None
        self.template = None
        self.legend = None
        self.difficulty_analysis = None
        self.quality_analysis = None
        self.color_mixing_guide = None

    def generate(self, input_path: str, output_dir: str = "output",
                n_colors: int = None, merge_similar: bool = True,
                add_grid: bool = False, legend_style: str = "grid",
                use_unified_palette: Optional[bool] = None,
                palette_name: Optional[str] = None) -> dict:
        """
        Generate complete paint-by-numbers package from input image

        Args:
            input_path: Path to input image
            output_dir: Directory for output files
            n_colors: Number of colors (None uses default)
            merge_similar: Merge nearby regions of same color
            add_grid: Add reference grid to template
            legend_style: Style of legend ("grid", "list", or "compact")
            use_unified_palette: Use predefined color palette
            palette_name: Name of unified palette to use

        Returns:
            Dictionary with paths to generated files
        """
        logger.info("=" * 60)
        logger.info("PAINT BY NUMBERS GENERATOR")
        logger.info("=" * 60)

        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Define processing steps
        steps = [
            "Loading and preprocessing image",
            "Performing color quantization",
            "Detecting regions",
            "Building contours",
            "Placing numbers",
            "Generating template",
            "Generating color legend",
            "Saving outputs"
        ]

        # Use progress bar if enabled
        if self.config.SHOW_PROGRESS:
            pbar = tqdm(total=len(steps), desc="Generating", unit="step")

        # Step 1: Load and preprocess image
        logger.info("\n[1/8] Loading and preprocessing image...")
        self.original_image = self.image_processor.load_image(input_path)
        self.processed_image = self.image_processor.preprocess(
            apply_bilateral=True,
            apply_gaussian=True
        )

        # Display image info
        info = self.image_processor.get_image_info()
        logger.info(f"  Image size: {info['width']}x{info['height']}")
        logger.info(f"  File size: {info['size_mb']:.2f} MB")

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 2: Intelligent Palette Selection & Color quantization
        logger.info(f"\n[2/8] Intelligent palette selection and color quantization...")

        # Auto-select palette if not specified
        if use_unified_palette is None:
            use_unified_palette = self.config.USE_UNIFIED_PALETTE

        if palette_name is None and use_unified_palette:
            # Use intelligent palette selector
            recommended_palette, image_analysis = self.palette_selector.recommend_palette(
                self.processed_image, n_colors
            )
            palette_name = recommended_palette
            logger.info(f"✨ Intelligently selected: {palette_name}")
        elif palette_name is None:
            palette_name = self.config.UNIFIED_PALETTE_NAME

        if n_colors is None:
            n_colors = self.config.DEFAULT_NUM_COLORS

        self.quantized_image, self.palette = self.color_quantizer.quantize(
            self.processed_image,
            n_colors=n_colors,
            sort_palette=True,
            use_unified_palette=use_unified_palette,
            palette_name=palette_name
        )

        # Optimize color mapping for better visual quality
        if use_unified_palette:
            logger.info("Optimizing color mapping...")
            self.quantized_image, optimized_labels = self.color_optimizer.optimize_palette_mapping(
                self.processed_image, self.palette, perceptual=True
            )
            self.color_quantizer.labels = optimized_labels

        # Get color names if using unified palette
        if self.color_quantizer.color_names:
            self.color_names = self.color_quantizer.color_names
        else:
            self.color_names = [f"Color {i+1}" for i in range(len(self.palette))]

        # Display color statistics
        percentages = self.color_quantizer.get_color_percentages()
        logger.info(f"  Colors used: {len(self.palette)}")
        logger.info(f"  Dominant color: {max(percentages.values()):.1f}% of image")

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 3: Detect regions
        logger.info(f"\n[3/8] Detecting regions...")
        self.regions = self.region_detector.detect_regions(
            self.quantized_image,
            self.palette,
            self.color_quantizer.labels
        )

        # Merge nearby regions if requested
        if merge_similar:
            logger.info("  Merging nearby regions...")
            self.regions = self.region_detector.merge_nearby_regions(
                same_color=True,
                distance_threshold=5
            )

        # Filter small regions
        self.regions = self.region_detector.filter_small_regions()

        stats = self.region_detector.get_region_statistics()
        logger.info(f"  Total regions: {stats['total_regions']}")
        logger.info(f"  Average region size: {stats['mean_area']:.0f} pixels")

        # Analyze difficulty
        self.difficulty_analysis = self.difficulty_analyzer.analyze_difficulty(
            self.regions, self.palette, self.processed_image.shape[:2]
        )

        # Analyze quality
        self.quality_analysis = self.quality_scorer.score_template(
            self.original_image,
            self.quantized_image,
            self.regions,
            self.palette
        )

        # Generate color mixing guide
        self.color_mixing_guide = self.color_optimizer.generate_color_mixing_guide(
            self.palette, self.color_names
        )

        # Analyze color harmony
        harmony_analysis = self.color_optimizer.analyze_color_harmony(self.palette)
        logger.info(f"🎨 Color Harmony: {harmony_analysis['harmony_type']} ({harmony_analysis['harmony_score']:.1f}/100)")

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 4: Build contours
        logger.info(f"\n[4/8] Building contours...")
        self.contour_image = self.contour_builder.build_contours_from_regions(
            self.regions,
            self.processed_image.shape[:2],
            smooth=True
        )

        contour_stats = self.contour_builder.get_contour_statistics()
        logger.info(f"  Contours created: {contour_stats['total_contours']}")

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 5: Place numbers
        logger.info(f"\n[5/8] Placing numbers...")
        self.numbered_image = self.number_placer.place_numbers(
            self.contour_image.copy(),
            self.regions,
            self.palette
        )

        placement_stats = self.number_placer.get_placement_statistics()
        logger.info(f"  Numbers placed: {placement_stats['total_placed']}")

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 6: Generate template
        logger.info(f"\n[6/8] Generating template...")
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

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 7: Generate legend
        logger.info(f"\n[7/8] Generating color legend...")
        self.legend = self.legend_generator.generate_legend(
            self.palette,
            include_hex=True,
            include_rgb=False,
            style=legend_style
        )

        if self.config.SHOW_PROGRESS:
            pbar.update(1)

        # Step 8: Save outputs
        logger.info(f"\n[8/8] Saving outputs...")

        # Get base filename
        input_name = Path(input_path).stem

        result_files = {}

        # Save main template
        template_path = output_path / f"{input_name}_template.png"
        self.template_generator.save_template(printable_template, str(template_path))
        result_files['template'] = str(template_path)

        # Save legend
        legend_path = output_path / f"{input_name}_legend.png"
        self.legend_generator.save_legend(self.legend, str(legend_path))
        result_files['legend'] = str(legend_path)

        # Save solution (colored reference)
        solution = self.template_generator.create_solution_image(
            self.quantized_image,
            self.contour_image
        )
        solution_path = output_path / f"{input_name}_solution.png"
        cv2.imwrite(str(solution_path), cv2.cvtColor(solution, cv2.COLOR_RGB2BGR))
        logger.info(f"  Solution saved to: {solution_path}")
        result_files['solution'] = str(solution_path)

        # Save coloring guide (faded colors)
        guide = self.template_generator.create_coloring_guide(
            self.quantized_image,
            self.contour_image,
            alpha=0.3
        )
        guide_path = output_path / f"{input_name}_guide.png"
        cv2.imwrite(str(guide_path), cv2.cvtColor(guide, cv2.COLOR_RGB2BGR))
        logger.info(f"  Coloring guide saved to: {guide_path}")
        result_files['guide'] = str(guide_path)

        # Save comparison
        comparison = self.template_generator.create_comparison_image(
            self.original_image,
            printable_template,
            solution,
            layout="horizontal"
        )
        comparison_path = output_path / f"{input_name}_comparison.png"
        cv2.imwrite(str(comparison_path), cv2.cvtColor(comparison, cv2.COLOR_RGB2BGR))
        logger.info(f"  Comparison saved to: {comparison_path}")
        result_files['comparison'] = str(comparison_path)

        # Save intelligent analysis and guides
        import json
        try:
            # Save color mixing guide
            mixing_guide_path = output_path / f"{input_name}_color_mixing_guide.json"
            with open(mixing_guide_path, 'w') as f:
                json.dump(self.color_mixing_guide, f, indent=2)
            result_files['mixing_guide'] = str(mixing_guide_path)
            logger.info(f"  Color mixing guide saved to: {mixing_guide_path}")

            # Save difficulty analysis
            if self.difficulty_analysis:
                difficulty_path = output_path / f"{input_name}_difficulty_analysis.json"
                with open(difficulty_path, 'w') as f:
                    json.dump(self.difficulty_analysis, f, indent=2)
                result_files['difficulty_analysis'] = str(difficulty_path)

            # Save quality analysis
            if self.quality_analysis:
                quality_path = output_path / f"{input_name}_quality_analysis.json"
                with open(quality_path, 'w') as f:
                    json.dump(self.quality_analysis, f, indent=2)
                result_files['quality_analysis'] = str(quality_path)

        except Exception as e:
            logger.warning(f"  Failed to save analysis files: {str(e)}")

        # Export SVG if enabled
        if self.config.GENERATE_SVG:
            try:
                logger.info("  Generating SVG outputs...")
                svg_template_path = output_path / f"{input_name}_template.svg"
                self.svg_exporter.export_template(
                    self.contour_image,
                    self.regions,
                    self.palette,
                    str(svg_template_path)
                )
                result_files['svg_template'] = str(svg_template_path)

                svg_legend_path = output_path / f"{input_name}_legend.svg"
                self.svg_exporter.export_legend(
                    self.palette,
                    self.color_names,
                    str(svg_legend_path)
                )
                result_files['svg_legend'] = str(svg_legend_path)
                logger.info(f"  SVG files saved")
            except Exception as e:
                logger.warning(f"  Failed to generate SVG: {str(e)}")

        # Generate PDF if enabled
        if self.config.GENERATE_PDF:
            try:
                logger.info("  Generating PDF kit...")
                pdf_path = output_path / f"{input_name}_kit.pdf"
                self.pdf_generator.generate_complete_kit(
                    printable_template,
                    self.legend,
                    solution,
                    guide,
                    self.palette,
                    self.color_names,
                    str(pdf_path),
                    title=f"Paint by Numbers - {input_name}"
                )
                result_files['pdf'] = str(pdf_path)
                logger.info(f"  PDF kit saved to: {pdf_path}")
            except Exception as e:
                logger.warning(f"  Failed to generate PDF: {str(e)}")

        if self.config.SHOW_PROGRESS:
            pbar.update(1)
            pbar.close()

        logger.info("\n" + "=" * 60)
        logger.info("GENERATION COMPLETE!")
        logger.info("=" * 60)

        # Display intelligent analysis summary
        if self.difficulty_analysis:
            logger.info(f"\n📊 TEMPLATE ANALYSIS:")
            logger.info(f"  Difficulty: {self.difficulty_analysis['difficulty_emoji']} {self.difficulty_analysis['difficulty_level']} ({self.difficulty_analysis['overall_difficulty']}/100)")
            logger.info(f"  Estimated Time: {self.difficulty_analysis['time_estimate']}")

        if self.quality_analysis:
            logger.info(f"  Quality: {self.quality_analysis['quality_emoji']} {self.quality_analysis['quality_grade']} ({self.quality_analysis['overall_quality']}/100)")

        if self.difficulty_analysis and self.difficulty_analysis.get('recommendations'):
            logger.info(f"\n💡 RECOMMENDATIONS:")
            for rec in self.difficulty_analysis['recommendations'][:3]:  # Show top 3
                logger.info(f"  • {rec}")

        logger.info(f"\n📁 Output directory: {output_path.absolute()}")
        logger.info(f"\n📄 Files generated:")
        logger.info(f"  • Template: {template_path.name}")
        logger.info(f"  • Legend: {legend_path.name}")
        logger.info(f"  • Solution: {solution_path.name}")
        logger.info(f"  • Guide: {guide_path.name}")
        logger.info(f"  • Comparison: {comparison_path.name}")

        if 'mixing_guide' in result_files:
            logger.info(f"  • Color Mixing Guide: {Path(result_files['mixing_guide']).name}")

        if 'svg_template' in result_files:
            logger.info(f"  • SVG Template: {Path(result_files['svg_template']).name}")
            logger.info(f"  • SVG Legend: {Path(result_files['svg_legend']).name}")

        if 'pdf' in result_files:
            logger.info(f"  • PDF Kit: {Path(result_files['pdf']).name}")

        logger.info(f"\n✨ Generated with intelligent color selection and quality analysis!")

        return result_files


def main():
    """Main entry point for command-line interface"""
    parser = argparse.ArgumentParser(
        description="Paint by Numbers Generator - Convert images to paint-by-numbers templates",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python main.py input.jpg

  # Use unified color palette
  python main.py input.jpg --unified-palette classic_18

  # Specify preset
  python main.py input.py --preset beginner

  # Batch process directory
  python main.py --batch input_dir/ -o output_dir/

  # Generate with SVG and PDF
  python main.py input.jpg --svg --pdf

  # Load custom config
  python main.py input.jpg --config my_config.yaml

  # Use specific number of colors
  python main.py input.jpg -c 20

  # Add reference grid
  python main.py input.jpg --grid
        """
    )

    parser.add_argument(
        "input",
        type=str,
        nargs='?',
        help="Input image path or directory (for batch mode)"
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
        "--preset",
        type=str,
        choices=["beginner", "intermediate", "advanced", "professional"],
        help="Use a configuration preset"
    )

    parser.add_argument(
        "--config",
        type=str,
        help="Load configuration from YAML file"
    )

    parser.add_argument(
        "--unified-palette",
        type=str,
        help="Use a unified color palette (e.g., classic_12, classic_18, nature_15)"
    )

    parser.add_argument(
        "--list-palettes",
        action="store_true",
        help="List available color palettes and exit"
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

    parser.add_argument(
        "--svg",
        action="store_true",
        help="Generate SVG output"
    )

    parser.add_argument(
        "--pdf",
        action="store_true",
        help="Generate PDF kit"
    )

    parser.add_argument(
        "--batch",
        action="store_true",
        help="Batch process all images in input directory"
    )

    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of parallel workers for batch processing (default: 4)"
    )

    parser.add_argument(
        "--log-file",
        type=str,
        help="Save logs to file"
    )

    parser.add_argument(
        "--log-level",
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level (default: INFO)"
    )

    args = parser.parse_args()

    # List palettes if requested
    if args.list_palettes:
        pm = PaletteManager()
        palettes = pm.list_palettes()
        logger.info("Available color palettes:")
        for palette_name in palettes:
            info = pm.get_palette_info(palette_name)
            logger.info(f"  • {palette_name} ({info['num_colors']} colors)")
        sys.exit(0)

    # Validate input
    if not args.input:
        parser.print_help()
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        logger.error(f"Error: Input not found: {args.input}")
        sys.exit(1)

    # Create configuration
    try:
        if args.preset:
            config = Config(preset=args.preset)
        else:
            config = Config()

        if args.config:
            config.load_from_yaml(args.config)

        # Override config with CLI arguments
        if args.svg:
            config.GENERATE_SVG = True
        if args.pdf:
            config.GENERATE_PDF = True
        if args.log_file:
            config.LOG_FILE = args.log_file
        if args.log_level:
            config.LOG_LEVEL = args.log_level
        if args.unified_palette:
            config.USE_UNIFIED_PALETTE = True
            config.UNIFIED_PALETTE_NAME = args.unified_palette

        # Batch processing mode
        if args.batch:
            if not input_path.is_dir():
                logger.error(f"Error: Batch mode requires a directory, got: {args.input}")
                sys.exit(1)

            logger.info(f"Starting batch processing from: {input_path}")
            batch_processor = BatchProcessor(config)
            results = batch_processor.process_directory(
                str(input_path),
                args.output,
                recursive=False,
                max_workers=args.workers,
                n_colors=args.colors,
                merge_similar=not args.no_merge,
                add_grid=args.grid,
                legend_style=args.legend_style
            )

            logger.info("\n" + "=" * 60)
            logger.info("BATCH PROCESSING COMPLETE!")
            logger.info("=" * 60)
            logger.info(f"Total images: {results['total']}")
            logger.info(f"Successful: {results['successful']}")
            logger.info(f"Failed: {results['failed']}")

            if results['errors']:
                logger.warning("\nErrors:")
                for error in results['errors']:
                    logger.warning(f"  • {error['input']}: {error['error']}")

        else:
            # Single image processing
            if input_path.is_dir():
                logger.error(f"Error: Expected image file, got directory. Use --batch for batch processing.")
                sys.exit(1)

            # Create generator and run
            generator = PaintByNumbersGenerator(config)
            generator.generate(
                input_path=args.input,
                output_dir=args.output,
                n_colors=args.colors,
                merge_similar=not args.no_merge,
                add_grid=args.grid,
                legend_style=args.legend_style
            )

    except Exception as e:
        logger.error(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
