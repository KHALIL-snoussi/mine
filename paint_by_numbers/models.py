"""
Premium 4-Model Paint-by-Numbers System
Inspired by QBRIX's professional approach

🎨 ORIGINAL - Natural photorealistic colors (20 colors)
📸 VINTAGE - Warm nostalgic tones (18 colors)
🎭 POP-ART - Bold vibrant colors (16 colors)
💎 FULL COLOR HD - QBRIX-quality maximum realism (38 colors!)

Each model is professionally calibrated for stunning results.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from .config import Config


@dataclass
class ModelProfile:
    """Profile defining a processing model's characteristics"""

    id: str
    name: str
    display_name: str
    description: str
    difficulty_level: str  # 'beginner', 'intermediate', 'advanced'
    recommended_for: list
    size_label: str  # Display size like "40×50 cm"

    # Processing parameters
    num_colors: int
    min_region_size: int
    max_image_size: tuple
    edge_threshold_low: int
    edge_threshold_high: int
    bilateral_filter_d: int
    bilateral_sigma_color: int
    bilateral_sigma_space: int
    morphology_kernel_size: int

    # ENHANCED number rendering for crystal-clear visibility
    font_scale: float
    font_thickness: int = 2
    font_outline_thickness: int = 3
    number_contrast_boost: bool = True

    # Color style
    color_style: str = "natural"  # 'natural', 'vintage', 'pop_art'
    saturation_boost: float = 1.0  # 1.0 = normal, >1.0 = more saturated
    warmth_adjustment: int = 0  # Shift toward warm (-20 to +20)

    # Palette settings
    use_unified_palette: bool = True
    palette_name: str = "realistic_natural"

    # Style characteristics
    style_tags: list = field(default_factory=list)
    processing_time_estimate: str = "30-60 seconds"

    # Visual preview settings
    preview_icon: str = "🎨"
    color_range: str = "16-20 colors"
    detail_level: str = "High"

    def to_config(self) -> Config:
        """Convert model profile to Config object with enhanced settings"""
        config = Config()

        # Basic parameters
        config.DEFAULT_NUM_COLORS = self.num_colors
        config.MIN_REGION_SIZE = self.min_region_size
        config.MAX_IMAGE_SIZE = self.max_image_size
        config.EDGE_THRESHOLD_LOW = self.edge_threshold_low
        config.EDGE_THRESHOLD_HIGH = self.edge_threshold_high
        config.BILATERAL_FILTER_D = self.bilateral_filter_d
        config.BILATERAL_SIGMA_COLOR = self.bilateral_sigma_color
        config.BILATERAL_SIGMA_SPACE = self.bilateral_sigma_space
        config.MORPHOLOGY_KERNEL_SIZE = self.morphology_kernel_size

        # ENHANCED font settings for crystal-clear numbers
        config.FONT_SCALE = self.font_scale
        config.FONT_THICKNESS = self.font_thickness
        config.FONT_OUTLINE_THICKNESS = self.font_outline_thickness
        config.NUMBER_CONTRAST_BOOST = self.number_contrast_boost

        # Color style settings
        config.COLOR_STYLE = self.color_style
        config.SATURATION_BOOST = self.saturation_boost
        config.WARMTH_ADJUSTMENT = self.warmth_adjustment

        # Palette
        config.USE_UNIFIED_PALETTE = self.use_unified_palette
        config.UNIFIED_PALETTE_NAME = self.palette_name

        return config

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'size_label': self.size_label,
            'difficulty_level': self.difficulty_level,
            'recommended_for': self.recommended_for,
            'color_range': self.color_range,
            'detail_level': self.detail_level,
            'processing_time': self.processing_time_estimate,
            'preview_icon': self.preview_icon,
            'style_tags': self.style_tags,
            'color_style': self.color_style,
        }


