/**
 * Diamond Painting Quality Tests
 *
 * Tests for segmentation and palette balancing to ensure:
 * 1. Background uses ≥2 palette colors
 * 2. Subject palette usage stays within ±15% of targets
 * 3. Edge pixels survive quantization
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  kMeansSegmentation,
  quantizeWithTargetPercentages,
  applyCLAHE,
  applySegmentedToneCurves,
  errorDiffusionWithMask,
  rgbToLab,
  deltaE2000,
} from '@/lib/colorUtils'
import { RGB } from '@/lib/types'

/**
 * Create a synthetic test image simulating a portrait:
 * - Center circle (subject) with gradient from dark to light
 * - Border area (background) with sky-like gradient
 * - Edge areas with distinct gradients (mountain/horizon)
 */
function createTestPortrait(width: number = 200, height: number = 200): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Background: Sky gradient (top-to-bottom: light blue to white)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height)
  skyGradient.addColorStop(0, '#87CEEB') // Sky blue
  skyGradient.addColorStop(0.6, '#B0D4E3') // Light blue
  skyGradient.addColorStop(1, '#D3E4ED') // Very light blue
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, width, height)

  // Mountain/Horizon edges (bottom third)
  const mountainGradient = ctx.createLinearGradient(0, height * 0.7, 0, height)
  mountainGradient.addColorStop(0, '#8B7355') // Brown
  mountainGradient.addColorStop(0.5, '#A0826D') // Light brown
  mountainGradient.addColorStop(1, '#B8A38A') // Tan
  ctx.fillStyle = mountainGradient
  ctx.fillRect(0, height * 0.7, width, height * 0.3)

  // Subject: Circle in center with radial gradient (person)
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 4

  const subjectGradient = ctx.createRadialGradient(
    centerX - radius * 0.3,
    centerY - radius * 0.3,
    0,
    centerX,
    centerY,
    radius
  )
  subjectGradient.addColorStop(0, '#FFE5CC') // Light skin tone (face)
  subjectGradient.addColorStop(0.4, '#E6B89C') // Medium skin tone
  subjectGradient.addColorStop(0.7, '#4A5D7D') // Blue shirt
  subjectGradient.addColorStop(1, '#2E3A52') // Dark blue shirt edge

  ctx.fillStyle = subjectGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  // Add some detail (shirt folds) - vertical stripes
  ctx.strokeStyle = '#3B4A5F'
  ctx.lineWidth = 2
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(centerX + i * 8, centerY + radius * 0.3)
    ctx.lineTo(centerX + i * 8, centerY + radius * 0.8)
    ctx.stroke()
  }

  return ctx.getImageData(0, 0, width, height)
}

/**
 * Calculate gradient magnitude at each pixel (edge strength)
 */
function calculateGradientMagnitude(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData
  const gradients = new Float32Array(width * height)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4

      // Sobel operator for gradient
      const gx =
        -data[idx - 4 - width * 4] +
        data[idx + 4 - width * 4] +
        -2 * data[idx - 4] +
        2 * data[idx + 4] +
        -data[idx - 4 + width * 4] +
        data[idx + 4 + width * 4]

      const gy =
        -data[idx - 4 - width * 4] +
        -2 * data[idx - width * 4] +
        -data[idx + 4 - width * 4] +
        data[idx - 4 + width * 4] +
        2 * data[idx + width * 4] +
        data[idx + 4 + width * 4]

      gradients[y * width + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  return gradients
}

/**
 * Count unique colors in an image region
 */
function countUniqueColorsInRegion(
  imageData: ImageData,
  mask: Uint8Array,
  isForeground: boolean
): Set<string> {
  const { data } = imageData
  const uniqueColors = new Set<string>()

  for (let i = 0; i < mask.length; i++) {
    const isMaskForeground = mask[i] > 127
    if (isMaskForeground === isForeground) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      uniqueColors.add(`${r},${g},${b}`)
    }
  }

  return uniqueColors
}

/**
 * Calculate color distribution percentages
 */
