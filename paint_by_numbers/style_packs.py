"""
Fixed Style Packs for Paint-by-Numbers (QBRIX-inspired)
Each pack has curated paint colors with target percentage distributions
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass
import numpy as np


@dataclass
class StylePackColor:
    """A single color in a style pack"""
    id: int  # Color index (1-based for user display)
    name: str
    rgb: Tuple[int, int, int]
    hex: str
    category: str
    target_percentage: float  # Expected usage percentage
    paint_ml_per_100sqcm: float = 2.5  # Estimated paint consumption


@dataclass
class StylePack:
    """A complete style pack with fixed palette and processing parameters"""
    id: str
    name: str
    description: str
    colors: List[StylePackColor]

    # Processing parameters for this style
    saturation_boost: float = 1.0
    warmth_adjustment: int = 0
    clahe_clip_limit: float = 2.0
    bilateral_d: int = 8
    bilateral_sigma_color: int = 70
    bilateral_sigma_space: int = 70

    def get_palette(self) -> np.ndarray:
        """Get RGB palette as numpy array"""
        return np.array([c.rgb for c in self.colors], dtype=np.uint8)

    def get_target_percentages(self) -> np.ndarray:
        """Get target percentages as numpy array"""
        return np.array([c.target_percentage for c in self.colors], dtype=np.float32)

    def get_color_names(self) -> List[str]:
        """Get list of color names"""
        return [c.name for c in self.colors]

    def estimate_paint_volumes(self, canvas_area_sqcm: float) -> Dict[str, float]:
        """
        Estimate paint volumes needed for each color.

        Args:
            canvas_area_sqcm: Canvas area in square centimeters (A4 = 623.7 cm²)

        Returns:
            Dict mapping color name to estimated ml of paint needed
        """
        volumes = {}
        for color in self.colors:
            # Calculate area covered by this color
            color_area_sqcm = canvas_area_sqcm * (color.target_percentage / 100)
            # Estimate paint volume (typically 2-3 ml per 100 cm²)
            paint_ml = (color_area_sqcm / 100) * color.paint_ml_per_100sqcm
            volumes[color.name] = round(paint_ml, 1)
        return volumes


# ORIGINAL PACK - Natural photorealistic colors
# 7 colors for A4 format (~10k regions)
ORIGINAL_7_COLOR_PACK = StylePack(
    id='original_7',
    name='Original (7 Colors)',
    description='Natural photorealistic colors - perfect for portraits and realistic subjects',
    colors=[
        StylePackColor(1, 'Pure Black', (0, 0, 0), '#000000', 'Black', 12.0),
        StylePackColor(2, 'Pure White', (252, 251, 248), '#FCFBF8', 'White', 18.0),
        StylePackColor(3, 'Neutral Gray', (140, 140, 140), '#8C8C8C', 'Gray', 15.0),
        StylePackColor(4, 'Peachy Skin', (250, 211, 187), '#FAD3BB', 'Skin', 25.0),
        StylePackColor(5, 'Warm Brown', (152, 94, 51), '#985E33', 'Brown', 14.0),
        StylePackColor(6, 'Sky Blue', (148, 186, 217), '#94BAD9', 'Blue', 10.0),
        StylePackColor(7, 'Fresh Green', (89, 163, 61), '#59A33D', 'Green', 6.0),
    ],
    saturation_boost=1.05,
    warmth_adjustment=0,
    clahe_clip_limit=2.0,
    bilateral_d=8,
    bilateral_sigma_color=70,
    bilateral_sigma_space=70
)


# VINTAGE PACK - Warm nostalgic tones
# 7 colors with sepia/warm shift
VINTAGE_7_COLOR_PACK = StylePack(
    id='vintage_7',
    name='Vintage (7 Colors)',
    description='Warm nostalgic tones with sepia shift - perfect for timeless, classic look',
    colors=[
        StylePackColor(1, 'Deep Brown', (37, 26, 22), '#251A16', 'Brown', 14.0),
        StylePackColor(2, 'Warm Cream', (240, 234, 218), '#F0EADA', 'Cream', 20.0),
        StylePackColor(3, 'Dark Tan', (89, 73, 55), '#594937', 'Brown', 16.0),
        StylePackColor(4, 'Light Tan', (236, 204, 158), '#ECCC9E', 'Brown', 22.0),
        StylePackColor(5, 'Mocha', (108, 84, 67), '#6C5443', 'Brown', 15.0),
        StylePackColor(6, 'Warm Peach', (250, 211, 187), '#FAD3BB', 'Skin', 8.0),
        StylePackColor(7, 'Golden Straw', (223, 182, 95), '#DFB65F', 'Yellow', 5.0),
    ],
    saturation_boost=0.85,
    warmth_adjustment=15,
    clahe_clip_limit=1.5,
    bilateral_d=10,
    bilateral_sigma_color=85,
    bilateral_sigma_space=85
)


# POP ART PACK - Bold vibrant colors
# 7 colors with high saturation
POP_ART_7_COLOR_PACK = StylePack(
    id='pop_art_7',
    name='Pop Art (7 Colors)',
    description='Bold vibrant colors with high contrast - perfect for statement pieces',
    colors=[
        StylePackColor(1, 'Deep Black', (0, 0, 0), '#000000', 'Black', 15.0),
        StylePackColor(2, 'Bright White', (255, 255, 255), '#FFFFFF', 'White', 16.0),
        StylePackColor(3, 'Fire Red', (227, 29, 66), '#E31D42', 'Red', 18.0),
        StylePackColor(4, 'Electric Blue', (0, 164, 214), '#00A4D6', 'Blue', 16.0),
        StylePackColor(5, 'Sunny Yellow', (255, 227, 0), '#FFE300', 'Yellow', 14.0),
        StylePackColor(6, 'Hot Pink', (229, 72, 119), '#E54877', 'Pink', 12.0),
        StylePackColor(7, 'Vibrant Green', (10, 117, 36), '#0A7524', 'Green', 9.0),
    ],
    saturation_boost=1.35,
    warmth_adjustment=0,
    clahe_clip_limit=2.5,
    bilateral_d=7,
    bilateral_sigma_color=60,
    bilateral_sigma_space=60
)


# Registry of all style packs
STYLE_PACKS: Dict[str, StylePack] = {
    'original_7': ORIGINAL_7_COLOR_PACK,
    'vintage_7': VINTAGE_7_COLOR_PACK,
    'pop_art_7': POP_ART_7_COLOR_PACK,
}


def get_style_pack(pack_id: str) -> StylePack:
    """Get a style pack by ID"""
    if pack_id not in STYLE_PACKS:
        raise ValueError(f"Unknown style pack: {pack_id}. Available: {list(STYLE_PACKS.keys())}")
    return STYLE_PACKS[pack_id]


def get_all_style_packs() -> List[StylePack]:
    """Get all available style packs"""
    return list(STYLE_PACKS.values())


def get_style_pack_for_model(model_id: str) -> StylePack:
    """
    Get the recommended style pack for a model.

    Args:
        model_id: 'original', 'vintage', or 'pop_art'

    Returns:
        Corresponding StylePack
    """
    mapping = {
        'original': 'original_7',
        'vintage': 'vintage_7',
        'pop_art': 'pop_art_7',
    }

    pack_id = mapping.get(model_id, 'original_7')
    return get_style_pack(pack_id)


# A4 canvas dimensions for paint quantity calculations
A4_WIDTH_CM = 21.0
A4_HEIGHT_CM = 29.7
A4_AREA_SQCM = A4_WIDTH_CM * A4_HEIGHT_CM  # 623.7 cm²

# Standard canvas sizes
CANVAS_FORMATS = {
    'a4_portrait': {'width_cm': 21.0, 'height_cm': 29.7, 'area_sqcm': 623.7},
    'a4_landscape': {'width_cm': 29.7, 'height_cm': 21.0, 'area_sqcm': 623.7},
    'square_20x20': {'width_cm': 20.0, 'height_cm': 20.0, 'area_sqcm': 400.0},
    'square_25x25': {'width_cm': 25.0, 'height_cm': 25.0, 'area_sqcm': 625.0},
}
