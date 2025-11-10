# Quick Start Guide - Commercial Diamond Painting Generator

## 🚀 Getting Started in 5 Minutes

### Using Quality Presets (NEW - Phase 4!)

The easiest way to get started is with quality presets:

```typescript
import { generateAdvancedDiamondPainting } from './lib/advancedDiamondGenerator'
import { applyPreset } from './lib/qualityPresets'

// Beginner preset (fast, simple, 7 colors)
const options = applyPreset('beginner', {
  canvasFormat: 'canvas_25x35'
})

// Professional preset (high quality, 22-28 colors)
const options = applyPreset('professional', {
  canvasFormat: 'canvas_50x70'
})

// Gallery masterpiece preset (maximum quality, 30 colors)
const options = applyPreset('gallery_masterpiece', {
  canvasFormat: 'canvas_70x90'
})

const result = await generateAdvancedDiamondPainting(imageUrl, options)
```

**Available Presets**:
- `beginner` - Your first project (20-30cm, 7 colors, 2-3 weeks)
- `intermediate` - Some experience (30-40cm, 15-20 colors, 1-2 months)
- `professional` - High quality (40-70cm, 22-28 colors, 2-4 months)
- `master` - Expert level (60-90cm, 28-30 colors, 4-6 months)
- `quick_gift` - Fast turnaround (30-40cm, 18-22 colors, 3-4 weeks)
- `gallery_masterpiece` - Ultimate quality (70-90cm, 30 colors, 6+ months)

---

### Basic Usage

```typescript
import { generateAdvancedDiamondPainting } from './lib/advancedDiamondGenerator'

// Simple beginner project
const result = await generateAdvancedDiamondPainting(imageUrl, {
  canvasFormat: 'canvas_30x40',
  stylePack: 'a4_original'  // 7 colors, simple
})

// Professional portrait (recommended)
const result = await generateAdvancedDiamondPainting(imageUrl, {
  canvasFormat: 'canvas_50x70',
  stylePack: 'hd_palette',
  hdPaletteOptions: {
    minColors: 25,
    maxColors: 30
  }
})

// Master-level artwork
const result = await generateAdvancedDiamondPainting(imageUrl, {
  canvasFormat: 'canvas_70x90',
  stylePack: 'hd_palette',
  hdPaletteOptions: {
    minColors: 30,
    maxColors: 30,
    prioritizeSaturation: true
  },
  qualitySettings: {
    useFaceDetection: true,
    minClusterSize: 3,
    sharpenAmount: 1.2
  }
})
```

---

## 📐 Choosing Canvas Size

### By Subject Type

**Portraits**:
- Headshot → `canvas_30x40` or `canvas_40x50`
- Upper body → `canvas_50x70`
- Full body → `canvas_60x80` or `canvas_70x90`

**Landscapes**:
- Simple → `canvas_40x50`
- Detailed → `canvas_50x70` or `canvas_60x80`
- Panoramic → `canvas_70x50` (wide)

**Pets/Animals**:
- Close-up → `canvas_40x50`
- Full pet → `canvas_50x70`
- Wildlife → `canvas_60x80`

### By Skill Level

- **Beginner**: `canvas_20x30` to `canvas_30x40` (10-20k drills)
- **Intermediate**: `canvas_40x50` to `canvas_50x60` (30-50k drills)
- **Advanced**: `canvas_50x70` to `canvas_60x80` (50-80k drills)
- **Expert/Master**: `canvas_70x90` (100k+ drills)

---

## 🎨 Color Mode Selection

### 7-Color Style Packs

**Best For**:
- Graphics, logos, simple illustrations
- Kids' projects
- First-time crafters
- Quick completion (1-2 weeks)

**Available Styles**:
```typescript
stylePack: 'a4_original'   // Photo-realistic, natural
stylePack: 'a4_vintage'    // Warm, desaturated, nostalgic
stylePack: 'a4_pop_art'    // High contrast, vibrant, bold
```

### HD Palette (20-30 Colors)

**Best For**:
- Photorealistic portraits
- Complex scenes with many colors
- Detailed landscapes
- Gallery-quality display
- Experienced crafters

**Configuration**:
```typescript
stylePack: 'hd_palette',
hdPaletteOptions: {
  minColors: 20,        // Minimum colors
  maxColors: 30,        // Maximum colors
  emphasizeSubject: true,   // Focus colors on face/subject
  prioritizeSaturation: true,  // Vivid colors
  ensureFullSpectrum: true    // Balanced hue distribution
}
```

