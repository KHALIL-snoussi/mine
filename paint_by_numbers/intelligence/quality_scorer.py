"""
Quality Scorer - Evaluates the quality of paint-by-numbers templates
"""

import numpy as np
from typing import Dict, List

try:
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    from ..utils.opencv import require_cv2

try:
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from logger import logger


class QualityScorer:
    """Evaluates template quality and paintability"""

    def __init__(self):
        pass

    def score_template(self, original_image: np.ndarray,
                      quantized_image: np.ndarray,
                      regions: List[dict],
                      palette: np.ndarray) -> Dict:
        """
        Score template quality

        Args:
            original_image: Original input image
            quantized_image: Color-quantized image
            regions: List of regions
            palette: Color palette

        Returns:
            Dictionary with quality scores and metrics
        """
        scores = {}

        # 1. Color accuracy (how well does quantized match original?)
        scores['color_accuracy'] = self._score_color_accuracy(
            original_image, quantized_image
        )

        # 2. Region quality (are regions well-defined?)
        scores['region_quality'] = self._score_region_quality(regions)

        # 3. Number visibility (can numbers be read easily?)
        scores['number_visibility'] = self._score_number_visibility(regions)

        # 4. Color distribution (are colors well distributed?)
        scores['color_distribution'] = self._score_color_distribution(
            regions, palette
        )

        # 5. Edge clarity (are boundaries clear?)
        scores['edge_clarity'] = self._score_edge_clarity(quantized_image)

        # 6. Paintability (is it practical to paint?)
        scores['paintability'] = self._score_paintability(regions)

        # Calculate overall quality
        weights = {
            'color_accuracy': 0.25,
            'region_quality': 0.20,
            'number_visibility': 0.15,
            'color_distribution': 0.15,
            'edge_clarity': 0.10,
            'paintability': 0.15,
        }

        overall_score = sum(scores[k] * weights[k] for k in scores.keys())

        # Determine quality grade
        if overall_score >= 90:
            grade = "Excellent"
            emoji = "⭐⭐⭐⭐⭐"
        elif overall_score >= 80:
            grade = "Very Good"
            emoji = "⭐⭐⭐⭐"
        elif overall_score >= 70:
            grade = "Good"
            emoji = "⭐⭐⭐"
        elif overall_score >= 60:
            grade = "Fair"
            emoji = "⭐⭐"
        else:
            grade = "Needs Improvement"
            emoji = "⭐"

        result = {
            'overall_quality': round(overall_score, 1),
            'quality_grade': grade,
            'quality_emoji': emoji,
            'scores': {k: round(v, 1) for k, v in scores.items()},
            'improvements': self._suggest_improvements(scores),
        }

        # Log quality
        logger.info(f"\n{'='*60}")
        logger.info(f"QUALITY ANALYSIS")
        logger.info(f"{'='*60}")
        logger.info(f"Overall Quality: {emoji} {grade} ({overall_score:.1f}/100)")
        logger.info(f"\nDetailed Scores:")
        for metric, score in scores.items():
            logger.info(f"  {metric.replace('_', ' ').title()}: {score:.1f}/100")
        logger.info(f"{'='*60}\n")

        return result

    def _score_color_accuracy(self, original: np.ndarray, quantized: np.ndarray) -> float:
        """Score how accurately quantized image represents original"""
        # Resize original to match quantized if needed
        if original.shape != quantized.shape:
            cv2 = require_cv2()
            original = cv2.resize(original, (quantized.shape[1], quantized.shape[0]))

        # Calculate PSNR (Peak Signal-to-Noise Ratio)
        mse = np.mean((original.astype(float) - quantized.astype(float)) ** 2)

        if mse == 0:
            return 100.0

        max_pixel = 255.0
        psnr = 20 * np.log10(max_pixel / np.sqrt(mse))

        # Convert PSNR to 0-100 score
        # PSNR typically ranges from 20-50 for images
        # Higher PSNR = better quality
        score = min(100, max(0, (psnr - 20) / 30 * 100))

        return score

    def _score_region_quality(self, regions: List[dict]) -> float:
        """Score region definition quality"""
        if not regions:
            return 0.0

        # Check region size distribution
        areas = [r.area for r in regions]
        avg_area = np.mean(areas)
        std_area = np.std(areas)

        # Good templates have consistent region sizes
        # CV (coefficient of variation) < 1.0 is good
        cv = std_area / avg_area if avg_area > 0 else 0
        consistency_score = max(0, 100 - (cv * 50))

        # Check for very small regions (< 50 pixels)
        tiny_regions = sum(1 for a in areas if a < 50)
        tiny_ratio = tiny_regions / len(regions)
        size_score = max(0, 100 - (tiny_ratio * 200))

        # Combined score
        return (consistency_score * 0.6 + size_score * 0.4)

    def _score_number_visibility(self, regions: List) -> float:
        """Score how visible numbers will be in regions"""
        if not regions:
            return 0.0

        # Regions need to be large enough for numbers
        min_size_for_number = 100  # pixels
        visible_regions = sum(1 for r in regions if r.area >= min_size_for_number)
        visibility_ratio = visible_regions / len(regions)

        # Simple scoring based on area
        aspect_ratio = 0.8  # Default assumption

        return (visibility_ratio * 70 + aspect_ratio * 30)

    def _score_color_distribution(self, regions: List, palette: np.ndarray) -> float:
        """Score how well colors are distributed"""
        if not regions or len(palette) == 0:
            return 0.0

        # Count regions per color
        color_usage = {}
        for region in regions:
            color_idx = region.color_idx
            color_usage[color_idx] = color_usage.get(color_idx, 0) + 1

        # Good distribution means all colors are used
        colors_used = len(color_usage)
        colors_available = len(palette)
        usage_ratio = colors_used / colors_available

        # Check for balanced usage (no color dominates too much)
        usage_values = list(color_usage.values())
        avg_usage = np.mean(usage_values)
        std_usage = np.std(usage_values)
        cv_usage = std_usage / avg_usage if avg_usage > 0 else 0

        balance_score = max(0, 100 - (cv_usage * 30))

        return (usage_ratio * 50 + balance_score * 50)

    def _score_edge_clarity(self, quantized_image: np.ndarray) -> float:
        """Score how clear edges are between regions"""
        # Convert to grayscale
        cv2 = require_cv2()
        gray = cv2.cvtColor(quantized_image, cv2.COLOR_RGB2GRAY)

        # Detect edges
        edges = cv2.Canny(gray, 50, 150)

        # Calculate edge density
        edge_density = np.sum(edges > 0) / edges.size

        # Good templates have clear but not excessive edges
        # Optimal edge density is around 0.05-0.15
        if 0.05 <= edge_density <= 0.15:
            score = 100
        elif edge_density < 0.05:
            score = edge_density / 0.05 * 100
        else:
            score = max(0, 100 - ((edge_density - 0.15) / 0.15 * 100))

        return score

    def _score_paintability(self, regions: List[dict]) -> float:
        """Score how practical it is to actually paint this template"""
        if not regions:
            return 0.0

        total_score = 0
        num_factors = 0

        # Factor 1: Not too many tiny regions
        tiny_regions = sum(1 for r in regions if r.area < 100)
        tiny_ratio = tiny_regions / len(regions)
        tiny_score = max(0, 100 - (tiny_ratio * 150))
        total_score += tiny_score
        num_factors += 1

        # Factor 2: Not too many total regions (overwhelming)
        region_count_score = 100
        if len(regions) > 150:
            region_count_score = max(0, 100 - ((len(regions) - 150) / 100 * 50))
        total_score += region_count_score
        num_factors += 1

        # Factor 3: Regions are compact (not too irregular) - using contour attribute
        compactness_scores = []
        cv2 = require_cv2()
        for region in regions:
            if hasattr(region, 'contour') and region.contour is not None:
                contour = region.contour
                if len(contour) >= 5:
                    area = cv2.contourArea(contour)
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        # Compactness = 4π × area / perimeter²
                        # Circle = 1.0, more irregular = lower
                        compactness = (4 * np.pi * area) / (perimeter ** 2)
                        compactness_scores.append(min(1.0, compactness))

        if compactness_scores:
            avg_compactness = np.mean(compactness_scores)
            compactness_score = avg_compactness * 100
            total_score += compactness_score
            num_factors += 1

        return total_score / num_factors if num_factors > 0 else 50.0

    def _suggest_improvements(self, scores: dict) -> List[str]:
        """Suggest improvements based on scores"""
        suggestions = []

        if scores['color_accuracy'] < 70:
            suggestions.append("Consider using more colors for better color accuracy")

        if scores['region_quality'] < 70:
            suggestions.append("Try increasing MIN_REGION_SIZE to get more consistent regions")

        if scores['number_visibility'] < 70:
            suggestions.append("Increase MIN_REGION_SIZE to make numbers more visible")

        if scores['color_distribution'] < 70:
            suggestions.append("Some colors may be underused - consider fewer total colors")

        if scores['edge_clarity'] < 70:
            suggestions.append("Try enabling bilateral filtering for clearer edges")

        if scores['paintability'] < 70:
            suggestions.append("Template may be too complex - try reducing number of colors")
            suggestions.append("Increase MIN_REGION_SIZE for easier painting")

        if not suggestions:
            suggestions.append("Template quality is excellent! Ready to paint!")

        return suggestions
