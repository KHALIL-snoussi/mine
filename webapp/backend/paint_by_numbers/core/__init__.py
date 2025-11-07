"""Core processing modules for paint-by-numbers generation"""

from .image_processor import ImageProcessor
from .color_quantizer import ColorQuantizer
from .region_detector import RegionDetector, Region
from .contour_builder import ContourBuilder
from .number_placer import NumberPlacer

__all__ = [
    "ImageProcessor",
    "ColorQuantizer",
    "RegionDetector",
    "Region",
    "ContourBuilder",
    "NumberPlacer"
]
