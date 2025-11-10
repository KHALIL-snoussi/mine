"""
Detail Level presets for paint-by-numbers templates
Controls segment simplification and detail preservation independently of color count
"""

from dataclasses import dataclass
from typing import Dict, Optional
from paint_by_numbers.config import Config


@dataclass
class DetailLevelPreset:
    """Defines a detail level preset for segment complexity"""
    id: str
    name: str
    display_name: str
    description: str
    level: int  # 1-5, where 5 is most detailed

    # Segmentation parameters
    min_region_size: int
    morphology_kernel_size: int
    morph_close_iterations: int
    morph_open_iterations: int

    # Bilateral filter settings (edge-preserving smoothing)
    bilateral_filter_d: int
    bilateral_sigma_color: int
    bilateral_sigma_space: int

    # Edge detection
    edge_threshold_low: int
    edge_threshold_high: int

    # Visual characteristics
    typical_region_count: str
    complexity_description: str


# Detail level presets - from simplest to most detailed
DETAIL_LEVEL_PRESETS = {
    'very_simple': DetailLevelPreset(
        id='very_simple',
        name='Very Simple',
        display_name='Level 1 - Very Simple',
        description='Large, smooth regions with minimal detail - easiest to paint',
        level=1,
        min_region_size=300,
        morphology_kernel_size=5,
        morph_close_iterations=3,
        morph_open_iterations=3,
        bilateral_filter_d=15,
        bilateral_sigma_color=100,
        bilateral_sigma_space=100,
        edge_threshold_low=60,
        edge_threshold_high=130,
        typical_region_count='50-150 regions',
        complexity_description='Bold, poster-like appearance with clear boundaries'
    ),

    'simple': DetailLevelPreset(
        id='simple',
        name='Simple',
        display_name='Level 2 - Simple',
        description='Simplified segments with moderate detail reduction',
        level=2,
        min_region_size=150,
        morphology_kernel_size=4,
        morph_close_iterations=2,
        morph_open_iterations=2,
        bilateral_filter_d=11,
        bilateral_sigma_color=85,
        bilateral_sigma_space=85,
        edge_threshold_low=55,
        edge_threshold_high=140,
        typical_region_count='150-300 regions',
        complexity_description='Smooth appearance with major features preserved'
    ),

    'balanced': DetailLevelPreset(
        id='balanced',
        name='Balanced',
        display_name='Level 3 - Balanced',
        description='Balanced detail level - good for most images',
        level=3,
        min_region_size=100,
        morphology_kernel_size=3,
        morph_close_iterations=1,
        morph_open_iterations=1,
        bilateral_filter_d=9,
        bilateral_sigma_color=75,
        bilateral_sigma_space=75,
        edge_threshold_low=50,
        edge_threshold_high=150,
        typical_region_count='300-600 regions',
        complexity_description='Natural balance between simplicity and detail'
    ),

    'detailed': DetailLevelPreset(
        id='detailed',
        name='Detailed',
        display_name='Level 4 - Detailed',
        description='Preserves fine details and textures',
        level=4,
        min_region_size=50,
        morphology_kernel_size=2,
        morph_close_iterations=1,
        morph_open_iterations=1,
        bilateral_filter_d=5,
        bilateral_sigma_color=60,
        bilateral_sigma_space=60,
        edge_threshold_low=40,
        edge_threshold_high=160,
        typical_region_count='600-1200 regions',
        complexity_description='Rich detail with subtle gradations and textures'
    ),

    'very_detailed': DetailLevelPreset(
        id='very_detailed',
        name='Very Detailed',
        display_name='Level 5 - Very Detailed',
        description='Maximum detail preservation - captures subtle nuances',
        level=5,
        min_region_size=35,
        morphology_kernel_size=2,
        morph_close_iterations=1,
        morph_open_iterations=0,  # Minimal opening to preserve thin features
        bilateral_filter_d=3,
        bilateral_sigma_color=50,
        bilateral_sigma_space=50,
        edge_threshold_low=30,
        edge_threshold_high=170,
        typical_region_count='1200+ regions',
        complexity_description='Highly detailed with fine lines and complex patterns'
    ),
}


