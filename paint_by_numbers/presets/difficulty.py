"""
Difficulty presets for paint-by-numbers templates
Provides user-friendly presets that automatically configure complexity
"""

from dataclasses import dataclass
from typing import Dict, Optional
from paint_by_numbers.config import Config


@dataclass
class DifficultyPreset:
    """Defines a difficulty level preset"""
    id: str
    name: str
    display_name: str
    description: str
    emoji: str
    num_colors: int
    min_region_size: int
    max_image_size: tuple
    font_scale: float
    difficulty_score: int  # 1-100, where 100 is hardest
    estimated_hours: str
    skill_level: str
    best_for: list


# Predefined difficulty presets
DIFFICULTY_PRESETS = {
    'kids': DifficultyPreset(
        id='kids',
        name='Kids & Beginners',
        display_name='🎨 Kids & Beginners',
        description='Very simple with large regions and few colors - perfect for children and first-timers',
        emoji='🎨',
        num_colors=8,
        min_region_size=300,
        max_image_size=(800, 800),
        font_scale=0.8,
        difficulty_score=10,
        estimated_hours='1-2 hours',
        skill_level='Beginner',
        best_for=['Children 6+', 'First time painters', 'Quick projects', 'Gifts']
    ),

    'easy': DifficultyPreset(
        id='easy',
        name='Easy',
        display_name='😊 Easy',
        description='Simple and relaxing with manageable detail - great for beginners',
        emoji='😊',
        num_colors=12,
        min_region_size=200,
        max_image_size=(1000, 1000),
        font_scale=0.7,
        difficulty_score=25,
        estimated_hours='2-4 hours',
        skill_level='Beginner',
        best_for=['Beginners', 'Relaxation', 'Weekend projects', 'Learning']
    ),

    'medium': DifficultyPreset(
        id='medium',
        name='Medium',
        display_name='🎯 Medium',
        description='Moderate detail with good color variety - perfect for casual painters',
        emoji='🎯',
        num_colors=18,
        min_region_size=100,
        max_image_size=(1500, 1500),
        font_scale=0.5,
        difficulty_score=50,
        estimated_hours='4-8 hours',
        skill_level='Intermediate',
        best_for=['Regular painters', 'Portraits', 'Detailed landscapes', 'Home decor']
    ),

    'hard': DifficultyPreset(
        id='hard',
        name='Hard',
        display_name='💪 Hard',
        description='Challenging with fine details and many colors - for experienced painters',
        emoji='💪',
        num_colors=24,
        min_region_size=75,
        max_image_size=(2000, 2000),
        font_scale=0.4,
        difficulty_score=75,
        estimated_hours='8-15 hours',
        skill_level='Advanced',
        best_for=['Experienced painters', 'Complex images', 'Show pieces', 'Detailed art']
    ),

    'expert': DifficultyPreset(
        id='expert',
        name='Expert',
        display_name='🏆 Expert',
        description='Maximum detail and color richness - for serious artists and perfectionists',
        emoji='🏆',
        num_colors=40,
        min_region_size=50,
        max_image_size=(2500, 2500),
        font_scale=0.35,
        difficulty_score=90,
        estimated_hours='15-25 hours',
        skill_level='Expert',
        best_for=['Expert painters', 'Fine art reproduction', 'Professional display', 'Competitions']
    ),

    'master': DifficultyPreset(
        id='master',
        name='Master',
        display_name='⭐ Master',
        description='Ultimate detail for large canvas printing - museum-quality results',
        emoji='⭐',
        num_colors=48,
        min_region_size=35,
        max_image_size=(5906, 4134),  # 50×35 cm @ 300 DPI
        font_scale=0.25,
        difficulty_score=100,
        estimated_hours='25-40 hours',
        skill_level='Master',
        best_for=['Master artists', 'Large canvas prints', 'Gallery pieces', 'Ultimate challenges']
    ),
}