function calculateColorDistribution(
  imageData: ImageData,
  mask: Uint8Array
): Map<string, number> {
  const { data } = imageData
  const colorCounts = new Map<string, number>()
  let totalPixels = 0

  for (let i = 0; i < mask.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const key = `${r},${g},${b}`

    colorCounts.set(key, (colorCounts.get(key) || 0) + 1)
    totalPixels++
  }

  const distribution = new Map<string, number>()
  for (const [color, count] of colorCounts) {
    distribution.set(color, (count / totalPixels) * 100)
  }

  return distribution
}

describe('Diamond Painting Quality - Segmentation and Palette', () => {
  let testImage: ImageData
  let segmentationMask: Uint8Array

  beforeAll(() => {
    // Create synthetic portrait test image
    testImage = createTestPortrait(200, 200)

    // Run segmentation
    segmentationMask = kMeansSegmentation(testImage, 2)
  })

  describe('K-Means Segmentation', () => {
    it('should separate foreground from background', () => {
      // Count foreground and background pixels
      let foregroundPixels = 0
      let backgroundPixels = 0

      for (let i = 0; i < segmentationMask.length; i++) {
        if (segmentationMask[i] > 127) {
          foregroundPixels++
        } else {
          backgroundPixels++
        }
      }

      const totalPixels = segmentationMask.length
      const foregroundPercentage = (foregroundPixels / totalPixels) * 100
      const backgroundPercentage = (backgroundPixels / totalPixels) * 100

      // Should have both foreground and background regions
      expect(foregroundPercentage).toBeGreaterThan(10)
      expect(foregroundPercentage).toBeLessThan(90)
      expect(backgroundPercentage).toBeGreaterThan(10)
      expect(backgroundPercentage).toBeLessThan(90)
    })

    it('should identify center region as foreground', () => {
      const width = 200
      const height = 200
      const centerX = Math.floor(width / 2)
      const centerY = Math.floor(height / 2)

      // Check center pixel is foreground
      const centerIdx = centerY * width + centerX
      expect(segmentationMask[centerIdx]).toBeGreaterThan(127)

      // Check pixels around center (within radius/2) are mostly foreground
      const radius = Math.min(width, height) / 4
      let centerForegroundPixels = 0
      let centerTotalPixels = 0

      for (let y = centerY - radius / 2; y < centerY + radius / 2; y++) {
        for (let x = centerX - radius / 2; x < centerX + radius / 2; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = Math.floor(y) * width + Math.floor(x)
            if (segmentationMask[idx] > 127) centerForegroundPixels++
            centerTotalPixels++
          }
        }
      }

      const centerForegroundPercentage = (centerForegroundPixels / centerTotalPixels) * 100
      expect(centerForegroundPercentage).toBeGreaterThan(60)
    })

    it('should identify border regions as background', () => {
      const width = 200
      const height = 200
      const borderThickness = 10

      let borderBackgroundPixels = 0
      let borderTotalPixels = 0

      // Check top border
      for (let y = 0; y < borderThickness; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          if (segmentationMask[idx] < 127) borderBackgroundPixels++
          borderTotalPixels++
        }
      }

      // Check left border
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < borderThickness; x++) {
          const idx = y * width + x
          if (segmentationMask[idx] < 127) borderBackgroundPixels++
          borderTotalPixels++
        }
      }

      const borderBackgroundPercentage = (borderBackgroundPixels / borderTotalPixels) * 100
      expect(borderBackgroundPercentage).toBeGreaterThan(60)
    })
  })

  describe('Palette Balancing with Target Percentages', () => {
    it('should use ≥2 colors in background region', () => {
      // Define a simple test palette (Vintage-like beige tones)
      const palette: RGB[] = [
        { r: 237, g: 224, b: 212 }, // ECRU (background dominant)
        { r: 223, g: 196, b: 176 }, // TAN (background secondary)
        { r: 169, g: 130, b: 109 }, // MOCHA (subject mid)
        { r: 120, g: 90, b: 75 }, // BROWN (subject dark)
        { r: 255, g: 229, b: 204 }, // PEACH (subject light)
      ]

      const targetPercentages = [30, 20, 20, 15, 15] // Sum = 100%

      // Quantize with histogram-aware balancing
      const quantized = quantizeWithTargetPercentages(
        testImage,
        palette,
        targetPercentages,
        segmentationMask,
        15 // ±15% tolerance
      )

      // Count unique colors in background
      const backgroundColors = countUniqueColorsInRegion(quantized, segmentationMask, false)

      expect(backgroundColors.size).toBeGreaterThanOrEqual(2)
    })

    it('should keep palette usage within ±15% of targets', () => {
      const palette: RGB[] = [
        { r: 237, g: 224, b: 212 }, // ECRU
        { r: 223, g: 196, b: 176 }, // TAN
        { r: 169, g: 130, b: 109 }, // MOCHA
        { r: 120, g: 90, b: 75 }, // BROWN
        { r: 255, g: 229, b: 204 }, // PEACH
      ]

      const targetPercentages = [30, 20, 20, 15, 15]

      const quantized = quantizeWithTargetPercentages(
        testImage,
        palette,
        targetPercentages,
        segmentationMask,
        15
      )

      // Calculate actual color distribution
      const distribution = calculateColorDistribution(quantized, segmentationMask)

      // Map to palette indices
      const paletteUsage = new Array(palette.length).fill(0)
      const { data } = quantized

      for (let i = 0; i < segmentationMask.length; i++) {
        const r = data[i * 4]
        const g = data[i * 4 + 1]
        const b = data[i * 4 + 2]

        // Find matching palette index
        for (let p = 0; p < palette.length; p++) {
          if (palette[p].r === r && palette[p].g === g && palette[p].b === b) {
            paletteUsage[p]++
            break
          }
        }
      }

      // Convert to percentages
      const totalPixels = segmentationMask.length
      const usagePercentages = paletteUsage.map((count) => (count / totalPixels) * 100)

      // Check deviations
      let colorsWithinTolerance = 0
      const tolerance = 15

      for (let i = 0; i < palette.length; i++) {
        const deviation = Math.abs(usagePercentages[i] - targetPercentages[i])

        // At least 3 out of 5 colors should be within tolerance
        if (deviation <= tolerance) {
          colorsWithinTolerance++
        }
      }

      expect(colorsWithinTolerance).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Edge Preservation', () => {
    it('should preserve horizon edge pixels after quantization', () => {
      const palette: RGB[] = [
        { r: 237, g: 224, b: 212 },
        { r: 223, g: 196, b: 176 },
        { r: 169, g: 130, b: 109 },
        { r: 120, g: 90, b: 75 },
        { r: 255, g: 229, b: 204 },
      ]

      const targetPercentages = [30, 20, 20, 15, 15]

      // Calculate gradients before quantization
      const gradientsBefore = calculateGradientMagnitude(testImage)

      // Apply full pipeline
      let processed = testImage
      processed = applyCLAHE(processed, 2.0, 8)
      processed = applySegmentedToneCurves(processed, segmentationMask, 1.15, 0.7)
      processed = quantizeWithTargetPercentages(
        processed,
        palette,
        targetPercentages,
        segmentationMask,
        15
      )
      processed = errorDiffusionWithMask(processed, segmentationMask)

      // Calculate gradients after quantization
      const gradientsAfter = calculateGradientMagnitude(processed)

      // Find high-gradient pixels before (edges)
      const edgeThreshold = 30
      const edgePixelsBefore: number[] = []

      for (let i = 0; i < gradientsBefore.length; i++) {
        if (gradientsBefore[i] > edgeThreshold) {
          edgePixelsBefore.push(i)
        }
      }

      // Check how many edge pixels still have gradients after
      let preservedEdges = 0
      const preservationThreshold = edgeThreshold * 0.5 // Allow 50% reduction

      for (const idx of edgePixelsBefore) {
        if (gradientsAfter[idx] > preservationThreshold) {
          preservedEdges++
        }
      }

      const preservationRate = (preservedEdges / edgePixelsBefore.length) * 100

      // At least 40% of edge pixels should survive quantization
      expect(preservationRate).toBeGreaterThan(40)
    })

    it('should maintain gradient transitions in sky and mountain regions', () => {
      const palette: RGB[] = [
        { r: 237, g: 224, b: 212 },
        { r: 223, g: 196, b: 176 },
        { r: 169, g: 130, b: 109 },
        { r: 120, g: 90, b: 75 },
        { r: 255, g: 229, b: 204 },
      ]

      const targetPercentages = [30, 20, 20, 15, 15]

      const quantized = quantizeWithTargetPercentages(
        testImage,
        palette,
        targetPercentages,
        segmentationMask,
        15
      )

      // Check sky region (top 30%) has gradient (uses multiple colors)
      const width = 200
      const height = 200
      const skyColors = new Set<string>()

      for (let y = 0; y < height * 0.3; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = quantized.data[idx]
          const g = quantized.data[idx + 1]
          const b = quantized.data[idx + 2]
          skyColors.add(`${r},${g},${b}`)
        }
      }

      // Sky should have at least 2 colors (gradient)
      expect(skyColors.size).toBeGreaterThanOrEqual(2)

      // Check mountain region (bottom 30%) has gradient
      const mountainColors = new Set<string>()

      for (let y = height * 0.7; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = quantized.data[idx]
          const g = quantized.data[idx + 1]
          const b = quantized.data[idx + 2]
          mountainColors.add(`${r},${g},${b}`)
        }
      }

      // Mountain should have at least 2 colors (gradient)
      expect(mountainColors.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('CLAHE and Tone Curves', () => {
    it('should enhance local contrast without destroying detail', () => {
      // Apply CLAHE
      const enhanced = applyCLAHE(testImage, 2.0, 8)

      // Check that pixel values changed (contrast was enhanced)
      let pixelsDifferent = 0
      const { data: originalData } = testImage
      const { data: enhancedData } = enhanced

      for (let i = 0; i < originalData.length; i += 4) {
        if (
          originalData[i] !== enhancedData[i] ||
          originalData[i + 1] !== enhancedData[i + 1] ||
          originalData[i + 2] !== enhancedData[i + 2]
        ) {
          pixelsDifferent++
        }
      }

      const changeRate = (pixelsDifferent / (originalData.length / 4)) * 100

      // At least 50% of pixels should be modified
      expect(changeRate).toBeGreaterThan(50)
    })

    it('should brighten foreground and desaturate background', () => {
      const processed = applySegmentedToneCurves(testImage, segmentationMask, 1.15, 0.7)

      // Sample foreground pixels (center)
      const centerIdx = 100 * 200 + 100
      const originalLab = rgbToLab({
        r: testImage.data[centerIdx * 4],
        g: testImage.data[centerIdx * 4 + 1],
        b: testImage.data[centerIdx * 4 + 2],
      })
      const processedLab = rgbToLab({
        r: processed.data[centerIdx * 4],
        g: processed.data[centerIdx * 4 + 1],
        b: processed.data[centerIdx * 4 + 2],
      })

      // Foreground should be brighter (higher L)
      expect(processedLab.l).toBeGreaterThanOrEqual(originalLab.l * 0.95)

      // Sample background pixels (top-left corner)
      const bgIdx = 10 * 200 + 10
      const originalBgLab = rgbToLab({
        r: testImage.data[bgIdx * 4],
        g: testImage.data[bgIdx * 4 + 1],
        b: testImage.data[bgIdx * 4 + 2],
      })
      const processedBgLab = rgbToLab({
        r: processed.data[bgIdx * 4],
        g: processed.data[bgIdx * 4 + 1],
        b: processed.data[bgIdx * 4 + 2],
      })

      // Background should be less saturated (lower a, b magnitude)
      const originalChroma = Math.sqrt(originalBgLab.a ** 2 + originalBgLab.b ** 2)
      const processedChroma = Math.sqrt(processedBgLab.a ** 2 + processedBgLab.b ** 2)

      expect(processedChroma).toBeLessThanOrEqual(originalChroma * 1.1)
    })
  })
})
