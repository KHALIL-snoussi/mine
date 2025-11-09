"""
Quality Validation and Sanity Checks
Ensures paint-by-numbers templates are error-free and high quality
"""

import numpy as np
from typing import List, Dict, Tuple, Set
from collections import Counter


class TemplateValidator:
    """Validates paint-by-numbers templates for quality and correctness"""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

    def validate(self, regions: List, palette: np.ndarray, image_shape: Tuple[int, int]) -> Dict:
        """
        Perform comprehensive validation on a paint-by-numbers template

        Args:
            regions: List of Region objects
            palette: Color palette array (N, 3)
            image_shape: (height, width) of the template

        Returns:
            Validation report dictionary
        """
        self.errors = []
        self.warnings = []
        self.info = []

        # Run all validation checks
        self._check_no_duplicate_numbers(regions)
        self._check_all_colors_used(regions, palette)
        self._check_no_unnumbered_regions(regions)
        self._check_region_sizes(regions)
        self._check_adjacent_color_similarity(regions, palette)
        self._check_coverage(regions, image_shape)
        self._check_number_visibility(regions)

        # Compile report
        report = {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'info': self.info,
            'stats': self._generate_stats(regions, palette)
        }

        return report

    def _check_no_duplicate_numbers(self, regions: List):
        """Check that no two regions have the same number in close proximity"""
        # This is more about visual clarity than strict uniqueness
        # For paint-by-numbers, same color regions can have same number
        # but we check if numbers are well-distributed

        if not regions:
            self.errors.append("No regions found")
            return

        color_region_counts = Counter(r.color_idx for r in regions)

        for color_idx, count in color_region_counts.items():
            if count > 100:
                self.warnings.append(
                    f"Color {color_idx + 1} has {count} separate regions - "
                    f"consider merging some for simplicity"
                )

    def _check_all_colors_used(self, regions: List, palette: np.ndarray):
        """Check that every palette color is used in at least one region"""
        if not regions:
            return

        used_colors = set(r.color_idx for r in regions)
        total_colors = len(palette)
        unused_colors = set(range(total_colors)) - used_colors

        if unused_colors:
            unused_list = [i + 1 for i in sorted(unused_colors)]
            self.warnings.append(
                f"Unused colors in palette: {unused_list}. "
                f"Consider reducing color count or adjusting quantization."
            )

        usage_pct = (len(used_colors) / total_colors * 100) if total_colors > 0 else 0
        self.info.append(f"Color usage: {len(used_colors)}/{total_colors} ({usage_pct:.1f}%)")

    def _check_no_unnumbered_regions(self, regions: List):
        """Check that all regions have valid number positions"""
        unnumbered = []

        for i, region in enumerate(regions):
            if not hasattr(region, 'number_position') or region.number_position is None:
                unnumbered.append(i)
            elif not hasattr(region, 'center') or region.center is None:
                unnumbered.append(i)

        if unnumbered:
            self.errors.append(
                f"Found {len(unnumbered)} regions without number positions"
            )

    def _check_region_sizes(self, regions: List):
        """Check for regions that might be too small or too large"""
        if not regions:
            return

        areas = [r.area for r in regions]

        min_area = min(areas)
        max_area = max(areas)
        avg_area = np.mean(areas)

        # Check for tiny regions
        tiny_threshold = 100
        tiny_regions = [r for r in regions if r.area < tiny_threshold]

        if tiny_regions:
            self.warnings.append(
                f"Found {len(tiny_regions)} very small regions (< {tiny_threshold} px). "
                f"These may be difficult to paint."
            )

        # Check for extremely large regions
        large_threshold = avg_area * 10
        large_regions = [r for r in regions if r.area > large_threshold]

        if large_regions:
            self.info.append(
                f"Found {len(large_regions)} very large regions (> {int(large_threshold)} px)"
            )

        self.info.append(
            f"Region sizes: min={min_area}, max={max_area}, avg={int(avg_area)}"
        )

    def _check_adjacent_color_similarity(self, regions: List, palette: np.ndarray):
        """Check if adjacent regions have very similar colors"""
        from paint_by_numbers.utils.color_names import color_distance_lab

        # Build adjacency information (simplified check)
        similar_adjacent = []

        for i, region1 in enumerate(regions):
            for j, region2 in enumerate(regions[i+1:], start=i+1):
                # Check if regions are the same color (expected to be adjacent)
                if region1.color_idx == region2.color_idx:
                    continue

                # Check if regions are close in space (rough check)
                dist = np.linalg.norm(
                    np.array(region1.center) - np.array(region2.center)
                )

                # If centers are close, check color similarity
                if dist < 100:  # Rough proximity threshold
                    color1 = tuple(palette[region1.color_idx])
                    color2 = tuple(palette[region2.color_idx])

                    color_dist = color_distance_lab(color1, color2)

                    # If colors are very similar
                    if color_dist < 10:  # Perceptually very similar
                        similar_adjacent.append((i, j, color_dist))

        if similar_adjacent:
            self.warnings.append(
                f"Found {len(similar_adjacent)} pairs of nearby regions with very similar colors. "
                f"Consider adjusting color quantization."
            )

    def _check_coverage(self, regions: List, image_shape: Tuple[int, int]):
        """Check that regions cover the entire image"""
        if not regions:
            return

        total_pixels = image_shape[0] * image_shape[1]
        covered_pixels = sum(r.area for r in regions)

        coverage_pct = (covered_pixels / total_pixels * 100) if total_pixels > 0 else 0

        if coverage_pct < 95:
            self.warnings.append(
                f"Regions only cover {coverage_pct:.1f}% of image. "
                f"Some areas may be missing."
            )
        else:
            self.info.append(f"Image coverage: {coverage_pct:.1f}%")

    def _check_number_visibility(self, regions: List):
        """Check that numbers are positioned in visible locations"""
        issues = 0

        for region in regions:
            # Check if number position is within the region's bounding box
            if hasattr(region, 'number_position') and region.number_position:
                x, y = region.number_position

                # Basic check: is it within a reasonable distance from center?
                if hasattr(region, 'center') and region.center:
                    cx, cy = region.center
                    dist = np.sqrt((x - cx)**2 + (y - cy)**2)

                    # If number is very far from center, might be misplaced
                    if dist > 100:
                        issues += 1

        if issues > 0:
            self.warnings.append(
                f"{issues} numbers may be poorly positioned (far from region centers)"
            )

    def _generate_stats(self, regions: List, palette: np.ndarray) -> Dict:
        """Generate statistical summary"""
        if not regions:
            return {'total_regions': 0, 'total_colors': len(palette)}

        areas = [r.area for r in regions]

        used_colors = set(r.color_idx for r in regions)

        return {
            'total_regions': len(regions),
            'total_colors': len(palette),
            'used_colors': len(used_colors),
            'min_region_area': min(areas),
            'max_region_area': max(areas),
            'avg_region_area': int(np.mean(areas)),
            'median_region_area': int(np.median(areas)),
            'total_area': sum(areas)
        }


def quick_validate(regions: List, palette: np.ndarray, image_shape: Tuple[int, int]) -> bool:
    """
    Quick validation check - returns True if template passes basic checks

    Args:
        regions: List of Region objects
        palette: Color palette
        image_shape: Image dimensions

    Returns:
        True if template is valid
    """
    validator = TemplateValidator()
    report = validator.validate(regions, palette, image_shape)
    return report['valid']


def print_validation_report(report: Dict):
    """
    Print a human-readable validation report

    Args:
        report: Validation report dictionary
    """
    print("\n" + "="*60)
    print("TEMPLATE VALIDATION REPORT")
    print("="*60)

    if report['valid']:
        print("✅ Template is VALID")
    else:
        print("❌ Template has ERRORS")

    print()

    if report['errors']:
        print("ERRORS:")
        for error in report['errors']:
            print(f"  ❌ {error}")
        print()

    if report['warnings']:
        print("WARNINGS:")
        for warning in report['warnings']:
            print(f"  ⚠️  {warning}")
        print()

    if report['info']:
        print("INFO:")
        for info in report['info']:
            print(f"  ℹ️  {info}")
        print()

    print("STATISTICS:")
    for key, value in report['stats'].items():
        print(f"  • {key}: {value}")

    print("="*60)
