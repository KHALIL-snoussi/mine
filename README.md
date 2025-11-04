# 🪵 Wood Puzzle Generator

Professional wooden mosaic puzzle generator for laser cutting. Converts portrait photos into beautiful A4-sized wooden art kits with realistic color mapping.

## ✨ Features

- **Uniform Voronoi Tessellation** with Lloyd relaxation for evenly-sized pieces
- **LAB Color Space Mapping** for perceptually accurate wood tones
- **20 Natural Wood Colors** from birch to ebony
- **Laser-Cut Ready SVG** with kerf compensation (0.2mm default)
- **High-Resolution Preview** (300 DPI) that looks like real wooden mosaic
- **Multiple Output Formats**: template SVG, color map SVG, preview PNG, legend PNG, data JSON
- **Flexible Piece Count**: 80 (low), 120 (medium), 160 (high) or custom
- **Reproducible Results** with random seed control

## 🎯 Output Files

| File | Description |
|------|-------------|
| `template.svg` | Cutting outlines + engraved numbers for laser cutting |
| `color_map.svg` | Filled color reference for piece painting |
| `preview.png` | High-DPI realistic wooden mosaic rendering |
| `legend.png` | 20 wood color swatches with HEX/RGB values |
| `pieces_data.json` | Complete piece data (coordinates, colors, metadata) |

## 📦 Installation

### Requirements

- Python 3.11+
- Dependencies:

```bash
pip install numpy opencv-python scipy scikit-learn matplotlib shapely svgwrite
```

### Quick Start

```bash
# Generate your first puzzle with sample image
python wood_puzzle_generator.py --photo man.jpg --output-dir output
```

## 🚀 Usage

### Basic Command

```bash
python wood_puzzle_generator.py --photo portrait.jpg --output-dir output
```

### All Options

```bash
python wood_puzzle_generator.py \
  --photo portrait.jpg \              # Input portrait image
  --output-dir output \                # Output directory
  --detail-level medium \              # low (80), medium (120), high (160)
  --palette wood \                     # wood (fixed) or kmeans (adaptive)
  --clusters 20 \                      # Number of color clusters
  --kerf 0.2 \                         # Laser kerf in mm
  --seed 42 \                          # Random seed for reproducibility
  --preview-dpi 300                    # Preview PNG resolution
```

### Examples

**High Detail Mosaic (160 pieces)**
```bash
python wood_puzzle_generator.py --photo portrait.jpg --detail-level high
```

**Template Only (No Photo)**
```bash
python wood_puzzle_generator.py --no-color --output-dir template_only
```

**Custom Piece Count**
```bash
python wood_puzzle_generator.py --photo image.jpg --num-pieces 200
```

**K-Means Adaptive Palette**
```bash
python wood_puzzle_generator.py --photo portrait.jpg --palette kmeans
```

## 🎨 How It Works

### 1. Geometry Generation

- **Poisson Disk Sampling**: Generates uniformly distributed seed points
- **Voronoi Tessellation**: Creates polygonal cells of roughly equal area
- **Lloyd Relaxation** (2 iterations): Smooths cell distribution for uniform sizing
- **Kerf Compensation**: Shrinks each polygon by 0.1mm (0.2mm total gap)
- **Boundary Clipping**: Ensures all pieces fit perfectly within A4 frame

### 2. Color Mapping

- **Image Preprocessing**: Crop/resize to A4 aspect ratio (cover fit)
- **LAB Color Space**: Convert to perceptually uniform color space
- **Region Sampling**: Extract median color from each polygon region
- **Palette Mapping**:
  - **Wood mode**: Maps to 20 fixed natural wood tones (birch → ebony)
  - **K-means mode**: Clusters image colors and warms toward wood tones
- **Result**: Realistic wooden mosaic with proper tone distribution

### 3. Output Generation

- **Template SVG**: Black outlines + centered piece numbers for laser cutting
- **Color Map SVG**: Filled polygons showing which color each piece should be
- **Preview PNG**: High-resolution (300 DPI) render with realistic wood appearance
- **Legend PNG**: Visual reference of all 20 wood colors with HEX/RGB codes
- **Data JSON**: Complete piece data for custom processing

## 🌈 Wood Palette

The default 20-tone palette includes:

| Range | Colors | Description |
|-------|--------|-------------|
| 1-5 | `#F2E2C8` → `#C0A484` | Light woods (birch, maple) |
| 6-10 | `#B79776` → `#8B6C4D` | Medium woods (oak) |
| 11-15 | `#7E613E` → `#53423B` | Dark woods (walnut, mahogany) |
| 16-20 | `#4A3C2C` → `#262120` | Very dark woods (ebony) |

## 📐 Technical Specifications

- **Canvas**: 210 × 297 mm (A4)
- **Material**: 3mm wood sheets (recommended)
- **Laser Kerf**: 0.2mm (adjustable)
- **Piece Count**: 80-200+ pieces
- **Average Piece Size**: ~150-300 mm² per piece
- **Frame Margin**: 10mm decorative inner border (optional)

## 🛠️ Advanced Usage

### Deterministic Results

Use `--seed` for reproducible tessellation:

```bash
python wood_puzzle_generator.py --photo image.jpg --seed 12345
```

### High-Resolution Previews

Increase DPI for poster-quality previews:

```bash
python wood_puzzle_generator.py --photo image.jpg --preview-dpi 600
```

## 🎯 Laser Cutting Tips

1. **Material**: Use 3mm birch plywood or similar light wood
2. **Settings**: Adjust your laser cutter for 3mm wood (varies by machine)
3. **Kerf Calibration**: Test cut and adjust `--kerf` value if pieces too tight/loose
4. **Order**: Cut pieces first, then engrave numbers
5. **Painting**: Use the `color_map.svg` or `legend.png` as reference
6. **Assembly**: Frame can be cut from darker wood for contrast

## 🐛 Troubleshooting

**Issue**: Pieces don't fit together
**Solution**: Adjust `--kerf` value (increase if too tight, decrease if too loose)

**Issue**: Too many/few pieces
**Solution**: Use `--num-pieces N` to override automatic calculation

**Issue**: Colors look unnatural
**Solution**: Try `--palette kmeans` for image-adaptive colors

**Issue**: Preview doesn't look like portrait
**Solution**: Use higher detail level `--detail-level high` or increase `--num-pieces`

## 📊 Performance

| Detail Level | Pieces | Generation Time | Preview Size |
|--------------|--------|-----------------|--------------|
| Low | 80 | ~10s | ~800 KB |
| Medium | 120 | ~15s | ~1.1 MB |
| High | 160 | ~25s | ~1.5 MB |

*Tested on Intel Core i7, 16GB RAM*

## 🔬 Algorithm Details

### Voronoi Tessellation
Creates polygonal cells where each cell contains all points closer to its seed than any other seed. Results in natural-looking mosaic patterns.

### Lloyd Relaxation
Iteratively moves each point to the centroid of its Voronoi cell, creating more uniform cell areas. 2 iterations provide good balance between uniformity and speed.

### LAB Color Space
Device-independent color space where Euclidean distance approximates perceptual color difference. Superior to RGB for color matching.

### Kerf Compensation
Uses Shapely's negative buffer with mitered joins to shrink polygons uniformly inward, preventing gaps after laser cutting.

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Acknowledgments

- Voronoi tessellation: SciPy
- Image processing: OpenCV
- Color clustering: scikit-learn
- Polygon operations: Shapely
- Visualization: Matplotlib

---

**Made with ❤️ for laser cutting enthusiasts and wooden art lovers**

