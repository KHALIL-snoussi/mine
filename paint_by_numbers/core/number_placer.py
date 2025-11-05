"""
Number Placement Module - Intelligently places numbers in regions
"""

import numpy as np
from typing import List, Tuple, Optional, Dict

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import is_point_inside_region, get_contrasting_color
    from paint_by_numbers.utils.opencv import require_cv2
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import is_point_inside_region, get_contrasting_color
    from utils.opencv import require_cv2
    from logger import logger


class NumberPlacer:
    """Handles intelligent placement of numbers in regions"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize number placer

        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.placed_positions = []

    def place_numbers(self, image: np.ndarray, regions: List,
                     palette: np.ndarray) -> np.ndarray:
        """
        Place numbers in all regions

        Args:
            image: Template image to draw numbers on
            regions: List of Region objects
            palette: Color palette

        Returns:
            Image with numbers placed
        """
        result = image.copy()
        self.placed_positions = []

        logger.info(f"Placing numbers in {len(regions)} regions...")

        for region in regions:
            # Get the color for this region
            color = palette[region.color_idx]

            # Determine number to display (1-indexed)
            number = region.color_idx + 1

            # Find best position for number
            position = self._find_best_position(region, result.shape[:2])

            if position is None:
                continue

            # Get contrasting text color
            text_color = get_contrasting_color(color)

            # Draw number
            self._draw_number(result, number, position, text_color)

            self.placed_positions.append((region, position, number))

        logger.info(f"Placed {len(self.placed_positions)} numbers")
        return result

    def _find_best_position(self, region, image_shape: Tuple[int, int]) -> Optional[Tuple[int, int]]:
        """
        Find best position to place number in region

        Args:
            region: Region object
            image_shape: (height, width) of image

        Returns:
            (x, y) position or None if no suitable position found
        """
        # Try the geometric center first
        center = region.center

        if self._is_position_valid(center, region, image_shape):
            return center

        # If center doesn't work, try to find alternative positions
        # Use distance transform to find interior points
        cv2 = require_cv2()
        dist_transform = cv2.distanceTransform(region.mask, cv2.DIST_L2, 5)

        # Get multiple candidate positions sorted by distance from edge
        h, w = region.mask.shape
        y_coords, x_coords = np.where(region.mask > 0)

        if len(x_coords) == 0:
            return None

        # Get distances for all points
        distances = dist_transform[y_coords, x_coords]

        # Sort by distance (descending)
        sorted_indices = np.argsort(distances)[::-1]

        # Try top candidates
        for idx in sorted_indices[:10]:  # Try top 10 positions
            candidate = (x_coords[idx], y_coords[idx])

            if self._is_position_valid(candidate, region, image_shape):
                return candidate

        # If nothing works, use the point with maximum distance from edge
        if len(sorted_indices) > 0:
            best_idx = sorted_indices[0]
            return (x_coords[best_idx], y_coords[best_idx])

        return None

    def _is_position_valid(self, position: Tuple[int, int], region,
                          image_shape: Tuple[int, int]) -> bool:
        """
        Check if position is valid for placing a number

        Args:
            position: (x, y) position
            region: Region object
            image_shape: (height, width) of image

        Returns:
            True if position is valid
        """
        x, y = position
        h, w = image_shape

        # Check bounds
        if x < 0 or x >= w or y < 0 or y >= h:
            return False

        # Check if point is inside region with some margin
        if not is_point_inside_region(position, region.mask, min_distance=5):
            return False

        # Check if too close to other placed numbers
        for _, placed_pos, _ in self.placed_positions:
            px, py = placed_pos
            distance = np.sqrt((x - px) ** 2 + (y - py) ** 2)

            if distance < self.config.MIN_NUMBER_SPACING:
                return False

        return True

    def _draw_number(self, image: np.ndarray, number: int,
                    position: Tuple[int, int], color: Tuple[int, int, int]):
        """
        Draw number at specified position

        Args:
            image: Image to draw on
            number: Number to draw
            position: (x, y) position
            color: Text color
        """
        text = str(number)
        cv2 = require_cv2()
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = self.config.FONT_SCALE
        thickness = self.config.FONT_THICKNESS

        # Get text size
        (text_w, text_h), baseline = cv2.getTextSize(
            text, font, font_scale, thickness
        )

        # Center text on position
        x, y = position
        text_x = x - text_w // 2
        text_y = y + text_h // 2

        # Draw text with slight outline for better visibility
        # Draw white outline
        outline_color = (255, 255, 255) if color == (0, 0, 0) else (0, 0, 0)
        cv2.putText(
            image, text,
            (text_x, text_y),
            font, font_scale,
            outline_color,
            thickness + 2,
            cv2.LINE_AA
        )

        # Draw main text
        cv2.putText(
            image, text,
            (text_x, text_y),
            font, font_scale,
            color,
            thickness,
            cv2.LINE_AA
        )

    def place_color_samples(self, image: np.ndarray, regions: List,
                           palette: np.ndarray, sample_size: int = 20) -> np.ndarray:
        """
        Place small color samples instead of numbers

        Args:
            image: Template image
            regions: List of Region objects
            palette: Color palette
            sample_size: Size of color sample

        Returns:
            Image with color samples
        """
        cv2 = require_cv2()
        result = image.copy()

        for region in regions:
            color = palette[region.color_idx]
            position = self._find_best_position(region, result.shape[:2])

            if position is None:
                continue

            x, y = position
            half_size = sample_size // 2

            # Draw color sample square
            x1 = max(0, x - half_size)
            y1 = max(0, y - half_size)
            x2 = min(result.shape[1], x + half_size)
            y2 = min(result.shape[0], y + half_size)

            cv2.rectangle(result, (x1, y1), (x2, y2), color.tolist(), -1)
            cv2.rectangle(result, (x1, y1), (x2, y2), (0, 0, 0), 1)

        return result

    def create_number_map(self, regions: List, image_shape: Tuple[int, int]) -> Dict[int, List[Tuple[int, int]]]:
        """
        Create a map of color indices to their number positions

        Args:
            regions: List of Region objects
            image_shape: (height, width) of image

        Returns:
            Dictionary mapping color index to list of positions
        """
        number_map = {}

        for region in regions:
            color_idx = region.color_idx

            if color_idx not in number_map:
                number_map[color_idx] = []

            position = self._find_best_position(region, image_shape)

            if position:
                number_map[color_idx].append(position)

        return number_map

    def get_placement_statistics(self) -> dict:
        """
        Get statistics about number placement

        Returns:
            Dictionary with placement statistics
        """
        if not self.placed_positions:
            return {"total_placed": 0}

        # Calculate average distances between nearby numbers
        positions = [pos for _, pos, _ in self.placed_positions]

        min_distances = []
        for i, (x1, y1) in enumerate(positions):
            min_dist = float('inf')

            for j, (x2, y2) in enumerate(positions):
                if i != j:
                    dist = np.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
                    min_dist = min(min_dist, dist)

            if min_dist != float('inf'):
                min_distances.append(min_dist)

        return {
            "total_placed": len(self.placed_positions),
            "numbers_per_color": self._count_numbers_per_color(),
            "mean_min_distance": np.mean(min_distances) if min_distances else 0,
            "min_distance": min(min_distances) if min_distances else 0
        }

    def _count_numbers_per_color(self) -> Dict[int, int]:
        """
        Count how many numbers placed for each color

        Returns:
            Dictionary mapping color index to count
        """
        counts = {}

        for region, _, number in self.placed_positions:
            color_idx = region.color_idx

            if color_idx not in counts:
                counts[color_idx] = 0

            counts[color_idx] += 1

        return counts