class ModelRegistry:
    """Registry of 4 Premium Processing Models (including QBRIX-quality Full Color HD)"""

    MODELS = {
        # MODEL 1: ORIGINAL - Natural Photorealistic
        'original': ModelProfile(
            id='original',
            name='Original',
            display_name='Original 40×50 cm',
            description='Natural photorealistic colors that stay true to your image. ' +
                       'Perfect for portraits, family photos, and realistic subjects. ' +
                       'Professional quality with crystal-clear numbers.',
            difficulty_level='intermediate',
            size_label='40×50 cm',
            recommended_for=[
                '✓ Portrait photography',
                '✓ Family photos',
                '✓ Realistic landscapes',
                '✓ Pet portraits',
                '✓ Wedding photos',
                '✓ Professional results'
            ],
            # Optimized for natural look with excellent clarity
            num_colors=20,  # Rich color depth without overwhelming
            min_region_size=80,  # Perfect balance - not too small, not too large
            max_image_size=(2480, 3508),  # A4 @ 300 DPI - perfect print quality
            edge_threshold_low=45,
            edge_threshold_high=155,
            bilateral_filter_d=8,
            bilateral_sigma_color=70,
            bilateral_sigma_space=70,
            morphology_kernel_size=3,

            # CRYSTAL-CLEAR NUMBERS
            font_scale=0.6,  # Bigger, easier to read
            font_thickness=2,  # Bold numbers
            font_outline_thickness=4,  # Strong white outline
            number_contrast_boost=True,

            # Natural color style
            color_style='natural',
            saturation_boost=1.05,  # Slightly enhanced for vibrancy
            warmth_adjustment=0,
            palette_name='realistic_natural',

            style_tags=['photorealistic', 'natural', 'professional', 'clear'],
            color_range='18-22 colors',
            detail_level='High Definition',
            preview_icon='🎨',
            processing_time_estimate='40-60 seconds'
        ),

        # MODEL 2: VINTAGE - Warm Nostalgic Tones
        'vintage': ModelProfile(
            id='vintage',
            name='Vintage',
            display_name='Vintage 40×50 cm',
            description='Warm, nostalgic tones with a retro aesthetic. ' +
                       'Slightly muted colors create a timeless, classic look. ' +
                       'Perfect for creating that vintage feel with modern clarity.',
            difficulty_level='intermediate',
            size_label='40×50 cm',
            recommended_for=[
                '✓ Vintage-style photos',
                '✓ Nostalgic memories',
                '✓ Classic portraits',
                '✓ Retro aesthetics',
                '✓ Warm landscapes',
                '✓ Timeless artwork'
            ],
            # Optimized for warm vintage look
            num_colors=18,  # Slightly fewer for classic feel
            min_region_size=95,  # Comfortable painting regions
            max_image_size=(2480, 3508),  # A4 @ 300 DPI
            edge_threshold_low=40,
            edge_threshold_high=145,
            bilateral_filter_d=10,  # Softer edges for vintage feel
            bilateral_sigma_color=85,
            bilateral_sigma_space=85,
            morphology_kernel_size=4,

            # CRYSTAL-CLEAR NUMBERS
            font_scale=0.65,  # Even bigger for comfort
            font_thickness=2,
            font_outline_thickness=4,
            number_contrast_boost=True,

            # Vintage color style - warm and nostalgic
            color_style='vintage',
            saturation_boost=0.85,  # Slightly desaturated
            warmth_adjustment=15,  # Warm shift (sepia-like)
            palette_name='vintage_warm',

            style_tags=['vintage', 'retro', 'warm', 'nostalgic', 'classic'],
            color_range='16-20 colors',
            detail_level='Medium-High',
            preview_icon='📸',
            processing_time_estimate='35-55 seconds'
        ),

        # MODEL 3: POP-ART - Bold Vibrant Colors
        'pop_art': ModelProfile(
            id='pop_art',
            name='Pop-Art',
            display_name='Pop-Art 40×50 cm',
            description='Bold, vibrant colors with high contrast like Andy Warhol masterpieces. ' +
                       'Eye-catching, modern aesthetic perfect for statement pieces. ' +
                       'Maximum impact with professional clarity.',
            difficulty_level='intermediate',
            size_label='40×50 cm',
            recommended_for=[
                '✓ Bold statement pieces',
                '✓ Modern art style',
                '✓ Pop culture images',
                '✓ High-contrast photos',
                '✓ Contemporary decor',
                '✓ Creative projects'
            ],
            # Optimized for bold pop-art style
            num_colors=16,  # Fewer colors = bolder impact
            min_region_size=110,  # Larger regions for graphic look
            max_image_size=(2480, 3508),  # A4 @ 300 DPI
            edge_threshold_low=60,  # Strong edges
            edge_threshold_high=170,  # High contrast
            bilateral_filter_d=7,  # Sharp transitions
            bilateral_sigma_color=60,
            bilateral_sigma_space=60,
            morphology_kernel_size=3,

            # ULTRA-CLEAR NUMBERS for bold style
            font_scale=0.7,  # Largest font
            font_thickness=3,  # Extra bold
            font_outline_thickness=5,  # Maximum outline
            number_contrast_boost=True,

            # Pop-art color style - vibrant and bold
            color_style='pop_art',
            saturation_boost=1.35,  # Highly saturated
            warmth_adjustment=0,
            palette_name='pop_art_bold',

            style_tags=['pop-art', 'bold', 'vibrant', 'modern', 'graphic'],
            color_range='14-18 colors',
            detail_level='Bold & Graphic',
            preview_icon='🎭',
            processing_time_estimate='30-50 seconds'
        ),

        # MODEL 4: PORTRAIT - Professional Portrait Optimized
        'portrait': ModelProfile(
            id='portrait',
            name='Portrait',
            display_name='Portrait Pro 40×50 cm',
            description='PORTRAIT-OPTIMIZED with face detection and skin smoothing. ' +
                       'Large, paintable regions with realistic skin tones. ' +
                       'Smooth faces, sharp details on eyes/glasses. Perfect for headshots.',
            difficulty_level='beginner',
            size_label='40×50 cm',
            recommended_for=[
                '✓ Portrait photography',
                '✓ Headshots & selfies',
                '✓ Family portraits',
                '✓ Face-focused images',
                '✓ Smooth skin tones',
                '✓ Easy to paint (large regions)',
                '✓ Realistic DMC colors'
            ],
            # PORTRAIT-OPTIMIZED SETTINGS
            num_colors=12,  # Fewer colors for smoother faces
            min_region_size=500,  # LARGE regions - easy to paint
            max_image_size=(2480, 3508),  # A4 @ 300 DPI
            edge_threshold_low=30,
            edge_threshold_high=140,
            bilateral_filter_d=12,  # Strong smoothing
            bilateral_sigma_color=90,
            bilateral_sigma_space=90,
            morphology_kernel_size=5,  # Merge small regions

            # CLEAR NUMBERS
            font_scale=0.7,
            font_thickness=2,
            font_outline_thickness=4,
            number_contrast_boost=True,

            # Portrait color style - realistic skin tones
            color_style='portrait',
            saturation_boost=1.0,
            warmth_adjustment=5,  # Slight warmth for skin
            palette_name='portrait_realistic',

            style_tags=['portrait', 'smooth', 'realistic', 'beginner-friendly', 'large-regions'],
            color_range='10-14 colors',
            detail_level='Smooth & Paintable',
            preview_icon='👤',
            processing_time_estimate='45-70 seconds'
        ),

        # MODEL 5: PORTRAIT PRO - Ultra-Quality Portrait
        'portrait_pro': ModelProfile(
            id='portrait_pro',
            name='Portrait Pro',
            display_name='Portrait Pro Ultra 40×50 cm',
            description='MAXIMUM PORTRAIT QUALITY with multi-pass face detection, ' +
                       'selective smoothing, and professional skin tones. ' +
                       'Best quality for portraits regardless of processing time.',
            difficulty_level='intermediate',
            size_label='40×50 cm',
            recommended_for=[
                '✓ Professional portraits',
                '✓ Maximum quality headshots',
                '✓ Wedding portraits',
                '✓ Gallery-quality faces',
                '✓ Smooth professional finish',
                '✓ Best possible skin tones',
                '✓ When time doesn\'t matter'
            ],
            # ULTRA-QUALITY PORTRAIT SETTINGS
            num_colors=15,  # More colors for subtle gradients
            min_region_size=400,  # Balanced - quality + detail
            max_image_size=(3508, 4960),  # A3 for maximum quality
            edge_threshold_low=25,
            edge_threshold_high=135,
            bilateral_filter_d=15,  # Maximum smoothing
            bilateral_sigma_color=100,
            bilateral_sigma_space=100,
            morphology_kernel_size=6,

            # CLEAR NUMBERS
            font_scale=0.65,
            font_thickness=2,
            font_outline_thickness=4,
            number_contrast_boost=True,

            # Ultra portrait color style
            color_style='portrait_pro',
            saturation_boost=1.02,
            warmth_adjustment=3,
            palette_name='portrait_realistic',

            style_tags=['portrait', 'ultra-quality', 'face-detection', 'multi-pass', 'professional'],
            color_range='12-16 colors',
            detail_level='Ultra Professional',
            preview_icon='🎯',
            processing_time_estimate='90-180 seconds'
        ),

        # MODEL 6: FULL COLOR HD - QBRIX Premium Quality (38 colors)
        'full_color_hd': ModelProfile(
            id='full_color_hd',
            name='Full Color HD',
            display_name='Full Color HD 40×50 cm',
            description='MAXIMUM REALISM with 38 colors for photo-quality results. ' +
                       'Like QBRIX premium tier - smooth skin tones, fine gradients, ' +
                       'and professional portrait quality. Perfect for complex photos ' +
                       'where you want EVERY detail preserved. Optimized for stamp-brush technique.',
            difficulty_level='advanced',
            size_label='40×50 cm',
            recommended_for=[
                '✓ MAXIMUM photo realism (38 colors!)',
                '✓ Professional portrait photography',
                '✓ Complex photos with many details',
                '✓ Smooth skin tone gradients',
                '✓ Gallery-quality wall art',
                '✓ Wedding & family portraits',
                '✓ When you want the BEST possible quality',
                '✓ Stamp-brush optimized regions'
            ],
            # QBRIX-level quality settings
            num_colors=38,  # Like QBRIX Full Color - maximum realism
            min_region_size=50,  # Smaller regions for fine detail, but stamp-friendly
            max_image_size=(3508, 4960),  # A3 @ 300 DPI for maximum quality
            edge_threshold_low=30,  # Capture subtle edges
            edge_threshold_high=160,  # Strong edge definition
            bilateral_filter_d=6,  # Fine detail preservation
            bilateral_sigma_color=55,
            bilateral_sigma_space=55,
            morphology_kernel_size=2,  # Minimal morphology for detail

            # CRYSTAL-CLEAR NUMBERS (optimized for 38 colors)
            font_scale=0.5,  # Smaller but still clear (more numbers to fit)
            font_thickness=2,
            font_outline_thickness=4,
            number_contrast_boost=True,

            # Natural realistic style with maximum color depth
            color_style='natural',
            saturation_boost=1.03,  # Very subtle enhancement
            warmth_adjustment=0,
            palette_name='full_color_hd_38',

            style_tags=['maximum-realism', 'photo-quality', 'premium', '38-colors', 'qbrix-quality', 'stamp-optimized'],
            color_range='35-38 colors',
            detail_level='Ultra HD Professional',
            preview_icon='💎',
            processing_time_estimate='90-120 seconds'
        ),
    }

    @classmethod
    def get_model(cls, model_id: str) -> Optional[ModelProfile]:
        """Get a model by ID"""
        return cls.MODELS.get(model_id)

    @classmethod
    def get_all_models(cls) -> Dict[str, ModelProfile]:
        """Get all available models"""
        return cls.MODELS.copy()

    @classmethod
    def get_models_list(cls) -> list:
        """Get list of all models as dictionaries"""
        return [model.to_dict() for model in cls.MODELS.values()]

    @classmethod
    def get_model_ids(cls) -> list:
        """Get list of all model IDs"""
        return list(cls.MODELS.keys())

    @classmethod
    def get_default_model(cls) -> ModelProfile:
        """Get the default model (Original)"""
        return cls.MODELS['original']

    @classmethod
    def get_recommended_model(cls, style_preference: str = 'natural') -> ModelProfile:
        """
        Get recommended model based on style preference

        Args:
            style_preference: 'natural', 'vintage', 'bold', 'modern'

        Returns:
            Recommended ModelProfile
        """
        style_map = {
            'natural': 'original',
            'realistic': 'original',
            'photo': 'original',
            'vintage': 'vintage',
            'retro': 'vintage',
            'warm': 'vintage',
            'classic': 'vintage',
            'bold': 'pop_art',
            'vibrant': 'pop_art',
            'modern': 'pop_art',
            'pop': 'pop_art',
            'graphic': 'pop_art',
        }

        model_id = style_map.get(style_preference.lower(), 'original')
        return cls.MODELS[model_id]


def get_model_comparison() -> Dict[str, Any]:
    """
    Get a comparison of all 4 premium models (including QBRIX-quality Full Color HD)

    Returns:
        Dictionary with model comparison data
    """
    return {
        'title': 'Premium Paint-by-Numbers Models',
        'subtitle': 'Choose your perfect style (4 professional models)',
        'models': ModelRegistry.get_models_list(),
        'comparison_factors': [
            'Style',
            'Color Range',
            'Detail Level',
            'Best For',
            'Processing Time'
        ],
        'note': 'All models include crystal-clear numbers and professional A4 print quality (40×50 cm). ' +
               'FULL COLOR HD (38 colors) matches QBRIX premium tier for maximum realism!'
    }