def get_detail_level_preset(preset_id: str) -> Optional[DetailLevelPreset]:
    """
    Get a detail level preset by ID

    Args:
        preset_id: Preset identifier

    Returns:
        DetailLevelPreset or None if not found
    """
    return DETAIL_LEVEL_PRESETS.get(preset_id)


def get_detail_level_by_number(level: int) -> DetailLevelPreset:
    """
    Get detail level preset by level number (1-5)

    Args:
        level: Detail level (1=very simple, 5=very detailed)

    Returns:
        Corresponding DetailLevelPreset
    """
    level = max(1, min(5, level))  # Clamp to 1-5

    level_map = {
        1: 'very_simple',
        2: 'simple',
        3: 'balanced',
        4: 'detailed',
        5: 'very_detailed'
    }

    preset_id = level_map[level]
    return get_detail_level_preset(preset_id)


def list_detail_level_presets() -> Dict[str, DetailLevelPreset]:
    """Get all available detail level presets"""
    return DETAIL_LEVEL_PRESETS.copy()


def detail_level_preset_to_config(preset: DetailLevelPreset, config: Config = None) -> Config:
    """
    Apply detail level preset to a Config object

    Args:
        preset: DetailLevelPreset to apply
        config: Existing Config object to modify (creates new one if None)

    Returns:
        Configured Config object
    """
    if config is None:
        config = Config()

    # Apply segmentation parameters
    config.MIN_REGION_SIZE = preset.min_region_size
    config.MORPHOLOGY_KERNEL_SIZE = preset.morphology_kernel_size
    config.MORPH_CLOSE_ITERATIONS = preset.morph_close_iterations
    config.MORPH_OPEN_ITERATIONS = preset.morph_open_iterations

    # Apply bilateral filter settings
    config.BILATERAL_FILTER_D = preset.bilateral_filter_d
    config.BILATERAL_SIGMA_COLOR = preset.bilateral_sigma_color
    config.BILATERAL_SIGMA_SPACE = preset.bilateral_sigma_space

    # Apply edge detection settings
    config.EDGE_THRESHOLD_LOW = preset.edge_threshold_low
    config.EDGE_THRESHOLD_HIGH = preset.edge_threshold_high

    # Adjust font scale based on detail level
    # More detail = smaller regions = need slightly smaller font
    if preset.level <= 2:
        config.FONT_SCALE = max(0.6, config.FONT_SCALE)
    elif preset.level >= 4:
        config.FONT_SCALE = min(0.4, config.FONT_SCALE)

    return config


def get_recommended_detail_level(
    image_complexity: float,
    user_preference: str = 'balanced'
) -> DetailLevelPreset:
    """
    Recommend a detail level based on image complexity and user preference

    Args:
        image_complexity: Complexity score 0-1 (from image analysis)
        user_preference: 'simple', 'balanced', 'detailed'

    Returns:
        Recommended DetailLevelPreset
    """
    if user_preference == 'simple':
        if image_complexity < 0.3:
            return get_detail_level_preset('very_simple')
        else:
            return get_detail_level_preset('simple')

    elif user_preference == 'detailed':
        if image_complexity > 0.7:
            return get_detail_level_preset('very_detailed')
        else:
            return get_detail_level_preset('detailed')

    else:  # balanced
        if image_complexity < 0.3:
            return get_detail_level_preset('simple')
        elif image_complexity > 0.7:
            return get_detail_level_preset('detailed')
        else:
            return get_detail_level_preset('balanced')


def print_detail_level_presets():
    """Print all available detail level presets in a nice format"""
    print("\n" + "="*80)
    print("DETAIL LEVEL PRESETS")
    print("="*80)
    print("\nControl segment complexity independently of color count\n")

    for preset_id, preset in DETAIL_LEVEL_PRESETS.items():
        print(f"{preset.display_name}")
        print(f"  {preset.description}")
        print(f"  Min Region: {preset.min_region_size} pixels")
        print(f"  {preset.typical_region_count}")
        print(f"  {preset.complexity_description}")
        print()

    print("="*80)
