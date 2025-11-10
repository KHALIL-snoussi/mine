# Phase 4 - Advanced Features

## 🚀 Overview

Phase 4 introduces professional-grade advanced features that significantly improve pattern quality and user experience:

1. **Smart Region Merging** - Reduces color fragmentation by intelligently merging similar adjacent regions
2. **Background Simplification** - Simplifies backgrounds while preserving subject detail
3. **Quality Presets** - One-click configurations for different skill levels
4. **Enhanced Diagnostics** - Detailed statistics about processing and quality

---

## 1. Smart Region Merging

### What It Does

After quantization, diamond painting patterns often have fragmented regions - tiny isolated patches of the same color scattered throughout the image. This makes the pattern harder to work with and less visually appealing.

Smart Region Merging solves this by:
- Identifying all connected regions using flood fill analysis
- Calculating color similarity using LAB color space (Delta E)
- Merging small adjacent regions that are visually similar
- Preserving important details in subject areas (faces, focal points)

### Benefits

✅ **Cleaner Patterns**: Reduces isolated single beads and tiny clusters
✅ **Faster Assembly**: Fewer color changes while working
✅ **Better Visual Flow**: More cohesive color regions
✅ **Preserved Detail**: Keeps subject areas sharp and detailed

### Usage

```typescript
import { generateAdvancedDiamondPainting } from './lib/advancedDiamondGenerator'

const result = await generateAdvancedDiamondPainting(imageUrl, {
  canvasFormat: 'canvas_50x70',
  stylePack: 'hd_palette',
  regionMergingOptions: {
    enableMerging: true,  // Enable region merging (default: true)
    mergeSimilarityThreshold: 8,  // Delta E threshold (default: 8)
    minRegionSizeBeforeMerge: 20,  // Min size to consider (default: 20 pixels)
    maxRegionSizeToMerge: 500,  // Max size to merge (default: 500 pixels)
    preserveSubjectDetail: true,  // Keep subject sharp (default: true)
    mergePasses: 2  // Number of passes (default: 2)
  }
})
```

### Configuration Guide

**`mergeSimilarityThreshold`** (Delta E units)
- `6-7`: Very strict, only merge nearly identical colors (high detail, more fragmentation)
- `8-10`: Balanced merging (recommended for most projects)
- `11-15`: Aggressive merging (cleaner patterns, slightly less detail)

**`minRegionSizeBeforeMerge`** (pixels)
- `10-15`: Merge even small regions (very clean, less detail)
- `18-25`: Balanced (recommended)
- `30+`: Only merge tiny isolated pixels (maximum detail)

**`preserveSubjectDetail`**
- `true`: Stricter merging in detected subject areas (faces, focal points)
- `false`: Apply same merging everywhere

**`mergePasses`**
- `1`: Single pass (faster, less thorough)
- `2`: Standard (recommended)
- `3`: Maximum cleanup (for complex patterns)

### Statistics

After processing, check `diagnostics.regionMergingStats`:

```typescript
{
  regionsFound: 1247,  // Initial regions
  regionsMerged: 342,  // Regions merged
  fragmentationReduction: 27.4,  // Fragmentation reduced by 27.4%
  tinyRegionsRemoved: 89  // Isolated pixels removed
}
```

---

## 2. Background Simplification

### What It Does

Professional diamond paintings focus detail on the subject while keeping backgrounds clean and simple. Background simplification automatically:

- Detects background regions using subject/face masks
- Applies selective blur to background only
- Reduces color diversity in backgrounds
- Optionally desaturates backgrounds
- Preserves all subject detail

### Benefits

✅ **Subject Emphasis**: Makes focal points pop
✅ **Cleaner Patterns**: Reduces background complexity
✅ **Faster Completion**: Fewer colors in backgrounds
✅ **Professional Look**: Mimics bokeh effect from professional photography

### Usage

```typescript
const result = await generateAdvancedDiamondPainting(imageUrl, {
  canvasFormat: 'canvas_50x70',
  stylePack: 'hd_palette',
  backgroundSimplificationOptions: {
    enableSimplification: true,  // Enable background simplification
    simplificationMode: 'moderate',  // 'subtle' | 'moderate' | 'strong'
    applyBackgroundBlur: true,  // Blur background
    backgroundBlurAmount: 3,  // Blur radius in pixels (default: 3)
    reduceBackgroundColors: true,  // Reduce color diversity
    colorReductionFactor: 0.3,  // 0-1, reduce to 30% of colors
    desaturateBackground: false,  // Convert to grayscale
    desaturationAmount: 0.4,  // 0-1, 40% desaturation
    smoothBackgroundRegions: true  // Smooth regions
  },
  qualitySettings: {
    useFaceDetection: true  // Required for subject detection!
  }
})
```

