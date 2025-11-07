"""
Configuration module for Paint-by-Numbers System
"""

from typing import Optional
import yaml
from pathlib import Path


class Config:
    """Configuration settings for the paint-by-numbers generator"""

    # Image Processing
    MAX_IMAGE_SIZE = (1200, 1200)  # Maximum dimensions for processing (backend limit)
    MIN_IMAGE_SIZE = (400, 400)    # Minimum dimensions for good results
    # IMPORTANT: Frontend PortraitCropSelector must stay within MAX_IMAGE_SIZE
    # to prevent memory issues and crashes
    AUTO_WHITE_BALANCE = True      # Apply gray-world white balance correction
    WHITE_BALANCE_CLIP = 0.01      # Clip percentile for white balance scaling
    APPLY_DENOISE = True           # Run fast denoising prior to clustering
    DENOISE_STRENGTH = 7           # Strength for luminance denoising
    DENOISE_COLOR_STRENGTH = 7     # Strength for chroma denoising
    APPLY_LOCAL_CONTRAST = True    # Use CLAHE based local contrast enhancement
    CLAHE_CLIP_LIMIT = 2.5         # Clip limit for CLAHE
    CLAHE_TILE_GRID_SIZE = (8, 8)  # Tile grid for CLAHE (must be tuple)
    APPLY_TONE_BALANCE = True      # Normalize global brightness before clustering
    TONE_BALANCE_TARGET = 0.55     # Desired normalized luminance (0-1)
    APPLY_SHARPENING = True        # Apply unsharp masking for edge clarity
    SHARPEN_RADIUS = 3             # Radius for Gaussian blur in unsharp mask
    SHARPEN_AMOUNT = 0.6           # Sharpening amount (0-1 suggested)

    # Color Quantization
    DEFAULT_NUM_COLORS = 15        # Default number of colors
    MIN_NUM_COLORS = 5
    MAX_NUM_COLORS = 30
    COLOR_SAMPLE_FRACTION = 0.3    # Fraction of pixels to sample for clustering
    KMEANS_COLOR_SPACE = "lab"     # Color space for clustering (rgb, lab, hsv)
    PALETTE_DISTANCE_METRIC = "lab"  # Metric for palette projection

    # Unified Palette - BUSINESS MODEL: USE FIXED COLORS FOR REUSABLE PAINT KITS
    # This allows customers to buy ONE paint kit and paint MULTIPLE templates!
    USE_UNIFIED_PALETTE = True     # RECOMMENDED: Use predefined fixed color palette
    UNIFIED_PALETTE_NAME = "classic_18"  # Default: 18-color Creative Kit palette

    # Business Benefits:
    # - Customers buy standardized paint kits (Starter/Creative/Professional)
    # - Same kit works for many templates = better value
    # - Predictable inventory and supply chain
    # - Recurring revenue through subscriptions
    # - Lower customer acquisition cost

    # Region Detection
    MIN_REGION_SIZE = 100          # Minimum pixels for a region to be numbered
    MORPHOLOGY_KERNEL_SIZE = 3     # Kernel size for morphological operations
    MORPH_CLOSE_ITERATIONS = 1     # Closing passes for mask cleanup
    MORPH_OPEN_ITERATIONS = 1      # Opening passes for mask cleanup
    BILATERAL_FILTER_D = 9         # Bilateral filter diameter
    BILATERAL_SIGMA_COLOR = 75     # Bilateral filter sigma color
    BILATERAL_SIGMA_SPACE = 75     # Bilateral filter sigma space

    # Contour Detection
    CONTOUR_THICKNESS = 2          # Thickness of contour lines
    CONTOUR_COLOR = (0, 0, 0)      # Black contours
    EDGE_THRESHOLD_LOW = 50        # Canny edge detection low threshold
    EDGE_THRESHOLD_HIGH = 150      # Canny edge detection high threshold

    # Number Placement - ENHANCED FOR CRYSTAL-CLEAR VISIBILITY
    FONT_SCALE = 0.6               # Font size for numbers (bigger = easier to read)
    FONT_THICKNESS = 2             # Font thickness (bold numbers)
    FONT_OUTLINE_THICKNESS = 4     # White outline thickness for contrast
    NUMBER_CONTRAST_BOOST = True   # Add white halo around numbers for visibility
    NUMBER_COLOR = (0, 0, 0)       # Black numbers
    MIN_NUMBER_SPACING = 30        # Minimum pixels between numbers

    # Color Style Processing - NEW FEATURE
    COLOR_STYLE = "natural"        # 'natural', 'vintage', 'pop_art'
    SATURATION_BOOST = 1.0         # Color saturation multiplier (1.0 = normal)
    WARMTH_ADJUSTMENT = 0          # Warm/cool shift (-20 to +20)

    # Output
    TEMPLATE_BACKGROUND = (255, 255, 255)  # White background
    LEGEND_SWATCH_SIZE = 40        # Size of color swatches in legend
    LEGEND_PADDING = 20            # Padding in legend
    DPI = 300                      # DPI for saved images
    GENERATE_SVG = False           # Generate SVG output
    GENERATE_PDF = False           # Generate PDF kit

    # Logging
    LOG_LEVEL = "INFO"             # Logging level (DEBUG, INFO, WARNING, ERROR)
    LOG_FILE = None                # Optional log file path

    # Processing
    USE_ANTIALIASING = True        # Use antialiasing for smoother edges
    GAUSSIAN_BLUR_KERNEL = (3, 3)  # Kernel for Gaussian blur preprocessing
    SHOW_PROGRESS = True           # Show progress bars

    # Intelligence & Analysis
    ANALYSIS_SAMPLE_SIZE = 10000   # Number of pixels to sample for analysis
    SMALL_REGION_THRESHOLD = 200   # Pixel threshold for small region detection
    BRIGHTNESS_THRESHOLD = 200     # Brightness value (0-255) for light color detection

    def __init__(self, preset: Optional[str] = None):
        """
        Initialize config with optional preset

        Args:
            preset: Preset name ('beginner', 'intermediate', 'advanced', 'professional')
        """
        if preset:
            self.apply_preset(preset)

    def apply_preset(self, preset_name: str):
        """
        Apply a configuration preset

        Args:
            preset_name: Name of the preset to apply
        """
        presets = {
            "beginner": {
                "DEFAULT_NUM_COLORS": 10,
                "MIN_REGION_SIZE": 200,
                "MAX_IMAGE_SIZE": (800, 800),
                "FONT_SCALE": 0.6,
                "USE_UNIFIED_PALETTE": True,
                "UNIFIED_PALETTE_NAME": "classic_12",
            },
            "intermediate": {
                "DEFAULT_NUM_COLORS": 15,
                "MIN_REGION_SIZE": 100,
                "MAX_IMAGE_SIZE": (1200, 1200),
                "FONT_SCALE": 0.5,
                "USE_UNIFIED_PALETTE": True,
                "UNIFIED_PALETTE_NAME": "classic_18",
            },
            "advanced": {
                "DEFAULT_NUM_COLORS": 20,
                "MIN_REGION_SIZE": 75,
                "MAX_IMAGE_SIZE": (1500, 1500),
                "FONT_SCALE": 0.4,
                "USE_UNIFIED_PALETTE": True,
                "UNIFIED_PALETTE_NAME": "classic_24",
            },
            "professional": {
                "DEFAULT_NUM_COLORS": 25,
                "MIN_REGION_SIZE": 50,
                "MAX_IMAGE_SIZE": (2000, 2000),
                "FONT_SCALE": 0.35,
                "USE_UNIFIED_PALETTE": True,
                "UNIFIED_PALETTE_NAME": "classic_24",
                "GENERATE_SVG": True,
                "GENERATE_PDF": True,
            },
            "ultra_detailed": {
                "DEFAULT_NUM_COLORS": 30,
                "MIN_REGION_SIZE": 35,
                "MAX_IMAGE_SIZE": (4960, 7016),  # A2 size @ 300 DPI for MAXIMUM clarity
                "FONT_SCALE": 0.28,
                "EDGE_THRESHOLD_LOW": 30,
                "EDGE_THRESHOLD_HIGH": 170,
                "BILATERAL_FILTER_D": 5,
                "BILATERAL_SIGMA_COLOR": 50,
                "BILATERAL_SIGMA_SPACE": 50,
                "MORPHOLOGY_KERNEL_SIZE": 2,
                "USE_UNIFIED_PALETTE": True,
                "UNIFIED_PALETTE_NAME": "classic_24",
                "GENERATE_SVG": True,
                "GENERATE_PDF": True,
                "APPLY_SHARPENING": True,
                "SHARPEN_AMOUNT": 1.0,  # Maximum sharpening for ultimate face clarity
                "SHARPEN_RADIUS": 4,  # Larger radius for better detail
                "CLAHE_CLIP_LIMIT": 3.5,  # Enhanced local contrast for faces
                "APPLY_LOCAL_CONTRAST": True,
                "APPLY_TONE_BALANCE": True,
                "AUTO_WHITE_BALANCE": True,
            },
        }

        if preset_name not in presets:
            available = ', '.join(presets.keys())
            raise ValueError(f"Unknown preset '{preset_name}'. Available: {available}")

        preset_config = presets[preset_name]
        for key, value in preset_config.items():
            setattr(self, key, value)

    def load_from_yaml(self, filepath: str):
        """
        Load configuration from YAML file

        Args:
            filepath: Path to YAML config file
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {filepath}")

        with open(filepath, 'r') as f:
            config_data = yaml.safe_load(f)

        # Apply configuration
        for key, value in config_data.items():
            if hasattr(self, key):
                # Convert tuples from lists
                if key.endswith('_SIZE') or key.endswith('_KERNEL') or key.endswith('_COLOR') or key == 'TEMPLATE_BACKGROUND':
                    if isinstance(value, list):
                        value = tuple(value)
                setattr(self, key, value)

    def save_to_yaml(self, filepath: str):
        """
        Save current configuration to YAML file

        Args:
            filepath: Path to save config file
        """
        config_data = {}

        # Get all uppercase attributes (configuration values)
        for attr in dir(self):
            if attr.isupper() and not attr.startswith('_'):
                value = getattr(self, attr)
                # Convert tuples to lists for YAML
                if isinstance(value, tuple):
                    value = list(value)
                config_data[attr] = value

        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False, sort_keys=False)

    def to_dict(self) -> dict:
        """
        Convert configuration to dictionary

        Returns:
            Dictionary of configuration values
        """
        config_data = {}
        for attr in dir(self):
            if attr.isupper() and not attr.startswith('_'):
                config_data[attr] = getattr(self, attr)
        return config_data
