"""
Legend Generator Module - Creates color legend/key for paint-by-numbers
"""

import numpy as np
from typing import Optional
from pathlib import Path

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import rgb_to_hex, get_contrasting_color
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import rgb_to_hex, get_contrasting_color
    from utils.opencv import require_cv2


class LegendGenerator:
    """Generates color legends for paint-by-numbers"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize legend generator

        Args:
            config: Configuration object
        """
        self.config = config or Config()

    def generate_legend(self, palette: np.ndarray,
                       include_hex: bool = True,
                       include_rgb: bool = False,
                       style: str = "grid") -> np.ndarray:
        """
        Generate color legend

        Args:
            palette: Color palette (RGB)
            include_hex: Include hex color codes
            include_rgb: Include RGB values
            style: "grid", "list", or "compact"

        Returns:
            Legend image
        """
        if style == "grid":
            return self._generate_grid_legend(palette, include_hex, include_rgb)
        elif style == "list":
            return self._generate_list_legend(palette, include_hex, include_rgb)
        else:  # compact
            return self._generate_compact_legend(palette)

    def _generate_grid_legend(self, palette: np.ndarray,
                             include_hex: bool,
                             include_rgb: bool) -> np.ndarray:
        """
        Generate grid-style legend

        Args:
            palette: Color palette
            include_hex: Include hex codes
            include_rgb: Include RGB values

        Returns:
            Legend image
        """
        cv2 = require_cv2()
        n_colors = len(palette)
        swatch_size = self.config.LEGEND_SWATCH_SIZE
        padding = self.config.LEGEND_PADDING

        # Calculate grid dimensions
        cols = min(5, n_colors)
        rows = (n_colors + cols - 1) // cols

        # Calculate cell size
        cell_width = swatch_size + 100  # Extra space for text
        cell_height = swatch_size + 60  # Extra space for text

        # Create legend image
        width = cols * cell_width + (cols + 1) * padding
        height = rows * cell_height + (rows + 1) * padding + 60  # Extra for title

        legend = np.ones((height, width, 3), dtype=np.uint8) * 255

        # Add title
        title = "Color Legend"
        font = cv2.FONT_HERSHEY_DUPLEX
        title_scale = 1.2
        title_thickness = 2

        (text_w, text_h), _ = cv2.getTextSize(title, font, title_scale, title_thickness)
        title_x = (width - text_w) // 2
        title_y = 40

        cv2.putText(
            legend, title,
            (title_x, title_y),
            font, title_scale,
            (0, 0, 0),
            title_thickness,
            cv2.LINE_AA
        )

        # Draw legend entries
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        thickness = 1

        for idx, color in enumerate(palette):
            row = idx // cols
            col = idx % cols

            # Calculate position
            x = col * cell_width + (col + 1) * padding
            y = row * cell_height + (row + 1) * padding + 60  # Offset for title

            # Draw color swatch
            swatch_x1 = x
            swatch_y1 = y
            swatch_x2 = x + swatch_size
            swatch_y2 = y + swatch_size

            cv2.rectangle(legend, (swatch_x1, swatch_y1), (swatch_x2, swatch_y2),
                         color.tolist(), -1)
            cv2.rectangle(legend, (swatch_x1, swatch_y1), (swatch_x2, swatch_y2),
                         (0, 0, 0), 2)

            # Draw number
            number_text = str(idx + 1)
            text_x = x + swatch_size // 2 - 10
            text_y = y + swatch_size // 2 + 5

            # Draw number with contrasting color
            text_color = get_contrasting_color(color)
            cv2.putText(
                legend, number_text,
                (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                text_color,
                2,
                cv2.LINE_AA
            )

            # Draw color info below swatch
            info_y = y + swatch_size + 20

            if include_hex:
                hex_code = rgb_to_hex(color)
                cv2.putText(
                    legend, hex_code,
                    (x, info_y),
                    font, font_scale,
                    (0, 0, 0),
                    thickness,
                    cv2.LINE_AA
                )
                info_y += 15

            if include_rgb:
                rgb_text = f"RGB:{color[0]},{color[1]},{color[2]}"
                cv2.putText(
                    legend, rgb_text,
                    (x, info_y),
                    font, font_scale - 0.1,
                    (0, 0, 0),
                    thickness,
                    cv2.LINE_AA
                )

        return legend

    def _generate_list_legend(self, palette: np.ndarray,
                             include_hex: bool,
                             include_rgb: bool) -> np.ndarray:
        """
        Generate list-style legend (vertical layout)

        Args:
            palette: Color palette
            include_hex: Include hex codes
            include_rgb: Include RGB values

        Returns:
            Legend image
        """
        cv2 = require_cv2()
        n_colors = len(palette)
        swatch_size = self.config.LEGEND_SWATCH_SIZE
        padding = self.config.LEGEND_PADDING

        # Calculate dimensions
        width = 400
        row_height = swatch_size + padding
        height = n_colors * row_height + 100  # Extra for title and padding

        legend = np.ones((height, width, 3), dtype=np.uint8) * 255

        # Add title
        title = "Color Key"
        font = cv2.FONT_HERSHEY_DUPLEX
        title_scale = 1.0
        title_thickness = 2

        cv2.putText(
            legend, title,
            (padding, 40),
            font, title_scale,
            (0, 0, 0),
            title_thickness,
            cv2.LINE_AA
        )

        # Draw legend entries
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness = 1

        for idx, color in enumerate(palette):
            y = 80 + idx * row_height

            # Draw color swatch
            cv2.rectangle(legend, (padding, y), (padding + swatch_size, y + swatch_size),
                         color.tolist(), -1)
            cv2.rectangle(legend, (padding, y), (padding + swatch_size, y + swatch_size),
                         (0, 0, 0), 2)

            # Draw number in swatch
            number_text = str(idx + 1)
            text_color = get_contrasting_color(color)
            cv2.putText(
                legend, number_text,
                (padding + 15, y + 30),
                cv2.FONT_HERSHEY_BOLD, 0.8,
                text_color,
                2,
                cv2.LINE_AA
            )

            # Draw color info
            text_x = padding + swatch_size + 20
            info_y = y + 25

            # Number label
            cv2.putText(
                legend, f"Color {idx + 1}",
                (text_x, info_y),
                font, font_scale,
                (0, 0, 0),
                thickness,
                cv2.LINE_AA
            )

            if include_hex:
                hex_code = rgb_to_hex(color)
                cv2.putText(
                    legend, f"Hex: {hex_code}",
                    (text_x + 100, info_y),
                    font, font_scale - 0.1,
                    (0, 0, 0),
                    thickness,
                    cv2.LINE_AA
                )

            if include_rgb:
                rgb_text = f"RGB: ({color[0]}, {color[1]}, {color[2]})"
                cv2.putText(
                    legend, rgb_text,
                    (text_x, info_y + 20),
                    font, font_scale - 0.1,
                    (0, 0, 0),
                    thickness,
                    cv2.LINE_AA
                )

        return legend

    def _generate_compact_legend(self, palette: np.ndarray) -> np.ndarray:
        """
        Generate compact legend (just swatches with numbers)

        Args:
            palette: Color palette

        Returns:
            Compact legend image
        """
        cv2 = require_cv2()
        n_colors = len(palette)
        swatch_size = self.config.LEGEND_SWATCH_SIZE - 10  # Smaller swatches
        padding = 10

        # Calculate grid dimensions
        cols = min(10, n_colors)
        rows = (n_colors + cols - 1) // cols

        # Create legend
        width = cols * (swatch_size + padding) + padding
        height = rows * (swatch_size + padding) + padding + 40  # Extra for title

        legend = np.ones((height, width, 3), dtype=np.uint8) * 255

        # Add title
        title = "Colors"
        font = cv2.FONT_HERSHEY_SIMPLEX
        (text_w, _), _ = cv2.getTextSize(title, font, 0.7, 2)
        cv2.putText(
            legend, title,
            ((width - text_w) // 2, 25),
            font, 0.7,
            (0, 0, 0),
            2,
            cv2.LINE_AA
        )

        # Draw swatches
        for idx, color in enumerate(palette):
            row = idx // cols
            col = idx % cols

            x = col * (swatch_size + padding) + padding
            y = row * (swatch_size + padding) + padding + 40

            # Draw swatch
            cv2.rectangle(legend, (x, y), (x + swatch_size, y + swatch_size),
                         color.tolist(), -1)
            cv2.rectangle(legend, (x, y), (x + swatch_size, y + swatch_size),
                         (0, 0, 0), 1)

            # Draw number
            number_text = str(idx + 1)
            text_color = get_contrasting_color(color)
            cv2.putText(
                legend, number_text,
                (x + swatch_size // 2 - 8, y + swatch_size // 2 + 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                text_color,
                2,
                cv2.LINE_AA
            )

        return legend

    def save_legend(self, legend: np.ndarray, output_path: str,
                   dpi: Optional[int] = None):
        """
        Save legend to file

        Args:
            legend: Legend image
            output_path: Output file path
            dpi: DPI for saving
        """
        if dpi is None:
            dpi = self.config.DPI

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert RGB to BGR
        cv2 = require_cv2()
        bgr_legend = cv2.cvtColor(legend, cv2.COLOR_RGB2BGR)

        cv2.imwrite(str(output_path), bgr_legend, [cv2.IMWRITE_JPEG_QUALITY, 95])

        print(f"Legend saved to: {output_path}")

    def create_color_mixing_guide(self, palette: np.ndarray) -> np.ndarray:
        """
        Create a guide showing how to mix colors (for painting)

        Args:
            palette: Color palette

        Returns:
            Color mixing guide image
        """
        cv2 = require_cv2()
        # This is a simplified version - in reality, color mixing is complex
        n_colors = len(palette)

        width = 600
        height = n_colors * 50 + 100

        guide = np.ones((height, width, 3), dtype=np.uint8) * 255

        # Add title
        title = "Color Mixing Guide"
        cv2.putText(
            guide, title,
            (20, 40),
            cv2.FONT_HERSHEY_DUPLEX, 1.0,
            (0, 0, 0),
            2,
            cv2.LINE_AA
        )

        # List each color with basic mixing suggestions
        for idx, color in enumerate(palette):
            y = 80 + idx * 50

            # Draw swatch
            cv2.rectangle(guide, (20, y), (60, y + 35), color.tolist(), -1)
            cv2.rectangle(guide, (20, y), (60, y + 35), (0, 0, 0), 2)

            # Color number
            cv2.putText(
                guide, f"Color {idx + 1}",
                (80, y + 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (0, 0, 0),
                1,
                cv2.LINE_AA
            )

            # RGB info
            rgb_text = f"RGB: ({color[0]}, {color[1]}, {color[2]})"
            cv2.putText(
                guide, rgb_text,
                (200, y + 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                (0, 0, 0),
                1,
                cv2.LINE_AA
            )

        return guide
