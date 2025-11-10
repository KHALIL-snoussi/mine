"""
Premium presets that combine enhanced features for professional results
These presets use dynamic palettes, vibrancy boost, black avoidance, etc.
"""

from dataclasses import dataclass
from typing import Optional
from paint_by_numbers.config import Config


@dataclass
class PremiumPreset:
    """Premium preset with all enhancements enabled"""
    id: str
    name: str
    display_name: str
    description: str

    # Color settings
    num_colors: int
    use_dynamic_palette: bool
    vibrancy_boost: float
    avoid_pure_black: bool
    simplify_background: bool
    max_single_color_percentage: float

    # Detail level (1-5)
    detail_level: int

    # Image quality
    max_image_size: tuple
    font_scale: float

    # Output formats
    generate_svg: bool
    generate_pdf: bool

    # Metadata
    best_for: list
    estimated_hours: str


PREMIUM_PRESETS = {
    'professional_plus': PremiumPreset(
        id='professional_plus',
        name='Professional Plus',
        display_name='✨ Professional Plus',
        description='Maximum quality with all enhancements - dynamic palette, rich colors, balanced detail',
        num_colors=36,
        use_dynamic_palette=True,
        vibrancy_boost=1.15,
        avoid_pure_black=True,
        simplify_background=True,
        max_single_color_percentage=35.0,
        detail_level=4,  # Detailed
        max_image_size=(3000, 3000),
        font_scale=0.35,
        generate_svg=True,
        generate_pdf=True,
        best_for=['Professional artists', 'High-quality prints', 'Gallery display', 'Gifts'],
        estimated_hours='12-20 hours'
    ),

    'ultra_realistic': PremiumPreset(
        id='ultra_realistic',
        name='Ultra Realistic',
        display_name='🎨 Ultra Realistic',
        description='Maximum colors and detail for photorealistic results',
        num_colors=60,
        use_dynamic_palette=True,
        vibrancy_boost=1.1,  # Subtle vibrancy for realism
        avoid_pure_black=True,
        simplify_background=False,  # Keep background detail for realism
        max_single_color_percentage=30.0,
        detail_level=5,  # Very detailed
        max_image_size=(4000, 4000),
        font_scale=0.3,
        generate_svg=True,
        generate_pdf=True,
        best_for=['Photo reproduction', 'Portraits', 'Complex images', 'Expert painters'],
        estimated_hours='30-50 hours'
    ),

    'vibrant_art': PremiumPreset(
        id='vibrant_art',
        name='Vibrant Art',
        display_name='🌈 Vibrant Art',
        description='Bold, saturated colors with simplified segments - modern art style',
        num_colors=24,
        use_dynamic_palette=True,
        vibrancy_boost=1.3,  # High vibrancy for pop art effect
        avoid_pure_black=True,
        simplify_background=True,
        max_single_color_percentage=40.0,
        detail_level=2,  # Simple - bold regions
        max_image_size=(2000, 2000),
        font_scale=0.5,
        generate_svg=True,
        generate_pdf=True,
        best_for=['Modern art', 'Pop art style', 'Colorful subjects', 'Quick projects'],
        estimated_hours='6-12 hours'
    ),

    'balanced_quality': PremiumPreset(
        id='balanced_quality',
        name='Balanced Quality',
        display_name='⚖️ Balanced Quality',
        description='Perfect balance of quality and paintability - recommended for most users',
        num_colors=30,
        use_dynamic_palette=True,
        vibrancy_boost=1.15,
        avoid_pure_black=True,
        simplify_background=True,
        max_single_color_percentage=35.0,
        detail_level=3,  # Balanced
        max_image_size=(2000, 2000),
        font_scale=0.45,
        generate_svg=True,
        generate_pdf=True,
        best_for=['Most images', 'Intermediate painters', 'Home decor', 'Personal use'],
        estimated_hours='8-15 hours'
    ),

    'quick_masterpiece': PremiumPreset(
        id='quick_masterpiece',
        name='Quick Masterpiece',
        display_name='⚡ Quick Masterpiece',
        description='Beautiful results with simplified regions - perfect for beginners',
        num_colors=18,
        use_dynamic_palette=True,
        vibrancy_boost=1.2,
        avoid_pure_black=True,
        simplify_background=True,
        max_single_color_percentage=40.0,
        detail_level=2,  # Simple
        max_image_size=(1500, 1500),
        font_scale=0.6,
        generate_svg=False,
        generate_pdf=True,
        best_for=['Beginners', 'Quick projects', 'Learning', 'Kids 10+'],
        estimated_hours='3-6 hours'
    ),

    'print_ready_large': PremiumPreset(
        id='print_ready_large',
        name='Print Ready Large',
        display_name='🖨️ Print Ready Large',
        description='Optimized for large canvas printing (50x70 cm) - maximum resolution',
        num_colors=48,
        use_dynamic_palette=True,
        vibrancy_boost=1.12,
        avoid_pure_black=True,
        simplify_background=False,
        max_single_color_percentage=30.0,
        detail_level=4,  # Detailed
        max_image_size=(8268, 5906),  # 70×50 cm @ 300 DPI
        font_scale=0.22,
        generate_svg=True,
        generate_pdf=True,
        best_for=['Large canvas prints', 'Commercial use', 'Professional display', 'Competitions'],
        estimated_hours='40-60 hours'
    ),

    'upaint_style': PremiumPreset(
        id='upaint_style',
        name='uPaint Style',
        display_name='🎨 uPaint Style',
        description='Artistic simplification with vivid colors - smooth painterly look',
        num_colors=30,
        use_dynamic_palette=True,
        vibrancy_boost=1.2,  # Higher for vivid colors
        avoid_pure_black=True,
        simplify_background=True,
        max_single_color_percentage=35.0,
        detail_level=3,  # Balanced - not too detailed
        max_image_size=(5906, 4134),  # 50×35 cm @ 300 DPI
        font_scale=0.35,
        generate_svg=True,
        generate_pdf=True,
        best_for=['Portraits', 'Canvas 50×35 cm', 'Artistic style', 'Smooth gradients'],
        estimated_hours='12-18 hours'
    ),
}


