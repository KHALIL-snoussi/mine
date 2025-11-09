"""
SVG Export Module - Generates scalable vector graphics templates
"""

import numpy as np
from typing import List, Tuple, Optional
import svgwrite
from pathlib import Path

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    from pathlib import Path as P
    sys.path.insert(0, str(P(__file__).parent.parent))
    from config import Config
    from logger import logger


class SVGExporter:
    """Exports paint-by-numbers templates as SVG files"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize SVG exporter

        Args:
            config: Configuration object
        """
        self.config = config or Config()

    def export_template(self, contour_image: np.ndarray, regions: List[dict],
                       palette: np.ndarray, output_path: str,
                       width: str = None, height: str = None):
        """
        Export template as SVG (vector format for infinite scalability)

        Args:
            contour_image: Image with contours
            regions: List of region dictionaries with contours and labels
            palette: Color palette
            output_path: Path to save SVG file
            width: SVG width (with units, e.g., "800px", "50cm"). If None, uses actual pixel dimensions
            height: SVG height (with units). If None, uses actual pixel dimensions
        """
        logger.info(f"Exporting high-resolution SVG template to {output_path}")

        img_height, img_width = contour_image.shape[:2]

        # If width/height not specified, use actual dimensions in pixels
        if width is None:
            width = f"{img_width}px"
        if height is None:
            height = f"{img_height}px"

        # Create SVG drawing with proper viewBox for scalability
        dwg = svgwrite.Drawing(
            output_path,
            size=(width, height),
            viewBox=f"0 0 {img_width} {img_height}",
            profile='full'
        )

        # Add metadata for print quality
        dwg.defs.add(dwg.metadata(
            f"Generated for print at 300 DPI. " +
            f"Original dimensions: {img_width}x{img_height} pixels"
        ))

        # Add white background
        dwg.add(dwg.rect(
            insert=(0, 0),
            size=('100%', '100%'),
            fill='white'
        ))

        # Draw regions
        for region in regions:
            color_idx = region['color_index']
            rgb = palette[color_idx]
            color = f"rgb({rgb[0]},{rgb[1]},{rgb[2]})"

            # Get contours for this region
            for contour in region['contours']:
                if len(contour) < 3:
                    continue

                # Convert contour to SVG path
                points = contour.reshape(-1, 2)
                path_data = f"M {points[0][0]},{points[0][1]}"

                for point in points[1:]:
                    path_data += f" L {point[0]},{point[1]}"

                path_data += " Z"  # Close path

                # Add filled region (very light)
                dwg.add(dwg.path(
                    d=path_data,
                    fill=color,
                    fill_opacity=0.1,
                    stroke='black',
                    stroke_width=self.config.CONTOUR_THICKNESS
                ))

        # Add numbers
        for region in regions:
            color_idx = region['color_index']
            center = region['center']

            # Add number text
            text_x, text_y = int(center[0]), int(center[1])

            # Choose contrasting text color
            rgb = palette[color_idx]
            brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
            text_color = 'black' if brightness > 128 else 'white'

            dwg.add(dwg.text(
                str(color_idx + 1),
                insert=(text_x, text_y),
                fill=text_color,
                font_size=f"{self.config.FONT_SCALE * 40}px",
                font_family="Arial, sans-serif",
                font_weight="bold",
                text_anchor="middle",
                dominant_baseline="middle"
            ))

        # Save SVG
        dwg.save()
        logger.info(f"SVG template saved successfully")

    def export_legend(self, palette: np.ndarray, color_names: List[str],
                     output_path: str, swatch_size: int = 60):
        """
        Export color legend as SVG

        Args:
            palette: Color palette
            color_names: List of color names
            output_path: Path to save SVG file
            swatch_size: Size of color swatches
        """
        logger.info(f"Exporting SVG legend to {output_path}")

        n_colors = len(palette)
        padding = 20
        text_width = 200

        # Calculate dimensions
        width = swatch_size + text_width + padding * 3
        height = (swatch_size + padding) * n_colors + padding

        # Create SVG drawing
        dwg = svgwrite.Drawing(
            output_path,
            size=(f"{width}px", f"{height}px")
        )

        # Add white background
        dwg.add(dwg.rect(
            insert=(0, 0),
            size=(width, height),
            fill='white',
            stroke='black',
            stroke_width=1
        ))

        # Add title
        dwg.add(dwg.text(
            "Color Legend",
            insert=(width // 2, padding),
            fill='black',
            font_size="20px",
            font_family="Arial, sans-serif",
            font_weight="bold",
            text_anchor="middle"
        ))

        # Add color swatches and labels
        for i, (color, name) in enumerate(zip(palette, color_names)):
            y = padding * 2 + i * (swatch_size + padding)

            # Color swatch
            rgb = color
            color_str = f"rgb({rgb[0]},{rgb[1]},{rgb[2]})"

            dwg.add(dwg.rect(
                insert=(padding, y),
                size=(swatch_size, swatch_size),
                fill=color_str,
                stroke='black',
                stroke_width=2
            ))

            # Number in swatch
            dwg.add(dwg.text(
                str(i + 1),
                insert=(padding + swatch_size // 2, y + swatch_size // 2),
                fill='white',
                font_size="24px",
                font_family="Arial, sans-serif",
                font_weight="bold",
                text_anchor="middle",
                dominant_baseline="middle",
                stroke='black',
                stroke_width=0.5
            ))

            # Color name and RGB
            text_x = padding * 2 + swatch_size
            dwg.add(dwg.text(
                f"{i + 1}. {name}",
                insert=(text_x, y + swatch_size // 3),
                fill='black',
                font_size="16px",
                font_family="Arial, sans-serif",
                font_weight="bold"
            ))

            dwg.add(dwg.text(
                f"RGB: {rgb[0]}, {rgb[1]}, {rgb[2]}",
                insert=(text_x, y + 2 * swatch_size // 3),
                fill='gray',
                font_size="12px",
                font_family="Arial, sans-serif"
            ))

        # Save SVG
        dwg.save()
        logger.info(f"SVG legend saved successfully")
