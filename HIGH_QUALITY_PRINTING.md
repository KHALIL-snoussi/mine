# High-Quality Print Canvas Guide

## 🎨 Professional Paint-by-Numbers for Large Canvases

This guide explains how to generate professional-quality paint-by-numbers templates optimized for printing on large canvases (50×35 cm and larger).

## ✨ Key Features

### 🖼️ High Resolution Output
- **5906×4134 pixels** for 50×35 cm canvas @ 300 DPI
- **7087×4724 pixels** for 60×40 cm canvas @ 300 DPI
- **8268×5906 pixels** for 70×50 cm canvas @ 300 DPI
- 300 DPI metadata embedded in PNG/JPG files for perfect printing
- No downsampling during processing—high resolution throughout

### 🧾 Vector Output (SVG)
- Infinitely scalable vector graphics
- Each paint region as separate path/polygon
- Sharp lines at any zoom level
- Perfect for professional print shops

### 🎨 Smart Color Quantization
- Up to **36 colors** (increased from 30)
- K-means clustering in **Lab color space** (perceptually accurate)
- Smart color distribution to avoid similar adjacent colors
- Optimized for portraits and detail-rich images

### 🌈 Contrast and Clarity Enhancement
- Auto-adjust contrast and brightness before segmentation
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Sharpening with unsharp mask (configurable strength)
- Tone balance for consistent luminance

### 🧼 Clean Region Boundaries
- Contour smoothing with adaptive epsilon
- Bilateral filtering for edge-preserving smoothing
- Anti-aliasing for professional-quality lines
- Morphological operations to clean masks

### 🔍 Small Region Management
- Automatic removal of regions < 50 pixels (adjustable)
- Merges tiny specks into nearest color
- Prevents regions too small to paint

### 📐 Aspect Ratio and Canvas Control
- Respects source image aspect ratio
- Standard canvas sizes: 50×35, 60×40, 70×50 cm
- Configurable DPI (default 300)
- Options to crop or pad to fit canvas

## 🚀 Quick Start

### Basic Usage

Generate a 50×35 cm canvas (default):

```bash
python generate_hq_canvas.py your_image.jpg
```

### Advanced Options

Generate 60×40 cm canvas with 30 colors:

```bash
python generate_hq_canvas.py your_image.jpg --canvas-size 60x40 --colors 30
```

Generate 70×50 cm canvas without SVG:

```bash
python generate_hq_canvas.py your_image.jpg --canvas-size 70x50 --no-svg
```

Custom output directory:

```bash
python generate_hq_canvas.py your_image.jpg -o my_print_project/
```

## 📋 Canvas Specifications

### 50×35 cm Canvas (Default)
- **Pixels:** 5906×4134 @ 300 DPI
- **Colors:** Up to 36
- **Min Region Size:** 50 pixels
- **Best For:** Detailed portraits, landscapes
- **Preset:** `print_quality_50x35`

### 60×40 cm Canvas
- **Pixels:** 7087×4724 @ 300 DPI
- **Colors:** Up to 36
- **Min Region Size:** 60 pixels
- **Best For:** Large wall art, premium prints
- **Preset:** `print_quality_60x40`

### 70×50 cm Canvas
- **Pixels:** 8268×5906 @ 300 DPI
- **Colors:** Up to 36
- **Min Region Size:** 75 pixels
- **Best For:** Statement pieces, commercial prints
- **Preset:** `print_quality_70x50`

## 📄 Output Files

The generator creates the following files:

1. **Template PNG** - Main paint-by-numbers template with numbered regions (300 DPI)
2. **Legend PNG** - Color legend showing all paint colors (300 DPI)
3. **Solution PNG** - Fully colored reference image (300 DPI)
4. **Guide PNG** - Faded color guide overlay (300 DPI)
5. **Comparison PNG** - Side-by-side original/template/solution (300 DPI)
6. **Template SVG** - Vector template (infinitely scalable)
7. **Legend SVG** - Vector legend (infinitely scalable)
8. **PDF Kit** - Complete paint-by-numbers kit with all materials

## 🖨️ Printing Tips

### For Best Results