---

## ⚙️ Quality Settings Guide

### Preprocessing (Automatic Image Enhancement)

**Always Recommended**:
```typescript
qualitySettings: {
  enablePreprocessing: true  // Default, leave enabled
}
```

**Custom Preprocessing**:
```typescript
preprocessingOptions: {
  minResolution: 1500,     // Min size before upscaling
  autoWhiteBalance: true,   // Fix color casts
  autoContrast: true,       // Enhance contrast (CLAHE)
  autoSharpen: true,        // Sharpen details
  noiseReduction: true      // Remove noise/artifacts
}
```

**When to Disable Preprocessing**:
- Professional studio photos (already perfect)
- Pre-edited images (avoid double-processing)
- Specific artistic effects (vintage, faded)

### Face Detection

```typescript
qualitySettings: {
  useFaceDetection: true  // Emphasizes facial details
}
```

**Enable For**: Portraits, people photos, pet faces
**Disable For**: Landscapes, objects, abstract art

### Region Cleanup

```typescript
qualitySettings: {
  minClusterSize: 4  // Default (2×2 beads minimum)
}
```

**Increase to 6-8 for**:
- Simpler, cleaner patterns
- Beginner-friendly projects
- Faster completion

**Decrease to 3 for**:
- Maximum detail preservation
- Complex scenes
- Expert-level projects

### Sharpening

```typescript
qualitySettings: {
  sharpenAmount: 0.8  // Default (moderate)
}
```

- **0.5-0.7**: Gentle, for smooth subjects (babies, soft portraits)
- **0.8-1.0**: Standard, balanced sharpness
- **1.1-1.5**: Strong, for detailed textures (landscapes, animals)

---

## 📊 Common Scenarios

### Scenario 1: Quick Portrait Gift

**Goal**: Nice portrait, reasonable time investment

```typescript
{
  canvasFormat: 'canvas_40x50',
  stylePack: 'hd_palette',
  hdPaletteOptions: {
    minColors: 20,
    maxColors: 25
  },
  qualitySettings: {
    useFaceDetection: true,
    minClusterSize: 5
  }
}
```

**Result**: ~32,000 drills, 25 colors, 40-60 hours work

### Scenario 2: Wall Art Masterpiece

**Goal**: Gallery-quality display piece

```typescript
{
  canvasFormat: 'canvas_70x90',
  stylePack: 'hd_palette',
  hdPaletteOptions: {
    minColors: 30,
    maxColors: 30,
    prioritizeSaturation: true,
    colorSeparationThreshold: 22
  },
  preprocessingOptions: {
    minResolution: 2000,
    autoSharpen: true
  },
  qualitySettings: {
    useFaceDetection: true,
    minClusterSize: 3,
    sharpenAmount: 1.2
  }
}
```

**Result**: ~100,000 drills, 30 vivid colors, 140-180 hours work

### Scenario 3: Beginner First Project

**Goal**: Easy, achievable, builds confidence

```typescript
{
  canvasFormat: 'canvas_25x35',
  stylePack: 'a4_original',  // 7 colors only
  qualitySettings: {
    minClusterSize: 8
  }
}
```

**Result**: ~14,000 drills, 7 colors, 18-24 hours work

### Scenario 4: Pet Portrait

**Goal**: Realistic pet with fur detail

```typescript
{
  canvasFormat: 'canvas_50x70',
  stylePack: 'hd_palette',
  hdPaletteOptions: {
    minColors: 25,
    maxColors: 28,
    emphasizeSubject: true
  },
  qualitySettings: {
    useFaceDetection: true,  // Works for pet faces too
    sharpenAmount: 1.1,      // Enhance fur texture
    minClusterSize: 4
  }
}
```

**Result**: ~56,000 drills, 25-28 colors, 70-100 hours work

### Scenario 5: Landscape Photography

**Goal**: Scenic view with sky, water, trees

```typescript
{
  canvasFormat: 'canvas_60x80',
  stylePack: 'hd_palette',
  hdPaletteOptions: {
    minColors: 25,
    maxColors: 30,
    ensureFullSpectrum: true,  // Important for nature scenes
    prioritizeSaturation: true  // Vivid blues/greens
  },
  qualitySettings: {
    useFaceDetection: false,  // No faces
    minClusterSize: 5
  }
}
```

**Result**: ~76,800 drills, 25-30 colors, 100-140 hours work

