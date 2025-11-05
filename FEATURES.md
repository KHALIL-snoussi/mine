# New Features & Improvements

This document highlights the major improvements made to the Paint by Numbers Generator.

## 🎨 Unified Color Palettes

**Key Feature:** Use consistent color palettes across all images!

- **7 Built-in Palettes:**
  - `classic_12` - 12 basic colors, perfect for beginners
  - `classic_18` - 18 colors for standard projects
  - `classic_24` - 24 colors for detailed work
  - `pastel_12` - 12 soft pastel colors
  - `earth_tones_12` - 12 natural earth colors
  - `vibrant_18` - 18 bright, vibrant colors
  - `nature_15` - 15 colors perfect for landscapes

- **Benefits:**
  - Same colors across multiple images
  - Consistent paint kits for series
  - Named colors for easy identification
  - Professional color coordination

### Usage
```bash
# Use a unified palette
python main.py input.jpg --unified-palette classic_18

# List available palettes
python main.py --list-palettes
```

## 📦 Multiple Output Formats

### SVG Export
- Scalable vector graphics for professional printing
- Editable paths for customization
- Infinite scaling without quality loss

```bash
python main.py input.jpg --svg
```

### PDF Generation
- Complete paint-by-numbers kit in one file
- Includes:
  - Cover page with instructions
  - Color legend page
  - Template page
  - Coloring guide page
  - Solution reference page
- Print-ready, professional layout

```bash
python main.py input.jpg --pdf
```

## 🚀 Batch Processing

Process multiple images at once with parallel processing!

```bash
# Process entire directory
python main.py --batch input_dir/ -o output_dir/

# Use 8 parallel workers
python main.py --batch input_dir/ --workers 8

# Batch with unified palette (same colors for all!)
python main.py --batch input_dir/ --unified-palette classic_18
```

## ⚙️ Configuration System

### Presets
Four difficulty presets for different skill levels:

```bash
# Beginner: 10 colors, large regions
python main.py input.jpg --preset beginner

# Intermediate: 15 colors, medium regions (default)
python main.py input.jpg --preset intermediate

# Advanced: 20 colors, smaller regions
python main.py input.jpg --preset advanced

# Professional: 25 colors, SVG, PDF
python main.py input.jpg --preset professional
```

### YAML Configuration Files
Save and load custom configurations:

```bash
# Use a config file
python main.py input.jpg --config my_config.yaml
```

Example config:
```yaml
DEFAULT_NUM_COLORS: 18
USE_UNIFIED_PALETTE: true
UNIFIED_PALETTE_NAME: classic_18
GENERATE_SVG: true
GENERATE_PDF: true
MIN_REGION_SIZE: 100
```

## 📊 Logging & Progress

### Colored Logging
- Color-coded log levels
- Clean, readable output
- Optional log files

```bash
# Set log level
python main.py input.jpg --log-level DEBUG

# Save logs to file
python main.py input.jpg --log-file processing.log
```

### Progress Bars
- Visual progress indication
- Step-by-step feedback
- Time estimation

## 🎯 Enhanced Features

### Named Colors
- Descriptive color names (not just "Color 1")
- Easier paint shopping
- Better color identification

### Better Error Handling
- Graceful error recovery
- Detailed error messages
- Safe batch processing (one failure doesn't stop others)

### Advanced Region Detection
- Improved region merging
- Better small region filtering
- Smarter number placement

## 🔧 Technical Improvements

### Performance
- Parallel batch processing
- Optimized image processing
- Efficient memory usage

### Code Quality
- Modular architecture
- Clean separation of concerns
- Comprehensive logging
- Type hints throughout
- Exception handling

### Extensibility
- Easy to add new palettes
- Pluggable export formats
- Configurable everything

## 📝 Complete Feature List

| Feature | Status | Description |
|---------|--------|-------------|
| Unified Palettes | ✅ | Consistent colors across images |
| SVG Export | ✅ | Scalable vector output |
| PDF Generation | ✅ | Complete kits in PDF |
| Batch Processing | ✅ | Process multiple images |
| Parallel Processing | ✅ | Multi-threaded batch mode |
| Configuration Presets | ✅ | Beginner/Intermediate/Advanced/Professional |
| YAML Configs | ✅ | Load/save configurations |
| Named Colors | ✅ | Descriptive color names |
| Progress Bars | ✅ | Visual progress feedback |
| Colored Logging | ✅ | Color-coded log output |
| Error Recovery | ✅ | Graceful error handling |
| Custom Palettes | ✅ | Add your own palettes |

## 🎨 Comparison: Before vs After

### Before
```bash
python main.py input.jpg -c 15
```
- Only PNG output
- Different colors for each image
- No batch processing
- Print statements for logging
- No presets
- Manual configuration

### After
```bash
# Single image with unified palette and PDF
python main.py input.jpg --unified-palette classic_18 --pdf

# Batch process with consistent colors
python main.py --batch photos/ --unified-palette classic_18 --workers 4

# Use preset for quick start
python main.py input.jpg --preset beginner

# Full professional output
python main.py input.jpg --preset professional --svg --pdf
```

## 💡 Use Cases

### 1. Creating a Series
Use unified palettes to create multiple paint-by-numbers with the same colors:
```bash
python main.py --batch series/ --unified-palette classic_18 --pdf
```
Result: All images use the same 18 colors, perfect for a matching set!

### 2. Beginner Kits
Create easy templates for beginners:
```bash
python main.py image.jpg --preset beginner --pdf
```
Result: Large regions, fewer colors, complete PDF kit with instructions!

### 3. Professional Printing
Generate high-quality output for commercial use:
```bash
python main.py image.jpg --preset professional
```
Result: SVG + PDF + high-DPI PNG files!

### 4. Batch Production
Process hundreds of images efficiently:
```bash
python main.py --batch input/ -o output/ --workers 8 --unified-palette classic_24
```
Result: Consistent, professional templates at scale!

## 🚀 Getting Started with New Features

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Try unified palette:**
   ```bash
   python main.py examples/photo.jpg --unified-palette classic_18
   ```

3. **Generate complete PDF kit:**
   ```bash
   python main.py examples/photo.jpg --preset beginner
   ```

4. **Batch process:**
   ```bash
   python main.py --batch examples/ --unified-palette nature_15
   ```

Enjoy creating professional paint-by-numbers templates!
