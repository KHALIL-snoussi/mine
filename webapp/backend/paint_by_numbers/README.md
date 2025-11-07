# Paint by Numbers Generator 🎨

A sophisticated Python application that transforms any image into a paint-by-numbers template, inspired by Qbrix's modular system design. This tool uses advanced image processing, color quantization, and intelligent region detection to create professional-quality paint-by-numbers templates.

## Features ✨

- **Advanced Color Quantization**: K-means clustering with intelligent palette reduction
- **Smart Region Detection**: Automatic segmentation with morphological operations
- **Intelligent Number Placement**: Numbers positioned optimally in each region
- **Multiple Output Formats**: Templates, legends, solutions, and coloring guides
- **Configurable Settings**: Customize colors, sizes, and styles
- **Professional Quality**: High-DPI output suitable for printing
- **Modular Architecture**: Clean, maintainable code following Qbrix design principles

## System Architecture 🏗️

```
paint_by_numbers/
├── main.py                      # Main application entry point
├── config.py                    # Configuration settings
├── requirements.txt             # Python dependencies
│
├── core/                        # Core processing modules
│   ├── image_processor.py       # Image loading & preprocessing
│   ├── color_quantizer.py       # K-means color quantization
│   ├── region_detector.py       # Region segmentation
│   ├── contour_builder.py       # Contour/edge detection
│   └── number_placer.py         # Intelligent number placement
│
├── output/                      # Output generation modules
│   ├── template_generator.py    # Template creation
│   └── legend_generator.py      # Color legend generation
│
└── utils/                       # Utility functions
    └── helpers.py               # Helper functions
```

## Installation 🚀

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd paint_by_numbers
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## OpenCV Dependency Handling 🔧

This project uses **OpenCV (cv2)** as an optional dependency with graceful error handling. Here's how it works:

### How It Works

All modules that need OpenCV use the `require_cv2()` function from `utils/opencv.py`:

```python
from paint_by_numbers.utils.opencv import require_cv2

def process_image(self, image):
    cv2 = require_cv2()  # Import cv2 only when needed
    result = cv2.GaussianBlur(image, (5, 5), 0)
    return result
```

### Key Features

1. **Lazy Loading**: OpenCV is only imported when actually needed, not at module import time
2. **Module Caching**: Once loaded, cv2 is cached and reused (no redundant imports)
3. **Clear Error Messages**: If OpenCV is missing, you get a helpful error message:
   ```
   OpenCV (cv2) could not be imported. Install the 'opencv-python-headless'
   package and ensure system libraries such as libGL are present.
   ```

### Available Helper Functions

The `utils/opencv.py` module provides several helper functions:

- **`require_cv2()`**: Import and return cv2, or raise an error if unavailable
- **`get_cv2(raise_if_missing=False)`**: Get cv2 or return None if unavailable
- **`cv2_available()`**: Check if OpenCV is available (returns True/False)
- **`describe_missing_cv2()`**: Get detailed error message about why cv2 failed to load

### Example Usage

```python
from paint_by_numbers.utils.opencv import cv2_available, require_cv2

# Check availability before processing
if cv2_available():
    cv2 = require_cv2()
    # Use cv2 safely
else:
    print("OpenCV not available - using alternative method")
```

### Files Using OpenCV

The following modules use the `require_cv2()` pattern:
- `core/image_processor.py` - Image loading and preprocessing
- `core/color_quantizer.py` - Color reduction
- `core/region_detector.py` - Region segmentation
- `core/contour_builder.py` - Contour detection
- `core/number_placer.py` - Number placement
- `output/template_generator.py` - Template creation
- `output/legend_generator.py` - Legend generation
- `utils/helpers.py` - Helper utilities

All these modules call `require_cv2()` **once** at the beginning of each method that needs OpenCV, ensuring efficient and consistent dependency management.

## Usage 📖

### Basic Usage

Convert an image to paint-by-numbers:

```bash
python main.py input_image.jpg
```

This will create an `output/` directory with:
- `*_template.png` - The numbered template to paint
- `*_legend.png` - Color key with numbers
- `*_solution.png` - Completed reference image
- `*_guide.png` - Faded color guide
- `*_comparison.png` - Side-by-side comparison

### Advanced Options

```bash
# Specify number of colors (5-30)
python main.py input.jpg -c 20

# Custom output directory
python main.py input.jpg -o my_output

# Add reference grid
python main.py input.jpg --grid

# Different legend styles
python main.py input.jpg -l list      # Vertical list
python main.py input.jpg -l compact   # Compact grid

# Don't merge nearby regions
python main.py input.jpg --no-merge
```

### Complete Example

```bash
python main.py photo.jpg -c 15 -o results --grid -l grid
```

This creates a paint-by-numbers with 15 colors, adds a reference grid, uses grid-style legend, and saves to the `results/` directory.

## Python API 🐍

You can also use the system programmatically:

```python
from paint_by_numbers.main import PaintByNumbersGenerator

# Create generator
generator = PaintByNumbersGenerator()

# Generate paint-by-numbers
results = generator.generate(
    input_path="my_image.jpg",
    output_dir="output",
    n_colors=15,
    merge_similar=True,
    add_grid=False,
    legend_style="grid"
)

# Access generated file paths
print(f"Template: {results['template']}")
print(f"Legend: {results['legend']}")
print(f"Solution: {results['solution']}")
```

