"""
Multiple AI Models/Modes for Paint-by-Numbers Generation
Inspired by Qbrix's multi-model approach

Each model offers a unique processing style with different characteristics.
Customers can choose the model that best fits their needs and skill level.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from config import Config


@dataclass
class ModelProfile:
    """Profile defining a processing model's characteristics"""

    id: str
    name: str
    display_name: str
    description: str
    difficulty_level: str  # 'beginner', 'intermediate', 'advanced', 'expert'
    recommended_for: list

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
    font_scale: float

    # Palette settings
    use_unified_palette: bool = True
    palette_name: str = "classic_18"

    # Style characteristics
    style_tags: list = field(default_factory=list)
    processing_time_estimate: str = "30-60 seconds"

    # Visual preview settings
    preview_icon: str = "🎨"
    color_range: str = "10-15 colors"
    detail_level: str = "Medium"

    def to_config(self) -> Config:
        """Convert model profile to Config object"""
        config = Config()

        config.DEFAULT_NUM_COLORS = self.num_colors
        config.MIN_REGION_SIZE = self.min_region_size
        config.MAX_IMAGE_SIZE = self.max_image_size
        config.EDGE_THRESHOLD_LOW = self.edge_threshold_low
        config.EDGE_THRESHOLD_HIGH = self.edge_threshold_high
        config.BILATERAL_FILTER_D = self.bilateral_filter_d
        config.BILATERAL_SIGMA_COLOR = self.bilateral_sigma_color
        config.BILATERAL_SIGMA_SPACE = self.bilateral_sigma_space
        config.MORPHOLOGY_KERNEL_SIZE = self.morphology_kernel_size
        config.FONT_SCALE = self.font_scale
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
            'difficulty_level': self.difficulty_level,
            'recommended_for': self.recommended_for,
            'color_range': self.color_range,
            'detail_level': self.detail_level,
            'processing_time': self.processing_time_estimate,
            'preview_icon': self.preview_icon,
            'style_tags': self.style_tags,
        }