1. **Use Professional Print Services**
   - Upload PNG or SVG files to print shops
   - Specify 300 DPI in print settings
   - Choose high-quality canvas or thick paper (250-300 gsm)

2. **Verify DPI Settings**
   - All PNG/JPG files have 300 DPI embedded metadata
   - Most print software will automatically detect this
   - If not detected, manually set to 300 DPI

3. **Choose the Right Format**
   - **PNG:** Best for most print shops, preserves quality
   - **SVG:** Best for maximum scalability and sharpness
   - **PDF:** All-in-one kit for easy printing

4. **Paper/Canvas Selection**
   - **Canvas:** 100% cotton canvas for authentic paint-by-numbers
   - **Paper:** 250-300 gsm thick art paper
   - **Finish:** Matte finish works best (not glossy)

5. **Color Matching**
   - Use the color legend PNG for paint matching
   - RGB values provided for each color
   - Consider standard acrylic paint sets (18-36 colors)

## ⚙️ Configuration Options

### Using Python API

```python
from paint_by_numbers.main import PaintByNumbersGenerator
from paint_by_numbers.config import Config

# Create config with print quality preset
config = Config(preset="print_quality_50x35")

# Customize settings
config.DEFAULT_NUM_COLORS = 36
config.MIN_REGION_SIZE = 50
config.GENERATE_SVG = True
config.GENERATE_PDF = True

# Generate
generator = PaintByNumbersGenerator(config)
result = generator.generate(
    input_path="input.jpg",
    output_dir="output_hq",
    paper_format="canvas_50x35"
)
```

### Available Presets

- `beginner` - 10 colors, 800×800 px
- `intermediate` - 15 colors, 1200×1200 px
- `advanced` - 20 colors, 1500×1500 px
- `professional` - 25 colors, 2000×2000 px
- `ultra_detailed` - 30 colors, A2 size (4960×7016 px)
- `print_quality_50x35` - 36 colors, 5906×4134 px ⭐ **NEW**
- `print_quality_60x40` - 36 colors, 7087×4724 px ⭐ **NEW**
- `print_quality_70x50` - 36 colors, 8268×5906 px ⭐ **NEW**

### Custom Config Parameters

```python
config = Config()

# Resolution
config.MAX_IMAGE_SIZE = (5906, 4134)  # 50×35 cm @ 300 DPI
config.DPI = 300

# Colors
config.DEFAULT_NUM_COLORS = 36
config.MAX_NUM_COLORS = 36
config.KMEANS_COLOR_SPACE = "lab"  # Perceptually accurate

# Region Detection
config.MIN_REGION_SIZE = 50  # Pixels
config.MORPHOLOGY_KERNEL_SIZE = 2

# Enhancement
config.APPLY_SHARPENING = True
config.SHARPEN_AMOUNT = 1.2
config.APPLY_LOCAL_CONTRAST = True
config.CLAHE_CLIP_LIMIT = 4.0

# Output
config.CONTOUR_THICKNESS = 2
config.GENERATE_SVG = True
config.GENERATE_PDF = True
```

## 🧪 Quality Validation

### Output Quality Checklist

✅ **Resolution:**
- PNG files are 5906×4134 px (or higher for larger canvases)
- No pixelation when zoomed in
- Sharp contours at 300% zoom

✅ **Color Separation:**
- No visually similar adjacent regions
- Clear color boundaries
- Distinct palette entries

✅ **Region Quality:**
- No tiny unpaintable regions
- Smooth boundaries without jagged edges
- Clear numbered regions

✅ **Print Readiness:**
- 300 DPI metadata embedded in files
- Correct physical dimensions (50×35 cm)
- Black contours clearly visible

### Testing Your Output

```bash
# Check image dimensions and DPI
identify -verbose output_hq/image_template.png | grep -E "Geometry|Resolution"

# Expected output:
# Geometry: 5906x4134+0+0
# Resolution: 300x300
```

## 🎨 Best Practices

### Image Selection

**Good Choices:**
- High-resolution photos (2000×2000 px or higher)
- Clear subjects with good contrast
- Portraits with defined features
- Landscapes with distinct elements

