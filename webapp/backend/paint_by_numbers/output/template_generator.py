"""
Template Generator Module - Creates the paint-by-numbers template
"""

import numpy as np
from typing import List, Optional, Tuple
from pathlib import Path

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.opencv import require_cv2
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.opencv import require_cv2
    from logger import logger


class TemplateGenerator:
    """Generates paint-by-numbers templates"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize template generator

        Args:
            config: Configuration object
        """
        self.config = config or Config()

    def generate_basic_template(self, contour_image: np.ndarray,
                               numbered_image: np.ndarray) -> np.ndarray:
        """
        Generate basic template by combining contours and numbers

        Args:
            contour_image: Image with contours
            numbered_image: Image with numbers

        Returns:
            Combined template
        """
        cv2 = require_cv2()
        # Start with white background
        template = np.ones_like(contour_image) * 255

        # Add contours (black lines)
        gray_contours = cv2.cvtColor(contour_image, cv2.COLOR_RGB2GRAY)
        template[gray_contours < 250] = 0

        # Add numbers
        gray_numbers = cv2.cvtColor(numbered_image, cv2.COLOR_RGB2GRAY)
        # Copy number pixels to template
        number_mask = gray_numbers < 250
        template[number_mask] = numbered_image[number_mask]

        return template

    def generate_advanced_template(self, contour_image: np.ndarray,
                                  numbered_image: np.ndarray,
                                  add_grid: bool = False,
                                  grid_spacing: int = 50) -> np.ndarray:
        """
        Generate advanced template with optional features

        Args:
            contour_image: Image with contours
            numbered_image: Image with numbers
            add_grid: Add reference grid
            grid_spacing: Spacing between grid lines

        Returns:
            Advanced template
        """
        template = self.generate_basic_template(contour_image, numbered_image)

        if add_grid:
            template = self._add_grid(template, grid_spacing)

        return template

    def _add_grid(self, image: np.ndarray, spacing: int) -> np.ndarray:
        """
        Add reference grid to image

        Args:
            image: Input image
            spacing: Spacing between grid lines

        Returns:
            Image with grid
        """
        result = image.copy()
        h, w = image.shape[:2]

        grid_color = (200, 200, 200)  # Light gray
        thickness = 1

        cv2 = require_cv2()
        # Draw vertical lines
        for x in range(0, w, spacing):
            cv2.line(result, (x, 0), (x, h), grid_color, thickness)

        # Draw horizontal lines
        for y in range(0, h, spacing):
            cv2.line(result, (0, y), (w, y), grid_color, thickness)

        return result

    def create_printable_template(self, template: np.ndarray,
                                 title: str = "Paint by Numbers",
                                 add_border: bool = True,
                                 border_size: int = 20) -> np.ndarray:
        """
        Create printable template with title and border

        Args:
            template: Template image
            title: Title to add
            add_border: Add border around template
            border_size: Border size in pixels

        Returns:
            Printable template
        """
        result = template.copy()

        cv2 = require_cv2()
        if add_border:
            result = cv2.copyMakeBorder(
                result,
                border_size, border_size, border_size, border_size,
                cv2.BORDER_CONSTANT,
                value=(255, 255, 255)
            )

        # Add title at top
        if title:
            # Add space for title
            title_height = 60
            h, w = result.shape[:2]
            titled = np.ones((h + title_height, w, 3), dtype=np.uint8) * 255

            # Copy template
            titled[title_height:, :] = result

            # Draw title
            font = cv2.FONT_HERSHEY_DUPLEX
            font_scale = 1.5
            thickness = 2

            (text_w, text_h), _ = cv2.getTextSize(title, font, font_scale, thickness)
            text_x = (w - text_w) // 2
            text_y = title_height // 2 + text_h // 2

            cv2.putText(
                titled, title,
                (text_x, text_y),
                font, font_scale,
                (0, 0, 0),
                thickness,
                cv2.LINE_AA
            )

            result = titled

        return result

    def save_template(self, template: np.ndarray, output_path: str,
                     dpi: Optional[int] = None):
        """
        Save template to file

        Args:
            template: Template image
            output_path: Output file path
            dpi: DPI for saving (uses config default if None)
        """
        if dpi is None:
            dpi = self.config.DPI

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        cv2 = require_cv2()
        # Convert RGB to BGR for saving
        bgr_template = cv2.cvtColor(template, cv2.COLOR_RGB2BGR)

        # Save with high quality
        cv2.imwrite(str(output_path), bgr_template, [cv2.IMWRITE_JPEG_QUALITY, 95])

        logger.info(f"Template saved to: {output_path}")

    def create_coloring_guide(self, quantized_image: np.ndarray,
                             contour_image: np.ndarray,
                             alpha: float = 0.3) -> np.ndarray:
        """
        Create a coloring guide showing faded colors with contours

        Args:
            quantized_image: Quantized image with colors
            contour_image: Image with contours
            alpha: Transparency of colors (0-1)

        Returns:
            Coloring guide image
        """
        # Create faded version of quantized image
        faded = quantized_image.astype(float) * alpha + 255 * (1 - alpha)
        faded = faded.astype(np.uint8)

        # Add contours
        cv2 = require_cv2()
        gray_contours = cv2.cvtColor(contour_image, cv2.COLOR_RGB2GRAY)
        contour_mask = gray_contours < 250

        result = faded.copy()
        result[contour_mask] = 0

        return result

    def create_solution_image(self, quantized_image: np.ndarray,
                             contour_image: np.ndarray) -> np.ndarray:
        """
        Create solution image (fully colored with contours)

        Args:
            quantized_image: Quantized image
            contour_image: Image with contours

        Returns:
            Solution image
        """
        result = quantized_image.copy()

        # Overlay contours
        cv2 = require_cv2()
        gray_contours = cv2.cvtColor(contour_image, cv2.COLOR_RGB2GRAY)
        contour_mask = gray_contours < 250

        result[contour_mask] = 0

        return result

    def create_comparison_image(self, original: np.ndarray,
                               template: np.ndarray,
                               solution: np.ndarray,
                               layout: str = "horizontal") -> np.ndarray:
        """
        Create comparison image showing original, template, and solution

        Args:
            original: Original image
            template: Template image
            solution: Solution image
            layout: "horizontal" or "vertical"

        Returns:
            Comparison image
        """
        # Ensure all images are same size
        h, w = template.shape[:2]
        cv2 = require_cv2()
        original_resized = cv2.resize(original, (w, h))
        solution_resized = cv2.resize(solution, (w, h))

        images = [original_resized, template, solution_resized]
        labels = ["Original", "Template", "Solution"]

        # Add labels to images
        labeled_images = []
        for img, label in zip(images, labels):
            labeled = img.copy()
            # Get actual dimensions of this image
            img_h, img_w = labeled.shape[:2]

            # Add label at bottom
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            thickness = 2

            (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)

            # Add white rectangle for label
            label_height = text_h + baseline + 20
            labeled_with_label = np.ones((img_h + label_height, img_w, 3), dtype=np.uint8) * 255
            labeled_with_label[:img_h, :] = labeled

            # Draw label
            text_x = (img_w - text_w) // 2
            text_y = img_h + text_h + 10

            cv2.putText(
                labeled_with_label, label,
                (text_x, text_y),
                font, font_scale,
                (0, 0, 0),
                thickness,
                cv2.LINE_AA
            )

            labeled_images.append(labeled_with_label)

        # Combine images
        if layout == "horizontal":
            comparison = np.hstack(labeled_images)
        else:  # vertical
            comparison = np.vstack(labeled_images)

        return comparison
