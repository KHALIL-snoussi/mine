"""
Intelligence Module - Smart features for paint-by-numbers generation
"""

from .palette_selector import IntelligentPaletteSelector
from .difficulty_analyzer import DifficultyAnalyzer
from .quality_scorer import QualityScorer
from .color_optimizer import ColorOptimizer
from .kit_recommender import KitRecommender

__all__ = [
    'IntelligentPaletteSelector',
    'DifficultyAnalyzer',
    'QualityScorer',
    'ColorOptimizer',
    'KitRecommender',
]
