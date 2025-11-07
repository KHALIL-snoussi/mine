"""
Utility helper functions for Paint-by-Numbers System
"""

import numpy as np
from typing import Tuple, List
from scipy.spatial import distance

try:
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    from .opencv import require_cv2


def resize_image(image: np.ndarray, max_size: Tuple[int, int]) -> np.ndarray:
    """
    Resize image while maintaining aspect ratio

    Args:
        image: Input image
        max_size: Maximum (width, height)

    Returns:
        Resized image
    """
    h, w = image.shape[:2]
    max_w, max_h = max_size

    # Calculate scaling factor
    scale = min(max_w / w, max_h / h, 1.0)

    if scale < 1.0:
        new_w = int(w * scale)
        new_h = int(h * scale)
        cv2 = require_cv2()
        return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return image


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """
    Convert RGB tuple to hex color string

    Args:
        rgb: RGB color tuple

    Returns:
        Hex color string
    """
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))


def get_contrasting_color(rgb: Tuple[int, int, int]) -> Tuple[int, int, int]:
    """
    Get contrasting color (black or white) for given RGB color

    Args:
        rgb: RGB color tuple

    Returns:
        Contrasting color (black or white)
    """
    luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
    return (0, 0, 0) if luminance > 128 else (255, 255, 255)


def find_region_center(region_mask: np.ndarray) -> Tuple[int, int]:
    """
    Find the visual center of a region using distance transform

    Args:
        region_mask: Binary mask of region

    Returns:
        (x, y) coordinates of center
    """
    # Use distance transform to find the most interior point
    cv2 = require_cv2()
    dist_transform = cv2.distanceTransform(region_mask, cv2.DIST_L2, 5)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(dist_transform)

    return max_loc


def calculate_region_area(region_mask: np.ndarray) -> int:
    """
    Calculate the area of a region in pixels

    Args:
        region_mask: Binary mask of region

    Returns:
        Area in pixels
    """
    return np.sum(region_mask > 0)


def sort_colors_by_brightness(colors: np.ndarray) -> np.ndarray:
    """
    Sort colors by brightness (luminance)

    Args:
        colors: Array of RGB colors

    Returns:
        Sorted array of colors
    """
    luminance = 0.299 * colors[:, 0] + 0.587 * colors[:, 1] + 0.114 * colors[:, 2]
    sorted_indices = np.argsort(luminance)
    return colors[sorted_indices]


def is_point_inside_region(point: Tuple[int, int], region_mask: np.ndarray,
                           min_distance: int = 5) -> bool:
    """
    Check if a point is safely inside a region (not too close to edges)

    Args:
        point: (x, y) coordinates
        region_mask: Binary mask of region
        min_distance: Minimum distance from edge

    Returns:
        True if point is safely inside
    """
    x, y = point
    h, w = region_mask.shape

    # Check bounds
    if x < 0 or x >= w or y < 0 or y >= h:
        return False

    # Check if point is in region
    if region_mask[y, x] == 0:
        return False

    # Check distance from edge using distance transform
    cv2 = require_cv2()
    dist_transform = cv2.distanceTransform(region_mask, cv2.DIST_L2, 5)

    return dist_transform[y, x] >= min_distance


def smooth_contours(contours: List[np.ndarray], epsilon_factor: float = 0.001) -> List[np.ndarray]:
    """
    Smooth contours using Douglas-Peucker algorithm

    Args:
        contours: List of contours
        epsilon_factor: Approximation accuracy factor

    Returns:
        List of smoothed contours
    """
    smoothed = []
    cv2 = require_cv2()
    for contour in contours:
        epsilon = epsilon_factor * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        smoothed.append(approx)

    return smoothed


def create_color_palette_image(colors: np.ndarray, swatch_size: int = 50) -> np.ndarray:
    """
    Create a visual palette image from colors

    Args:
        colors: Array of RGB colors
        swatch_size: Size of each color swatch

    Returns:
        Palette image
    """
    n_colors = len(colors)
    cols = min(5, n_colors)
    rows = (n_colors + cols - 1) // cols

    palette = np.zeros((rows * swatch_size, cols * swatch_size, 3), dtype=np.uint8)

    for idx, color in enumerate(colors):
        row = idx // cols
        col = idx % cols
        palette[row * swatch_size:(row + 1) * swatch_size,
                col * swatch_size:(col + 1) * swatch_size] = color[::-1]  # BGR to RGB

    return palette


def ensure_uint8(image: np.ndarray) -> np.ndarray:
    """
    Ensure image is in uint8 format

    Args:
        image: Input image

    Returns:
        Image in uint8 format
    """
    if image.dtype != np.uint8:
        if image.max() <= 1.0:
            image = (image * 255).astype(np.uint8)
        else:
            image = image.astype(np.uint8)

    return image
