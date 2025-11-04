#!/usr/bin/env python3
"""
Paint-By-Numbers Photo Generator
Transforms any photo into a numbered canvas painting kit.

Creates a flat canvas (no puzzle pieces!) with numbered color regions.
Perfect for laser engraving or printing on wood/canvas.
"""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple, Dict, Optional

import numpy as np
import cv2
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib import font_manager
import svgwrite
from scipy import ndimage


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class PaintByNumbersConfig:
    """Configuration for paint-by-numbers generation."""
    width_mm: float = 400.0          # Canvas width (40cm default)
    height_mm: float = 500.0         # Canvas height (50cm default)
    num_colors: int = 24             # Number of paint colors
    min_region_size: int = 400       # Minimum pixels per region (increased!)
    detail_level: str = "medium"     # low/medium/high
    preview_dpi: int = 300           # Preview resolution
    canvas_dpi: int = 200            # Canvas output resolution
    show_numbers_threshold: int = 200  # Only show numbers in regions larger than this


# ============================================================================
# COLOR PALETTE GENERATION
# ============================================================================

def extract_color_palette(image: np.ndarray, num_colors: int,
                         seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extract dominant colors from image using K-means clustering.

    Returns:
        palette: RGB colors (num_colors, 3)
        labels: Color assignment for each pixel
    """
    # Reshape image to list of pixels
    h, w = image.shape[:2]
    pixels = image.reshape(-1, 3).astype(np.float32)

    # Remove pure white/black backgrounds
    mask = ~((pixels.sum(axis=1) > 750) | (pixels.sum(axis=1) < 15))
    sample_pixels = pixels[mask]

    if len(sample_pixels) < num_colors:
        sample_pixels = pixels

    # Sample for performance
    if len(sample_pixels) > 100000:
        indices = np.random.RandomState(seed).choice(
            len(sample_pixels), 100000, replace=False
        )
        sample_pixels = sample_pixels[indices]

    # K-means clustering
    kmeans = KMeans(
        n_clusters=num_colors,
        random_state=seed,
        n_init=10,
        max_iter=300
    )
    kmeans.fit(sample_pixels)

    # Get palette
    palette = kmeans.cluster_centers_.astype(np.uint8)

    # Assign colors to all pixels
    labels = kmeans.predict(pixels)
    labels = labels.reshape(h, w)

    # Sort palette by brightness for better organization
    brightness = palette.sum(axis=1)
    sort_idx = np.argsort(brightness)[::-1]  # Brightest first
    palette = palette[sort_idx]

    # Remap labels
    remap = {old: new for new, old in enumerate(sort_idx)}
    labels = np.vectorize(remap.get)(labels)

    return palette, labels


# ============================================================================
# REGION SEGMENTATION
# ============================================================================

def create_regions(labels: np.ndarray, min_size: int = 100) -> np.ndarray:
    """
    Convert color labels to distinct numbered regions.
    Merges small regions into neighbors.

    Returns:
        regions: Array where each pixel has a region ID (1 to N)
    """
    # Label connected components for each color
    num_colors = labels.max() + 1
    regions = np.zeros_like(labels, dtype=np.int32)
    region_id = 1

    for color_idx in range(num_colors):
        # Find all pixels of this color
        mask = (labels == color_idx).astype(np.uint8)

        # Label connected components
        num_features, labeled = cv2.connectedComponents(mask, connectivity=8)

        for feature_id in range(1, num_features):
            region_mask = (labeled == feature_id)
            region_size = region_mask.sum()

            if region_size >= min_size:
                regions[region_mask] = region_id
                region_id += 1

    # Fill unlabeled pixels (too small regions) with nearest neighbor
    unlabeled = (regions == 0)
    if unlabeled.any():
        # Dilate labeled regions to fill small gaps
        kernel = np.ones((3, 3), np.uint8)
        for _ in range(5):
            dilated = cv2.dilate((regions > 0).astype(np.uint8), kernel)
            filled_regions = cv2.dilate(regions.astype(np.float32), kernel)
            filled_regions = (filled_regions / cv2.dilate(np.ones_like(regions, dtype=np.float32), kernel)).astype(np.int32)

            fill_mask = unlabeled & (dilated > 0)
            regions[fill_mask] = filled_regions[fill_mask]
            unlabeled = (regions == 0)

            if not unlabeled.any():
                break

    return regions


def smooth_regions(regions: np.ndarray, iterations: int = 2) -> np.ndarray:
    """
    Smooth region boundaries using morphological operations.
    """
    smoothed = regions.copy()

    for _ in range(iterations):
        # Apply median filter to smooth jagged edges
        smoothed = ndimage.median_filter(smoothed, size=3)

    return smoothed


# ============================================================================
# PAINT-BY-NUMBERS GENERATOR
# ============================================================================

class PaintByNumbersGenerator:
    """Generate paint-by-numbers canvas from photo."""

    def __init__(self, config: PaintByNumbersConfig):
        """Initialize generator."""
        self.config = config
        self.image: Optional[np.ndarray] = None
        self.palette: Optional[np.ndarray] = None
        self.labels: Optional[np.ndarray] = None
        self.regions: Optional[np.ndarray] = None
        self.region_colors: Dict[int, int] = {}  # region_id -> color_index

    def load_image(self, image_path: str) -> None:
        """Load and preprocess image."""
        print(f"Loading image: {image_path}")
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        self.image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Resize to target canvas size
        aspect = self.config.width_mm / self.config.height_mm
        img_h, img_w = self.image.shape[:2]
        img_aspect = img_w / img_h

        # Target resolution based on detail level
        detail_scale = {
            'low': 1.5,
            'medium': 2.5,
            'high': 4.0
        }[self.config.detail_level]

        target_w = int(self.config.width_mm * detail_scale)
        target_h = int(self.config.height_mm * detail_scale)

        # Cover fit (crop to aspect)
        if img_aspect > aspect:
            # Image wider, scale by height
            new_h = target_h
            new_w = int(target_h * img_aspect)
        else:
            # Image taller, scale by width
            new_w = target_w
            new_h = int(target_w / img_aspect)

        resized = cv2.resize(self.image, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # Crop to exact size
        if new_w > target_w:
            x_offset = (new_w - target_w) // 2
            resized = resized[:, x_offset:x_offset + target_w]

        if new_h > target_h:
            y_offset = (new_h - target_h) // 2
            resized = resized[y_offset:y_offset + target_h, :]

        self.image = resized
        print(f"Processed image: {self.image.shape[1]}×{self.image.shape[0]} pixels")

    def process(self) -> None:
        """Process image into paint-by-numbers format."""
        if self.image is None:
            raise RuntimeError("Load image first")

        # Extract color palette
        print(f"Extracting {self.config.num_colors} colors...")
        self.palette, self.labels = extract_color_palette(
            self.image,
            self.config.num_colors
        )

        # Create regions
        print("Creating numbered regions...")
        self.regions = create_regions(self.labels, self.config.min_region_size)

        # Smooth boundaries
        print("Smoothing region boundaries...")
        self.regions = smooth_regions(self.regions, iterations=2)

        # Map regions to colors
        for region_id in range(1, self.regions.max() + 1):
            region_mask = (self.regions == region_id)
            if region_mask.any():
                # Find most common color in this region
                region_labels = self.labels[region_mask]
                color_idx = np.bincount(region_labels).argmax()
                self.region_colors[region_id] = int(color_idx)

        print(f"Created {self.regions.max()} numbered regions")

    def export_canvas_svg(self, output_path: str) -> None:
        """
        Export canvas SVG with numbered regions.
        This is the main painting template.
        """
        h, w = self.regions.shape

        dwg = svgwrite.Drawing(
            output_path,
            size=(f'{self.config.width_mm}mm', f'{self.config.height_mm}mm'),
            profile='full'
        )
        dwg.viewbox(0, 0, w, h)

        # White background
        dwg.add(dwg.rect(insert=(0, 0), size=(w, h), fill='white'))

        # Draw region boundaries and numbers
        print("Generating canvas SVG...")

        # Find contours for each region
        for region_id in range(1, self.regions.max() + 1):
            if region_id not in self.region_colors:
                continue

            region_mask = (self.regions == region_id).astype(np.uint8)

            # Find contours
            contours, _ = cv2.findContours(
                region_mask,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )

            if not contours:
                continue

            # Draw largest contour
            contour = max(contours, key=cv2.contourArea)

            # Simplify contour
            epsilon = 0.5
            contour = cv2.approxPolyDP(contour, epsilon, True)

            if len(contour) < 3:
                continue

            # Create path
            points = contour.reshape(-1, 2)
            path_data = f"M {points[0][0]},{points[0][1]} "
            for point in points[1:]:
                path_data += f"L {point[0]},{point[1]} "
            path_data += "Z"

            # Draw outline
            dwg.add(dwg.path(
                d=path_data,
                fill='white',
                stroke='black',
                stroke_width=0.5,
                id=f'region_{region_id}'
            ))

            # Add number at centroid (only for larger regions)
            region_area = region_mask.sum()
            if region_area >= self.config.show_numbers_threshold:
                M = cv2.moments(region_mask)
                if M['m00'] > 0:
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])

                    color_idx = self.region_colors[region_id]
                    number = color_idx + 1  # 1-indexed for users

                    # Choose text color based on background brightness
                    bg_color = self.palette[color_idx]
                    brightness = int(bg_color[0]) * 0.299 + int(bg_color[1]) * 0.587 + int(bg_color[2]) * 0.114
                    text_color = 'white' if brightness < 128 else 'black'

                    # Scale font size based on region size
                    font_size = min(18, max(10, int(np.sqrt(region_area) / 3)))

                    dwg.add(dwg.text(
                        str(number),
                        insert=(cx, cy),
                        text_anchor='middle',
                        dominant_baseline='middle',
                        font_size=f'{font_size}px',
                        font_family='Arial',
                        font_weight='bold',
                        fill=text_color,
                        stroke='none'
                    ))

        dwg.save()
        print(f"✓ Exported canvas: {output_path}")

    def export_color_legend(self, output_path: str) -> None:
        """Export color legend showing all paint colors."""
        num_colors = len(self.palette)
        cols = 6
        rows = (num_colors + cols - 1) // cols

        fig, ax = plt.subplots(figsize=(14, rows * 1.8), facecolor='white')
        ax.set_xlim(0, cols)
        ax.set_ylim(0, rows)
        ax.axis('off')

        fig.suptitle('Paint Color Legend', fontsize=18, fontweight='bold', y=0.98)

        for idx, color in enumerate(self.palette):
            row = rows - 1 - (idx // cols)
            col = idx % cols

            # Color swatch
            rect = mpatches.Rectangle(
                (col + 0.08, row + 0.35),
                0.84, 0.55,
                facecolor=color / 255.0,
                edgecolor='black',
                linewidth=2
            )
            ax.add_patch(rect)

            # Number
            ax.text(
                col + 0.5, row + 0.75,
                f'#{idx + 1}',
                ha='center',
                va='center',
                fontsize=16,
                fontweight='bold',
                color='white' if color.sum() < 384 else 'black'
            )

            # HEX color
            hex_color = f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}".upper()
            ax.text(
                col + 0.5, row + 0.2,
                hex_color,
                ha='center',
                va='center',
                fontsize=10,
                fontfamily='monospace',
                fontweight='bold'
            )

            # RGB values
            rgb_text = f"R:{color[0]} G:{color[1]} B:{color[2]}"
            ax.text(
                col + 0.5, row + 0.08,
                rgb_text,
                ha='center',
                va='center',
                fontsize=8,
                fontfamily='monospace',
                color='gray'
            )

        plt.tight_layout()
        plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        print(f"✓ Exported color legend: {output_path}")

    def export_preview(self, output_path: str) -> None:
        """Export preview of finished painting."""
        fig, ax = plt.subplots(figsize=(12, 9), facecolor='white')
        ax.imshow(self.image)
        ax.axis('off')
        ax.set_title('Preview: Finished Painting', fontsize=16, pad=10, fontweight='bold')

        plt.tight_layout()
        plt.savefig(output_path, dpi=self.config.preview_dpi, bbox_inches='tight')
        plt.close(fig)
        print(f"✓ Exported preview: {output_path}")

    def export_numbered_preview(self, output_path: str) -> None:
        """Export preview showing numbered regions."""
        fig, ax = plt.subplots(figsize=(14, 10), facecolor='white')

        # Create colored visualization
        colored = np.zeros_like(self.image)
        for region_id in range(1, self.regions.max() + 1):
            if region_id in self.region_colors:
                color_idx = self.region_colors[region_id]
                colored[self.regions == region_id] = self.palette[color_idx]

        ax.imshow(colored)

        # Overlay boundaries
        boundaries = cv2.Canny((self.regions > 0).astype(np.uint8) * 255, 50, 150)
        boundaries_rgba = np.zeros((*boundaries.shape, 4))
        boundaries_rgba[boundaries > 0] = [0, 0, 0, 0.5]
        ax.imshow(boundaries_rgba)

        # Add numbers
        for region_id in range(1, self.regions.max() + 1):
            if region_id not in self.region_colors:
                continue

            region_mask = (self.regions == region_id).astype(np.uint8)
            M = cv2.moments(region_mask)

            if M['m00'] > 0:
                cx = int(M['m10'] / M['m00'])
                cy = int(M['m01'] / M['m00'])

                color_idx = self.region_colors[region_id]
                number = color_idx + 1

                # Text color based on brightness
                bg_color = self.palette[color_idx]
                brightness = int(bg_color[0]) * 0.299 + int(bg_color[1]) * 0.587 + int(bg_color[2]) * 0.114
                text_color = 'white' if brightness < 128 else 'black'

                ax.text(
                    cx, cy, str(number),
                    ha='center',
                    va='center',
                    fontsize=8,
                    fontweight='bold',
                    color=text_color,
                    bbox=dict(boxstyle='circle,pad=0.1', facecolor='none', edgecolor='none')
                )

        ax.axis('off')
        ax.set_title('Numbered Canvas Preview', fontsize=16, pad=10, fontweight='bold')

        plt.tight_layout()
        plt.savefig(output_path, dpi=self.config.canvas_dpi, bbox_inches='tight')
        plt.close(fig)
        print(f"✓ Exported numbered preview: {output_path}")

    def export_data_json(self, output_path: str) -> None:
        """Export metadata JSON."""
        data = {
            'canvas': {
                'width_mm': float(self.config.width_mm),
                'height_mm': float(self.config.height_mm),
                'width_px': int(self.image.shape[1]),
                'height_px': int(self.image.shape[0]),
            },
            'colors': [
                {
                    'number': int(i + 1),
                    'rgb': [int(c) for c in color],
                    'hex': f"#{int(color[0]):02x}{int(color[1]):02x}{int(color[2]):02x}".upper()
                }
                for i, color in enumerate(self.palette)
            ],
            'statistics': {
                'num_colors': int(len(self.palette)),
                'num_regions': int(self.regions.max()),
            }
        }

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✓ Exported data: {output_path}")


# ============================================================================
# CLI
# ============================================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Paint-By-Numbers Photo Generator',
        epilog="""
Examples:
  # Standard 40x50cm with 24 colors
  %(prog)s --photo portrait.jpg

  # Larger canvas with more detail
  %(prog)s --photo image.jpg --size 50x70 --colors 30

  # Simplified version (fewer, larger regions)
  %(prog)s --photo face.jpg --simplify

  # Small canvas, easy to paint
  %(prog)s --photo photo.jpg --size 30x40 --colors 18 --simplify

Popular sizes:
  30x40 cm - Small, beginner-friendly
  40x50 cm - Most popular (default)
  50x70 cm - Large, detailed
        """
    )

    parser.add_argument(
        '--photo',
        type=str,
        required=True,
        help='Path to input photo'
    )

    parser.add_argument(
        '--output-dir',
        type=str,
        default='output',
        help='Output directory (default: output)'
    )

    parser.add_argument(
        '--colors',
        type=int,
        default=24,
        help='Number of paint colors (default: 24, recommended: 18-36)'
    )

    parser.add_argument(
        '--detail',
        type=str,
        choices=['low', 'medium', 'high'],
        default='medium',
        help='Detail level (default: medium)'
    )

    parser.add_argument(
        '--size',
        type=str,
        default='40x50',
        help='Canvas size: 30x40, 40x50 (default), 50x70 cm, or custom WxH in cm'
    )

    parser.add_argument(
        '--min-region-size',
        type=int,
        default=400,
        help='Minimum pixels per region (default: 400, recommended: 300-600)'
    )

    parser.add_argument(
        '--simplify',
        action='store_true',
        help='Create fewer, larger regions (easier to paint)'
    )

    args = parser.parse_args()

    # Validate
    if not Path(args.photo).exists():
        parser.error(f"Photo not found: {args.photo}")

    if args.colors < 6 or args.colors > 48:
        parser.error("Number of colors must be between 6 and 48")

    # Parse size (convert cm to mm)
    try:
        width_str, height_str = args.size.lower().split('x')
        width_cm = float(width_str)
        height_cm = float(height_str)
        width_mm = width_cm * 10  # cm to mm
        height_mm = height_cm * 10
    except:
        parser.error("Size must be in format WxH in cm (e.g., 40x50)")

    # Adjust settings if simplify mode
    if args.simplify:
        args.min_region_size = max(args.min_region_size, 600)
        args.colors = min(args.colors, 20)

    # Create output dir
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Configure
    config = PaintByNumbersConfig(
        width_mm=width_mm,
        height_mm=height_mm,
        num_colors=args.colors,
        min_region_size=args.min_region_size,
        detail_level=args.detail
    )

    # Print header
    print("=" * 70)
    print("PAINT-BY-NUMBERS GENERATOR")
    print("=" * 70)
    print(f"Photo:            {args.photo}")
    print(f"Canvas size:      {config.width_mm/10:.0f}×{config.height_mm/10:.0f} cm ({config.width_mm:.0f}×{config.height_mm:.0f} mm)")
    print(f"Colors:           {config.num_colors}")
    print(f"Detail level:     {config.detail_level}")
    print(f"Min region size:  {config.min_region_size} pixels")
    if args.simplify:
        print(f"Mode:             SIMPLIFIED (fewer, larger regions)")
    print(f"Output:           {output_dir}")
    print("=" * 70)
    print()

    # Generate
    generator = PaintByNumbersGenerator(config)
    generator.load_image(args.photo)
    generator.process()

    # Export
    print("\nExporting files...")
    generator.export_canvas_svg(str(output_dir / 'canvas_template.svg'))
    generator.export_color_legend(str(output_dir / 'color_legend.png'))
    generator.export_preview(str(output_dir / 'preview_finished.png'))
    generator.export_numbered_preview(str(output_dir / 'canvas_numbered.png'))
    generator.export_data_json(str(output_dir / 'data.json'))

    # Count numbered regions
    num_numbered = 0
    for region_id in range(1, generator.regions.max() + 1):
        region_mask = (generator.regions == region_id).astype(np.uint8)
        if region_mask.sum() >= config.show_numbers_threshold:
            num_numbered += 1

    print("\n" + "=" * 70)
    print("✓ GENERATION COMPLETE")
    print("=" * 70)
    print(f"Total regions:    {generator.regions.max()}")
    print(f"Numbered regions: {num_numbered} (large enough to show numbers)")
    print(f"Colors used:      {len(generator.palette)}")
    print(f"\nFiles saved to: {output_dir}")
    print("\nNext steps:")
    print("  1. Print/engrave 'canvas_template.svg' on wood/canvas")
    print("  2. Use 'color_legend.png' to mix/buy paints")
    print("  3. Paint each numbered region with matching color")
    print("  4. See 'preview_finished.png' for final result")
    print("\nTIP: If too many tiny regions, try --simplify or increase --min-region-size")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
