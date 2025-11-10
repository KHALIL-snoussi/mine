"""
Region Detection Module - Detects and segments color regions
"""

import numpy as np
from typing import List, Tuple, Dict, Optional

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import calculate_region_area, find_region_center
    from paint_by_numbers.utils.opencv import require_cv2
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import calculate_region_area, find_region_center
    from utils.opencv import require_cv2
    from logger import logger


class Region:
    """Represents a color region in the image"""

    def __init__(self, color_idx: int, mask: np.ndarray, contour: np.ndarray,
                 center: Tuple[int, int], area: int):
        """
        Initialize region

        Args:
            color_idx: Index of color in palette
            mask: Binary mask of region
            contour: Contour points
            center: (x, y) center point
            area: Area in pixels
        """
        self.color_idx = color_idx
        self.mask = mask
        self.contour = contour
        self.center = center
        self.area = area
        self.number_position = center  # Can be adjusted later


class RegionDetector:
    """Detects and segments regions in quantized images"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize region detector

        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.regions = []
        self.color_regions = {}  # Maps color_idx to list of regions

    def detect_regions(self, quantized_image: np.ndarray, palette: np.ndarray,
                      labels: np.ndarray) -> List[Region]:
        """
        Detect all regions in quantized image

        Args:
            quantized_image: Quantized image
            palette: Color palette
            labels: Label map (each pixel's color index)

        Returns:
            List of detected regions
        """
        self.regions = []
        self.color_regions = {i: [] for i in range(len(palette))}

        logger.info("Detecting regions...")

        cv2 = require_cv2()

        for color_idx in range(len(palette)):
            # Create mask for this color
            mask = (labels == color_idx).astype(np.uint8) * 255

            if mask.sum() == 0:
                continue

            # Apply morphological operations to clean up mask
            kernel = cv2.getStructuringElement(
                cv2.MORPH_ELLIPSE,
                (self.config.MORPHOLOGY_KERNEL_SIZE, self.config.MORPHOLOGY_KERNEL_SIZE)
            )

            close_iterations = max(0, getattr(self.config, "MORPH_CLOSE_ITERATIONS", 1))
            open_iterations = max(0, getattr(self.config, "MORPH_OPEN_ITERATIONS", 1))

            if close_iterations > 0:
                mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=close_iterations)

            if open_iterations > 0:
                mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=open_iterations)

            # Find contours
            contours, hierarchy = cv2.findContours(
                mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            # Process each contour as a separate region
            for contour in contours:
                area = cv2.contourArea(contour)

                # Skip very small regions
                if area < self.config.MIN_REGION_SIZE:
                    continue

                # Create region mask
                region_mask = np.zeros_like(mask)
                cv2.drawContours(region_mask, [contour], -1, 255, -1)

                # Find region center
                center = find_region_center(region_mask)

                # Create region object
                region = Region(
                    color_idx=color_idx,
                    mask=region_mask,
                    contour=contour,
                    center=center,
                    area=int(area)
                )

                self.regions.append(region)
                self.color_regions[color_idx].append(region)

        logger.info(f"Detected {len(self.regions)} regions")
        return self.regions

    def get_region_statistics(self) -> Dict:
        """
        Get statistics about detected regions

        Returns:
            Dictionary with region statistics
        """
        if not self.regions:
            return {"total_regions": 0}

        areas = [r.area for r in self.regions]
        regions_per_color = {
            idx: len(regions)
            for idx, regions in self.color_regions.items()
            if regions
        }

        return {
            "total_regions": len(self.regions),
            "regions_per_color": regions_per_color,
            "min_area": min(areas),
            "max_area": max(areas),
            "mean_area": np.mean(areas),
            "median_area": np.median(areas)
        }

    def filter_small_regions(self, min_area: Optional[int] = None) -> List[Region]:
        """
        Filter out regions smaller than threshold

        Args:
            min_area: Minimum area (uses config default if None)

        Returns:
            List of filtered regions
        """
        if min_area is None:
            min_area = self.config.MIN_REGION_SIZE

        filtered = [r for r in self.regions if r.area >= min_area]

        logger.info(f"Filtered {len(self.regions) - len(filtered)} small regions")

        self.regions = filtered

        # Rebuild color_regions mapping
        self.color_regions = {}
        for region in self.regions:
            if region.color_idx not in self.color_regions:
                self.color_regions[region.color_idx] = []
            self.color_regions[region.color_idx].append(region)

        return self.regions

    def merge_nearby_regions(self, same_color: bool = True,
                            distance_threshold: int = 10) -> List[Region]:
        """
        Merge regions that are very close to each other

        Args:
            same_color: Only merge regions of the same color
            distance_threshold: Maximum distance for merging

        Returns:
            List of merged regions
        """
        cv2 = require_cv2()
        if same_color:
            # Merge regions color by color
            merged_regions = []

            for color_idx, regions in self.color_regions.items():
                if not regions:
                    continue

                # Create combined mask for all regions of this color
                h, w = regions[0].mask.shape
                combined_mask = np.zeros((h, w), dtype=np.uint8)

                for region in regions:
                    combined_mask = cv2.bitwise_or(combined_mask, region.mask)

                # Dilate slightly to connect nearby regions
                kernel_size = distance_threshold
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
                dilated = cv2.dilate(combined_mask, kernel)

                # Find connected components
                contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                # Create new regions
                for contour in contours:
                    # Erode back to original size
                    region_mask = np.zeros((h, w), dtype=np.uint8)
                    cv2.drawContours(region_mask, [contour], -1, 255, -1)
                    region_mask = cv2.erode(region_mask, kernel)

                    # Intersect with original combined mask
                    region_mask = cv2.bitwise_and(region_mask, combined_mask)

                    area = calculate_region_area(region_mask)

                    if area < self.config.MIN_REGION_SIZE:
                        continue

                    # Find new contour on cleaned mask
                    contours_clean, _ = cv2.findContours(
                        region_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                    )

                    if not contours_clean:
                        continue

                    # Use largest contour
                    contour = max(contours_clean, key=cv2.contourArea)
                    center = find_region_center(region_mask)

                    merged_region = Region(
                        color_idx=color_idx,
                        mask=region_mask,
                        contour=contour,
                        center=center,
                        area=int(area)
                    )

                    merged_regions.append(merged_region)

            self.regions = merged_regions

            # Rebuild color_regions mapping
            self.color_regions = {i: [] for i in self.color_regions.keys()}
            for region in self.regions:
                self.color_regions[region.color_idx].append(region)

            logger.info(f"After merging: {len(self.regions)} regions")

        return self.regions

    def get_region_at_point(self, x: int, y: int) -> Optional[Region]:
        """
        Get region at specific point

        Args:
            x: X coordinate
            y: Y coordinate

        Returns:
            Region at point or None
        """
        for region in self.regions:
            h, w = region.mask.shape
            if 0 <= x < w and 0 <= y < h:
                if region.mask[y, x] > 0:
                    return region

        return None

    def apply_artistic_simplification(self, palette: np.ndarray, labels: np.ndarray,
                                      threshold: float = 15.0) -> Tuple[np.ndarray, np.ndarray]:
        """
        Apply artistic simplification by merging adjacent regions with similar colors.
        This creates a more painterly, less photo-traced appearance.

        Args:
            palette: Color palette (RGB)
            labels: Label map
            threshold: LAB distance threshold for merging (lower = more aggressive)

        Returns:
            Tuple of (updated_palette, updated_labels)
        """
        logger.info(f"Applying artistic simplification (threshold: {threshold} Delta E)")

        # Import LAB conversion functions
        try:
            from paint_by_numbers.core.color_quantizer import rgb_to_lab, delta_e_cie2000
        except ImportError:
            from core.color_quantizer import rgb_to_lab, delta_e_cie2000

        cv2 = require_cv2()
        h, w = labels.shape[:2]

        # Convert palette to LAB
        palette_lab = rgb_to_lab(palette)

        # Find pairs of similar colors
        merge_map = {}  # Maps color_idx to target color_idx
        for i in range(len(palette)):
            merge_map[i] = i  # Initially, each color maps to itself

        # Find colors that are perceptually similar
        for i in range(len(palette)):
            for j in range(i + 1, len(palette)):
                distance = delta_e_cie2000(palette_lab[i], palette_lab[j])

                if distance < threshold:
                    # These colors are similar enough to merge
                    # Merge j into i (keep lower index)
                    logger.info(f"Merging color {j} into {i} (distance: {distance:.1f})")
                    merge_map[j] = i

        # Check for adjacent regions with similar colors
        # Create adjacency matrix
        adjacency = np.zeros((len(palette), len(palette)), dtype=bool)

        # Scan image to find adjacent colors
        for y in range(h - 1):
            for x in range(w - 1):
                current = labels[y, x]
                # Check right neighbor
                if labels[y, x + 1] != current:
                    adjacency[current, labels[y, x + 1]] = True
                    adjacency[labels[y, x + 1], current] = True
                # Check bottom neighbor
                if labels[y + 1, x] != current:
                    adjacency[current, labels[y + 1, x]] = True
                    adjacency[labels[y + 1, x], current] = True

        # Merge adjacent similar colors more aggressively
        for i in range(len(palette)):
            for j in range(i + 1, len(palette)):
                if adjacency[i, j]:
                    distance = delta_e_cie2000(palette_lab[i], palette_lab[j])
                    # Use slightly higher threshold for adjacent regions
                    if distance < threshold * 1.5:
                        logger.info(f"Merging adjacent color {j} into {i} (distance: {distance:.1f})")
                        # Resolve chain: if j was already going to merge with something, update
                        target_j = merge_map[j]
                        if target_j != j:
                            # j is already merging elsewhere, use that target
                            merge_map[j] = min(i, target_j)
                        else:
                            merge_map[j] = i

        # Apply merging to labels
        new_labels = labels.copy()
        for old_idx, new_idx in merge_map.items():
            if old_idx != new_idx:
                new_labels[labels == old_idx] = new_idx

        # Create new palette with only used colors
        used_colors = np.unique(new_labels)
        new_palette = palette[used_colors]

        # Remap labels to consecutive indices
        remap = {old: new for new, old in enumerate(used_colors)}
        final_labels = np.zeros_like(new_labels)
        for old_idx, new_idx in remap.items():
            final_labels[new_labels == old_idx] = new_idx

        logger.info(f"Artistic simplification: {len(palette)} → {len(new_palette)} colors")

        return new_palette, final_labels