### Configuration Guide

**`simplificationMode`**
- `'subtle'`: Gentle simplification, maintains most background detail
- `'moderate'`: Balanced simplification (recommended)
- `'strong'`: Aggressive simplification, very clean backgrounds

**`backgroundBlurAmount`** (pixels)
- `2-3`: Gentle blur (portraits, close-ups)
- `3-4`: Standard blur (most projects)
- `5+`: Strong blur (dramatic bokeh effect)

**`colorReductionFactor`** (0-1)
- `0.2`: Gentle reduction (80% of colors remain)
- `0.3`: Balanced reduction (recommended)
- `0.4-0.5`: Aggressive reduction (very simple backgrounds)

**`desaturateBackground`**
- Use for dramatic effect (color subject, gray background)
- Recommended with `desaturationAmount: 0.3-0.5`
- Works great for portraits and product photos

### When to Use

**✅ Use Background Simplification For**:
- Portraits (headshots, upper body, full body)
- Product photography
- Pet photos
- Subject-focused compositions
- When background is cluttered or busy

**❌ Skip Background Simplification For**:
- Landscapes (background IS the subject)
- Abstract art
- Patterns without clear subject
- Cityscapes
- Nature photography where detail matters everywhere

### Statistics

Check `result.backgroundSimplificationStats`:

```typescript
{
  backgroundPercentage: 62.3,  // 62.3% of image is background
  subjectPercentage: 37.7,  // 37.7% is subject
  blurApplied: true,
  colorsReduced: true,
  desaturated: false
}
```

---

## 3. Quality Presets

### What They Are

Quality presets are carefully tuned configurations for different skill levels and project goals. Instead of manually configuring dozens of parameters, choose a preset that matches your needs.

### Available Presets

#### 1. Beginner
**Perfect for your first diamond painting**

```typescript
import { applyPreset } from './lib/qualityPresets'

const options = applyPreset('beginner', {
  canvasFormat: 'canvas_25x35'
})
```

- **Canvas**: 20-30cm (9,600-16,800 beads)
- **Colors**: 7 colors (simple)
- **Completion**: 2-3 weeks (2-3 hours/day)
- **Features**:
  - Large clusters (easy to work with)
  - High cleanup (removes tiny regions)
  - Gentle sharpening
  - No face detection (simplified)

---

#### 2. Intermediate
**For crafters with some experience**

```typescript
const options = applyPreset('intermediate', {
  canvasFormat: 'canvas_40x50'
})
```

- **Canvas**: 30-40cm (19,200-32,000 beads)
- **Colors**: 15-20 colors (HD palette)
- **Completion**: 1-2 months (2-3 hours/day)
- **Features**:
  - Moderate detail
  - Face detection enabled
  - Balanced cleanup
  - Full spectrum colors

---

#### 3. Professional
**High-quality results for experienced crafters**

```typescript
const options = applyPreset('professional', {
  canvasFormat: 'canvas_50x70'
})
```

- **Canvas**: 40-70cm (32,000-56,000 beads)
- **Colors**: 22-28 colors (HD palette)
- **Completion**: 2-4 months (2-3 hours/day)
- **Features**:
  - High detail preservation
  - Background simplification (subtle)
  - Smart region merging
  - Enhanced sharpening
  - Face detection

---

#### 4. Master
**Ultimate quality for expert crafters**

```typescript
const options = applyPreset('master', {
  canvasFormat: 'canvas_70x90'
})
```

- **Canvas**: 60-90cm (76,800-100,800 beads)
- **Colors**: 28-30 colors (full HD palette)
- **Completion**: 4-6 months (2-3 hours/day)
- **Features**:
  - Maximum detail
  - Background simplification (moderate)
  - Aggressive region merging
  - Maximum sharpening
  - Advanced preprocessing
  - 3 merge passes

---

#### 5. Quick Gift
**Fast turnaround for gift-giving**

```typescript
const options = applyPreset('quick_gift', {
  canvasFormat: 'canvas_30x40'
})
```

- **Canvas**: 30-40cm (19,200-25,600 beads)
- **Colors**: 18-22 colors (HD palette)
- **Completion**: 3-4 weeks (2-3 hours/day)
- **Features**:
  - Balanced quality/speed
  - Moderate background blur
  - Background desaturation (subtle)
  - Smart region merging
  - Looks great, finishes fast!

