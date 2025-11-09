# 🎨 Premium Paint-by-Numbers Generator

## Professional-Grade Features

Your paint-by-numbers system has been upgraded to a **premium, professional-grade tool** with advanced features for both hobbyists and commercial applications.

---

## ✨ **New Premium Features**

### 1. 🎯 **Difficulty Preset System**

6 intelligent difficulty levels that auto-configure all settings:

| Level | Colors | Time | Best For |
|-------|--------|------|----------|
| 🎨 **Kids** | 8 | 1-2h | Children 6+, first-timers |
| 😊 **Easy** | 12 | 2-4h | Beginners, relaxation |
| 🎯 **Medium** | 18 | 4-8h | Casual painters, portraits |
| 💪 **Hard** | 24 | 8-15h | Experienced painters |
| 🏆 **Expert** | 30 | 15-25h | Advanced artists |
| ⭐ **Master** | 36 | 25-40h | Professional prints |

Each preset automatically configures:
- Number of colors
- Minimum region size
- Image resolution
- Font scaling
- Contour thickness
- Sharpening intensity
- SVG/PDF generation

### 2. 🏷️ **Named Color Mapping**

Transform RGB values into human-readable color names:

**Before:** `Color 1: RGB(135, 206, 235)`
**After:** `Color 1: Sky Blue`

- **350+ CSS/X11 color names** in database
- Perceptually accurate matching using Lab color space
- Paint mixing suggestions for each color
- Export to JSON for paint shopping lists

### 3. 📍 **Intelligent Number Placement**

Uses **pole-of-inaccessibility algorithm** to find the optimal label position:

- Finds the point furthest from region edges
- Better than simple centroid for irregular shapes
- Ensures numbers are always visible
- No numbers cut off by boundaries

### 4. ✅ **Quality Validation System**

Comprehensive checks before printing:

**Validates:**
- ✓ No unnumbered regions
- ✓ All palette colors used
- ✓ No duplicate numbers in proximity
- ✓ Region sizes are paintable
- ✓ Adjacent colors aren't too similar
- ✓ Complete image coverage
- ✓ Number visibility

**Outputs:**
- Detailed error/warning/info reports
- Statistical summary
- Recommendations for improvements

### 5. 🖼️ **High-Quality Canvas Output**

Professional print-ready templates:

- **300 DPI embedded metadata** in all PNG/JPG files
- **3 canvas sizes:** 50×35 cm, 60×40 cm, 70×50 cm
- **SVG vector output** for infinite scalability
- **PDF complete kits** with all materials
- No downsampling throughout pipeline

---

## 🚀 **Quick Start**

### Basic Usage

```bash
# Medium difficulty (recommended)
python generate_premium.py your_image.jpg

# Easy template for beginners
python generate_premium.py your_image.jpg --difficulty easy

# Master level for large canvas printing
python generate_premium.py your_image.jpg --difficulty master --canvas-size 50x35
```

### Advanced Usage

```bash
# Expert level with 28 colors and custom output
python generate_premium.py portrait.jpg --difficulty expert --colors 28 -o my_art/

# Master level with all features
python generate_premium.py landscape.jpg \
  --difficulty master \
  --canvas-size 60x40 \
  --colors 36

# Quick kids template without validation
python generate_premium.py drawing.jpg --difficulty kids --no-validate
```

---

## 📊 **Output Files**

### Standard Outputs

Every generation creates:

1. **`image_template.png`** - Template with numbers and outlines (300 DPI)
2. **`image_legend.png`** - Color legend with paint numbers
3. **`image_solution.png`** - Fully colored reference image
4. **`image_guide.png`** - Faded overlay for painting guidance
5. **`image_comparison.png`** - Side-by-side original/template/solution

### Premium Outputs

With premium features enabled:

6. **`image_template.svg`** - Vector template (infinitely scalable)
7. **`image_legend.svg`** - Vector legend
8. **`image_kit.pdf`** - Complete PDF kit with all materials
9. **`image_named_colors.json`** - Color names and RGB values
10. **`image_validation.json`** - Quality validation report

### Example Named Colors Output

```json
{
  "colors": [
    {
      "number": 1,
      "name": "Sky Blue",
      "rgb": [135, 206, 235],
      "hex": "#87ceeb"
    },
    {
      "number": 2,
      "name": "Forest Green",
      "rgb": [34, 139, 34],
      "hex": "#228b22"
    }
  ],
  "total_colors": 18
}
```