def get_difficulty_preset(preset_id: str) -> Optional[DifficultyPreset]:
    """
    Get a difficulty preset by ID

    Args:
        preset_id: Preset identifier

    Returns:
        DifficultyPreset or None if not found
    """
    return DIFFICULTY_PRESETS.get(preset_id)


def list_difficulty_presets() -> Dict[str, DifficultyPreset]:
    """Get all available difficulty presets"""
    return DIFFICULTY_PRESETS.copy()


def difficulty_preset_to_config(preset: DifficultyPreset) -> Config:
    """
    Convert a difficulty preset to a Config object

    Args:
        preset: DifficultyPreset to convert

    Returns:
        Configured Config object
    """
    config = Config()

    # Apply preset settings
    config.DEFAULT_NUM_COLORS = preset.num_colors
    config.MIN_REGION_SIZE = preset.min_region_size
    config.MAX_IMAGE_SIZE = preset.max_image_size
    config.FONT_SCALE = preset.font_scale

    # Adjust other settings based on difficulty
    if preset.difficulty_score <= 25:  # Easy presets
        config.MORPH_CLOSE_ITERATIONS = 2  # More aggressive cleanup
        config.MORPH_OPEN_ITERATIONS = 2
        config.CONTOUR_THICKNESS = 3  # Thicker lines
        config.FONT_THICKNESS = 3

    elif preset.difficulty_score >= 75:  # Hard presets
        config.MORPH_CLOSE_ITERATIONS = 1  # Preserve detail
        config.MORPH_OPEN_ITERATIONS = 1
        config.CONTOUR_THICKNESS = 2  # Normal lines
        config.FONT_THICKNESS = 2
        config.APPLY_SHARPENING = True
        config.SHARPEN_AMOUNT = 1.0

        # Enable high-quality outputs
        if preset.difficulty_score >= 90:
            config.GENERATE_SVG = True
            config.GENERATE_PDF = True
            config.DPI = 300

    return config


def get_recommended_difficulty(
    image_complexity: float,
    user_experience: str = 'beginner'
) -> DifficultyPreset:
    """
    Recommend a difficulty preset based on image complexity and user experience

    Args:
        image_complexity: Complexity score 0-1 (from image analysis)
        user_experience: 'beginner', 'intermediate', 'advanced', or 'expert'

    Returns:
        Recommended DifficultyPreset
    """
    experience_map = {
        'beginner': ['kids', 'easy'],
        'intermediate': ['medium', 'hard'],
        'advanced': ['hard', 'expert'],
        'expert': ['expert', 'master']
    }

    candidates = experience_map.get(user_experience, ['medium'])

    # Choose based on image complexity
    if image_complexity < 0.3:
        # Simple image - can go easier
        return get_difficulty_preset(candidates[0])
    else:
        # Complex image - use harder preset if available
        return get_difficulty_preset(candidates[-1])


def print_difficulty_presets():
    """Print all available difficulty presets in a nice format"""
    print("\n" + "="*80)
    print("AVAILABLE DIFFICULTY PRESETS")
    print("="*80)

    for preset_id, preset in DIFFICULTY_PRESETS.items():
        print(f"\n{preset.display_name}")
        print(f"  ID: {preset_id}")
        print(f"  Difficulty: {preset.difficulty_score}/100")
        print(f"  Colors: {preset.num_colors}")
        print(f"  Est. Time: {preset.estimated_hours}")
        print(f"  Skill Level: {preset.skill_level}")
        print(f"  {preset.description}")
        print(f"  Best for: {', '.join(preset.best_for[:3])}")

    print("\n" + "="*80)


# Difficulty slider function
def get_difficulty_from_slider(slider_value: int) -> DifficultyPreset:
    """
    Convert a slider value (1-6) to a difficulty preset

    Args:
        slider_value: Integer 1-6

    Returns:
        Corresponding DifficultyPreset
    """
    slider_map = {
        1: 'kids',
        2: 'easy',
        3: 'medium',
        4: 'hard',
        5: 'expert',
        6: 'master'
    }

    preset_id = slider_map.get(slider_value, 'medium')
    return get_difficulty_preset(preset_id)