---

## 🎯 Pro Tips

### Image Quality Matters

✅ **DO**:
- Use high-res photos (> 1500px min dimension)
- Ensure good lighting
- Sharp focus on main subject
- Simple backgrounds

❌ **AVOID**:
- Blurry images
- Very dark/overexposed photos
- Extreme compression (small JPEGs)
- Busy, cluttered backgrounds

### Color Mode Tips

**Use 7-Color Packs When**:
- First-time crafter
- Simple graphic/logo
- Want quick completion
- Limited color organization skills

**Use HD Palette When**:
- Photorealistic result desired
- Complex scene
- Experienced crafter
- Gallery-quality goal

### Size Selection Tips

**Bigger Is NOT Always Better**:
- 30×40 cm can look amazing if well-executed
- 70×90 cm takes 3-6 months of dedicated work
- Consider completion likelihood

**Start Small, Scale Up**:
- First project: 25×35 or 30×40 cm
- Second project: 40×50 cm
- Advanced: 50×70 cm
- Master: 60×80 or 70×90 cm

### Completion Time Reality Check

**Drilling Speed**: ~100-150 drills/hour average

| Canvas Size | Drills | Hours @ 120/hr | Calendar Time* |
|-------------|--------|----------------|----------------|
| 25×35 cm | 14,000 | 117 hours | 2-3 weeks |
| 40×50 cm | 32,000 | 267 hours | 1-2 months |
| 50×70 cm | 56,000 | 467 hours | 2-3 months |
| 70×90 cm | 100,800 | 840 hours | 4-6 months |

*Assuming 2-3 hours/day pace

---

## 🛠️ Troubleshooting Quick Fixes

### Problem: Too Fragmented

```typescript
qualitySettings: {
  minClusterSize: 6  // Increase
}
```

### Problem: Dull Colors

```typescript
hdPaletteOptions: {
  prioritizeSaturation: true,
  colorSeparationThreshold: 22
}
```

### Problem: Background Too Detailed

```typescript
hdPaletteOptions: {
  emphasizeSubject: true
}
```

### Problem: Face Not Clear

```typescript
qualitySettings: {
  useFaceDetection: true,
  sharpenAmount: 1.1
}
// Also: crop tighter on face, ensure good lighting
```

---

## 📦 Output Files

After generation, you'll receive:

1. **Preview Image**: High-res rendering of final pattern
2. **Grid Data**: Complete bead placement map
3. **Tile System**: 16×16 sections for manageable assembly
4. **Bead Counts**: Exact DMC codes and quantities needed
5. **Diagnostics**: Quality metrics and statistics

---

## 🎓 Learning Path

### Week 1: Learn the Basics
- Try `canvas_25x35` with `a4_original`
- 7 colors, simple pattern
- Focus on completing your first piece

### Week 2-4: Explore Options
- Try `canvas_40x50` with different style packs
- Experiment with `vintage` and `pop_art` modes
- Learn color organization

### Month 2-3: Advanced Techniques
- Move to `canvas_50x70`
- Try `hd_palette` with 20-25 colors
- Enable face detection

### Month 4+: Master Level
- Tackle `canvas_60x80` or `canvas_70x90`
- Use full HD palette (30 colors)
- Fine-tune all quality settings
- Create gallery pieces

---

## 💡 Best Practices Summary

1. **Start with good source images** (sharp, well-lit, high-res)
2. **Choose appropriate size** (don't overcommit)
3. **Match color mode to project** (7-color for simple, HD for complex)
4. **Enable preprocessing** (unless photo is already perfect)
5. **Use face detection for portraits** (huge quality boost)
6. **Adjust cluster size to taste** (smaller = more detail = more time)
7. **Test small before going large** (learn the process first)

---

## 🚀 Ready to Create?

```typescript
// Your first professional diamond painting
const result = await generateAdvancedDiamondPainting(
  'https://example.com/my-photo.jpg',
  {
    canvasFormat: 'canvas_40x50',
    stylePack: 'hd_palette',
    hdPaletteOptions: {
      minColors: 25,
      maxColors: 28
    },
    qualitySettings: {
      useFaceDetection: true
    }
  }
)

console.log(`Pattern ready! ${result.totalBeads} beads, ${result.beadCounts.length} colors`)
console.log(`Estimated time: ${result.estimatedTime}`)
console.log(`Difficulty: ${result.difficulty}`)
```

Happy crafting! 💎✨