---

## 🎨 **Difficulty Preset Guide**

### When to Use Each Level

#### 🎨 **Kids (8 colors)**
- **Perfect for:**
  - Children 6-12 years old
  - Absolute beginners
  - Quick 1-hour projects
  - Simple shapes and designs

- **Features:**
  - Very large regions (easy to paint)
  - Bold, primary colors
  - Thick contour lines
  - Large numbers

#### 😊 **Easy (12 colors)**
- **Perfect for:**
  - Adults new to painting
  - Relaxation and mindfulness
  - Weekend projects
  - Gift paintings

- **Features:**
  - Manageable region sizes
  - Clear color separation
  - Simple compositions
  - 2-4 hour completion time

#### 🎯 **Medium (18 colors)** ⭐ *Recommended Default*
- **Perfect for:**
  - Regular hobby painters
  - Portrait paintings
  - Detailed landscapes
  - Home decoration

- **Features:**
  - Good detail without frustration
  - Rich color palette
  - Balanced difficulty
  - 4-8 hour projects

#### 💪 **Hard (24 colors)**
- **Perfect for:**
  - Experienced painters
  - Complex scenes
  - Pet portraits
  - Show pieces

- **Features:**
  - Fine details
  - Subtle color gradations
  - Smaller regions
  - 8-15 hour investment

#### 🏆 **Expert (30 colors)**
- **Perfect for:**
  - Advanced artists
  - Photorealistic attempts
  - Gallery-quality pieces
  - Challenging projects

- **Features:**
  - Very fine details
  - Maximum color richness
  - Tiny regions require precision
  - 15-25 hours of work

#### ⭐ **Master (36 colors)**
- **Perfect for:**
  - Professional artists
  - Large canvas prints (50×35 cm+)
  - Commercial products
  - Museum-quality reproductions

- **Features:**
  - Ultimate detail and accuracy
  - Print-ready at 300 DPI
  - Hundreds of regions
  - 25-40+ hours to complete

---

## 🖨️ **Printing Guide**

### For Home Printing

```bash
# Generate with A4 size
python generate_premium.py image.jpg --canvas-size a4

# Print at 100% scale (no scaling in print dialog)
# Use high-quality paper (200+ gsm)
```

### For Professional Printing

```bash
# Generate 50×35 cm canvas
python generate_premium.py image.jpg --difficulty master --canvas-size 50x35

# Take PNG or SVG to print shop
# Specify 300 DPI if asked
# Print on canvas or thick art paper (250-300 gsm)
```

### Print Specifications

| Canvas Size | Pixels | DPI | Physical Size |
|-------------|--------|-----|---------------|
| 50×35 cm | 5906×4134 | 300 | 19.7×13.8 in |
| 60×40 cm | 7087×4724 | 300 | 23.6×15.7 in |
| 70×50 cm | 8268×5906 | 300 | 27.6×19.7 in |
| A4 | 2480×3508 | 300 | 8.3×11.7 in |
| A3 | 3508×4961 | 300 | 11.7×16.5 in |

---

## 🔧 **Command Reference**

### Core Arguments

```bash
python generate_premium.py IMAGE [OPTIONS]
```

**Required:**
- `IMAGE` - Input image path

**Optional:**
- `-o, --output DIR` - Output directory (default: output_premium)
- `--difficulty LEVEL` - Difficulty preset (kids|easy|medium|hard|expert|master)
- `--canvas-size SIZE` - Canvas format (50x35|60x40|70x50|a4|a3)
- `--colors N` - Override number of colors
- `--no-validate` - Skip quality validation
- `--no-named-colors` - Skip color naming
- `--no-svg` - Skip SVG generation
- `--no-pdf` - Skip PDF generation
- `--grid` - Add reference grid
- `--list-difficulties` - Show all presets and exit

---

## 💡 **Pro Tips**

### Choosing the Right Difficulty

1. **Image Complexity:** Simple photos → Easy/Medium, Complex photos → Hard/Expert
2. **Available Time:** Quick project → Kids/Easy, Long-term → Expert/Master
3. **Skill Level:** Match your experience to preset skill level
4. **Canvas Size:** Larger canvas → Higher difficulty recommended

