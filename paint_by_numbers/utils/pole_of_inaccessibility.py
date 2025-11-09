"""
Pole of Inaccessibility - Find the most centered point in a polygon
Used for optimal label placement in paint-by-numbers regions
"""

import numpy as np
from typing import Tuple, Optional


def point_to_polygon_distance(point: Tuple[float, float], polygon: np.ndarray) -> float:
    """
    Calculate the minimum distance from a point to a polygon's edges

    Args:
        point: (x, y) coordinates
        polygon: Array of polygon vertices (N, 2) or (N, 1, 2)

    Returns:
        Minimum distance to polygon edge
    """
    # Ensure polygon is (N, 2) shape
    if len(polygon.shape) == 3:
        polygon = polygon.reshape(-1, 2)

    x, y = point
    min_dist = float('inf')

    n = len(polygon)
    for i in range(n):
        p1 = polygon[i]
        p2 = polygon[(i + 1) % n]

        # Calculate distance to line segment
        dist = point_to_segment_distance((x, y), p1, p2)
        min_dist = min(min_dist, dist)

    return min_dist


def point_to_segment_distance(
    point: Tuple[float, float],
    seg_start: np.ndarray,
    seg_end: np.ndarray
) -> float:
    """
    Calculate distance from point to line segment

    Args:
        point: (x, y) coordinates
        seg_start: Segment start point
        seg_end: Segment end point

    Returns:
        Distance to segment
    """
    x, y = point
    x1, y1 = seg_start[0], seg_start[1]
    x2, y2 = seg_end[0], seg_end[1]

    # Calculate line segment parameters
    dx = x2 - x1
    dy = y2 - y1

    if dx == 0 and dy == 0:
        # Degenerate segment (point)
        return np.sqrt((x - x1) ** 2 + (y - y1) ** 2)

    # Project point onto line
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))  # Clamp to segment

    # Find closest point on segment
    closest_x = x1 + t * dx
    closest_y = y1 + t * dy

    # Return distance
    return np.sqrt((x - closest_x) ** 2 + (y - closest_y) ** 2)


def get_polygon_centroid(polygon: np.ndarray) -> Tuple[float, float]:
    """
    Calculate the centroid of a polygon

    Args:
        polygon: Array of polygon vertices

    Returns:
        (x, y) centroid coordinates
    """
    # Ensure polygon is (N, 2) shape
    if len(polygon.shape) == 3:
        polygon = polygon.reshape(-1, 2)

    x = polygon[:, 0].mean()
    y = polygon[:, 1].mean()

    return (float(x), float(y))


def get_polygon_bounding_box(polygon: np.ndarray) -> Tuple[float, float, float, float]:
    """
    Get bounding box of polygon

    Args:
        polygon: Array of polygon vertices

    Returns:
        (min_x, min_y, max_x, max_y)
    """
    # Ensure polygon is (N, 2) shape
    if len(polygon.shape) == 3:
        polygon = polygon.reshape(-1, 2)

    min_x = polygon[:, 0].min()
    max_x = polygon[:, 0].max()
    min_y = polygon[:, 1].min()
    max_y = polygon[:, 1].max()

    return (float(min_x), float(min_y), float(max_x), float(max_y))


def pole_of_inaccessibility(
    polygon: np.ndarray,
    precision: float = 1.0,
    initial_point: Optional[Tuple[float, float]] = None
) -> Tuple[float, float]:
    """
    Find the pole of inaccessibility (most distant point from polygon edges)
    using a grid-based search with iterative refinement.

    This is the optimal point for placing labels in irregularly shaped regions.

    Args:
        polygon: Array of polygon vertices (N, 2) or (N, 1, 2)
        precision: Grid cell size for search (smaller = more accurate but slower)
        initial_point: Optional starting point (uses centroid if None)

    Returns:
        (x, y) coordinates of the pole of inaccessibility
    """
    # Ensure polygon is (N, 2) shape
    if len(polygon.shape) == 3:
        polygon = polygon.reshape(-1, 2)

    if len(polygon) < 3:
        # Degenerate polygon
        return get_polygon_centroid(polygon)

    # Get bounding box
    min_x, min_y, max_x, max_y = get_polygon_bounding_box(polygon)

    # Start with centroid if no initial point provided
    if initial_point is None:
        initial_point = get_polygon_centroid(polygon)

    # Initialize best point
    best_x, best_y = initial_point
    best_dist = point_to_polygon_distance((best_x, best_y), polygon)

    # Grid search with decreasing cell size
    cell_size = min(max_x - min_x, max_y - min_y) / 4.0

    while cell_size > precision:
        # Search in a grid around current best point
        search_range = cell_size * 2

        for dx in np.arange(-search_range, search_range + cell_size, cell_size):
            for dy in np.arange(-search_range, search_range + cell_size, cell_size):
                test_x = best_x + dx
                test_y = best_y + dy

                # Check if point is within bounding box
                if not (min_x <= test_x <= max_x and min_y <= test_y <= max_y):
                    continue

                # Calculate distance to polygon edges
                dist = point_to_polygon_distance((test_x, test_y), polygon)

                # Update best point if this is better
                if dist > best_dist:
                    best_x, best_y = test_x, test_y
                    best_dist = dist

        # Reduce cell size for next iteration
        cell_size /= 2.0

    return (best_x, best_y)


def find_best_label_position(
    mask: np.ndarray,
    contour: Optional[np.ndarray] = None,
    precision: float = 1.0
) -> Tuple[int, int]:
    """
    Find the best position to place a label in a region

    Args:
        mask: Binary mask of the region (2D array)
        contour: Optional contour points for the region
        precision: Search precision (smaller = more accurate)

    Returns:
        (x, y) coordinates for label placement
    """
    # If contour is provided, use pole of inaccessibility
    if contour is not None and len(contour) >= 3:
        try:
            x, y = pole_of_inaccessibility(contour, precision=precision)
            return (int(round(x)), int(round(y)))
        except Exception:
            pass  # Fall back to centroid

    # Fall back to mask centroid
    y_coords, x_coords = np.where(mask > 0)

    if len(x_coords) == 0:
        return (0, 0)

    center_x = int(np.mean(x_coords))
    center_y = int(np.mean(y_coords))

    return (center_x, center_y)


def is_point_in_polygon(point: Tuple[float, float], polygon: np.ndarray) -> bool:
    """
    Check if a point is inside a polygon using ray casting

    Args:
        point: (x, y) coordinates
        polygon: Array of polygon vertices

    Returns:
        True if point is inside polygon
    """
    # Ensure polygon is (N, 2) shape
    if len(polygon.shape) == 3:
        polygon = polygon.reshape(-1, 2)

    x, y = point
    n = len(polygon)
    inside = False

    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]

        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside

        p1x, p1y = p2x, p2y

    return inside
