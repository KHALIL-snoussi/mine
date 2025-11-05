"""
Difficulty Analyzer - Rates the difficulty of paint-by-numbers templates
"""

import numpy as np
from typing import Dict, List

try:
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from logger import logger


class DifficultyAnalyzer:
    """Analyzes and rates the difficulty of paint-by-numbers templates"""

    def __init__(self):
        pass

    def analyze_difficulty(self, regions: List[dict], palette: np.ndarray,
                          image_shape: tuple) -> Dict:
        """
        Analyze template difficulty

        Args:
            regions: List of region dictionaries
            palette: Color palette
            image_shape: Shape of the image (height, width)

        Returns:
            Dictionary with difficulty analysis
        """
        if not regions:
            return self._default_analysis()

        # Calculate various difficulty factors
        region_count = len(regions)
        color_count = len(palette)

        # Region size statistics
        region_areas = [r.area for r in regions]
        avg_region_size = np.mean(region_areas)
        min_region_size = np.min(region_areas)
        std_region_size = np.std(region_areas)

        # Small region penalty (harder to paint)
        small_region_count = sum(1 for area in region_areas if area < 200)
        small_region_ratio = small_region_count / region_count

        # Color similarity (similar colors are harder to distinguish)
        color_similarity = self._calculate_color_similarity(palette)

        # Region density (regions per area)
        total_pixels = image_shape[0] * image_shape[1]
        region_density = region_count / (total_pixels / 10000)  # regions per 10k pixels

        # Calculate difficulty scores (0-100)
        scores = {
            'region_complexity': self._score_region_complexity(
                region_count, avg_region_size, std_region_size
            ),
            'small_region_difficulty': self._score_small_regions(small_region_ratio),
            'color_count_difficulty': self._score_color_count(color_count),
            'color_similarity_difficulty': color_similarity,
            'density_difficulty': self._score_density(region_density),
        }

        # Weighted overall difficulty
        weights = {
            'region_complexity': 0.25,
            'small_region_difficulty': 0.30,
            'color_count_difficulty': 0.15,
            'color_similarity_difficulty': 0.20,
            'density_difficulty': 0.10,
        }

        overall_score = sum(scores[k] * weights[k] for k in scores.keys())

        # Determine difficulty level
        if overall_score < 25:
            level = "Very Easy"
            emoji = "🟢"
        elif overall_score < 40:
            level = "Easy"
            emoji = "🟢"
        elif overall_score < 55:
            level = "Medium"
            emoji = "🟡"
        elif overall_score < 70:
            level = "Hard"
            emoji = "🟠"
        elif overall_score < 85:
            level = "Very Hard"
            emoji = "🔴"
        else:
            level = "Expert"
            emoji = "🔴"

        # Estimated time
        time_estimate = self._estimate_time(region_count, avg_region_size, overall_score)

        analysis = {
            'overall_difficulty': round(overall_score, 1),
            'difficulty_level': level,
            'difficulty_emoji': emoji,
            'scores': {k: round(v, 1) for k, v in scores.items()},
            'statistics': {
                'total_regions': region_count,
                'total_colors': color_count,
                'avg_region_size': round(avg_region_size, 1),
                'min_region_size': int(min_region_size),
                'small_regions': small_region_count,
                'small_region_percentage': round(small_region_ratio * 100, 1),
            },
            'time_estimate': time_estimate,
            'recommendations': self._generate_recommendations(overall_score, scores),
        }

        # Log analysis
        logger.info(f"\n{'='*60}")
        logger.info(f"DIFFICULTY ANALYSIS")
        logger.info(f"{'='*60}")
        logger.info(f"Overall Difficulty: {emoji} {level} ({overall_score:.1f}/100)")
        logger.info(f"Estimated Time: {time_estimate}")
        logger.info(f"Total Regions: {region_count}")
        logger.info(f"Total Colors: {color_count}")
        logger.info(f"Small Regions: {small_region_count} ({small_region_ratio*100:.1f}%)")
        logger.info(f"{'='*60}\n")

        return analysis

    def _calculate_color_similarity(self, palette: np.ndarray) -> float:
        """Calculate average color similarity in palette (0-100)"""
        if len(palette) < 2:
            return 0.0

        n_colors = len(palette)
        similarities = []

        for i in range(n_colors):
            for j in range(i + 1, n_colors):
                color1 = palette[i].astype(float)
                color2 = palette[j].astype(float)

                # Euclidean distance in RGB space
                distance = np.linalg.norm(color1 - color2)

                # Convert to similarity score (closer = more similar = harder)
                # Max distance is ~442, very similar colors have distance < 50
                similarity = max(0, 100 - (distance / 50 * 100))
                similarities.append(max(0, similarity))

        avg_similarity = np.mean(similarities)
        return min(100, avg_similarity)

    def _score_region_complexity(self, count: int, avg_size: float, std_size: float) -> float:
        """Score region complexity (0-100)"""
        # More regions = harder
        count_score = min(100, (count / 100) * 100)

        # Smaller average size = harder
        size_score = max(0, 100 - (avg_size / 1000 * 100))

        # High variance = harder (inconsistent sizes)
        variance_score = min(100, (std_size / 500) * 100)

        return (count_score * 0.4 + size_score * 0.4 + variance_score * 0.2)

    def _score_small_regions(self, ratio: float) -> float:
        """Score difficulty based on small regions (0-100)"""
        # More small regions = harder
        return min(100, ratio * 150)

    def _score_color_count(self, count: int) -> float:
        """Score difficulty based on color count (0-100)"""
        # More colors = harder, but plateaus
        if count <= 8:
            return count / 8 * 30
        elif count <= 15:
            return 30 + ((count - 8) / 7 * 30)
        elif count <= 24:
            return 60 + ((count - 15) / 9 * 30)
        else:
            return 90 + min(10, (count - 24) / 6 * 10)

    def _score_density(self, density: float) -> float:
        """Score difficulty based on region density (0-100)"""
        # Higher density = more regions in same space = harder
        return min(100, density * 20)

    def _estimate_time(self, region_count: int, avg_size: float, difficulty: float) -> str:
        """Estimate completion time"""
        # Base time: ~2 minutes per region for average difficulty
        base_minutes = region_count * 2

        # Adjust for difficulty
        difficulty_multiplier = 0.5 + (difficulty / 100)

        # Adjust for region size
        size_multiplier = 1.0
        if avg_size < 200:
            size_multiplier = 1.5  # Small regions take longer
        elif avg_size > 1000:
            size_multiplier = 0.8  # Large regions are faster

        total_minutes = base_minutes * difficulty_multiplier * size_multiplier

        # Format time
        if total_minutes < 60:
            return f"{int(total_minutes)} minutes"
        elif total_minutes < 120:
            return f"1-2 hours"
        elif total_minutes < 240:
            return f"2-4 hours"
        elif total_minutes < 480:
            return f"4-8 hours"
        else:
            hours = int(total_minutes / 60)
            return f"{hours-2}-{hours+2} hours"

    def _generate_recommendations(self, overall_score: float, scores: dict) -> List[str]:
        """Generate recommendations based on difficulty"""
        recommendations = []

        if overall_score > 70:
            recommendations.append("This is an advanced template - take your time!")

        if scores['small_region_difficulty'] > 70:
            recommendations.append("Use fine-tipped brushes for small regions")
            recommendations.append("Consider using a magnifying glass for tiny areas")

        if scores['color_similarity_difficulty'] > 70:
            recommendations.append("Colors are very similar - paint in good lighting")
            recommendations.append("Use the reference guide to check color placement")

        if scores['color_count_difficulty'] > 70:
            recommendations.append("Organize your paints with numbered labels")
            recommendations.append("Work on one color at a time across the image")

        if scores['region_complexity'] > 60:
            recommendations.append("Start with larger regions to build confidence")

        if overall_score < 30:
            recommendations.append("Great for beginners!")
            recommendations.append("Perfect project to learn painting techniques")

        if not recommendations:
            recommendations.append("Follow the color guide and enjoy painting!")

        return recommendations

    def _default_analysis(self) -> Dict:
        """Return default analysis when no regions available"""
        return {
            'overall_difficulty': 0,
            'difficulty_level': "Unknown",
            'difficulty_emoji': "⚪",
            'scores': {},
            'statistics': {},
            'time_estimate': "Unknown",
            'recommendations': [],
        }

    def get_difficulty_badge(self, difficulty_score: float) -> str:
        """Get a badge/emoji for difficulty level"""
        if difficulty_score < 25:
            return "🟢 BEGINNER"
        elif difficulty_score < 40:
            return "🟢 EASY"
        elif difficulty_score < 55:
            return "🟡 MEDIUM"
        elif difficulty_score < 70:
            return "🟠 HARD"
        elif difficulty_score < 85:
            return "🔴 VERY HARD"
        else:
            return "🔴 EXPERT"
