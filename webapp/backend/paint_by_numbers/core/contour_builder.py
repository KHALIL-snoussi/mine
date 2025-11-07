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
        ENHANCED for QBRIX-quality professional output

        Args:
            quantized_image: Quantized image
            smooth: Apply smoothing to contours

        Returns:
            Image with contours drawn
        """
        h, w = quantized_image.shape[:2]
        cv2 = require_cv2()

        # Create white background
        contour_img = np.ones((h, w, 3), dtype=np.uint8) * 255

        # Find edges between different colors (ENHANCED METHOD)
        edges = self._detect_color_boundaries(quantized_image)

        # Find contours
        contours, hierarchy = cv2.findContours(
            edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
        )

        # ENHANCED SMOOTHING with adaptive epsilon based on contour size
        if smooth and contours:
            smoothed_contours = []
            for contour in contours:
                # Calculate perimeter
                perimeter = cv2.arcLength(contour, True)

                # Adaptive epsilon: smaller for small contours, larger for big ones
                # This preserves detail in small regions while smoothing large areas
                if perimeter < 100:
                    epsilon = 0.001 * perimeter  # Keep small details
                elif perimeter < 500:
                    epsilon = 0.002 * perimeter  # Moderate smoothing
                else:
                    epsilon = 0.003 * perimeter  # More smoothing for large regions

                # Apply Douglas-Peucker algorithm for smooth curves
                approx = cv2.approxPolyDP(contour, epsilon, True)
                smoothed_contours.append(approx)

            contours = smoothed_contours

        self.contours = contours

        # Draw contours with ANTI-ALIASING for professional quality
        line_type = cv2.LINE_AA if self.config.USE_ANTIALIASING else cv2.LINE_8

        cv2.drawContours(
            contour_img,
            contours,
            -1,  # Draw all contours
            self.config.CONTOUR_COLOR,
            self.config.CONTOUR_THICKNESS,
            lineType=line_type  # Anti-aliasing for smooth edges
        )

        self.contour_image = contour_img
        return contour_img

    def _detect_color_boundaries(self, quantized_image: np.ndarray) -> np.ndarray:
        """
        Detect boundaries between different colors
        ENHANCED for QBRIX-quality pixel-perfect edges

        Args:
            quantized_image: Quantized image

        Returns:
            Binary edge map
        """
        cv2 = require_cv2()
        h, w = quantized_image.shape[:2]

        # METHOD 1: Direct pixel comparison (faster for small images)
        edges_direct = np.zeros((h, w), dtype=np.uint8)

        # Vectorized horizontal boundaries
        diff_h = np.any(quantized_image[:-1, :] != quantized_image[1:, :], axis=2)
        edges_direct[:-1, :][diff_h] = 255

        # Vectorized vertical boundaries
        diff_v = np.any(quantized_image[:, :-1] != quantized_image[:, 1:], axis=2)
        edges_direct[:, :-1][diff_v] = 255

        # METHOD 2: Multi-scale Canny for clean edges
        gray = cv2.cvtColor(quantized_image, cv2.COLOR_RGB2GRAY)

        # Apply bilateral filter for clean edges while preserving boundaries
        bilateral = cv2.bilateralFilter(gray, 5, 50, 50)

        # Multi-scale Canny edge detection
        edges_canny1 = cv2.Canny(bilateral,
                                  self.config.EDGE_THRESHOLD_LOW,
                                  self.config.EDGE_THRESHOLD_HIGH)
        edges_canny2 = cv2.Canny(bilateral,
                                  max(10, self.config.EDGE_THRESHOLD_LOW - 20),
                                  self.config.EDGE_THRESHOLD_HIGH + 20)

        # Combine both Canny scales for better coverage
        edges_canny = cv2.bitwise_or(edges_canny1, edges_canny2)

        # Combine direct and Canny methods for best results
        edges_combined = cv2.bitwise_or(edges_direct, edges_canny)

        # Clean up with morphological operations
        # Close small gaps
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        edges_combined = cv2.morphologyEx(edges_combined, cv2.MORPH_CLOSE, kernel_close)

        # Thin the edges for crisp 1-pixel lines
        kernel_thin = np.ones((2, 2), dtype=np.uint8)
        edges_final = cv2.morphologyEx(edges_combined, cv2.MORPH_GRADIENT, kernel_thin)

        return edges_final

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
