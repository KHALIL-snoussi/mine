/**
 * Quality Presets - Phase 4 Advanced Feature
 *
 * One-click preset configurations for different skill levels and use cases.
 * Each preset is carefully tuned for optimal results at that level.
 *
 * Presets:
 * - Beginner: Simple, achievable projects with fast completion
 * - Intermediate: Balanced detail and complexity
 * - Professional: High quality with good detail
 * - Master: Maximum quality for experienced crafters
 * - Quick Gift: Fast turnaround for gifts
 * - Gallery Masterpiece: Ultimate quality for display
 */

import type { AdvancedDiamondOptions } from './advancedDiamondGenerator'
import type { HDPaletteOptions } from './premiumDiamondUpgrades'
import type { PreprocessingOptions } from './imagePreprocessing'
import type { RegionMergingOptions } from './smartRegionMerging'
import type { BackgroundSimplificationOptions } from './backgroundSimplification'

export type QualityPresetName =
  | 'beginner'
  | 'intermediate'
  | 'professional'
  | 'master'
  | 'quick_gift'
  | 'gallery_masterpiece'

export interface QualityPreset {
  name: string
  description: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedTimeMultiplier: number  // Relative to baseline (1.0 = average)
  recommendedCanvasSizes: string[]
  options: Partial<AdvancedDiamondOptions>
}

/**
 * Get preset configuration by name
 */
