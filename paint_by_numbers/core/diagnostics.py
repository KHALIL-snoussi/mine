"""
Processing Diagnostics Module
Provides detailed quality metrics for paint-by-numbers generation
"""

import numpy as np
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class ProcessingDiagnostics:
    """
    Comprehensive diagnostics for paint-by-numbers generation quality.
    Mirrors the diamond-painting ProcessingDiagnostics interface.
    """

    # Image metrics
    original_width: int
    original_height: int
    processed_width: int
    processed_height: int
    total_pixels: int

    # Color palette metrics
    palette_size: int
    colors_used: int
    colors_unused: int

    # Region metrics
    total_regions: int
    min_region_size: int
    max_region_size: int
    avg_region_size: float
    median_region_size: float

    # Edge and detail metrics
    edge_pixel_count: int
    edge_pixel_percentage: float
    detail_level: str  # 'low', 'medium', 'high', 'ultra'

    # Palette coverage
    palette_coverage: Dict[int, float]  # color_index -> percentage
    background_percentage: float
    foreground_percentage: float

    # Quality indicators
    color_balance_score: float  # 0-100, higher is better
    region_distribution_score: float  # 0-100, higher is better
    overall_quality_score: float  # 0-100, higher is better

    # Processing metadata
    processing_time_seconds: float
    model_used: str
    style_applied: str

    # Advanced metrics
    palette_entropy: float  # Measure of color diversity
    speckle_count: int  # Number of tiny isolated regions
    largest_region_ratio: float  # Largest region as % of total
    smallest_paintable_regions: int  # Regions >= min_region_size

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return asdict(self)

    def get_summary(self) -> str:
        """Get human-readable summary"""
        return (
            f"Processing Diagnostics:\n"
            f"  Image: {self.processed_width}×{self.processed_height} ({self.total_pixels:,} pixels)\n"
            f"  Colors: {self.colors_used}/{self.palette_size} used\n"
            f"  Regions: {self.total_regions} total, {self.avg_region_size:.0f} avg size\n"
            f"  Detail: {self.detail_level} ({self.edge_pixel_percentage:.1f}% edges)\n"
            f"  Quality: {self.overall_quality_score:.1f}/100\n"
            f"  Model: {self.model_used} ({self.style_applied})\n"
            f"  Time: {self.processing_time_seconds:.1f}s"
        )


