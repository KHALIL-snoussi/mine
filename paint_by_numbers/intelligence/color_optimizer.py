"""
Color Optimizer - Optimizes color mapping for best visual results
"""

import numpy as np
from typing import Tuple, Optional, List
from scipy.spatial import distance

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


class ColorOptimizer:
    """Optimizes color selection and mapping for superior results"""

    def __init__(self):
        pass

    def optimize_palette_mapping(self, image: np.ndarray, palette: np.ndarray,
                                 perceptual: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """
        Optimize mapping of image colors to palette using perceptual color space

        Args:
            image: Input image in RGB
            palette: Color palette in RGB
            perceptual: Use perceptual LAB color space (more accurate)

        Returns:
            Tuple of (optimized_image, label_map)
        """
        logger.info("Optimizing color mapping...")

        if perceptual:
            cv2 = require_cv2()
            # Convert to LAB color space for perceptual accuracy
            image_lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB).astype(np.float32)
            palette_lab = cv2.cvtColor(
                palette.reshape(1, -1, 3), cv2.COLOR_RGB2LAB
            ).reshape(-1, 3).astype(np.float32)

            h, w = image.shape[:2]
            pixels_lab = image_lab.reshape(-1, 3)

            # Find nearest palette color in LAB space (perceptually accurate)
            distances = distance.cdist(pixels_lab, palette_lab, metric='euclidean')
            labels = np.argmin(distances, axis=1)

        else:
            # Standard RGB mapping
            h, w = image.shape[:2]
            pixels = image.reshape(-1, 3).astype(np.float32)
            palette_float = palette.astype(np.float32)

            distances = distance.cdist(pixels, palette_float, metric='euclidean')
            labels = np.argmin(distances, axis=1)

        # Create optimized image
        optimized_image = palette[labels].reshape(h, w, 3)
        label_map = labels.reshape(h, w)

        # Calculate improvement
        original_error = self._calculate_mapping_error(image, image, palette)
        optimized_error = self._calculate_mapping_error(image, optimized_image, palette)
        improvement = ((original_error - optimized_error) / original_error * 100) if original_error > 0 else 0

        logger.info(f"Color mapping optimized (improvement: {improvement:.1f}%)")

        return optimized_image, label_map

    def _calculate_mapping_error(self, original: np.ndarray, mapped: np.ndarray,
                                 palette: np.ndarray) -> float:
        """Calculate average color mapping error"""
        diff = original.astype(float) - mapped.astype(float)
        mse = np.mean(diff ** 2)
        return float(mse)

    def enhance_color_distinction(self, palette: np.ndarray,
                                  min_distance: float = 30.0) -> Tuple[np.ndarray, bool]:
        """
        Enhance color distinction by adjusting similar colors

        Args:
            palette: Color palette
            min_distance: Minimum distance between colors

        Returns:
            Tuple of (enhanced_palette, was_modified)
        """
        enhanced = palette.copy().astype(np.float32)
        modified = False

        n_colors = len(palette)

        for i in range(n_colors):
            for j in range(i + 1, n_colors):
                color1 = enhanced[i]
                color2 = enhanced[j]

                # Calculate distance
                dist = np.linalg.norm(color1 - color2)

                # If colors are too similar, push them apart
                if dist < min_distance and dist > 0:
                    # Calculate push direction
                    direction = (color2 - color1) / dist

                    # Push apart
                    push_amount = (min_distance - dist) / 2
                    enhanced[i] = color1 - direction * push_amount
                    enhanced[j] = color2 + direction * push_amount

                    modified = True

        # Clamp to valid range
        enhanced = np.clip(enhanced, 0, 255).astype(np.uint8)

        if modified:
            logger.info("Enhanced color distinction in palette")

        return enhanced, modified

    def generate_color_mixing_guide(self, palette: np.ndarray,
                                    color_names: List[str]) -> dict:
        """
        Generate guide for mixing colors from basic paints

        Args:
            palette: Color palette
            color_names: Names of colors

        Returns:
            Dictionary with mixing instructions
        """
        # Base paint colors
        base_paints = {
            'White': np.array([255, 255, 255]),
            'Black': np.array([0, 0, 0]),
            'Red': np.array([255, 0, 0]),
            'Blue': np.array([0, 0, 255]),
            'Yellow': np.array([255, 255, 0]),
            'Green': np.array([0, 255, 0]),
        }

        mixing_guide = {}

        for idx, (color, name) in enumerate(zip(palette, color_names)):
            # Find best mix to create this color
            mixing_guide[idx + 1] = {
                'color_name': name,
                'rgb': tuple(color.tolist()),
                'hex': f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}",
                'mixing_recipe': self._find_mixing_recipe(color, base_paints),
                'alternative': self._find_closest_common_color(color),
            }

        return mixing_guide

    def _find_mixing_recipe(self, target_color: np.ndarray, base_paints: dict) -> str:
        """Find mixing recipe for a color"""
        # Simple heuristic-based mixing
        r, g, b = target_color

        # Check if it's close to a base color
        for name, base in base_paints.items():
            if np.linalg.norm(target_color.astype(float) - base.astype(float)) < 30:
                return f"Pure {name}"

        # Analyze color components
        total = r + g + b
        if total == 0:
            return "Pure Black"

        brightness = total / 3

        # Determine base mix
        recipe_parts = []

        # Add white/black for brightness
        if brightness > 200:
            recipe_parts.append("Start with White")
        elif brightness < 50:
            recipe_parts.append("Start with Black")

        # Add primary colors
        if r > 150 and g < 100 and b < 100:
            recipe_parts.append("add Red")
        elif b > 150 and r < 100 and g < 100:
            recipe_parts.append("add Blue")
        elif g > 150 and r < 100 and b < 100:
            recipe_parts.append("add Green")
        elif r > 100 and g > 100 and b < 100:
            recipe_parts.append("mix Yellow")
        elif r > 100 and b > 100 and g < 100:
            recipe_parts.append("mix Purple (Red + Blue)")
        elif g > 100 and b > 100 and r < 100:
            recipe_parts.append("mix Cyan (Blue + Green)")

        # Adjust for tints/shades
        if brightness > 180:
            recipe_parts.append("+ White (tint)")
        elif brightness < 80:
            recipe_parts.append("+ Black (shade)")

        return ", ".join(recipe_parts) if recipe_parts else "Mix to match RGB values"

    def _find_closest_common_color(self, color: np.ndarray) -> str:
        """Find closest common color name"""
        common_colors = {
            'White': np.array([255, 255, 255]),
            'Black': np.array([0, 0, 0]),
            'Red': np.array([255, 0, 0]),
            'Dark Red': np.array([139, 0, 0]),
            'Blue': np.array([0, 0, 255]),
            'Navy': np.array([0, 0, 128]),
            'Sky Blue': np.array([135, 206, 235]),
            'Yellow': np.array([255, 255, 0]),
            'Green': np.array([0, 255, 0]),
            'Dark Green': np.array([0, 100, 0]),
            'Orange': np.array([255, 165, 0]),
            'Purple': np.array([128, 0, 128]),
            'Pink': np.array([255, 192, 203]),
            'Brown': np.array([165, 42, 42]),
            'Gray': np.array([128, 128, 128]),
            'Tan': np.array([210, 180, 140]),
        }

        min_dist = float('inf')
        closest = 'Custom Color'

        for name, common_color in common_colors.items():
            dist = np.linalg.norm(color.astype(float) - common_color.astype(float))
            if dist < min_dist:
                min_dist = dist
                closest = name

        if min_dist > 80:
            return f"Similar to {closest}"
        else:
            return closest

    def analyze_color_harmony(self, palette: np.ndarray) -> dict:
        """
        Analyze color harmony in palette

        Args:
            palette: Color palette

        Returns:
            Dictionary with harmony analysis
        """
        # Convert to HSV for harmony analysis
        cv2 = require_cv2()
        palette_hsv = cv2.cvtColor(
            palette.reshape(1, -1, 3), cv2.COLOR_RGB2HSV
        ).reshape(-1, 3)

        hues = palette_hsv[:, 0]
        saturations = palette_hsv[:, 1]
        values = palette_hsv[:, 2]

        # Analyze hue relationships
        harmony_type = self._detect_harmony_type(hues)

        # Calculate harmony score
        harmony_score = self._calculate_harmony_score(hues, saturations, values)

        return {
            'harmony_type': harmony_type,
            'harmony_score': round(harmony_score, 1),
            'hue_diversity': round(float(np.std(hues)), 1),
            'saturation_consistency': round(100 - float(np.std(saturations)), 1),
            'brightness_balance': round(100 - float(np.std(values)), 1),
        }

    def _detect_harmony_type(self, hues: np.ndarray) -> str:
        """Detect color harmony type"""
        if len(hues) < 2:
            return "monochrome"

        hue_range = np.ptp(hues)

        if hue_range < 30:
            return "monochrome"
        elif hue_range < 60:
            return "analogous"
        elif 120 <= hue_range <= 180:
            return "complementary"
        elif hue_range > 150:
            return "triadic"
        else:
            return "mixed"

    def _calculate_harmony_score(self, hues: np.ndarray, sats: np.ndarray,
                                 vals: np.ndarray) -> float:
        """Calculate overall color harmony score"""
        # Good harmony has:
        # - Diverse but related hues
        # - Consistent saturation
        # - Balanced brightness

        hue_diversity = min(100, np.std(hues) / 60 * 100)
        sat_consistency = max(0, 100 - np.std(sats) / 2.55)
        val_balance = max(0, 100 - np.std(vals) / 2.55)

        # Weighted score
        score = (hue_diversity * 0.3 + sat_consistency * 0.35 + val_balance * 0.35)

        return score