export function getQualityPreset(presetName: QualityPresetName): QualityPreset {
  const preset = QUALITY_PRESETS[presetName]
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`)
  }
  return preset
}

/**
 * Get all available presets
 */
export function getAllPresets(): Record<QualityPresetName, QualityPreset> {
  return { ...QUALITY_PRESETS }
}

/**
 * Apply preset to options (merges with existing options)
 */
export function applyPreset(
  presetName: QualityPresetName,
  baseOptions: Partial<AdvancedDiamondOptions> = {}
): AdvancedDiamondOptions {
  const preset = getQualityPreset(presetName)

  // Deep merge preset options with base options
  // Base options take precedence over preset (allows overrides)
  return {
    ...preset.options,
    ...baseOptions,
    hdPaletteOptions: {
      ...preset.options.hdPaletteOptions,
      ...baseOptions.hdPaletteOptions
    },
    preprocessingOptions: {
      ...preset.options.preprocessingOptions,
      ...baseOptions.preprocessingOptions
    },
    regionMergingOptions: {
      ...preset.options.regionMergingOptions,
      ...baseOptions.regionMergingOptions
    },
    backgroundSimplificationOptions: {
      ...preset.options.backgroundSimplificationOptions,
      ...baseOptions.backgroundSimplificationOptions
    },
    qualitySettings: {
      ...preset.options.qualitySettings,
      ...baseOptions.qualitySettings
    }
  } as AdvancedDiamondOptions
}

/**
 * Recommend preset based on canvas size and color mode
 */
export function recommendPreset(
  canvasFormat: string,
  stylePack: string
): QualityPresetName {
  const isHDPalette = stylePack === 'hd_palette'

  // Small canvases
  if (['canvas_20x30', 'canvas_25x35'].includes(canvasFormat)) {
    return isHDPalette ? 'intermediate' : 'beginner'
  }

  // Medium canvases
  if (['canvas_30x40', 'canvas_40x50'].includes(canvasFormat)) {
    return isHDPalette ? 'professional' : 'intermediate'
  }

  // Large canvases
  if (['canvas_50x70', 'canvas_60x80'].includes(canvasFormat)) {
    return isHDPalette ? 'master' : 'professional'
  }

  // Extra large canvases
  if (['canvas_70x90'].includes(canvasFormat)) {
    return 'master'
  }

  // Default
  return 'professional'
}

// ==================== PRESET DEFINITIONS ====================

const QUALITY_PRESETS: Record<QualityPresetName, QualityPreset> = {
  /**
   * BEGINNER PRESET
   * Perfect for first-time crafters
   * - Small canvas (20-30cm)
   * - 7 colors maximum
   * - Large clusters (easy to work with)
   * - Fast completion
   */
  beginner: {
    name: 'Beginner',
    description: 'Perfect for your first diamond painting project. Simple, achievable, and confidence-building.',
    skillLevel: 'beginner',
    estimatedTimeMultiplier: 0.4,
    recommendedCanvasSizes: ['canvas_20x30', 'canvas_25x35'],
    options: {
      stylePack: 'a4_original',  // 7 colors
      preprocessingOptions: {
        minResolution: 1200,
        autoWhiteBalance: true,
        autoContrast: true,
        autoSharpen: false,  // Don't over-sharpen for simple projects
        noiseReduction: true
      },
      regionMergingOptions: {
        enableMerging: true,
        mergeSimilarityThreshold: 12,  // More aggressive merging
        minRegionSizeBeforeMerge: 15,
        preserveSubjectDetail: true
      },
      backgroundSimplificationOptions: {
        enableSimplification: false  // Keep it simple
      },
      qualitySettings: {
        bilateralSigma: 4,  // More smoothing
        sharpenAmount: 0.5,  // Gentle sharpening
        ditheringStrength: 0.3,  // Less dithering
        minClusterSize: 8,  // Large clusters (4×2)
        useFaceDetection: false,  // Simplify
        useRegionAwareDithering: false,
        useEnhancedCleanup: true,
        enablePreprocessing: true
      }
    }
  },

  /**
   * INTERMEDIATE PRESET
   * For crafters with some experience
   * - Medium canvas (30-40cm)
   * - 7-20 colors
   * - Moderate detail
   * - Reasonable completion time
   */
  intermediate: {
    name: 'Intermediate',
    description: 'For crafters with some experience. Balanced detail and complexity with reasonable completion time.',
    skillLevel: 'intermediate',
    estimatedTimeMultiplier: 0.7,
    recommendedCanvasSizes: ['canvas_30x40', 'canvas_40x50'],
    options: {
      stylePack: 'hd_palette',
      hdPaletteOptions: {
        minColors: 15,
        maxColors: 20,
        emphasizeSubject: true,
        prioritizeSaturation: false,
        ensureFullSpectrum: true,
        colorSeparationThreshold: 20
      },
      preprocessingOptions: {
        minResolution: 1500,
        autoWhiteBalance: true,
        autoContrast: true,
        autoSharpen: true,
        noiseReduction: true
      },
      regionMergingOptions: {
        enableMerging: true,
        mergeSimilarityThreshold: 9,
        minRegionSizeBeforeMerge: 18,
        preserveSubjectDetail: true
      },
      backgroundSimplificationOptions: {
        enableSimplification: false
      },
      qualitySettings: {
        bilateralSigma: 3,
        sharpenAmount: 0.7,
        ditheringStrength: 0.4,
        minClusterSize: 5,
        useFaceDetection: true,
        useRegionAwareDithering: true,
        useEnhancedCleanup: true,
        enablePreprocessing: true
      }
    }
  },

  /**
   * PROFESSIONAL PRESET
   * High-quality results for experienced crafters
   * - Large canvas (40-60cm)
   * - 20-28 colors
   * - High detail
   * - Significant time investment
   */
  professional: {
    name: 'Professional',
    description: 'High-quality results for experienced crafters. Excellent detail and color accuracy.',
    skillLevel: 'advanced',
    estimatedTimeMultiplier: 1.0,
    recommendedCanvasSizes: ['canvas_40x50', 'canvas_50x70', 'canvas_60x80'],
    options: {
      stylePack: 'hd_palette',
      hdPaletteOptions: {
        minColors: 22,
        maxColors: 28,
        emphasizeSubject: true,
        prioritizeSaturation: true,
        ensureFullSpectrum: true,
        colorSeparationThreshold: 18
      },
      preprocessingOptions: {
        minResolution: 1800,
        autoWhiteBalance: true,
        autoContrast: true,
        autoSharpen: true,
        noiseReduction: true,
        advancedSharpening: true
      },
      regionMergingOptions: {
        enableMerging: true,
        mergeSimilarityThreshold: 8,
        minRegionSizeBeforeMerge: 20,
        preserveSubjectDetail: true,
        mergePasses: 2
      },
      backgroundSimplificationOptions: {
        enableSimplification: true,
        simplificationMode: 'subtle',
        applyBackgroundBlur: true,
        backgroundBlurAmount: 2,
        reduceBackgroundColors: true,
        colorReductionFactor: 0.2,
        desaturateBackground: false
      },
      qualitySettings: {
        bilateralSigma: 3,
        sharpenAmount: 0.9,
        ditheringStrength: 0.5,
        minClusterSize: 4,
        useFaceDetection: true,
        useRegionAwareDithering: true,
        useEnhancedCleanup: true,
        enablePreprocessing: true
      }
    }
  },

  /**
   * MASTER PRESET
   * Ultimate quality for expert crafters
   * - Extra large canvas (60-90cm)
   * - 28-30 colors
   * - Maximum detail
   * - Major time investment (months)
   */
  master: {
    name: 'Master',
    description: 'Ultimate quality for expert crafters. Gallery-worthy results with maximum detail.',
    skillLevel: 'expert',
    estimatedTimeMultiplier: 1.5,
    recommendedCanvasSizes: ['canvas_60x80', 'canvas_70x90'],
    options: {
      stylePack: 'hd_palette',
      hdPaletteOptions: {
        minColors: 28,
        maxColors: 30,
        emphasizeSubject: true,
        prioritizeSaturation: true,
        ensureFullSpectrum: true,
        colorSeparationThreshold: 16
      },
      preprocessingOptions: {
        minResolution: 2000,
        autoWhiteBalance: true,
        autoContrast: true,
        autoSharpen: true,
        noiseReduction: true,
        advancedSharpening: true,
        claheClipLimit: 2.5
      },
      regionMergingOptions: {
        enableMerging: true,
        mergeSimilarityThreshold: 7,
        minRegionSizeBeforeMerge: 20,
        preserveSubjectDetail: true,
        mergePasses: 2
      },
      backgroundSimplificationOptions: {
        enableSimplification: true,
        simplificationMode: 'moderate',
        applyBackgroundBlur: true,
        backgroundBlurAmount: 3,
        reduceBackgroundColors: true,
        colorReductionFactor: 0.3,
        desaturateBackground: false
      },
      qualitySettings: {
        bilateralSigma: 2.5,
        sharpenAmount: 1.1,
        ditheringStrength: 0.6,
        minClusterSize: 3,
        useFaceDetection: true,
        useRegionAwareDithering: true,
        useEnhancedCleanup: true,
        enablePreprocessing: true
      }
    }
  },

  /**
   * QUICK GIFT PRESET
   * Fast turnaround for gift-giving
   * - Small-medium canvas
   * - Moderate colors
   * - Quick completion
   * - Still looks great!
   */
  quick_gift: {
    name: 'Quick Gift',
    description: 'Fast turnaround for gift-giving. Looks great with minimal time investment.',
    skillLevel: 'intermediate',
    estimatedTimeMultiplier: 0.5,
    recommendedCanvasSizes: ['canvas_30x40', 'canvas_40x50'],
    options: {
      stylePack: 'hd_palette',
      hdPaletteOptions: {
        minColors: 18,
        maxColors: 22,
        emphasizeSubject: true,
        prioritizeSaturation: true,
        ensureFullSpectrum: true,
        colorSeparationThreshold: 20
      },
      preprocessingOptions: {
        minResolution: 1500,
        autoWhiteBalance: true,
        autoContrast: true,
        autoSharpen: true,
        noiseReduction: true
      },
      regionMergingOptions: {
        enableMerging: true,
        mergeSimilarityThreshold: 10,
        minRegionSizeBeforeMerge: 20,
        preserveSubjectDetail: true
      },
      backgroundSimplificationOptions: {
        enableSimplification: true,
        simplificationMode: 'moderate',
        applyBackgroundBlur: true,
        backgroundBlurAmount: 4,
        reduceBackgroundColors: true,
        colorReductionFactor: 0.4,
        desaturateBackground: true,
        desaturationAmount: 0.3
      },
      qualitySettings: {
        bilateralSigma: 3.5,
        sharpenAmount: 0.8,
        ditheringStrength: 0.4,
        minClusterSize: 6,
        useFaceDetection: true,
        useRegionAwareDithering: true,
        useEnhancedCleanup: true,
        enablePreprocessing: true
      }
    }
  },

  /**
   * GALLERY MASTERPIECE PRESET
   * Absolute maximum quality
   * - Extra large canvas
   * - Full 30 colors
   * - Every optimization enabled
   * - Months of work, but worth it!
   */
  gallery_masterpiece: {
    name: 'Gallery Masterpiece',
    description: 'Absolute maximum quality for wall art and display. Months of work, gallery-worthy result.',
    skillLevel: 'expert',
    estimatedTimeMultiplier: 1.8,
    recommendedCanvasSizes: ['canvas_70x90'],
    options: {
      stylePack: 'hd_palette',
      hdPaletteOptions: {
        minColors: 30,
        maxColors: 30,
        emphasizeSubject: true,
        prioritizeSaturation: true,
        ensureFullSpectrum: true,
        colorSeparationThreshold: 15
      },
      preprocessingOptions: {
        minResolution: 2500,
        autoWhiteBalance: true,
        autoContrast: true,
        autoSharpen: true,
        noiseReduction: true,
        advancedSharpening: true,
        claheClipLimit: 3.0
      },
      regionMergingOptions: {
        enableMerging: true,
        mergeSimilarityThreshold: 6,
        minRegionSizeBeforeMerge: 25,
        maxRegionSizeToMerge: 400,
        preserveSubjectDetail: true,
        mergePasses: 3
      },
      backgroundSimplificationOptions: {
        enableSimplification: true,
        simplificationMode: 'strong',
        applyBackgroundBlur: true,
        backgroundBlurAmount: 4,
        reduceBackgroundColors: true,
        colorReductionFactor: 0.35,
        desaturateBackground: false,
        smoothBackgroundRegions: true
      },
      qualitySettings: {
        bilateralSigma: 2,
        sharpenAmount: 1.3,
        ditheringStrength: 0.7,
        minClusterSize: 3,
        useFaceDetection: true,
        useRegionAwareDithering: true,
        useEnhancedCleanup: true,
        enablePreprocessing: true
      }
    }
  }
}