class DiagnosticsCalculator:
    """Helper class to calculate processing diagnostics"""

    @staticmethod
    def calculate(
        original_image: np.ndarray,
        processed_image: np.ndarray,
        quantized_image: np.ndarray,
        palette: np.ndarray,
        labels: np.ndarray,
        regions: list,
        edge_mask: Optional[np.ndarray],
        processing_time: float,
        model_name: str,
        style_name: str,
        min_region_size: int
    ) -> ProcessingDiagnostics:
        """
        Calculate comprehensive diagnostics from processing results.

        Args:
            original_image: Original input image
            processed_image: Preprocessed image
            quantized_image: Color-quantized image
            palette: Color palette used
            labels: Pixel-to-color assignments
            regions: Detected regions list
            edge_mask: Edge detection mask
            processing_time: Total processing time in seconds
            model_name: Model/preset used
            style_name: Style applied
            min_region_size: Minimum region size threshold

        Returns:
            ProcessingDiagnostics object
        """

        # Image metrics
        orig_h, orig_w = original_image.shape[:2]
        proc_h, proc_w = processed_image.shape[:2]
        total_pixels = proc_h * proc_w

        # Color metrics
        unique_labels = np.unique(labels)
        colors_used = len(unique_labels)
        colors_unused = len(palette) - colors_used

        # Palette coverage
        palette_coverage = {}
        for label in unique_labels:
            count = np.sum(labels == label)
            percentage = (count / total_pixels) * 100
            palette_coverage[int(label)] = float(percentage)

        # Region metrics
        total_regions = len(regions)
        region_sizes = [r['area'] for r in regions]

        if region_sizes:
            min_region = min(region_sizes)
            max_region = max(region_sizes)
            avg_region = np.mean(region_sizes)
            median_region = np.median(region_sizes)
            largest_region_ratio = (max_region / total_pixels) * 100
            smallest_paintable = sum(1 for s in region_sizes if s >= min_region_size)
            speckle_count = sum(1 for s in region_sizes if s < min_region_size / 2)
        else:
            min_region = max_region = avg_region = median_region = 0
            largest_region_ratio = 0
            smallest_paintable = 0
            speckle_count = 0

        # Edge metrics
        if edge_mask is not None:
            edge_pixel_count = int(np.sum(edge_mask > 0))
            edge_pixel_percentage = (edge_pixel_count / total_pixels) * 100
        else:
            edge_pixel_count = 0
            edge_pixel_percentage = 0.0

        # Detail level classification
        if edge_pixel_percentage < 10:
            detail_level = 'low'
        elif edge_pixel_percentage < 20:
            detail_level = 'medium'
        elif edge_pixel_percentage < 35:
            detail_level = 'high'
        else:
            detail_level = 'ultra'

        # Background/foreground estimation (largest region is often background)
        if region_sizes:
            background_percentage = largest_region_ratio
            foreground_percentage = 100 - background_percentage
        else:
            background_percentage = 0
            foreground_percentage = 100

        # Quality scores
        color_balance_score = DiagnosticsCalculator._calculate_color_balance_score(
            palette_coverage, len(palette)
        )
        region_distribution_score = DiagnosticsCalculator._calculate_region_score(
            region_sizes, min_region_size
        )

        # Palette entropy (color diversity)
        palette_entropy = DiagnosticsCalculator._calculate_entropy(palette_coverage)

        # Overall quality (weighted average)
        overall_quality_score = (
            color_balance_score * 0.4 +
            region_distribution_score * 0.4 +
            (100 - background_percentage) * 0.2  # Prefer less dominant background
        )

        return ProcessingDiagnostics(
            original_width=orig_w,
            original_height=orig_h,
            processed_width=proc_w,
            processed_height=proc_h,
            total_pixels=total_pixels,
            palette_size=len(palette),
            colors_used=colors_used,
            colors_unused=colors_unused,
            total_regions=total_regions,
            min_region_size=int(min_region),
            max_region_size=int(max_region),
            avg_region_size=float(avg_region),
            median_region_size=float(median_region),
            edge_pixel_count=edge_pixel_count,
            edge_pixel_percentage=float(edge_pixel_percentage),
            detail_level=detail_level,
            palette_coverage=palette_coverage,
            background_percentage=float(background_percentage),
            foreground_percentage=float(foreground_percentage),
            color_balance_score=float(color_balance_score),
            region_distribution_score=float(region_distribution_score),
            overall_quality_score=float(overall_quality_score),
            processing_time_seconds=float(processing_time),
            model_used=model_name,
            style_applied=style_name,
            palette_entropy=float(palette_entropy),
            speckle_count=speckle_count,
            largest_region_ratio=float(largest_region_ratio),
            smallest_paintable_regions=smallest_paintable
        )

    @staticmethod
    def _calculate_color_balance_score(palette_coverage: Dict[int, float], palette_size: int) -> float:
        """
        Calculate how well colors are balanced.
        100 = perfect balance, 0 = very imbalanced
        """
        if not palette_coverage:
            return 0.0

        percentages = list(palette_coverage.values())
        ideal_percentage = 100.0 / palette_size

        # Calculate deviation from ideal
        deviations = [abs(p - ideal_percentage) for p in percentages]
        avg_deviation = np.mean(deviations)

        # Convert to score (0 deviation = 100, high deviation = 0)
        score = max(0, 100 - (avg_deviation * 2))
        return score

    @staticmethod
    def _calculate_region_score(region_sizes: list, min_region_size: int) -> float:
        """
        Calculate region distribution quality.
        100 = good distribution, 0 = poor
        """
        if not region_sizes:
            return 0.0

        # Prefer: most regions above min size, not too many tiny regions
        paintable_ratio = sum(1 for s in region_sizes if s >= min_region_size) / len(region_sizes)
        speckle_ratio = sum(1 for s in region_sizes if s < min_region_size / 2) / len(region_sizes)

        score = (paintable_ratio * 100) - (speckle_ratio * 50)
        return max(0, min(100, score))

    @staticmethod
    def _calculate_entropy(palette_coverage: Dict[int, float]) -> float:
        """Calculate Shannon entropy of palette distribution"""
        if not palette_coverage:
            return 0.0

        percentages = np.array(list(palette_coverage.values())) / 100.0
        # Avoid log(0)
        percentages = percentages[percentages > 0]

        entropy = -np.sum(percentages * np.log2(percentages))
        return entropy
