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

__all__ = [
    'DifficultyPreset',
    'DIFFICULTY_PRESETS',
    'get_difficulty_preset',
    'list_difficulty_presets',
    'difficulty_preset_to_config',
    'get_recommended_difficulty',
    'print_difficulty_presets',
    'get_difficulty_from_slider'
]