### Advanced API Usage

```python
from paint_by_numbers.config import Config
from paint_by_numbers.core.image_processor import ImageProcessor
from paint_by_numbers.core.color_quantizer import ColorQuantizer

# Custom configuration
config = Config()
config.DEFAULT_NUM_COLORS = 20
config.MIN_REGION_SIZE = 150

# Use individual components
processor = ImageProcessor(config)
image = processor.load_image("input.jpg")
processed = processor.preprocess(apply_bilateral=True)

quantizer = ColorQuantizer(config)
quantized, palette = quantizer.quantize(processed, n_colors=12)
```

## Configuration ⚙️

Customize behavior by modifying `config.py`:

```python
class Config:
    # Image Processing
    MAX_IMAGE_SIZE = (1200, 1200)

    # Color Quantization
    DEFAULT_NUM_COLORS = 15
    MIN_NUM_COLORS = 5
    MAX_NUM_COLORS = 30

    # Region Detection
    MIN_REGION_SIZE = 100

    # Contour Detection
    CONTOUR_THICKNESS = 2

    # Number Placement
    FONT_SCALE = 0.5
    MIN_NUMBER_SPACING = 30

    # Output
    DPI = 300
```

## How It Works 🔬

### 1. Image Preprocessing
- Loads and validates input image
- Resizes to optimal dimensions
- Applies bilateral filtering for edge-preserving smoothing
- Gaussian blur for noise reduction

### 2. Color Quantization
- Uses K-means clustering to reduce colors
- Samples pixels for faster processing on large images
- Sorts palette by brightness
- Merges similar colors if requested

### 3. Region Detection
- Creates masks for each color
- Applies morphological operations to clean regions
- Finds contours for each region
- Filters out small regions
- Merges nearby regions of same color

### 4. Contour Building
- Detects boundaries between color regions
- Smooths contours using Douglas-Peucker algorithm
- Creates clean outlines for template

### 5. Number Placement
- Uses distance transform to find optimal positions
- Places numbers in the visual center of each region
- Ensures minimum spacing between numbers
- Uses contrasting colors for visibility

### 6. Output Generation
- Generates numbered template
- Creates color legend with swatches
- Produces solution reference
- Creates coloring guide with faded colors
- Builds comparison image

## Examples 🖼️

### Input Image
Any image (JPG, PNG, etc.)

### Generated Outputs

1. **Template** - Clean outline with numbers
2. **Legend** - Color key showing which number corresponds to which color
3. **Solution** - The finished reference image
4. **Guide** - Faded colors to help with painting
5. **Comparison** - Original, template, and solution side-by-side

## Tips for Best Results 💡

1. **Image Selection**
   - Choose images with clear subjects
   - Avoid extremely detailed or noisy images
   - Good contrast produces better results

2. **Number of Colors**
   - Start with 12-15 colors for beginners
   - Use 20-25 for intermediate complexity
   - Maximum 30 colors for advanced projects

3. **Image Size**
   - Larger images provide more detail
   - Recommended: 800x800 to 1200x1200 pixels
   - Too small: lack of detail
   - Too large: excessive regions

4. **Color Selection**
   - Photos work well
   - Landscapes and portraits are great
   - Abstract images create interesting patterns

## Troubleshooting 🔧

### Too Many Small Regions
- Increase `MIN_REGION_SIZE` in config
- Reduce number of colors
- Use `merge_similar=True`

### Numbers Not Visible
- Increase `FONT_SCALE` in config
- Increase `MIN_REGION_SIZE` to create larger regions

### Colors Too Similar
- Reduce number of colors
- Preprocess image to increase contrast

### Out of Memory
- Reduce `MAX_IMAGE_SIZE` in config
- Reduce `COLOR_SAMPLE_FRACTION`

## Technical Details 🔬

- **Language**: Python 3.8+
- **Image Processing**: OpenCV
- **Color Clustering**: scikit-learn (K-means)
- **Numerical Operations**: NumPy
- **Distance Calculations**: SciPy
- **Visualization**: Matplotlib

## Performance ⚡

- Small images (400x400): ~5-10 seconds
- Medium images (800x800): ~15-30 seconds
- Large images (1200x1200): ~30-60 seconds

Performance depends on:
- Number of colors
- Image complexity
- Region merging settings
- CPU speed

## Contributing 🤝

This project follows clean code principles and modular design inspired by Qbrix:

- **Modularity**: Each component has a single responsibility
- **Extensibility**: Easy to add new features
- **Configurability**: Extensive configuration options
- **Documentation**: Comprehensive docstrings
- **Type Hints**: Clear function signatures

## License 📄

This project is created for educational and creative purposes.

## Credits 🙏

- Inspired by Qbrix system architecture
- Uses OpenCV for image processing
- K-means clustering via scikit-learn
- Distance calculations via SciPy

## Future Enhancements 🚀

Potential improvements:
- GUI interface
- Web application
- Custom color palettes
- SVG output format
- Interactive region editing
- Batch processing
- Color name suggestions
- Print layout templates

## Support 💬

For issues, questions, or suggestions:
- Check the troubleshooting section
- Review configuration options
- Examine example outputs
- Modify config.py settings

---

**Happy Painting! 🎨**

Transform your photos into engaging paint-by-numbers projects with this professional-grade generator system.
