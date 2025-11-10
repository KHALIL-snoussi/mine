/**
 * Background Simplification - Phase 4 Advanced Feature
 *
 * Intelligently simplifies background regions while preserving subject detail,
 * creating professional results with clean backgrounds and sharp subjects.
 *
 * Features:
 * - Automatic background detection using segmentation masks
 * - Adaptive background blur with depth-aware processing
 * - Color reduction in background areas
 * - Edge-preserving subject detail
 * - Multiple simplification modes (Subtle, Moderate, Strong)
 */

import type { ImageData } from 'canvas'

export interface BackgroundSimplificationOptions {
  /** Enable background simplification (default: false) */
  enableSimplification?: boolean

  /** Subject/face mask for region detection */
  subjectMask?: ImageData | Uint8ClampedArray

  /** Simplification strength (default: 'moderate') */
  simplificationMode?: 'subtle' | 'moderate' | 'strong'

  /** Blur background (default: true) */
  applyBackgroundBlur?: boolean

  /** Background blur amount in pixels (default: 3) */
  backgroundBlurAmount?: number

  /** Reduce background colors (default: true) */
  reduceBackgroundColors?: boolean

  /** Color reduction factor 0-1 (default: 0.3 = reduce to 30% of colors) */
  colorReductionFactor?: number

  /** Desaturate background (default: false) */
  desaturateBackground?: boolean

  /** Desaturation amount 0-1 (default: 0.4 = reduce saturation by 40%) */
  desaturationAmount?: number

  /** Smooth background regions (default: true) */
  smoothBackgroundRegions?: boolean
}

export interface BackgroundSimplificationResult {
  simplifiedImage: ImageData
  backgroundMask: Uint8Array  // 255 = background, 0 = subject
  subjectBounds: { minX: number, maxX: number, minY: number, maxY: number }
  statistics: {
    backgroundPercentage: number
    subjectPercentage: number
    blurApplied: boolean
    colorsReduced: boolean
    desaturated: boolean
  }
}

/**
 * Main entry point for background simplification
 */
export async function simplifyBackground(
  imageData: ImageData,
  options: BackgroundSimplificationOptions = {}
): Promise<BackgroundSimplificationResult> {
  const {
    enableSimplification = false,
    subjectMask,
    simplificationMode = 'moderate',
    applyBackgroundBlur = true,
    backgroundBlurAmount = 3,
    reduceBackgroundColors = true,
    colorReductionFactor = 0.3,
    desaturateBackground = false,
    desaturationAmount = 0.4,
    smoothBackgroundRegions = true
  } = options

  if (!enableSimplification) {
    // Return original image unchanged
    const backgroundMask = new Uint8Array(imageData.width * imageData.height)
    return {
      simplifiedImage: imageData,
      backgroundMask,
      subjectBounds: { minX: 0, maxX: imageData.width - 1, minY: 0, maxY: imageData.height - 1 },
      statistics: {
        backgroundPercentage: 0,
        subjectPercentage: 100,
        blurApplied: false,
        colorsReduced: false,
        desaturated: false
      }
    }
  }

  console.log('🎨 Background Simplification: Starting...')

  // Step 1: Create/refine background mask
  const backgroundMask = createBackgroundMask(imageData, subjectMask)

  // Calculate background/subject percentages
  const totalPixels = backgroundMask.length
  let backgroundPixels = 0
  for (let i = 0; i < backgroundMask.length; i++) {
    if (backgroundMask[i] > 127) backgroundPixels++
  }
  const backgroundPercentage = (backgroundPixels / totalPixels) * 100
  const subjectPercentage = 100 - backgroundPercentage

  console.log(`  Background: ${backgroundPercentage.toFixed(1)}%, Subject: ${subjectPercentage.toFixed(1)}%`)

  // Step 2: Find subject bounds
  const subjectBounds = findSubjectBounds(backgroundMask, imageData.width, imageData.height)

  // Step 3: Clone image for processing
  let processedImage = cloneImageData(imageData)

  let blurApplied = false
  let colorsReduced = false
  let desaturated = false

  // Determine strength parameters based on mode
  const strength = getSimplificationStrength(simplificationMode)

  // Step 4: Apply background blur
  if (applyBackgroundBlur) {
    console.log(`  Applying background blur (${backgroundBlurAmount}px)...`)
    processedImage = applySelectiveBlur(
      processedImage,
      backgroundMask,
      backgroundBlurAmount * strength.blurMultiplier
    )
    blurApplied = true
  }

  // Step 5: Reduce background colors
  if (reduceBackgroundColors) {
    console.log(`  Reducing background colors (factor: ${colorReductionFactor})...`)
    processedImage = reduceColorsInBackground(
      processedImage,
      backgroundMask,
      colorReductionFactor * strength.colorReductionMultiplier
    )
    colorsReduced = true
  }

  // Step 6: Desaturate background
  if (desaturateBackground) {
    console.log(`  Desaturating background (amount: ${desaturationAmount})...`)
    processedImage = desaturateBackgroundRegion(
      processedImage,
      backgroundMask,
      desaturationAmount * strength.desaturationMultiplier
    )
    desaturated = true
  }

  // Step 7: Smooth background regions
  if (smoothBackgroundRegions) {
    console.log('  Smoothing background regions...')
    processedImage = smoothRegions(processedImage, backgroundMask, 2)
  }

  console.log('✅ Background Simplification Complete')

  return {
    simplifiedImage: processedImage,
    backgroundMask,
    subjectBounds,
    statistics: {
      backgroundPercentage,
      subjectPercentage,
      blurApplied,
      colorsReduced,
      desaturated
    }
  }
}