class ModelRegistry:
    """Registry of available processing models"""

    MODELS = {
        # Model 1: Classic Standard - Balanced approach
        'classic': ModelProfile(
            id='classic',
            name='Classic',
            display_name='Classic Standard',
            description='Our signature balanced approach perfect for most images. ' +
                       'Ideal blend of detail and simplicity.',
            difficulty_level='intermediate',
            recommended_for=[
                'First-time painters',
                'Portraits and photos',
                'General purpose',
                'Gift projects'
            ],
            num_colors=15,
            min_region_size=100,
            max_image_size=(1200, 1200),
            edge_threshold_low=50,
            edge_threshold_high=150,
            bilateral_filter_d=9,
            bilateral_sigma_color=75,
            bilateral_sigma_space=75,
            morphology_kernel_size=3,
            font_scale=0.5,
            palette_name='classic_18',
            style_tags=['balanced', 'versatile', 'popular'],
            color_range='12-18 colors',
            detail_level='Medium',
            preview_icon='⭐',
            processing_time_estimate='30-45 seconds'
        ),

        # Model 2: Simple Easy - For beginners
        'simple': ModelProfile(
            id='simple',
            name='Simple',
            display_name='Simple & Easy',
            description='Fewer colors and larger regions for quick, relaxing painting. ' +
                       'Perfect for beginners and children.',
            difficulty_level='beginner',
            recommended_for=[
                'Beginners and children',
                'Quick projects (2-4 hours)',
                'Relaxing activity',
                'Abstract and simple images'
            ],
            num_colors=10,
            min_region_size=200,
            max_image_size=(800, 800),
            edge_threshold_low=60,
            edge_threshold_high=140,
            bilateral_filter_d=11,
            bilateral_sigma_color=90,
            bilateral_sigma_space=90,
            morphology_kernel_size=5,
            font_scale=0.6,
            palette_name='classic_12',
            style_tags=['beginner', 'easy', 'quick'],
            color_range='8-12 colors',
            detail_level='Low',
            preview_icon='🌟',
            processing_time_estimate='25-35 seconds'
        ),

        # Model 3: Detailed Pro - For experienced painters
        'detailed': ModelProfile(
            id='detailed',
            name='Detailed',
            display_name='Detailed Professional',
            description='Maximum detail with more colors and finer regions. ' +
                       'For experienced painters seeking a challenge.',
            difficulty_level='advanced',
            recommended_for=[
                'Experienced painters',
                'Complex images',
                'High-detail portraits',
                'Professional results'
            ],
            num_colors=24,
            min_region_size=50,
            max_image_size=(1800, 1800),
            edge_threshold_low=40,
            edge_threshold_high=160,
            bilateral_filter_d=7,
            bilateral_sigma_color=60,
            bilateral_sigma_space=60,
            morphology_kernel_size=2,
            font_scale=0.35,
            palette_name='classic_24',
            style_tags=['advanced', 'detailed', 'professional'],
            color_range='20-24 colors',
            detail_level='High',
            preview_icon='💎',
            processing_time_estimate='45-75 seconds'
        ),

        # Model 4: Artistic Painterly - Stylized effect
        'artistic': ModelProfile(
            id='artistic',
            name='Artistic',
            display_name='Artistic Painterly',
            description='Enhanced color blending with a painterly, artistic effect. ' +
                       'Creates a more impressionistic final result.',
            difficulty_level='intermediate',
            recommended_for=[
                'Creative projects',
                'Landscapes and nature',
                'Artistic interpretation',
                'Unique gifts'
            ],
            num_colors=18,
            min_region_size=120,
            max_image_size=(1400, 1400),
            edge_threshold_low=35,
            edge_threshold_high=120,
            bilateral_filter_d=13,
            bilateral_sigma_color=100,
            bilateral_sigma_space=100,
            morphology_kernel_size=4,
            font_scale=0.45,
            palette_name='vibrant_18',
            style_tags=['artistic', 'creative', 'impressionistic'],
            color_range='15-18 colors',
            detail_level='Medium-High',
            preview_icon='🎭',
            processing_time_estimate='35-50 seconds'
        ),

        # Model 5: Vibrant Bold - Bold colors and high contrast
        'vibrant': ModelProfile(
            id='vibrant',
            name='Vibrant',
            display_name='Vibrant & Bold',
            description='Enhanced saturation and bold colors for eye-catching results. ' +
                       'Perfect for modern and pop art styles.',
            difficulty_level='intermediate',
            recommended_for=[
                'Modern art style',
                'Pop art and bold images',
                'High contrast photos',
                'Statement pieces'
            ],
            num_colors=16,
            min_region_size=90,
            max_image_size=(1300, 1300),
            edge_threshold_low=55,
            edge_threshold_high=155,
            bilateral_filter_d=8,
            bilateral_sigma_color=70,
            bilateral_sigma_space=70,
            morphology_kernel_size=3,
            font_scale=0.5,
            palette_name='vibrant_18',
            style_tags=['bold', 'colorful', 'modern'],
            color_range='14-18 colors',
            detail_level='Medium',
            preview_icon='🔥',
            processing_time_estimate='30-45 seconds'
        ),

        # Model 6: Pastel Soft - Gentle, muted colors
        'pastel': ModelProfile(
            id='pastel',
            name='Pastel',
            display_name='Pastel & Soft',
            description='Gentle, muted colors for a soft and soothing aesthetic. ' +
                       'Ideal for calming, delicate subjects.',
            difficulty_level='beginner',
            recommended_for=[
                'Delicate subjects',
                'Baby rooms and nurseries',
                'Relaxing projects',
                'Gentle aesthetics'
            ],
            num_colors=12,
            min_region_size=150,
            max_image_size=(1000, 1000),
            edge_threshold_low=45,
            edge_threshold_high=135,
            bilateral_filter_d=10,
            bilateral_sigma_color=85,
            bilateral_sigma_space=85,
            morphology_kernel_size=4,
            font_scale=0.55,
            palette_name='pastel_12',
            style_tags=['soft', 'gentle', 'calming'],
            color_range='10-12 colors',
            detail_level='Low-Medium',
            preview_icon='🌸',
            processing_time_estimate='25-40 seconds'
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
        """Get the default model (Classic)"""
        return cls.MODELS['classic']

    @classmethod
    def get_recommended_model(cls, image_complexity: str = 'medium',
                            user_experience: str = 'beginner') -> ModelProfile:
        """
        Get recommended model based on image and user characteristics

        Args:
            image_complexity: 'simple', 'medium', 'complex'
            user_experience: 'beginner', 'intermediate', 'advanced'

        Returns:
            Recommended ModelProfile
        """
        recommendations = {
            ('simple', 'beginner'): 'simple',
            ('simple', 'intermediate'): 'classic',
            ('simple', 'advanced'): 'artistic',
            ('medium', 'beginner'): 'classic',
            ('medium', 'intermediate'): 'classic',
            ('medium', 'advanced'): 'detailed',
            ('complex', 'beginner'): 'classic',
            ('complex', 'intermediate'): 'detailed',
            ('complex', 'advanced'): 'detailed',
        }

        model_id = recommendations.get((image_complexity, user_experience), 'classic')
        return cls.MODELS[model_id]


def get_model_comparison() -> Dict[str, Any]:
    """
    Get a comparison table of all models

    Returns:
        Dictionary with model comparison data
    """
    return {
        'models': ModelRegistry.get_models_list(),
        'comparison_factors': [
            'Difficulty Level',
            'Number of Colors',
            'Detail Level',
            'Processing Time',
            'Best For'
        ]
    }
