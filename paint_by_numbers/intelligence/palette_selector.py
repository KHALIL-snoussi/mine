"""
Intelligent Palette Selector
Analyzes images and recommends optimal color palettes
"""

import numpy as np
import cv2
from typing import Tuple, List, Optional
from collections import Counter

try:
    from paint_by_numbers.logger import logger
    from paint_by_numbers.palettes import PaletteManager
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from logger import logger
    from palettes import PaletteManager


class IntelligentPaletteSelector:
    """Analyzes images and recommends optimal color palettes"""

    def __init__(self):
        self.palette_manager = PaletteManager()

    def analyze_image(self, image: np.ndarray) -> dict:
        """
        Analyze image characteristics

        Args:
            image: Input image in RGB format

        Returns:
            Dictionary with image analysis
        """
        # Convert to different color spaces for analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)

        # Sample pixels for analysis
        h, w = image.shape[:2]
        sample_size = min(10000, h * w)
        indices = np.random.choice(h * w, sample_size, replace=False)

        pixels_rgb = image.reshape(-1, 3)[indices]
        pixels_hsv = hsv.reshape(-1, 3)[indices]
        pixels_lab = lab.reshape(-1, 3)[indices]

        # Analyze characteristics
        analysis = {
            # Brightness analysis
            'brightness': {
                'mean': float(np.mean(pixels_rgb)),
                'std': float(np.std(pixels_rgb)),
                'is_dark': np.mean(pixels_rgb) < 100,
                'is_light': np.mean(pixels_rgb) > 180,
            },

            # Color saturation
            'saturation': {
                'mean': float(np.mean(pixels_hsv[:, 1])),
                'std': float(np.std(pixels_hsv[:, 1])),
                'is_vibrant': np.mean(pixels_hsv[:, 1]) > 100,
                'is_muted': np.mean(pixels_hsv[:, 1]) < 50,
            },

            # Color diversity
            'diversity': {
                'hue_range': float(np.ptp(pixels_hsv[:, 0])),
                'is_monochrome': np.ptp(pixels_hsv[:, 0]) < 30,
                'is_diverse': np.ptp(pixels_hsv[:, 0]) > 150,
            },

            # Dominant hues
            'dominant_hues': self._analyze_dominant_hues(pixels_hsv[:, 0]),

            # Color temperature
            'temperature': self._analyze_temperature(pixels_rgb),

            # Overall theme
            'theme': None  # Will be determined
        }

        # Determine theme
        analysis['theme'] = self._determine_theme(analysis)

        return analysis

    def _analyze_dominant_hues(self, hues: np.ndarray) -> dict:
        """Analyze dominant hue ranges"""
        # Hue ranges: Red(0-30,150-180), Yellow(30-60), Green(60-120), Blue(120-150)
        hue_categories = {
            'red': np.sum((hues < 30) | (hues > 150)) / len(hues),
            'yellow': np.sum((hues >= 30) & (hues < 60)) / len(hues),
            'green': np.sum((hues >= 60) & (hues < 120)) / len(hues),
            'blue': np.sum((hues >= 120) & (hues < 150)) / len(hues),
        }

        dominant = max(hue_categories.items(), key=lambda x: x[1])

        return {
            'categories': hue_categories,
            'dominant_color': dominant[0],
            'dominant_percentage': float(dominant[1]),
        }

    def _analyze_temperature(self, pixels_rgb: np.ndarray) -> dict:
        """Analyze color temperature (warm vs cool)"""
        # Calculate warm (red/yellow) vs cool (blue/green)
        warm_score = (pixels_rgb[:, 0] + pixels_rgb[:, 1] / 2) / 2
        cool_score = (pixels_rgb[:, 2] + pixels_rgb[:, 1] / 2) / 2

        avg_warm = float(np.mean(warm_score))
        avg_cool = float(np.mean(cool_score))

        return {
            'warm_score': avg_warm,
            'cool_score': avg_cool,
            'is_warm': avg_warm > avg_cool,
            'is_cool': avg_cool > avg_warm,
            'is_neutral': abs(avg_warm - avg_cool) < 20,
        }

    def _determine_theme(self, analysis: dict) -> str:
        """Determine overall image theme"""
        dominant_hue = analysis['dominant_hues']['dominant_color']
        is_vibrant = analysis['saturation']['is_vibrant']
        is_muted = analysis['saturation']['is_muted']
        is_light = analysis['brightness']['is_light']
        is_dark = analysis['brightness']['is_dark']

        # Nature themes
        if dominant_hue == 'green' and analysis['saturation']['mean'] > 60:
            return 'nature'

        # Sky/water themes
        if dominant_hue == 'blue' and not is_dark:
            return 'sky_water'

        # Sunset/warm themes
        if analysis['temperature']['is_warm'] and dominant_hue in ['red', 'yellow']:
            return 'warm_sunset'

        # Pastel/soft themes
        if is_light and is_muted:
            return 'pastel'

        # Vibrant/bold themes
        if is_vibrant and not is_dark:
            return 'vibrant'

        # Earth tones
        if dominant_hue in ['red', 'yellow'] and is_muted:
            return 'earth'

        # Dark/moody
        if is_dark:
            return 'dark'

        return 'general'

    def recommend_palette(self, image: np.ndarray, num_colors: Optional[int] = None) -> Tuple[str, dict]:
        """
        Recommend best palette for image

        Args:
            image: Input image in RGB
            num_colors: Preferred number of colors (optional)

        Returns:
            Tuple of (palette_name, analysis)
        """
        analysis = self.analyze_image(image)
        theme = analysis['theme']

        logger.info(f"Image Analysis: Theme detected as '{theme}'")
        logger.info(f"  Dominant color: {analysis['dominant_hues']['dominant_color']}")
        logger.info(f"  Saturation: {'vibrant' if analysis['saturation']['is_vibrant'] else 'muted'}")
        logger.info(f"  Temperature: {'warm' if analysis['temperature']['is_warm'] else 'cool'}")

        # Theme-based recommendations
        theme_palettes = {
            'nature': ['nature_15', 'earth_tones_12', 'classic_18'],
            'sky_water': ['classic_18', 'vibrant_18', 'classic_24'],
            'warm_sunset': ['vibrant_18', 'classic_18', 'classic_24'],
            'pastel': ['pastel_12', 'classic_18', 'classic_12'],
            'vibrant': ['vibrant_18', 'classic_24', 'classic_18'],
            'earth': ['earth_tones_12', 'nature_15', 'classic_18'],
            'dark': ['classic_24', 'classic_18', 'earth_tones_12'],
            'general': ['classic_18', 'classic_24', 'classic_12'],
        }

        recommended_palettes = theme_palettes.get(theme, ['classic_18'])

        # If num_colors specified, try to match
        if num_colors:
            best_match = None
            min_diff = float('inf')

            for palette_name in recommended_palettes:
                palette_info = self.palette_manager.get_palette_info(palette_name)
                diff = abs(palette_info['num_colors'] - num_colors)
                if diff < min_diff:
                    min_diff = diff
                    best_match = palette_name

            selected = best_match
        else:
            selected = recommended_palettes[0]

        logger.info(f"Recommended palette: '{selected}' (theme: {theme})")

        return selected, analysis

    def get_palette_compatibility_score(self, image: np.ndarray, palette_name: str) -> float:
        """
        Score how well a palette matches an image

        Args:
            image: Input image
            palette_name: Name of palette to score

        Returns:
            Compatibility score (0-100)
        """
        analysis = self.analyze_image(image)
        palette = self.palette_manager.get_palette(palette_name)

        # Sample image colors
        h, w = image.shape[:2]
        sample_size = min(5000, h * w)
        indices = np.random.choice(h * w, sample_size, replace=False)
        image_pixels = image.reshape(-1, 3)[indices].astype(np.float32)

        # Calculate average distance to nearest palette color
        palette_float = palette.astype(np.float32)
        distances = np.sqrt(((image_pixels[:, np.newaxis] - palette_float) ** 2).sum(axis=2))
        min_distances = np.min(distances, axis=1)
        avg_distance = np.mean(min_distances)

        # Convert distance to score (lower distance = higher score)
        # Max distance in RGB space is ~442 (sqrt(255^2 * 3))
        distance_score = max(0, 100 - (avg_distance / 442 * 100))

        # Bonus for theme match
        theme = analysis['theme']
        theme_bonus = 0

        palette_themes = {
            'nature_15': ['nature', 'earth'],
            'earth_tones_12': ['earth', 'nature', 'dark'],
            'pastel_12': ['pastel', 'general'],
            'vibrant_18': ['vibrant', 'warm_sunset'],
            'classic_18': ['general', 'sky_water'],
            'classic_24': ['general', 'vibrant', 'dark'],
            'classic_12': ['general', 'pastel'],
        }

        if theme in palette_themes.get(palette_name, []):
            theme_bonus = 20

        final_score = min(100, distance_score + theme_bonus)

        return float(final_score)

    def compare_palettes(self, image: np.ndarray) -> List[Tuple[str, float]]:
        """
        Compare all available palettes and rank them

        Args:
            image: Input image

        Returns:
            List of (palette_name, score) tuples, sorted by score
        """
        palettes = self.palette_manager.list_palettes()
        scores = []

        for palette_name in palettes:
            score = self.get_palette_compatibility_score(image, palette_name)
            scores.append((palette_name, score))

        # Sort by score descending
        scores.sort(key=lambda x: x[1], reverse=True)

        return scores