/**
 * Create background mask (255 = background, 0 = subject)
 */
function createBackgroundMask(
  imageData: ImageData,
  subjectMask?: ImageData | Uint8ClampedArray
): Uint8Array {
  const { width, height } = imageData
  const mask = new Uint8Array(width * height)

  if (subjectMask) {
    // Use provided subject mask (invert: 255 subject → 0 background, 0 subject → 255 background)
    const maskData = subjectMask instanceof ImageData ? subjectMask.data : subjectMask

    for (let i = 0; i < mask.length; i++) {
      const maskValue = maskData[i * 4] || maskData[i]  // Handle both ImageData and Uint8ClampedArray
      mask[i] = maskValue > 127 ? 0 : 255  // Invert: subject (255) → background (0)
    }
  } else {
    // No mask provided, assume entire image is subject
    mask.fill(0)
  }

  // Dilate subject mask slightly to avoid bleeding effect at edges
  return dilate(mask, width, height, 2)
}

/**
 * Find bounding box of subject
 */
function findSubjectBounds(
  backgroundMask: Uint8Array,
  width: number,
  height: number
): { minX: number, maxX: number, minY: number, maxY: number } {
  let minX = width, maxX = 0, minY = height, maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x

      // Subject pixels (0 = subject, 255 = background)
      if (backgroundMask[idx] < 127) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  return { minX, maxX, minY, maxY }
}

/**
 * Get simplification strength parameters
 */
function getSimplificationStrength(mode: 'subtle' | 'moderate' | 'strong') {
  switch (mode) {
    case 'subtle':
      return {
        blurMultiplier: 0.6,
        colorReductionMultiplier: 0.5,
        desaturationMultiplier: 0.5
      }
    case 'moderate':
      return {
        blurMultiplier: 1.0,
        colorReductionMultiplier: 1.0,
        desaturationMultiplier: 1.0
      }
    case 'strong':
      return {
        blurMultiplier: 1.5,
        colorReductionMultiplier: 1.5,
        desaturationMultiplier: 1.5
      }
  }
}

/**
 * Apply selective blur to background only
 */
function applySelectiveBlur(
  imageData: ImageData,
  backgroundMask: Uint8Array,
  blurRadius: number
): ImageData {
  const { width, height, data } = imageData
  const result = cloneImageData(imageData)
  const resultData = result.data

  const radius = Math.ceil(blurRadius)
  const kernel = createGaussianKernel(radius, blurRadius / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x

      // Only blur background pixels
      if (backgroundMask[idx] < 127) continue

      let r = 0, g = 0, b = 0, weight = 0

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = x + kx
          const ny = y + ky

          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

          const nIdx = ny * width + nx
          const w = kernel[ky + radius][kx + radius]

          r += data[nIdx * 4] * w
          g += data[nIdx * 4 + 1] * w
          b += data[nIdx * 4 + 2] * w
          weight += w
        }
      }

      resultData[idx * 4] = Math.round(r / weight)
      resultData[idx * 4 + 1] = Math.round(g / weight)
      resultData[idx * 4 + 2] = Math.round(b / weight)
    }
  }

  return result
}

