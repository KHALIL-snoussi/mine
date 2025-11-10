"""
Preset configurations for different use cases
"""

from .difficulty import (
    DifficultyPreset,
    DIFFICULTY_PRESETS,
    get_difficulty_preset,
    list_difficulty_presets,
    difficulty_preset_to_config,
    get_recommended_difficulty,
    print_difficulty_presets,
    get_difficulty_from_slider
)

from .detail_level import (
    DetailLevelPreset,
    DETAIL_LEVEL_PRESETS,
    get_detail_level_preset,
    get_detail_level_by_number,
    list_detail_level_presets,
    detail_level_preset_to_config,
    get_recommended_detail_level,
    print_detail_level_presets
)

from .premium_presets import (
    PremiumPreset,
    PREMIUM_PRESETS,
    get_premium_preset,
    list_premium_presets,
    premium_preset_to_config,
    print_premium_presets
)

__all__ = [
    # Difficulty presets
    'DifficultyPreset',
    'DIFFICULTY_PRESETS',
    'get_difficulty_preset',
    'list_difficulty_presets',
    'difficulty_preset_to_config',
    'get_recommended_difficulty',
    'print_difficulty_presets',
    'get_difficulty_from_slider',
    # Detail level presets
    'DetailLevelPreset',
    'DETAIL_LEVEL_PRESETS',
    'get_detail_level_preset',
    'get_detail_level_by_number',
    'list_detail_level_presets',
    'detail_level_preset_to_config',
    'get_recommended_detail_level',
    'print_detail_level_presets',
    # Premium presets
    'PremiumPreset',
    'PREMIUM_PRESETS',
    'get_premium_preset',
    'list_premium_presets',
    'premium_preset_to_config',
    'print_premium_presets'
]