def get_premium_preset(preset_id: str) -> Optional[PremiumPreset]:
    """Get a premium preset by ID"""
    return PREMIUM_PRESETS.get(preset_id)


def list_premium_presets() -> dict:
    """Get all available premium presets"""
    return PREMIUM_PRESETS.copy()


def premium_preset_to_config(preset: PremiumPreset) -> Config:
    """
    Convert a premium preset to a Config object

    Args:
        preset: PremiumPreset to convert

    Returns:
        Configured Config object
    """
    config = Config()

    # Color settings
    config.DEFAULT_NUM_COLORS = preset.num_colors
    config.MAX_NUM_COLORS = max(preset.num_colors, 72)  # Ensure we can reach the target
    config.USE_UNIFIED_PALETTE = not preset.use_dynamic_palette
    config.VIBRANCY_BOOST = preset.vibrancy_boost
    config.AVOID_PURE_BLACK = preset.avoid_pure_black
    config.SIMPLIFY_BACKGROUND = preset.simplify_background
    config.MAX_SINGLE_COLOR_PERCENTAGE = preset.max_single_color_percentage

    # Detail level
    config.DETAIL_LEVEL = preset.detail_level

    # Apply detail level settings
    from paint_by_numbers.presets.detail_level import get_detail_level_by_number, detail_level_preset_to_config
    detail_preset = get_detail_level_by_number(preset.detail_level)
    config = detail_level_preset_to_config(detail_preset, config)

    # Image quality
    config.MAX_IMAGE_SIZE = preset.max_image_size
    config.FONT_SCALE = preset.font_scale

    # Output formats
    config.GENERATE_SVG = preset.generate_svg
    config.GENERATE_PDF = preset.generate_pdf
    config.DPI = 300

    # Enable all quality enhancements
    config.AUTO_WHITE_BALANCE = True
    config.APPLY_DENOISE = True
    config.APPLY_LOCAL_CONTRAST = True
    config.APPLY_TONE_BALANCE = True
    config.APPLY_SHARPENING = True

    # Adjust sharpening based on detail level
    if preset.detail_level >= 4:
        config.SHARPEN_AMOUNT = 1.0
    elif preset.detail_level <= 2:
        config.SHARPEN_AMOUNT = 0.5

    # Apply artistic refinements for uPaint style
    if preset.id == 'upaint_style':
        config.MIN_COLOR_DISTANCE = 30.0  # Higher for more vivid separation
        config.REDUCE_SKIN_CLUTTER = True
        config.ARTISTIC_SIMPLIFICATION = True
        config.SIMPLIFICATION_THRESHOLD = 15.0
        config.FILTER_INSIGNIFICANT_EDGES = True
        config.MIN_CONTOUR_LENGTH = 30
        config.CONTOUR_THICKNESS = 3  # Thicker lines for canvas

    return config


def print_premium_presets():
    """Print all available premium presets"""
    print("\n" + "="*80)
    print("PREMIUM PRESETS - Enhanced Quality with Dynamic Palettes")
    print("="*80)

    for preset_id, preset in PREMIUM_PRESETS.items():
        print(f"\n{preset.display_name}")
        print(f"  ID: {preset_id}")
        print(f"  Colors: {preset.num_colors} (dynamic palette)")
        print(f"  Detail Level: {preset.detail_level}/5")
        print(f"  Vibrancy: {preset.vibrancy_boost}x")
        print(f"  Est. Time: {preset.estimated_hours}")
        print(f"  {preset.description}")
        print(f"  Best for: {', '.join(preset.best_for[:3])}")

    print("\n" + "="*80)
    print("\nAll premium presets include:")
    print("  ✓ Dynamic color palette (matched to your image)")
    print("  ✓ Black avoidance (no large dark voids)")
    print("  ✓ Vibrancy boost (rich, vibrant colors)")
    print("  ✓ Background simplification")
    print("  ✓ Professional quality output")
    print("="*80)
