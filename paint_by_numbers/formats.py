"""
Standard Paper Formats for Paint by Numbers Templates

Provides A-series paper sizes with proper aspect ratio handling.
Ensures all templates output to standard, frameable sizes.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Tuple
import numpy as np

try:
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    from .utils.opencv import require_cv2


class FitMode(Enum):
    """How to fit image into standard format"""
    CONTAIN = "contain"  # Fit inside, add white borders if needed
    COVER = "cover"      # Fill entire canvas, may crop edges
    FIT = "fit"          # Stretch to fit (may distort aspect ratio)


@dataclass
class PaperFormat:
    """Standard paper format specification"""
    name: str
    display_name: str
    width_mm: int
    height_mm: int
    dpi: int = 300
    description: str = ""
    recommended_for: list = None
    price_modifier: float = 1.0  # Multiplier for pricing

    @property
    def width_inches(self) -> float:
        """Width in inches"""
        return self.width_mm / 25.4

    @property
    def height_inches(self) -> float:
        """Height in inches"""
        return self.height_mm / 25.4

    @property
    def width_pixels(self) -> int:
        """Width in pixels at specified DPI"""
        return int(self.width_inches * self.dpi)

    @property
    def height_pixels(self) -> int:
        """Height in pixels at specified DPI"""
        return int(self.height_inches * self.dpi)

    @property
    def dimensions(self) -> Tuple[int, int]:
        """Get (width, height) in pixels"""
        return (self.width_pixels, self.height_pixels)

    @property
    def aspect_ratio(self) -> float:
        """Aspect ratio (width/height)"""
        return self.width_mm / self.height_mm

    def to_dict(self) -> dict:
        """Convert to dictionary for API"""
        return {
            'name': self.name,
            'display_name': self.display_name,
            'width_mm': self.width_mm,
            'height_mm': self.height_mm,
            'width_inches': round(self.width_inches, 1),
            'height_inches': round(self.height_inches, 1),
            'width_pixels': self.width_pixels,
            'height_pixels': self.height_pixels,
            'dpi': self.dpi,
            'aspect_ratio': round(self.aspect_ratio, 2),
            'description': self.description,
            'recommended_for': self.recommended_for or [],
            'price_modifier': self.price_modifier,
        }


class FormatRegistry:
    """Registry of available paper formats"""

    FORMATS = {
        'a4': PaperFormat(
            name='a4',
            display_name='A4 (Standard)',
            width_mm=210,
            height_mm=297,
            dpi=300,
            description='Perfect for desk display and easy framing',
            recommended_for=['Portraits', 'Simple images', 'First-time customers', 'Gifts'],
            price_modifier=1.0,
        ),
        'a4_landscape': PaperFormat(
            name='a4_landscape',
            display_name='A4 Landscape',
            width_mm=297,
            height_mm=210,
            dpi=300,
            description='Wide format perfect for landscapes and panoramas',
            recommended_for=['Landscapes', 'Wide photos', 'Scenic views'],
            price_modifier=1.0,
        ),
        'a3': PaperFormat(
            name='a3',
            display_name='A3 (Large)',
            width_mm=297,
            height_mm=420,
            dpi=300,
            description='Large format for detailed work and wall art',
            recommended_for=['Detailed images', 'Wall art', 'Advanced painters', 'Living room display'],
            price_modifier=1.5,
        ),
        'a3_landscape': PaperFormat(
            name='a3_landscape',
            display_name='A3 Landscape',
            width_mm=420,
            height_mm=297,
            dpi=300,
            description='Extra-wide format for panoramic scenes',
            recommended_for=['Panoramas', 'Wide landscapes', 'Group photos'],
            price_modifier=1.5,
        ),
        'square_medium': PaperFormat(
            name='square_medium',
            display_name='Square (Medium)',
            width_mm=250,
            height_mm=250,
            dpi=300,
            description='Perfect square format for modern aesthetic',
            recommended_for=['Instagram photos', 'Modern decor', 'Portraits'],
            price_modifier=1.2,
        ),
        'square_large': PaperFormat(
            name='square_large',
            display_name='Square (Large)',
            width_mm=350,
            height_mm=350,
            dpi=300,
            description='Large square format for statement pieces',
            recommended_for=['Feature wall art', 'Bold images', 'Modern homes'],
            price_modifier=1.6,
        ),
    }

    @classmethod
    def get_format(cls, name: str) -> PaperFormat:
        """Get format by name"""
        return cls.FORMATS.get(name)

    @classmethod
    def get_all_formats(cls) -> dict:
        """Get all formats"""
        return cls.FORMATS.copy()

    @classmethod
    def get_formats_list(cls) -> list:
        """Get list of formats as dictionaries"""
        return [fmt.to_dict() for fmt in cls.FORMATS.values()]

    @classmethod
    def recommend_format(cls, image_width: int, image_height: int) -> PaperFormat:
        """
        Recommend best format based on image dimensions

        Args:
            image_width: Image width in pixels
            image_height: Image height in pixels

        Returns:
            Recommended PaperFormat
        """
        aspect_ratio = image_width / image_height

        # Very wide images (panoramas)
        if aspect_ratio > 1.8:
            return cls.FORMATS['a3_landscape']

        # Wide images
        elif aspect_ratio > 1.3:
            return cls.FORMATS['a4_landscape']

        # Very tall images
        elif aspect_ratio < 0.6:
            return cls.FORMATS['a3']

        # Tall images
        elif aspect_ratio < 0.8:
            return cls.FORMATS['a4']

        # Square-ish images (0.8 - 1.2 ratio)
        elif 0.8 <= aspect_ratio <= 1.2:
            # Choose size based on resolution
            if image_width >= 2000 or image_height >= 2000:
                return cls.FORMATS['square_large']
            else:
                return cls.FORMATS['square_medium']

        # Default to A4 portrait
        else:
            return cls.FORMATS['a4']


class ImageFormatter:
    """Handles fitting images into standard paper formats"""

    @staticmethod
    def fit_image(
        image: np.ndarray,
        target_format: PaperFormat,
        mode: FitMode = FitMode.CONTAIN,
        background_color: Tuple[int, int, int] = (255, 255, 255)
    ) -> np.ndarray:
        """
        Fit image into target format

        Args:
            image: Input image (RGB)
            target_format: Target paper format
            mode: How to fit the image
            background_color: Background color for borders (RGB)

        Returns:
            Formatted image
        """
        target_width, target_height = target_format.dimensions
        img_height, img_width = image.shape[:2]

        if mode == FitMode.CONTAIN:
            return ImageFormatter._fit_contain(
                image, target_width, target_height, background_color
            )
        elif mode == FitMode.COVER:
            return ImageFormatter._fit_cover(
                image, target_width, target_height
            )
        elif mode == FitMode.FIT:
            return ImageFormatter._fit_stretch(
                image, target_width, target_height
            )
        else:
            raise ValueError(f"Unknown fit mode: {mode}")

    @staticmethod
    def _fit_contain(
        image: np.ndarray,
        target_width: int,
        target_height: int,
        background_color: Tuple[int, int, int]
    ) -> np.ndarray:
        """
        Fit image inside target dimensions with borders
        Preserves aspect ratio, adds white space
        """
        img_height, img_width = image.shape[:2]

        # Calculate scaling to fit inside
        scale_w = target_width / img_width
        scale_h = target_height / img_height
        scale = min(scale_w, scale_h)

        # Resize image
        new_width = int(img_width * scale)
        new_height = int(img_height * scale)
        cv2 = require_cv2()
        resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)

        # Create canvas with background color
        canvas = np.full((target_height, target_width, 3), background_color, dtype=np.uint8)

        # Center the image
        y_offset = (target_height - new_height) // 2
        x_offset = (target_width - new_width) // 2

        canvas[y_offset:y_offset+new_height, x_offset:x_offset+new_width] = resized

        return canvas

    @staticmethod
    def _fit_cover(
        image: np.ndarray,
        target_width: int,
        target_height: int
    ) -> np.ndarray:
        """
        Fill entire canvas, crop if needed
        Preserves aspect ratio, may crop edges
        """
        img_height, img_width = image.shape[:2]

        # Calculate scaling to cover
        scale_w = target_width / img_width
        scale_h = target_height / img_height
        scale = max(scale_w, scale_h)

        # Resize image
        new_width = int(img_width * scale)
        new_height = int(img_height * scale)
        cv2 = require_cv2()
        resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)

        # Center crop
        y_offset = (new_height - target_height) // 2
        x_offset = (new_width - target_width) // 2

        cropped = resized[y_offset:y_offset+target_height, x_offset:x_offset+target_width]

        return cropped

    @staticmethod
    def _fit_stretch(
        image: np.ndarray,
        target_width: int,
        target_height: int
    ) -> np.ndarray:
        """
        Stretch to fit exactly
        May distort aspect ratio
        """
        cv2 = require_cv2()
        return cv2.resize(image, (target_width, target_height), interpolation=cv2.INTER_LANCZOS4)

    @staticmethod
    def preview_fit(
        image: np.ndarray,
        target_format: PaperFormat,
        mode: FitMode = FitMode.CONTAIN
    ) -> dict:
        """
        Preview how image will fit without actually processing

        Returns:
            Dictionary with fit information
        """
        img_height, img_width = image.shape[:2]
        target_width, target_height = target_format.dimensions

        img_ratio = img_width / img_height
        target_ratio = target_width / target_height

        result = {
            'format': target_format.display_name,
            'target_size': f"{target_width}x{target_height}",
            'mode': mode.value,
            'image_ratio': round(img_ratio, 2),
            'target_ratio': round(target_ratio, 2),
        }

        if mode == FitMode.CONTAIN:
            scale = min(target_width / img_width, target_height / img_height)
            result['action'] = 'Fit with borders'
            result['final_image_size'] = f"{int(img_width * scale)}x{int(img_height * scale)}"
            result['will_crop'] = False
            result['will_add_borders'] = scale < 1.0 or img_ratio != target_ratio

        elif mode == FitMode.COVER:
            scale = max(target_width / img_width, target_height / img_height)
            result['action'] = 'Fill canvas (may crop)'
            result['final_image_size'] = f"{target_width}x{target_height}"
            result['will_crop'] = scale > 1.0 or img_ratio != target_ratio
            result['will_add_borders'] = False

        elif mode == FitMode.FIT:
            result['action'] = 'Stretch to fit'
            result['final_image_size'] = f"{target_width}x{target_height}"
            result['will_crop'] = False
            result['will_add_borders'] = False
            result['may_distort'] = img_ratio != target_ratio

        return result


def get_format_comparison() -> dict:
    """Get comparison of all formats"""
    formats = FormatRegistry.get_formats_list()

    return {
        'formats': formats,
        'size_categories': {
            'small': ['a4', 'a4_landscape', 'square_medium'],
            'large': ['a3', 'a3_landscape', 'square_large'],
        },
        'orientation': {
            'portrait': ['a4', 'a3'],
            'landscape': ['a4_landscape', 'a3_landscape'],
            'square': ['square_medium', 'square_large'],
        }
    }


@dataclass
class GridSpec:
    """Grid specification for region snapping and tile-based instructions"""
    tile_rows: int  # Number of tile rows (e.g., 4)
    tile_cols: int  # Number of tile columns (e.g., 4)
    total_tiles: int  # Total tiles (tile_rows × tile_cols)
    target_regions: int  # Target number of paintable regions
    regions_per_tile: int  # Approximate regions per tile

    def get_tile_index(self, row: int, col: int) -> int:
        """Get linear tile index from row/col (1-based)"""
        return (row - 1) * self.tile_cols + col


def calculate_grid_spec(
    paper_format: PaperFormat,
    target_regions: int = 10000,
    tile_rows: int = 4,
    tile_cols: int = 4
) -> GridSpec:
    """
    Calculate optimal grid specification for a paper format.
    Used for tile-based instruction booklets similar to QBRIX diamond paintings.

    Args:
        paper_format: Paper format to use
        target_regions: Target number of paintable regions (~10k for A4)
        tile_rows: Number of tile rows for instructions (default 4)
        tile_cols: Number of tile columns for instructions (default 4)

    Returns:
        GridSpec with tile layout information
    """
    total_tiles = tile_rows * tile_cols
    regions_per_tile = target_regions // total_tiles

    return GridSpec(
        tile_rows=tile_rows,
        tile_cols=tile_cols,
        total_tiles=total_tiles,
        target_regions=target_regions,
        regions_per_tile=regions_per_tile
    )


def get_default_grid_spec(format_name: str) -> GridSpec:
    """
    Get default grid specification for a format.

    Args:
        format_name: Format name (e.g., 'a4', 'a3')

    Returns:
        GridSpec with sensible defaults
    """
    paper_format = FormatRegistry.get_format(format_name)

    # A4 formats: 4×4 tiles, ~10k regions
    if format_name in ['a4', 'a4_landscape', 'square_medium']:
        return calculate_grid_spec(paper_format, target_regions=10000, tile_rows=4, tile_cols=4)

    # A3 formats: 5×5 tiles, ~20k regions (more detail for larger canvas)
    elif format_name in ['a3', 'a3_landscape', 'square_large']:
        return calculate_grid_spec(paper_format, target_regions=20000, tile_rows=5, tile_cols=5)

    # Default fallback
    else:
        return calculate_grid_spec(paper_format, target_regions=10000, tile_rows=4, tile_cols=4)
