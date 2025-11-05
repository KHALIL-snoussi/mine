"""
Kit Recommender - Analyzes uploaded images and recommends the best paint kit
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from collections import Counter

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.logger import logger
    from paint_by_numbers.paint_kits import PaintKitManager, PaintKit
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from logger import logger
    from paint_kits import PaintKitManager, PaintKit
    from utils.opencv import require_cv2


class KitRecommender:
    """Analyzes images and recommends the best paint kit for the user"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.paint_kit_manager = PaintKitManager()

    def analyze_image_for_kit(self, image_path: str) -> Dict:
        """
        Analyze uploaded image and recommend best paint kit

        Args:
            image_path: Path to the uploaded image

        Returns:
            Dictionary containing:
            - recommended_kit: Best matching PaintKit object
            - confidence: Match confidence (0-100)
            - reasoning: List of reasons for recommendation
            - all_kits_ranked: All kits sorted by match score
            - color_analysis: Detailed color analysis
        """
        cv2 = require_cv2()

        # Load and analyze image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Failed to load image: {image_path}")
            return self._default_recommendation()

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Perform analysis
        logger.info("Analyzing image for kit recommendation...")

        color_analysis = self._analyze_colors(image_rgb)
        subject_analysis = self._analyze_subject(image_rgb)
        complexity_analysis = self._analyze_complexity(image_rgb)

        # Score all kits
        all_kits_scored = self._score_all_kits(
            color_analysis,
            subject_analysis,
            complexity_analysis
        )

        # Get top recommendation
        best_kit_data = all_kits_scored[0]

        result = {
            'recommended_kit': best_kit_data['kit'],
            'confidence': best_kit_data['score'],
            'reasoning': best_kit_data['reasons'],
            'all_kits_ranked': all_kits_scored,
            'color_analysis': color_analysis,
            'subject_analysis': subject_analysis,
            'complexity_analysis': complexity_analysis
        }

        # Log recommendation
        logger.info(f"\n{'='*60}")
        logger.info(f"KIT RECOMMENDATION")
        logger.info(f"{'='*60}")
        logger.info(f"Recommended Kit: {best_kit_data['kit'].display_name}")
        logger.info(f"Confidence: {best_kit_data['score']:.1f}%")
        logger.info(f"Price: ${best_kit_data['kit'].price_usd}")
        logger.info(f"Colors: {best_kit_data['kit'].num_colors}")
        logger.info(f"\nReasons:")
        for reason in best_kit_data['reasons']:
            logger.info(f"  • {reason}")
        logger.info(f"{'='*60}\n")

        return result

    def _analyze_colors(self, image_rgb: np.ndarray) -> Dict:
        """Analyze color characteristics of the image"""
        # Downsample for faster processing
        small = image_rgb[::4, ::4]
        pixels = small.reshape(-1, 3)

        # Calculate dominant colors using k-means
        from sklearn.cluster import KMeans

        # Find optimal number of colors (8-24 range)
        n_colors = min(24, max(8, len(np.unique(pixels, axis=0)) // 100))

        kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
        kmeans.fit(pixels)

        dominant_colors = kmeans.cluster_centers_.astype(int)
        color_counts = Counter(kmeans.labels_)

        # Analyze color temperature
        avg_color = np.mean(pixels, axis=0)
        r, g, b = avg_color

        # Warm if more red/yellow, cool if more blue
        warmth = (r + g/2) - b
        is_warm = warmth > 20
        is_cool = warmth < -20

        # Analyze saturation
        hsv_pixels = self._rgb_to_hsv_batch(pixels)
        avg_saturation = np.mean(hsv_pixels[:, 1])
        is_vibrant = avg_saturation > 0.4
        is_pastel = avg_saturation < 0.3

        # Analyze brightness
        avg_brightness = np.mean(hsv_pixels[:, 2])
        is_bright = avg_brightness > 0.7
        is_dark = avg_brightness < 0.3

        # Detect if nature/landscape colors (greens, blues, browns)
        green_count = np.sum((pixels[:, 1] > pixels[:, 0]) & (pixels[:, 1] > pixels[:, 2]))
        blue_count = np.sum((pixels[:, 2] > pixels[:, 0]) & (pixels[:, 2] > pixels[:, 1]))
        brown_count = np.sum((pixels[:, 0] > 100) & (pixels[:, 1] > 50) & (pixels[:, 1] < 150) & (pixels[:, 2] < 100))

        nature_ratio = (green_count + blue_count + brown_count) / len(pixels)
        is_nature = nature_ratio > 0.3

        return {
            'n_colors': int(n_colors),
            'dominant_colors': dominant_colors.tolist(),
            'is_warm': bool(is_warm),
            'is_cool': bool(is_cool),
            'is_vibrant': bool(is_vibrant),
            'is_pastel': bool(is_pastel),
            'is_bright': bool(is_bright),
            'is_dark': bool(is_dark),
            'is_nature': bool(is_nature),
            'avg_saturation': float(avg_saturation),
            'avg_brightness': float(avg_brightness),
            'warmth_score': float(warmth)
        }

    def _analyze_subject(self, image_rgb: np.ndarray) -> Dict:
        """Analyze subject type and characteristics"""
        h, w = image_rgb.shape[:2]
        aspect_ratio = w / h

        # Simple heuristics for subject detection
        # In production, you'd use a proper classifier

        # Portrait detection: vertical orientation, skin tone detection
        skin_pixels = self._detect_skin_tones(image_rgb)
        skin_ratio = np.sum(skin_pixels) / (h * w)
        is_portrait = skin_ratio > 0.1 and aspect_ratio < 1.3

        # Pet detection: fur-like textures (browns, grays, whites)
        fur_pixels = self._detect_fur_colors(image_rgb)
        fur_ratio = np.sum(fur_pixels) / (h * w)
        is_pet = fur_ratio > 0.2 and not is_portrait

        # Landscape: horizontal orientation, sky/ground patterns
        is_landscape = aspect_ratio > 1.3

        # Abstract: high color variance, no clear subject
        color_variance = np.std(image_rgb)
        is_abstract = color_variance > 60 and not (is_portrait or is_pet or is_landscape)

        # Determine primary subject
        if is_portrait:
            subject_type = "portrait"
        elif is_pet:
            subject_type = "pet"
        elif is_landscape:
            subject_type = "landscape"
        elif is_abstract:
            subject_type = "abstract"
        else:
            subject_type = "general"

        return {
            'type': subject_type,
            'is_portrait': bool(is_portrait),
            'is_pet': bool(is_pet),
            'is_landscape': bool(is_landscape),
            'is_abstract': bool(is_abstract),
            'aspect_ratio': float(aspect_ratio),
            'skin_ratio': float(skin_ratio),
            'fur_ratio': float(fur_ratio)
        }

    def _analyze_complexity(self, image_rgb: np.ndarray) -> Dict:
        """Analyze image complexity"""
        cv2 = require_cv2()

        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)

        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        # Texture complexity
        texture_variance = np.std(gray)

        # Color complexity (already calculated in color analysis)
        unique_colors = len(np.unique(image_rgb.reshape(-1, 3), axis=0))
        color_diversity = min(100, unique_colors / 1000 * 100)

        # Overall complexity score
        complexity_score = (
            edge_density * 30 +
            (texture_variance / 100) * 40 +
            color_diversity * 30
        )

        if complexity_score < 25:
            complexity_level = "simple"
        elif complexity_score < 50:
            complexity_level = "moderate"
        elif complexity_score < 75:
            complexity_level = "detailed"
        else:
            complexity_level = "very_detailed"

        return {
            'complexity_score': float(complexity_score),
            'complexity_level': complexity_level,
            'edge_density': float(edge_density),
            'texture_variance': float(texture_variance),
            'unique_colors': int(unique_colors)
        }

    def _score_all_kits(self, color_analysis: Dict, subject_analysis: Dict,
                       complexity_analysis: Dict) -> List[Dict]:
        """Score all paint kits and return ranked list"""
        all_kits = self.paint_kit_manager.get_all_kits()
        scored_kits = []

        for kit in all_kits.values():
            score, reasons = self._score_kit(kit, color_analysis, subject_analysis, complexity_analysis)
            scored_kits.append({
                'kit': kit,
                'score': score,
                'reasons': reasons
            })

        # Sort by score descending
        scored_kits.sort(key=lambda x: x['score'], reverse=True)

        return scored_kits

    def _score_kit(self, kit: PaintKit, color_analysis: Dict,
                   subject_analysis: Dict, complexity_analysis: Dict) -> Tuple[float, List[str]]:
        """Score a specific kit against the image analysis"""
        score = 0.0
        reasons = []

        # 1. Color count matching (30 points)
        colors_needed = color_analysis['n_colors']
        colors_in_kit = kit.num_colors

        if colors_in_kit >= colors_needed:
            # Kit has enough colors
            color_match = 100 - abs(colors_in_kit - colors_needed) * 2
            score += (color_match / 100) * 30
            if color_match > 90:
                reasons.append(f"Perfect color match: {colors_in_kit} colors cover your image's {colors_needed} tones")
            elif color_match > 70:
                reasons.append(f"{colors_in_kit} colors provide good coverage for your image")
        else:
            # Kit doesn't have enough colors - penalty
            deficit = colors_needed - colors_in_kit
            penalty = min(30, deficit * 5)
            score += max(0, 30 - penalty)
            if deficit <= 3:
                reasons.append(f"Simplified palette ({colors_in_kit} colors) creates an artistic interpretation")

        # 2. Color style matching (25 points)
        palette_name = kit.palette_name

        if 'pastel' in palette_name and color_analysis['is_pastel']:
            score += 25
            reasons.append("Soft pastel tones match your image beautifully")
        elif 'vibrant' in palette_name and color_analysis['is_vibrant']:
            score += 25
            reasons.append("Bold, vibrant colors bring your image to life")
        elif 'nature' in palette_name and color_analysis['is_nature']:
            score += 25
            reasons.append("Earth tones and natural colors perfect for your subject")
        elif 'classic' in palette_name:
            # Classic palettes work for most images
            score += 15
            reasons.append("Versatile classic palette works well for most subjects")

        # 3. Complexity matching (20 points)
        complexity = complexity_analysis['complexity_level']

        if complexity == 'simple' and colors_in_kit <= 12:
            score += 20
            reasons.append("Simple composition pairs perfectly with this starter kit")
        elif complexity == 'moderate' and 12 < colors_in_kit <= 18:
            score += 20
            reasons.append("Moderate detail level suits this mid-range kit")
        elif complexity == 'detailed' and colors_in_kit >= 18:
            score += 20
            reasons.append("Rich details require this professional-grade color range")
        elif complexity == 'very_detailed' and colors_in_kit >= 24:
            score += 20
            reasons.append("Complex image needs this premium color palette")
        else:
            score += 10

        # 4. Subject type matching (15 points)
        subject = subject_analysis['type']
        kit_best_for = [item.lower() for item in kit.best_for]

        if subject == 'portrait' and any('portrait' in item for item in kit_best_for):
            score += 15
            reasons.append("Ideal for portrait photography with skin tone accuracy")
        elif subject == 'pet' and any('pet' in item for item in kit_best_for):
            score += 15
            reasons.append("Excellent for pet portraits and fur textures")
        elif subject == 'landscape' and any('landscape' in item for item in kit_best_for):
            score += 15
            reasons.append("Great for landscape scenes and natural vistas")
        else:
            score += 8

        # 5. Price/value consideration (10 points)
        # Favor mid-tier Creative Kit slightly (best value)
        if kit.id == 'creative_kit':
            score += 10
            reasons.append("Best value: most popular choice among painters")
        elif kit.price_usd < 30:
            score += 8
            reasons.append("Budget-friendly option to get started")
        elif kit.price_usd < 45:
            score += 6
        else:
            score += 5
            reasons.append("Premium quality for serious artists")

        # Ensure reasons list has at least 2-3 items
        if len(reasons) < 2:
            reasons.append(f"Includes {colors_in_kit} professional acrylic paints")
            reasons.append(f"Estimated {kit.estimated_projects}+ templates with this kit")

        return min(100, score), reasons[:4]  # Return top 4 reasons

    def _detect_skin_tones(self, image_rgb: np.ndarray) -> np.ndarray:
        """Detect pixels that look like skin tones"""
        # Skin tone ranges in RGB (simplified)
        r = image_rgb[:, :, 0]
        g = image_rgb[:, :, 1]
        b = image_rgb[:, :, 2]

        # Skin usually has: R > G > B, R > 95, G > 40, B > 20
        # and R-G < 15, R-B > 15
        mask = (
            (r > 95) & (g > 40) & (b > 20) &
            (r > g) & (g > b) &
            ((r - g) < 50) & ((r - b) > 15)
        )

        return mask

    def _detect_fur_colors(self, image_rgb: np.ndarray) -> np.ndarray:
        """Detect pixels that look like animal fur"""
        # Fur colors: browns, grays, whites, blacks, golden
        r = image_rgb[:, :, 0]
        g = image_rgb[:, :, 1]
        b = image_rgb[:, :, 2]

        # Brown fur
        brown = (r > 100) & (g > 50) & (g < 150) & (b < 100) & (r > g) & (g > b)

        # Gray fur
        gray = (np.abs(r - g) < 30) & (np.abs(g - b) < 30) & (r > 50) & (r < 200)

        # White fur
        white = (r > 200) & (g > 200) & (b > 200)

        # Golden/blonde fur
        golden = (r > 150) & (g > 120) & (b < 100) & (r > g) & (g > b)

        return brown | gray | white | golden

    def _rgb_to_hsv_batch(self, rgb_pixels: np.ndarray) -> np.ndarray:
        """Convert RGB pixels to HSV color space"""
        rgb_normalized = rgb_pixels / 255.0

        r, g, b = rgb_normalized[:, 0], rgb_normalized[:, 1], rgb_normalized[:, 2]

        max_val = np.maximum(np.maximum(r, g), b)
        min_val = np.minimum(np.minimum(r, g), b)
        diff = max_val - min_val

        # Hue
        h = np.zeros_like(max_val)
        mask = diff != 0

        r_max = (max_val == r) & mask
        g_max = (max_val == g) & mask
        b_max = (max_val == b) & mask

        h[r_max] = (60 * ((g[r_max] - b[r_max]) / diff[r_max]) + 360) % 360
        h[g_max] = (60 * ((b[g_max] - r[g_max]) / diff[g_max]) + 120) % 360
        h[b_max] = (60 * ((r[b_max] - g[b_max]) / diff[b_max]) + 240) % 360

        # Saturation
        s = np.zeros_like(max_val)
        s[max_val != 0] = diff[max_val != 0] / max_val[max_val != 0]

        # Value
        v = max_val

        return np.stack([h, s, v], axis=1)

    def _default_recommendation(self) -> Dict:
        """Return default recommendation when analysis fails"""
        creative_kit = self.paint_kit_manager.get_kit_by_id('creative_kit')

        return {
            'recommended_kit': creative_kit,
            'confidence': 75.0,
            'reasoning': [
                "Most popular choice for all skill levels",
                "18 colors cover most subjects beautifully",
                "Great value for money"
            ],
            'all_kits_ranked': [
                {
                    'kit': kit,
                    'score': 75.0 if kit.id == 'creative_kit' else 50.0,
                    'reasons': ["Recommended for general use"]
                }
                for kit in self.paint_kit_manager.get_all_kits()
            ],
            'color_analysis': {},
            'subject_analysis': {},
            'complexity_analysis': {}
        }
