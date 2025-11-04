"""
Configuration module for Paint-by-Numbers System
"""

class Config:
    """Configuration settings for the paint-by-numbers generator"""

    # Image Processing
    MAX_IMAGE_SIZE = (1200, 1200)  # Maximum dimensions for processing
    MIN_IMAGE_SIZE = (400, 400)    # Minimum dimensions for good results

    # Color Quantization
    DEFAULT_NUM_COLORS = 15        # Default number of colors
    MIN_NUM_COLORS = 5
    MAX_NUM_COLORS = 30
    COLOR_SAMPLE_FRACTION = 0.3    # Fraction of pixels to sample for clustering

    # Region Detection
    MIN_REGION_SIZE = 100          # Minimum pixels for a region to be numbered
    MORPHOLOGY_KERNEL_SIZE = 3     # Kernel size for morphological operations
    BILATERAL_FILTER_D = 9         # Bilateral filter diameter
    BILATERAL_SIGMA_COLOR = 75     # Bilateral filter sigma color
    BILATERAL_SIGMA_SPACE = 75     # Bilateral filter sigma space

    # Contour Detection
    CONTOUR_THICKNESS = 2          # Thickness of contour lines
    CONTOUR_COLOR = (0, 0, 0)      # Black contours
    EDGE_THRESHOLD_LOW = 50        # Canny edge detection low threshold
    EDGE_THRESHOLD_HIGH = 150      # Canny edge detection high threshold

    # Number Placement
    FONT_SCALE = 0.5               # Font size for numbers
    FONT_THICKNESS = 1             # Font thickness
    NUMBER_COLOR = (0, 0, 0)       # Black numbers
    MIN_NUMBER_SPACING = 30        # Minimum pixels between numbers

    # Output
    TEMPLATE_BACKGROUND = (255, 255, 255)  # White background
    LEGEND_SWATCH_SIZE = 40        # Size of color swatches in legend
    LEGEND_PADDING = 20            # Padding in legend
    DPI = 300                      # DPI for saved images

    # Processing
    USE_ANTIALIASING = True        # Use antialiasing for smoother edges
    GAUSSIAN_BLUR_KERNEL = (3, 3)  # Kernel for Gaussian blur preprocessing
