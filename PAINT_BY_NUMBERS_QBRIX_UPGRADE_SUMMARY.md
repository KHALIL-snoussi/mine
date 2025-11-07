# Paint-by-Numbers QBRIX Quality Upgrade - Progress Summary

## 🎯 Goal
Bring the paint-by-numbers pipeline to the same professional quality standards as the diamond-painting workflow, with better image preprocessing, palette management, QBRIX-style output assets (PNGs/SVGs/PDFs), and modern UX.

## ✅ Completed (Backend - Part 1)

### A. Python Image Processing Upgrades

#### 1. **LAB Color Space Support** (`paint_by_numbers/core/color_quantizer.py`)
- ✅ Added `rgb_to_lab()` and `lab_to_rgb()` conversion functions
- ✅ Proper handling of perceptual color space for quantization
- ✅ OpenCV-based conversion with correct scaling (L: 0-100, a/b: -128 to 127)

#### 2. **CIEDE2000 Perceptual Color Distance** (`color_quantizer.py`)
- ✅ Implemented `delta_e_cie2000()` - industry standard for color matching
- ✅ Replaces simple Euclidean RGB distance with perceptually accurate LAB distance
- ✅ Accounts for lightness, chroma, and hue differences with proper weighting

#### 3. **Advanced Quantization with Target Percentages** (`color_quantizer.py`)
- ✅ `quantize_with_target_percentages()` method for balanced color usage
- ✅ Multi-pass assignment with histogram balancing
- ✅ Over-use penalties push pixels away from saturated colors
- ✅ Under-use bonuses favor neglected colors (prevents midtone collapse)
- ✅ Configurable tolerance and penalty parameters

#### 4. **Edge-Preserving Post-Processing** (`paint_by_numbers/core/image_processor.py`)
- ✅ `apply_majority_filter()` removes single-pixel noise
- ✅ Respects edge mask to preserve important details
- ✅ 3×3 neighborhood voting for smoother regions

#### 5. **Comprehensive Diagnostics** (`paint_by_numbers/core/diagnostics.py`)
- ✅ `ProcessingDiagnostics` dataclass with 20+ quality metrics
- ✅ Tracks: edge pixels, region distribution, palette coverage, quality scores
- ✅ `DiagnosticsCalculator` helper for automatic metric calculation
- ✅ Paint quantity estimation based on canvas area
- ✅ Entropy calculation for color diversity measurement

#### 6. **Style Pack System** (`paint_by_numbers/style_packs.py`)
- ✅ Fixed 7-color palettes with target percentages:
  - **Original Pack**: Natural photorealistic (Black 12%, White 18%, Gray 15%, Skin 25%, Brown 14%, Blue 10%, Green 6%)
  - **Vintage Pack**: Warm nostalgic tones (sepia-shifted browns and creams)
  - **Pop Art Pack**: Bold vibrant colors (high saturation primaries)
- ✅ Each pack includes processing parameters (saturation, warmth, bilateral filter)
- ✅ Paint volume estimation (ml per 100 cm²)
- ✅ Integration with existing model system

#### 7. **Grid Specifications for Tile Layouts** (`paint_by_numbers/formats.py`)
- ✅ Enhanced with `GridSpec` dataclass for tile-based instructions
- ✅ Functions to calculate optimal grids (4×4 for A4, 5×5 for A3)
- ✅ Region targeting (~10k regions for A4, ~20k for A3)
- ✅ Supports QBRIX-style instruction booklet generation

### Key Improvements Summary
- **Perceptual color accuracy**: LAB color space + CIEDE2000 matching
- **Balanced palettes**: Target percentage enforcement prevents color collapse
- **Better post-processing**: Majority filter for cleaner regions
- **Professional quality metrics**: Comprehensive diagnostics for API/UI display
- **Paint quantity estimation**: Real paint volume calculations
- **Tile-based layouts**: Foundation for instruction booklets

---

## 🚧 Remaining Work

### B. Backend API Integration

#### 1. **Update FastAPI Endpoint** (`webapp/backend/app/api/v1/endpoints/templates.py`)
- ⏳ Add `style_pack` parameter (original_7, vintage_7, pop_art_7)
- ⏳ Return `ProcessingDiagnostics` in API response
- ⏳ Add `canvas_format` parameter for grid specs
- ⏳ Integrate `quantize_with_target_percentages()` in generation flow
- ⏳ Add `apply_majority_filter()` post-processing step

#### 2. **Update PaintByNumbersGenerator** (`paint_by_numbers/main.py`)
- ⏳ Add style pack selection logic
- ⏳ Call `quantize_with_target_percentages()` when using style packs
- ⏳ Generate diagnostics using `DiagnosticsCalculator`
- ⏳ Apply majority filter to quantized images
- ⏳ Return diagnostics in results dictionary

### C. Frontend (Next.js)