---

#### 6. Gallery Masterpiece
**Absolute maximum quality for wall art**

```typescript
const options = applyPreset('gallery_masterpiece', {
  canvasFormat: 'canvas_70x90'
})
```

- **Canvas**: 70-90cm (100,800+ beads)
- **Colors**: 30 colors (maximum)
- **Completion**: 6+ months (2-3 hours/day)
- **Features**:
  - Every optimization enabled
  - Strong background simplification
  - 3 merge passes
  - Highest resolution preprocessing
  - Maximum sharpening
  - Gallery-worthy result

---

### Using Presets

**Basic Usage**:
```typescript
import { generateAdvancedDiamondPainting } from './lib/advancedDiamondGenerator'
import { applyPreset } from './lib/qualityPresets'

// Apply preset
const options = applyPreset('professional', {
  canvasFormat: 'canvas_50x70'
})

// Generate
const result = await generateAdvancedDiamondPainting(imageUrl, options)
```

**Override Preset Values**:
```typescript
// Start with preset, then customize
const options = applyPreset('professional', {
  canvasFormat: 'canvas_50x70',
  // Override: Use fewer colors than preset
  hdPaletteOptions: {
    minColors: 20,
    maxColors: 24
  }
})
```

**Get Recommended Preset**:
```typescript
import { recommendPreset } from './lib/qualityPresets'

// Auto-recommend based on canvas and style
const presetName = recommendPreset('canvas_50x70', 'hd_palette')
// Returns: 'master'

const options = applyPreset(presetName, {
  canvasFormat: 'canvas_50x70',
  stylePack: 'hd_palette'
})
```

---

## 4. Enhanced Diagnostics

### New Statistics

Phase 4 adds detailed statistics to help you understand and validate results:

```typescript
const result = await generateAdvancedDiamondPainting(imageUrl, options)

// Region merging stats
console.log(result.diagnostics.regionMergingStats)
// {
//   regionsFound: 1247,
//   regionsMerged: 342,
//   fragmentationReduction: 27.4,
//   tinyRegionsRemoved: 89
// }
```

### Interpreting Stats

**Fragmentation Reduction**:
- `< 10%`: Image already had large cohesive regions
- `10-20%`: Moderate improvement
- `20-30%`: Significant improvement
- `> 30%`: Major cleanup, pattern much cleaner

**Regions Merged**:
- `< 100`: Few merges needed
- `100-300`: Standard merging
- `300-500`: Heavy fragmentation corrected
- `> 500`: Extremely fragmented pattern cleaned

---

## Best Practices

### When to Use Each Feature

**Smart Region Merging**:
- ✅ Always enable (default: on)
- ✅ Increase threshold for simpler patterns (10-12)
- ✅ Decrease threshold for maximum detail (6-7)

**Background Simplification**:
- ✅ Enable for portraits, pets, products
- ❌ Disable for landscapes, nature, abstract
- ✅ Use 'subtle' for gentle effect
- ✅ Use 'strong' for dramatic bokeh

**Quality Presets**:
- ✅ Start with presets, customize if needed
- ✅ Use `quick_gift` when time matters
- ✅ Use `professional` for most projects
- ✅ Use `master` or `gallery_masterpiece` for display pieces

---

## Performance

### Processing Time

Phase 4 features add minimal overhead:

- **Smart Region Merging**: +2-5 seconds (depends on image complexity)
- **Background Simplification**: +1-3 seconds
- **Quality Presets**: No overhead (just configuration)

Total Phase 4 overhead: **~3-8 seconds** on typical images.

### Memory Usage

- Smart Region Merging: Temporary `O(n)` memory for region tracking
- Background Simplification: Single image clone for processing
- Overall: **No significant memory impact**

---

## Examples

### Example 1: Portrait with Background Blur

```typescript
import { applyPreset } from './lib/qualityPresets'

const options = applyPreset('professional', {
  canvasFormat: 'canvas_50x70',
  backgroundSimplificationOptions: {
    enableSimplification: true,
    simplificationMode: 'moderate',
    backgroundBlurAmount: 4
  }
})

const result = await generateAdvancedDiamondPainting(portraitUrl, options)
```

**Result**: Sharp subject, beautifully blurred background, ~25 colors

---

### Example 2: Quick Gift with Maximum Cleanup

```typescript
const options = applyPreset('quick_gift', {
  canvasFormat: 'canvas_30x40',
  regionMergingOptions: {
    mergeSimilarityThreshold: 10,  // More aggressive
    minRegionSizeBeforeMerge: 15   // Merge smaller regions
  }
})

const result = await generateAdvancedDiamondPainting(imageUrl, options)
```

