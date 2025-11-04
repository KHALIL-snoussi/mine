# Universal Wood Puzzle Template Generator

A Python program that generates laser-cutting templates for wood puzzles with optional photo-based color mapping.

## Features

- **A4-sized frame** (210×297 mm) centered at origin
- **120 polygonal cells** using uniform Delaunay/Voronoi triangulation
- **Perfect edge connectivity** with no overlaps or gaps
- **0.2 mm kerf tolerance** (adjustable spacing between pieces)
- **SVG export** for laser cutting
- **Unique polygon IDs** (1-120)
- **Optional color mapping** from uploaded images using k-means clustering (20 wood stain colors)
- **Multiple output formats**: SVG templates, color maps, legends, and JSON data

## Installation

1. Install Python 3.11 or higher
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage (Template Only)

Generate a cutting template without color mapping:

```bash
python puzzle_generator.py --no-color
```

### With Color Mapping

Generate a puzzle with colors mapped from a photo:

```bash
python puzzle_generator.py --photo path/to/image.jpg
```

### Advanced Options

```bash
python puzzle_generator.py \
    --photo image.jpg \
    --output-dir output \
    --num-pieces 120 \
    --kerf 0.2 \
    --clusters 20
```

### Command Line Arguments

- `--photo PATH`: Path to image file for color mapping
- `--no-color`: Export only SVG template without color mapping
- `--output-dir DIR`: Output directory (default: `output`)
- `--num-pieces N`: Number of puzzle pieces (default: 120)
- `--kerf MM`: Kerf tolerance in millimeters (default: 0.2)
- `--clusters N`: Number of color clusters for wood stains (default: 20)

## Output Files

The program generates the following files in the output directory:

- **`template.svg`**: Cutting template with polygon outlines and IDs
- **`color_map.svg`**: Same layout filled with clustered colors (if `--photo` provided)
- **`legend.png`**: Color swatches with hex values (if `--photo` provided)
- **`preview.png`**: PNG preview of the color-mapped puzzle (if `--photo` provided)
- **`pieces_data.json`**: JSON file containing all polygon coordinates and IDs

### JSON Format

```json
{
  "frame": {
    "width_mm": 210,
    "height_mm": 297
  },
  "pieces": [
    {
      "id": 1,
      "vertices": [[x1, y1], [x2, y2], ...],
      "color": [r, g, b]
    },
    ...
  ]
}
```

## Technical Details

- Uses **Lloyd's algorithm** (centroidal Voronoi tessellation) to generate equal-area polygonal cells
- **Kerf tolerance** applied by shrinking polygons inward using Shapely buffer operations
- **Color mapping** uses k-means clustering to reduce image colors to wood stain palette
- Coordinates are in **millimeters** and centered at origin (0, 0)
- SVG files use millimeters as units for easy scaling

## Example Workflow

1. **Generate template**: `python puzzle_generator.py --no-color`
2. **Review template.svg** in a vector graphics editor
3. **Add color mapping**: `python puzzle_generator.py --photo my_photo.jpg`
4. **Review color_map.svg** and **legend.png** for color accuracy
5. **Export to laser cutter** using template.svg

## Requirements

- Python 3.11+
- numpy
- opencv-python
- matplotlib
- scipy
- svgwrite
- scikit-learn
- shapely

## License

This project is provided as-is for personal and commercial use.

