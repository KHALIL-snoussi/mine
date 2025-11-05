"""
Contour Building Module - Creates outlines for paint-by-numbers template
"""

import numpy as np
from typing import List, Optional, Tuple

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import smooth_contours
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import smooth_contours
    from utils.opencv import require_cv2


class ContourBuilder:
    """Builds contours for paint-by-numbers templates"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize contour builder

        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.contours = []
        self.contour_image = None

    def build_contours(self, quantized_image: np.ndarray,
                      smooth: bool = True) -> np.ndarray:
        """
        Build contours from quantized image

        Args:
            quantized_image: Quantized image
            smooth: Apply smoothing to contours

        Returns:
            Image with contours drawn
        """
        h, w = quantized_image.shape[:2]

        # Create white background
        contour_img = np.ones((h, w, 3), dtype=np.uint8) * 255

        # Convert to grayscale for edge detection
        cv2 = require_cv2()
        gray = cv2.cvtColor(quantized_image, cv2.COLOR_RGB2GRAY)

        # Find edges between different colors
        edges = self._detect_color_boundaries(quantized_image)

        # Find contours
        contours, hierarchy = cv2.findContours(
            edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
        )

        # Smooth contours if requested
        if smooth and contours:
            contours = smooth_contours(contours, epsilon_factor=0.002)

        self.contours = contours

        cv2 = require_cv2()
        # Draw contours
        cv2.drawContours(
            contour_img,
            contours,
            -1,  # Draw all contours
            self.config.CONTOUR_COLOR,
            self.config.CONTOUR_THICKNESS
        )

        self.contour_image = contour_img
        return contour_img

    def _detect_color_boundaries(self, quantized_image: np.ndarray) -> np.ndarray:
        """
        Detect boundaries between different colors

        Args:
            quantized_image: Quantized image

        Returns:
            Binary edge map
        """
        h, w = quantized_image.shape[:2]
        edges = np.zeros((h, w), dtype=np.uint8)

        # Check horizontal boundaries
        for y in range(h - 1):
            for x in range(w):
                if not np.array_equal(quantized_image[y, x], quantized_image[y + 1, x]):
                    edges[y, x] = 255

        # Check vertical boundaries
        for y in range(h):
            for x in range(w - 1):
                if not np.array_equal(quantized_image[y, x], quantized_image[y, x + 1]):
                    edges[y, x] = 255

        # Dilate edges slightly to make them more visible
        kernel = np.ones((2, 2), dtype=np.uint8)
        cv2 = require_cv2()
        edges = cv2.dilate(edges, kernel, iterations=1)

        return edges

    def build_contours_from_regions(self, regions: List, image_shape: Tuple[int, int],
                                   smooth: bool = True) -> np.ndarray:
        """
        Build contours from detected regions

        Args:
            regions: List of Region objects
            image_shape: (height, width) of image
            smooth: Apply smoothing to contours

        Returns:
            Image with contours drawn
        """
        h, w = image_shape

        # Create white background
        contour_img = np.ones((h, w, 3), dtype=np.uint8) * 255

        cv2 = require_cv2()
        # Collect all contours
        all_contours = [region.contour for region in regions]

        # Smooth contours if requested
        if smooth and all_contours:
            all_contours = smooth_contours(all_contours, epsilon_factor=0.002)

        self.contours = all_contours

        # Draw contours
        cv2.drawContours(
            contour_img,
            all_contours,
            -1,  # Draw all contours
            self.config.CONTOUR_COLOR,
            self.config.CONTOUR_THICKNESS
        )

        self.contour_image = contour_img
        return contour_img

    def add_border(self, image: np.ndarray, border_size: int = 5) -> np.ndarray:
        """
        Add border around image

        Args:
            image: Input image
            border_size: Border thickness

        Returns:
            Image with border
        """
        cv2 = require_cv2()
        return cv2.copyMakeBorder(
            image,
            border_size, border_size, border_size, border_size,
            cv2.BORDER_CONSTANT,
            value=self.config.CONTOUR_COLOR
        )

    def enhance_contours(self, image: np.ndarray,
                        thickness_boost: int = 1) -> np.ndarray:
        """
        Enhance contour visibility

        Args:
            image: Contour image
            thickness_boost: Additional thickness

        Returns:
            Enhanced contour image
        """
        if thickness_boost <= 0:
            return image

        # Extract black pixels (contours)
        cv2 = require_cv2()
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        _, contour_mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)

        # Dilate contours
        kernel = np.ones((thickness_boost, thickness_boost), dtype=np.uint8)
        thick_contours = cv2.dilate(contour_mask, kernel, iterations=1)

        # Create white background
        result = np.ones_like(image) * 255

        # Apply thickened contours
        result[thick_contours > 0] = self.config.CONTOUR_COLOR

        return result

    def create_outline_only(self, image_shape: Tuple[int, int]) -> np.ndarray:
        """
        Create image with only outlines (no internal contours)

        Args:
            image_shape: (height, width) of image

        Returns:
            Outline image
        """
        h, w = image_shape
        cv2 = require_cv2()
        outline = np.ones((h, w, 3), dtype=np.uint8) * 255

        if not self.contours:
            return outline

        # Find the outer boundary contour
        if self.contours:
            # Draw only external contours
            for contour in self.contours:
                area = cv2.contourArea(contour)
                if area > 100:  # Only draw significant contours
                    cv2.drawContours(
                        outline,
                        [contour],
                        -1,
                        self.config.CONTOUR_COLOR,
                        self.config.CONTOUR_THICKNESS
                    )

        return outline

    def get_contour_statistics(self) -> dict:
        """
        Get statistics about contours

        Returns:
            Dictionary with contour statistics
        """
        if not self.contours:
            return {"total_contours": 0}

        cv2 = require_cv2()
        areas = [cv2.contourArea(c) for c in self.contours]
        perimeters = [cv2.arcLength(c, True) for c in self.contours]

        return {
            "total_contours": len(self.contours),
            "total_area": sum(areas),
            "mean_area": np.mean(areas) if areas else 0,
            "total_perimeter": sum(perimeters),
            "mean_perimeter": np.mean(perimeters) if perimeters else 0
        }