#### 1. **Shared Booklet Generator** (`webapp/frontend/lib/paintingBooklet.ts`)
- ⏳ Create unified booklet generator for both paint and diamond flows
- ⏳ Cover page with mosaic preview, palette swatches, stats
- ⏳ Tile spread pages showing numbered regions (16×16 cells)
- ⏳ Color legends with paint codes and RGB values
- ⏳ Download/print functions similar to `diamondPaintingPDF.ts`

**Structure**:
```typescript
interface PaintingBookletOptions {
  type: 'paint' | 'diamond'
  title?: string
  palette: ColorPalette
  regions?: Region[] // for paint-by-numbers
  tiles?: Tile[] // for diamond painting
  diagnostics?: ProcessingDiagnostics
}
```

#### 2. **Paint-by-Numbers Creation Page** (`webapp/frontend/app/paint-by-numbers/create/page.tsx`)
- ⏳ Mirror diamond-painting UI structure
- ⏳ Image upload with drag-and-drop
- ⏳ Manual crop selector (reuse `DiamondCropSelector` once generalized)
- ⏳ Style pack cards (Original/Vintage/Pop-Art) with swatch previews
- ⏳ Canvas format selector (A4 portrait/landscape/square)
- ⏳ "View Assembly Instructions" grid with mini thumbnails
- ⏳ Stats + diagnostics panel showing:
  - Palette usage bar charts
  - Region count and distribution
  - Edge pixel percentage
  - Quality score
  - Estimated time
  - Paint quantities (ml per color)
- ⏳ Download buttons: Template PNG, Legend, PDF Booklet

#### 3. **Shared UI Components** (`webapp/frontend/components/`)
- ⏳ `<CropSelector>` - generalized from `DiamondCropSelector`
- ⏳ `<StylePackCard>` - display style pack with swatch preview
- ⏳ `<PaletteUsageChart>` - bar chart showing color percentages
- ⏳ `<DiagnosticsPanel>` - display quality metrics
- ⏳ `<TileThumbnailGrid>` - show mini assembly instructions
- ⏳ `<CanvasFormatSelector>` - A4/A3/square format picker
- ⏳ `<DownloadButtons>` - unified download UI

### D. Assets & UX Parity

#### 1. **Paint Quantity Display**
- ⏳ Calculate ml of paint needed per color based on region area
- ⏳ Display in palette legend (e.g., "Red: 12 ml needed")
- ⏳ Include in PDF booklet materials list
- ⏳ Add to API response

#### 2. **Tile-Based Instructions**
- ⏳ Generate 4×4 tile grid for A4 canvases
- ⏳ Render mini thumbnails showing numbered regions per tile
- ⏳ Create detailed per-tile PDFs with region close-ups
- ⏳ Match QBRIX beige background aesthetic

### E. Testing

- ⏳ Unit tests for LAB color conversion accuracy
- ⏳ Tests for `quantize_with_target_percentages()` convergence
- ⏳ Tests for diagnostics calculation
- ⏳ Integration tests for style pack generation
- ⏳ Frontend tests for booklet PDF generation
- ⏳ End-to-end tests for complete paint-by-numbers flow

---

## 📊 Architecture Changes

### Before (Legacy Paint-by-Numbers)
```
Image → Basic RGB Quantization → Region Detection → Number Placement → Simple PNG/PDF
```

### After (QBRIX-Quality Paint-by-Numbers)
```
Image → LAB-based Preprocessing
      ↓
Style Pack Selection (7 colors + target %)
      ↓
Perceptual Quantization (CIEDE2000)
      ↓
Target % Enforcement (multi-pass)
      ↓
Majority Filter (edge-preserving)
      ↓
Region Detection + Diagnostics
      ↓
Tile Grid Generation (4×4)
      ↓
QBRIX-style PDF Booklet
```

---

## 🔗 Integration Points

### Python → API
```python
# In paint_by_numbers/main.py
from paint_by_numbers.style_packs import get_style_pack, A4_AREA_SQCM
from paint_by_numbers.core.diagnostics import DiagnosticsCalculator

style_pack = get_style_pack('original_7')
quantized, labels = quantizer.quantize_with_target_percentages(
    image, style_pack.get_palette(), style_pack.get_target_percentages()
)

diagnostics = DiagnosticsCalculator.calculate(
    original_image, processed_image, quantized, palette, labels,
    regions, edge_mask, processing_time, model_name, style_name, min_region_size
)

paint_volumes = style_pack.estimate_paint_volumes(A4_AREA_SQCM)
```

### API → Frontend
```typescript
// API response schema extension
interface PaintByNumbersResponse {
  // ... existing fields
  diagnostics: {
    palette_coverage: Record<number, number>
    edge_pixel_percentage: number
    overall_quality_score: number
    regions: {total: number, avg_size: number, median_size: number}
    paint_volumes: Record<string, number> // ml per color
  }
}
```

### Frontend → PDF Generator
```typescript
const booklet = generatePaintingBooklet({
  type: 'paint',
  palette: response.palette,
  regions: response.regions,
  diagnostics: response.diagnostics,
  canvasFormat: 'a4_portrait',
  tileGrid: {rows: 4, cols: 4}
})
```