**Avoid:**
- Low-resolution images (will be upscaled but may lose quality)
- Very dark or overexposed photos
- Images with excessive noise or grain
- Extremely detailed textures (may create too many regions)

### Color Count Selection

- **24-30 colors:** Beginner-friendly, faster to paint
- **30-36 colors:** Rich detail, better for portraits
- **36 colors:** Maximum detail, professional quality

### Canvas Size Selection

- **50×35 cm:** Standard large canvas, desktop/wall display
- **60×40 cm:** Extra-large, statement pieces
- **70×50 cm:** Premium large canvas, feature walls

## 🔧 Troubleshooting

### Issue: Image too small

**Solution:** The intelligent upscaler will automatically enhance small images, but start with at least 1500×1500 px for best results.

### Issue: Too many small regions

**Solution:** Increase `MIN_REGION_SIZE` in config or reduce number of colors.

```python
config.MIN_REGION_SIZE = 75  # Larger threshold
config.DEFAULT_NUM_COLORS = 30  # Fewer colors
```

### Issue: Colors look similar

**Solution:** The system uses Lab color space to avoid this, but you can adjust:

```python
config.KMEANS_COLOR_SPACE = "lab"  # Perceptually accurate
config.PALETTE_DISTANCE_METRIC = "lab"
```

### Issue: Blurry output

**Solution:** Increase sharpening:

```python
config.APPLY_SHARPENING = True
config.SHARPEN_AMOUNT = 1.5  # Higher = sharper
config.SHARPEN_RADIUS = 5
```

### Issue: DPI not embedded

**Solution:** Ensure PIL (Pillow) is installed:

```bash
pip install Pillow
```

## 📚 Technical Details

### Color Quantization Algorithm

1. Convert image to Lab color space (perceptually uniform)
2. Sample 30% of pixels for performance
3. Run k-means clustering (or MiniBatchKMeans for large images)
4. Sort palette by brightness
5. Map all pixels to nearest palette color
6. Optimize palette mapping for perceptual quality

### Region Detection

1. Create binary masks for each color
2. Apply morphological operations (close, open)
3. Find contours using OpenCV
4. Filter regions below threshold
5. Merge nearby regions of same color
6. Smooth contours with adaptive epsilon

### Boundary Smoothing

1. Detect color boundaries (vectorized comparison)
2. Multi-scale Canny edge detection
3. Combine direct pixel comparison with Canny
4. Apply morphological closing for gaps
5. Thin edges to crisp 1-pixel lines
6. Apply Douglas-Peucker smoothing

### DPI Embedding

Images are saved using PIL (Pillow) with explicit DPI metadata:

```python
from PIL import Image
image = Image.fromarray(array)
image.save('output.png', dpi=(300, 300))
```

## 🎓 Examples

### Example 1: Portrait (50×35 cm)

```bash
python generate_hq_canvas.py portrait.jpg --colors 36
```

**Output:**
- 5906×4134 pixels @ 300 DPI
- 36 colors for rich skin tones
- Small regions merged for clean painting
- SVG for crisp facial features

### Example 2: Landscape (60×40 cm)

```bash
python generate_hq_canvas.py landscape.jpg --canvas-size 60x40 --colors 32
```

**Output:**
- 7087×4724 pixels @ 300 DPI
- 32 colors for sky, water, foliage
- Optimized for wide aspect ratio
- PDF kit with full materials

### Example 3: Abstract Art (70×50 cm)

```bash
python generate_hq_canvas.py abstract.jpg --canvas-size 70x50 --colors 36
```

**Output:**
- 8268×5906 pixels @ 300 DPI
- Maximum 36 colors for color richness
- Large regions for bold strokes
- Premium quality for galleries

## 📖 Additional Resources

- **Main Generator:** `paint_by_numbers/main.py`
- **Config Options:** `paint_by_numbers/config.py`
- **Canvas Formats:** `paint_by_numbers/formats.py`
- **Image Processing:** `paint_by_numbers/core/image_processor.py`
- **Color Quantization:** `paint_by_numbers/core/color_quantizer.py`

## 🙏 Support

For issues, questions, or feature requests, please check the main README or create an issue in the repository.

---

**Happy Painting! 🎨✨**