/**
 * Reduce color diversity in background
 */
function reduceColorsInBackground(
  imageData: ImageData,
  backgroundMask: Uint8Array,
  reductionFactor: number
): ImageData {
  const { width, height, data } = imageData
  const result = cloneImageData(imageData)
  const resultData = result.data

  // Quantize background colors more aggressively
  const quantizationLevel = Math.max(16, Math.floor(128 * (1 - reductionFactor)))

  for (let i = 0; i < backgroundMask.length; i++) {
    // Only process background pixels
    if (backgroundMask[i] < 127) continue

    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]

    // Quantize to reduce color variation
    resultData[i * 4] = Math.round(r / quantizationLevel) * quantizationLevel
    resultData[i * 4 + 1] = Math.round(g / quantizationLevel) * quantizationLevel
    resultData[i * 4 + 2] = Math.round(b / quantizationLevel) * quantizationLevel
  }

  return result
}

/**
 * Desaturate background region
 */
function desaturateBackgroundRegion(
  imageData: ImageData,
  backgroundMask: Uint8Array,
  amount: number
): ImageData {
  const { data } = imageData
  const result = cloneImageData(imageData)
  const resultData = result.data

  for (let i = 0; i < backgroundMask.length; i++) {
    // Only process background pixels
    if (backgroundMask[i] < 127) continue

    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]

    // Calculate grayscale
    const gray = 0.299 * r + 0.587 * g + 0.114 * b

    // Blend toward grayscale
    resultData[i * 4] = Math.round(r * (1 - amount) + gray * amount)
    resultData[i * 4 + 1] = Math.round(g * (1 - amount) + gray * amount)
    resultData[i * 4 + 2] = Math.round(b * (1 - amount) + gray * amount)
  }

  return result
}

/**
 * Smooth background regions using median filter
 */
function smoothRegions(
  imageData: ImageData,
  backgroundMask: Uint8Array,
  radius: number
): ImageData {
  const { width, height, data } = imageData
  const result = cloneImageData(imageData)
  const resultData = result.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x

      // Only process background pixels
      if (backgroundMask[idx] < 127) continue

      const neighbors: Array<[number, number, number]> = []

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy

          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

          const nIdx = ny * width + nx

          neighbors.push([
            data[nIdx * 4],
            data[nIdx * 4 + 1],
            data[nIdx * 4 + 2]
          ])
        }
      }

      // Use median color
      if (neighbors.length > 0) {
        const medianR = median(neighbors.map(c => c[0]))
        const medianG = median(neighbors.map(c => c[1]))
        const medianB = median(neighbors.map(c => c[2]))

        resultData[idx * 4] = medianR
        resultData[idx * 4 + 1] = medianG
        resultData[idx * 4 + 2] = medianB
      }
    }
  }

  return result
}

/**
 * Dilate mask (expand subject, shrink background)
 */
function dilate(mask: Uint8Array, width: number, height: number, iterations: number): Uint8Array {
  let current = new Uint8Array(mask)

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Uint8Array(current)

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x

        // If any neighbor is subject (0), make this subject too
        if (
          current[idx - 1] === 0 ||
          current[idx + 1] === 0 ||
          current[idx - width] === 0 ||
          current[idx + width] === 0
        ) {
          next[idx] = 0
        }
      }
    }

    current = next
  }

  return current
}

/**
 * Create Gaussian kernel for blur
 */
function createGaussianKernel(radius: number, sigma: number): number[][] {
  const size = radius * 2 + 1
  const kernel: number[][] = []

  let sum = 0

  for (let y = 0; y < size; y++) {
    kernel[y] = []
    for (let x = 0; x < size; x++) {
      const dx = x - radius
      const dy = y - radius
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
      kernel[y][x] = value
      sum += value
    }
  }

  // Normalize
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum
    }
  }

  return kernel
}

/**
 * Calculate median of array
 */
function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Clone ImageData
 */
function cloneImageData(imageData: ImageData): ImageData {
  const cloned = new ImageData(imageData.width, imageData.height)
  cloned.data.set(imageData.data)
  return cloned
}