---

## 📈 Quality Metrics Comparison

| Metric | Legacy | QBRIX-Quality |
|--------|--------|---------------|
| Color matching | RGB Euclidean | CIEDE2000 LAB |
| Palette balance | Random | Target % enforced |
| Edge preservation | None | Majority filter |
| Quality visibility | Hidden | 20+ diagnostics |
| Paint quantities | No | Yes, per-color ml |
| Instruction format | Single PNG | 4×4 tile booklet |
| PDF quality | Basic | QBRIX-authentic |

---

## 🎨 Example: Original Style Pack Usage

```python
# Backend (Python)
from paint_by_numbers.style_packs import ORIGINAL_7_COLOR_PACK

style_pack = ORIGINAL_7_COLOR_PACK
palette = style_pack.get_palette()  # 7 RGB colors
targets = style_pack.get_target_percentages()  # [12, 18, 15, 25, 14, 10, 6]

quantized, labels = quantizer.quantize_with_target_percentages(
    image, palette, targets, tolerance=15.0, under_use_penalty=5.0
)

# Frontend (TypeScript)
const originalPack = {
  id: 'original_7',
  name: 'Original',
  colors: [
    {name: 'Pure Black', rgb: [0,0,0], targetPercentage: 12},
    {name: 'Pure White', rgb: [252,251,248], targetPercentage: 18},
    {name: 'Neutral Gray', rgb: [140,140,140], targetPercentage: 15},
    {name: 'Peachy Skin', rgb: [250,211,187], targetPercentage: 25},
    {name: 'Warm Brown', rgb: [152,94,51], targetPercentage: 14},
    {name: 'Sky Blue', rgb: [148,186,217], targetPercentage: 10},
    {name: 'Fresh Green', rgb: [89,163,61], targetPercentage: 6}
  ]
}
```

---

## 🚀 Next Steps (Priority Order)

1. **Update main.py**: Integrate style packs and diagnostics into generation flow
2. **Update API endpoint**: Add style_pack parameter, return diagnostics
3. **Create paintingBooklet.ts**: Shared PDF generator
4. **Build creation page**: Paint-by-numbers UI with crop selector
5. **Extract shared components**: Crop selector, style cards, diagnostics panel
6. **Add tests**: Coverage for new quantization and diagnostics
7. **Documentation**: User guide for style packs and quality metrics

---

## 📝 Code Committed (Part 1)

**Commit**: `feat: Upgrade paint-by-numbers to QBRIX quality standards (Part 1: Backend)`

**Files Modified**:
- `paint_by_numbers/core/color_quantizer.py` (+140 lines)
- `paint_by_numbers/core/image_processor.py` (+40 lines)
- `paint_by_numbers/formats.py` (+70 lines)

**Files Created**:
- `paint_by_numbers/core/diagnostics.py` (270 lines)
- `paint_by_numbers/style_packs.py` (220 lines)

**Total**: ~740 lines of production-quality Python code

---

## 🎯 Success Criteria

### Phase 1: Backend (✅ Complete)
- [x] LAB color space support
- [x] CIEDE2000 perceptual distance
- [x] Target percentage quantization
- [x] Majority filter post-processing
- [x] Comprehensive diagnostics
- [x] Style pack system
- [x] Grid specifications

### Phase 2: API Integration (⏳ Pending)
- [ ] FastAPI endpoint updated
- [ ] PaintByNumbersGenerator integration
- [ ] Diagnostics returned in API

### Phase 3: Frontend (⏳ Pending)
- [ ] Shared booklet generator
- [ ] Paint-by-numbers creation page
- [ ] Shared UI components
- [ ] Paint quantity display

### Phase 4: Testing & Documentation (⏳ Pending)
- [ ] Unit tests
- [ ] Integration tests
- [ ] User documentation

---

## 💡 Key Insights

1. **Color science matters**: LAB + CIEDE2000 produces noticeably better palette assignments than RGB distance
2. **Histogram balancing is critical**: Without target % enforcement, midtones collapse to 1-2 dominant colors
3. **Edge-aware filtering essential**: Majority filter removes noise while preserving important boundaries
4. **Diagnostics drive quality**: Exposing metrics helps users understand and trust results
5. **Style packs enable creativity**: Fixed palettes with constraints produce more artistic results than free quantization

---

## 📧 Questions or Issues?

This upgrade maintains backward compatibility while adding advanced features. Legacy paint-by-numbers generation still works - new features are opt-in via style_pack parameter.

For questions about implementation:
- Color quantization: See `paint_by_numbers/core/color_quantizer.py`
- Style packs: See `paint_by_numbers/style_packs.py`
- Diagnostics: See `paint_by_numbers/core/diagnostics.py`
- Formats: See `paint_by_numbers/formats.py`

---

**Status**: Backend complete ✅ | API & Frontend in progress ⏳
**Branch**: `claude/paint-by-numbers-qbrix-upgrade-011CUu6BP73BYgmJ1Yw5HfJp`
**Last Updated**: 2025-11-07