### Getting the Best Results

1. **Use High-Resolution Input**
   - At least 1500×1500 px for good results
   - 2000×2000 px+ for master level

2. **Choose Appropriate Colors**
   - Portraits: 18-30 colors for skin tones
   - Landscapes: 24-36 colors for detail
   - Simple graphics: 8-15 colors

3. **Validate Before Printing**
   - Always check validation report
   - Address warnings about tiny regions
   - Verify color usage

4. **Use Named Colors for Paint Shopping**
   - Check `named_colors.json`
   - Match to standard acrylic paint sets
   - Buy slightly more of dominant colors

### Workflow Recommendations

**For Beginners:**
```bash
# 1. Start easy
python generate_premium.py image.jpg --difficulty easy

# 2. Review validation report
# 3. If warnings, try with fewer colors
python generate_premium.py image.jpg --difficulty easy --colors 10
```

**For Experienced Users:**
```bash
# 1. Generate with expert preset
python generate_premium.py image.jpg --difficulty expert --canvas-size 50x35

# 2. Check validation and named colors
# 3. Print template and solution
# 4. Buy paints from named_colors.json
```

---

## 📚 **Examples**

### Example 1: Simple Portrait

```bash
python generate_premium.py portrait.jpg \
  --difficulty medium \
  --colors 20 \
  --canvas-size a4
```

**Output:**
- 20 colors (good for skin tones)
- A4 size for easy framing
- 4-6 hour project
- Named colors like "Peach", "Light Pink", "Saddle Brown"

### Example 2: Landscape Photo

```bash
python generate_premium.py landscape.jpg \
  --difficulty hard \
  --canvas-size 50x35 \
  --colors 30
```

**Output:**
- 30 colors for sky, water, foliage
- Large 50×35 cm canvas
- Professional print quality
- 10-15 hour project

### Example 3: Kids Project

```bash
python generate_premium.py cartoon.jpg \
  --difficulty kids \
  --no-svg \
  --no-pdf
```

**Output:**
- 8 simple colors
- Large, easy regions
- Fast generation (no SVG/PDF)
- Perfect for children

### Example 4: Master Piece

```bash
python generate_premium.py masterpiece.jpg \
  --difficulty master \
  --canvas-size 70x50 \
  --colors 36
```

**Output:**
- Maximum 36 colors
- Huge 70×50 cm canvas
- Ultimate detail
- 30-40+ hour project
- Museum-quality result

---

## 🐛 **Troubleshooting**

### "Too many small regions"

**Solution:** Lower the difficulty or reduce colors:
```bash
python generate_premium.py image.jpg --difficulty medium --colors 15
```

### "Validation warnings about similar colors"

**Solution:** This is normal for complex images. You can:
1. Accept it (minor visual similarity is OK)
2. Reduce color count slightly
3. Use a preset palette instead of custom clustering

### "Output file too large"

**Solution:** Skip SVG or lower resolution:
```bash
python generate_premium.py image.jpg --no-svg --difficulty hard
```

### "Numbers are too small to read"

**Solution:** Use easier difficulty (larger font):
```bash
python generate_premium.py image.jpg --difficulty easy
```

---

## 🎓 **Advanced Usage**

### Custom Configuration

You can combine presets with custom overrides:

```python
from paint_by_numbers.presets import difficulty_preset_to_config, get_difficulty_preset
from generate_premium import PremiumPaintByNumbersGenerator

# Start with expert preset
config = difficulty_preset_to_config(get_difficulty_preset('expert'))

# Override specific settings
config.DEFAULT_NUM_COLORS = 28
config.MIN_REGION_SIZE = 60
config.SHARPEN_AMOUNT = 1.5

# Generate
generator = PremiumPaintByNumbersGenerator(config=config)
result = generator.generate('image.jpg')
```

### Batch Processing

Process multiple images with same settings:

```bash
for img in images/*.jpg; do
  python generate_premium.py "$img" \
    --difficulty medium \
    --canvas-size a4 \
    -o "batch_output/$(basename $img .jpg)"
done
```

---

## 📞 **Support**

For issues or questions:
1. Check the validation report first
2. Try a different difficulty preset
3. Review this guide
4. Check the main README.md

---

**Happy Painting! 🎨✨**