**Result**: Very clean pattern, fast completion, 18-22 colors

---

### Example 3: Gallery Masterpiece with Custom Settings

```typescript
const options = applyPreset('gallery_masterpiece', {
  canvasFormat: 'canvas_70x90',
  hdPaletteOptions: {
    maxColors: 30,
    prioritizeSaturation: true
  },
  backgroundSimplificationOptions: {
    simplificationMode: 'strong',
    desaturateBackground: true,
    desaturationAmount: 0.5
  },
  regionMergingOptions: {
    mergePasses: 3
  }
})

const result = await generateAdvancedDiamondPainting(imageUrl, options)
```

**Result**: Ultimate quality, dramatic background, 30 vivid colors

---

## Migration Guide

### Upgrading from Phase 3

Phase 4 is **100% backward compatible**. All Phase 3 code continues to work without changes.

**To adopt Phase 4 features**:

1. **Use presets** (easiest):
   ```typescript
   // Old way (still works)
   const options = {
     canvasFormat: 'canvas_50x70',
     stylePack: 'hd_palette',
     hdPaletteOptions: { minColors: 25, maxColors: 28 },
     qualitySettings: { useFaceDetection: true }
   }

   // New way (recommended)
   const options = applyPreset('professional', {
     canvasFormat: 'canvas_50x70'
   })
   ```

2. **Enable new features**:
   ```typescript
   const options = {
     // ... existing options ...
     regionMergingOptions: {
       enableMerging: true  // Add region merging
     },
     backgroundSimplificationOptions: {
       enableSimplification: true  // Add background simplification
     }
   }
   ```

3. **Check new diagnostics**:
   ```typescript
   const result = await generateAdvancedDiamondPainting(imageUrl, options)

   // New Phase 4 stats
   console.log(result.diagnostics.regionMergingStats)
   ```

---

## FAQ

**Q: Do presets work with custom canvas sizes?**
A: Yes! Presets configure quality settings, not canvas size. You can use any canvas format with any preset.

**Q: Can I disable region merging?**
A: Yes: `regionMergingOptions: { enableMerging: false }`

**Q: Does background simplification work without face detection?**
A: It works better with face detection enabled, but will use segmentation masks if available. For best results, enable `useFaceDetection: true`.

**Q: Which preset should I use?**
A: Use `recommendPreset(canvasFormat, stylePack)` for automatic recommendation, or:
- First project → `beginner`
- Gift → `quick_gift`
- Personal use → `professional`
- Wall art → `master` or `gallery_masterpiece`

**Q: Can I mix features from different presets?**
A: Yes! Apply a preset as a base, then override specific options.

---

## Troubleshooting

### Region Merging Too Aggressive

**Problem**: Important details are being merged away

**Solution**:
```typescript
regionMergingOptions: {
  mergeSimilarityThreshold: 6,  // Stricter (from 8)
  minRegionSizeBeforeMerge: 30  // Only merge very small regions
}
```

### Background Simplification Affecting Subject

**Problem**: Subject is getting blurred/simplified

**Solution**:
- Ensure `useFaceDetection: true` is enabled
- Check subject mask is working (should be bright in subject areas)
- Use `'subtle'` mode instead of `'moderate'` or `'strong'`
- Reduce blur: `backgroundBlurAmount: 2`

### Preset Not Matching Expectations

**Problem**: Preset quality doesn't match description

**Solution**:
- Check canvas size matches preset recommendations
- Ensure source image is high quality (> 1500px)
- Try next preset up: `intermediate` → `professional` → `master`

---

## What's Next?

Phase 4 completes the core advanced features. Future enhancements may include:

- **Phase 5**: Enhanced PDF generation with legends and assembly instructions
- **Phase 6**: Multi-image support (diptychs, triptychs)
- **Phase 7**: Custom palette optimization
- **Phase 8**: Animation support (GIF → multi-panel)

---

## Summary

Phase 4 adds three major features:

1. ✅ **Smart Region Merging** - Cleaner patterns, reduced fragmentation
2. ✅ **Background Simplification** - Professional subject emphasis
3. ✅ **Quality Presets** - One-click configurations for all skill levels

All features are:
- **Backward compatible** (Phase 3 code works unchanged)
- **Optional** (enable/disable as needed)
- **Well-documented** (comprehensive examples and guides)
- **Production-ready** (tested and optimized)

**Happy crafting!** 💎✨
