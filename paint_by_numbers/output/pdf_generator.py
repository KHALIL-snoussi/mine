"""
PDF Generation Module - Creates complete paint-by-numbers kits as PDF
"""

import numpy as np
from typing import List, Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from PIL import Image
import io
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


class PDFGenerator:
    """Generates PDF paint-by-numbers kits"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize PDF generator

        Args:
            config: Configuration object
        """
        self.config = config or Config()

    def generate_complete_kit(self, template_image: np.ndarray,
                            legend_image: np.ndarray,
                            solution_image: np.ndarray,
                            guide_image: np.ndarray,
                            palette: np.ndarray,
                            color_names: List[str],
                            output_path: str,
                            page_size=letter,
                            title: str = "Paint by Numbers Kit"):
        """
        Generate a complete PDF kit with template, legend, and solution

        Args:
            template_image: Template image with numbers
            legend_image: Color legend image
            solution_image: Solution reference image
            guide_image: Faded color guide image
            palette: Color palette
            color_names: List of color names
            output_path: Path to save PDF
            page_size: Page size (letter or A4)
            title: Kit title
        """
        logger.info(f"Generating PDF kit to {output_path}")

        # Create PDF canvas
        c = canvas.Canvas(output_path, pagesize=page_size)
        width, height = page_size

        # Page 1: Cover page with title and instructions
        self._add_cover_page(c, title, width, height)
        c.showPage()

        # Page 2: Color legend
        self._add_legend_page(c, palette, color_names, width, height)
        c.showPage()

        # Page 3: Template
        self._add_template_page(c, template_image, width, height, title)
        c.showPage()

        # Page 4: Coloring guide (faded colors)
        self._add_guide_page(c, guide_image, width, height)
        c.showPage()

        # Page 5: Solution reference
        self._add_solution_page(c, solution_image, width, height)

        # Save PDF
        c.save()
        logger.info(f"PDF kit saved successfully")

    def _add_cover_page(self, c: canvas.Canvas, title: str, width: float, height: float):
        """Add cover page with instructions"""
        # Title
        c.setFont("Helvetica-Bold", 36)
        c.drawCentredString(width / 2, height - 2 * inch, title)

        # Instructions
        c.setFont("Helvetica", 14)
        instructions = [
            "Welcome to your Paint by Numbers Kit!",
            "",
            "Instructions:",
            "1. Review the color legend to familiarize yourself with the palette",
            "2. Use the template page to paint - match numbers to colors",
            "3. Refer to the color guide for hints on placement",
            "4. Check your work against the solution image",
            "",
            "Tips for Success:",
            "• Start with larger regions to get comfortable",
            "• Work from light to dark colors",
            "• Let each section dry before painting adjacent areas",
            "• Use the guide page to see color placement",
            "• Take your time and enjoy the process!",
            "",
            "Materials Needed:",
            "• Acrylic or tempera paints matching the color legend",
            "• Small and medium paint brushes",
            "• Water cup for rinsing brushes",
            "• Paper towels or cloth for drying brushes",
            "• Optional: White pencil for marking dark regions",
        ]

        y = height - 3.5 * inch
        for line in instructions:
            if line.startswith("•"):
                c.setFont("Helvetica", 12)
                c.drawString(2.5 * inch, y, line)
            elif line.endswith(":"):
                c.setFont("Helvetica-Bold", 13)
                c.drawString(2 * inch, y, line)
            elif line == "":
                y -= 8
            else:
                c.setFont("Helvetica", 12)
                c.drawString(2 * inch, y, line)
            y -= 18

    def _add_legend_page(self, c: canvas.Canvas, palette: np.ndarray,
                        color_names: List[str], width: float, height: float):
        """Add color legend page"""
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width / 2, height - inch, "Color Legend")

        c.setFont("Helvetica", 10)
        c.drawCentredString(width / 2, height - 1.3 * inch,
                          "Match these numbers to the numbers on your template")

        # Draw legend in two columns
        swatch_size = 0.4 * inch
        x_left = 1.5 * inch
        x_right = width / 2 + 0.5 * inch
        y_start = height - 2 * inch

        colors_per_column = (len(palette) + 1) // 2

        for i, (color, name) in enumerate(zip(palette, color_names)):
            if i < colors_per_column:
                x = x_left
                y = y_start - (i * (swatch_size + 0.2 * inch))
            else:
                x = x_right
                y = y_start - ((i - colors_per_column) * (swatch_size + 0.2 * inch))

            # Draw color swatch
            rgb = [val / 255.0 for val in color]
            c.setFillColorRGB(*rgb)
            c.rect(x, y, swatch_size, swatch_size, fill=1, stroke=1)

            # Draw number in swatch
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 14)
            c.drawCentredString(x + swatch_size / 2, y + swatch_size / 3, str(i + 1))

            # Draw color name and RGB
            c.setFillColor(colors.black)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(x + swatch_size + 0.1 * inch, y + swatch_size - 0.1 * inch,
                        f"{i + 1}. {name}")

            c.setFont("Helvetica", 9)
            c.setFillColor(colors.gray)
            c.drawString(x + swatch_size + 0.1 * inch, y + swatch_size - 0.25 * inch,
                        f"RGB: {color[0]}, {color[1]}, {color[2]}")

    def _add_template_page(self, c: canvas.Canvas, template_image: np.ndarray,
                          width: float, height: float, title: str):
        """Add template page"""
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width / 2, height - 0.6 * inch, f"{title} - Template")

        # Convert and add image
        img = self._numpy_to_pil(template_image)
        img_reader = ImageReader(img)

        # Calculate image dimensions to fit page
        max_width = width - 1 * inch
        max_height = height - 1.5 * inch

        img_width, img_height = img.size
        scale = min(max_width / img_width, max_height / img_height)

        final_width = img_width * scale
        final_height = img_height * scale

        x = (width - final_width) / 2
        y = (height - final_height) / 2 - 0.3 * inch

        c.drawImage(img_reader, x, y, final_width, final_height)

    def _add_guide_page(self, c: canvas.Canvas, guide_image: np.ndarray,
                       width: float, height: float):
        """Add coloring guide page"""
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width / 2, height - 0.6 * inch, "Coloring Guide")

        c.setFont("Helvetica", 10)
        c.drawCentredString(width / 2, height - 0.85 * inch,
                          "Use this faded reference to see where colors should be placed")

        # Convert and add image
        img = self._numpy_to_pil(guide_image)
        img_reader = ImageReader(img)

        # Calculate image dimensions
        max_width = width - 1 * inch
        max_height = height - 1.8 * inch

        img_width, img_height = img.size
        scale = min(max_width / img_width, max_height / img_height)

        final_width = img_width * scale
        final_height = img_height * scale

        x = (width - final_width) / 2
        y = (height - final_height) / 2 - 0.4 * inch

        c.drawImage(img_reader, x, y, final_width, final_height)

    def _add_solution_page(self, c: canvas.Canvas, solution_image: np.ndarray,
                          width: float, height: float):
        """Add solution reference page"""
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width / 2, height - 0.6 * inch, "Solution Reference")

        c.setFont("Helvetica", 10)
        c.drawCentredString(width / 2, height - 0.85 * inch,
                          "Use this as a reference to check your completed work")

        # Convert and add image
        img = self._numpy_to_pil(solution_image)
        img_reader = ImageReader(img)

        # Calculate image dimensions
        max_width = width - 1 * inch
        max_height = height - 1.8 * inch

        img_width, img_height = img.size
        scale = min(max_width / img_width, max_height / img_height)

        final_width = img_width * scale
        final_height = img_height * scale

        x = (width - final_width) / 2
        y = (height - final_height) / 2 - 0.4 * inch

        c.drawImage(img_reader, x, y, final_width, final_height)

    def _numpy_to_pil(self, image: np.ndarray) -> Image.Image:
        """Convert numpy array to PIL Image"""
        if len(image.shape) == 3:
            # RGB image
            return Image.fromarray(image.astype(np.uint8))
        else:
            # Grayscale
            return Image.fromarray(image.astype(np.uint8), mode='L')
