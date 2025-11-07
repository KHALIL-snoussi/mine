/**
 * Color Utilities Tests
 *
 * Tests for quantization, segmentation, and image processing functions
 * To run: npm test
 */

import { describe, it, expect } from 'vitest'
import {
  quantizeWithTargetPercentages,
  rgbToLab,
  labToRgb,
  deltaE2000,
  kMeansSegmentation,
  RGB,
} from '../lib/colorUtils'

describe('Color Utilities', () => {
  describe('quantizeWithTargetPercentages - Under-use Penalty', () => {
    it('should favor under-used colors to prevent midtone collapse', () => {
      // Create a test image: 100×100 pixels, all mid-gray
      const width = 100
      const height = 100
      const totalPixels = width * height
      const data = new Uint8ClampedArray(totalPixels * 4)

      // Fill with mid-gray RGB(128, 128, 128)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128     // R
        data[i + 1] = 128 // G
        data[i + 2] = 128 // B
        data[i + 3] = 255 // A
      }

      const imageData = new ImageData(data, width, height)

      // Create a 3-color palette: light gray, mid gray, dark gray
      const palette: RGB[] = [
        { r: 200, g: 200, b: 200 }, // Light gray
        { r: 128, g: 128, b: 128 }, // Mid gray (closest match)
        { r: 60, g: 60, b: 60 },    // Dark gray
      ]

      // Target percentages: each should get ~33%
      const targetPercentages = [33, 33, 34]

      // Create mask (all foreground)
      const mask = new Uint8Array(totalPixels).fill(255)

      // Quantize WITHOUT under-use penalty (penalty = 0)
      const resultNoPenalty = quantizeWithTargetPercentages(
        imageData,
        palette,
        targetPercentages,
        mask,
        15, // tolerance
        0   // No under-use penalty
      )

      // Count color usage without penalty
      const countsNoPenalty = [0, 0, 0]
      for (let i = 0; i < resultNoPenalty.data.length; i += 4) {
        const r = resultNoPenalty.data[i]
        if (r === 200) countsNoPenalty[0]++
        else if (r === 128) countsNoPenalty[1]++
        else if (r === 60) countsNoPenalty[2]++
      }

      // Quantize WITH under-use penalty (penalty = 5)
      const resultWithPenalty = quantizeWithTargetPercentages(
        imageData,
        palette,
        targetPercentages,
        mask,
        15, // tolerance
        5   // Under-use penalty
      )

      // Count color usage with penalty
      const countsWithPenalty = [0, 0, 0]
      for (let i = 0; i < resultWithPenalty.data.length; i += 4) {
        const r = resultWithPenalty.data[i]
        if (r === 200) countsWithPenalty[0]++
        else if (r === 128) countsWithPenalty[1]++
        else if (r === 60) countsWithPenalty[2]++
      }

      // With no penalty, mid-gray should dominate (it's the closest)
      const midGrayPercentNoPenalty = (countsNoPenalty[1] / totalPixels) * 100
      expect(midGrayPercentNoPenalty).toBeGreaterThan(50)

      // With under-use penalty, distribution should be more balanced
      const percentagesWithPenalty = countsWithPenalty.map(c => (c / totalPixels) * 100)

      // All colors should be used (no zero usage)
      expect(percentagesWithPenalty[0]).toBeGreaterThan(0)
      expect(percentagesWithPenalty[1]).toBeGreaterThan(0)
      expect(percentagesWithPenalty[2]).toBeGreaterThan(0)

      // Distribution should be closer to target (33%, 33%, 34%)
      // Allow ±20% deviation
      expect(percentagesWithPenalty[0]).toBeGreaterThan(13) // 33% - 20%
      expect(percentagesWithPenalty[0]).toBeLessThan(53)    // 33% + 20%
      expect(percentagesWithPenalty[1]).toBeGreaterThan(13)
      expect(percentagesWithPenalty[1]).toBeLessThan(53)
      expect(percentagesWithPenalty[2]).toBeGreaterThan(14)
      expect(percentagesWithPenalty[2]).toBeLessThan(54)
    })

    it('should penalize over-used colors to maintain target percentages', () => {
      // Create a test image with gradient from black to white
      const width = 100
      const height = 100
      const totalPixels = width * height
      const data = new Uint8ClampedArray(totalPixels * 4)

      // Create gradient
      for (let i = 0; i < totalPixels; i++) {
        const value = Math.floor((i / totalPixels) * 255)
        const idx = i * 4
        data[idx] = value     // R
        data[idx + 1] = value // G
        data[idx + 2] = value // B
        data[idx + 3] = 255   // A
      }

      const imageData = new ImageData(data, width, height)

      // Create palette: black, mid-gray, white
      const palette: RGB[] = [
        { r: 0, g: 0, b: 0 },       // Black
        { r: 128, g: 128, b: 128 }, // Mid-gray
        { r: 255, g: 255, b: 255 }, // White
      ]

      // Target: 40% black, 20% mid, 40% white
      const targetPercentages = [40, 20, 40]

      const mask = new Uint8Array(totalPixels).fill(255)

      const result = quantizeWithTargetPercentages(
        imageData,
        palette,
        targetPercentages,
        mask,
        15, // tolerance
        5   // Under-use penalty
      )

      // Count actual usage
      const counts = [0, 0, 0]
      for (let i = 0; i < result.data.length; i += 4) {
        const r = result.data[i]
        if (r === 0) counts[0]++
        else if (r === 128) counts[1]++
        else if (r === 255) counts[2]++
      }

      const percentages = counts.map(c => (c / totalPixels) * 100)

      // Black should be close to 40% (±20%)
      expect(percentages[0]).toBeGreaterThan(20)
      expect(percentages[0]).toBeLessThan(60)

      // Mid-gray should be close to 20% (±15%)
      expect(percentages[1]).toBeGreaterThan(5)
      expect(percentages[1]).toBeLessThan(35)

      // White should be close to 40% (±20%)
      expect(percentages[2]).toBeGreaterThan(20)
      expect(percentages[2]).toBeLessThan(60)

      // Total should be 100%
      expect(counts[0] + counts[1] + counts[2]).toBe(totalPixels)
    })

    it('should respect foreground mask and only quantize foreground pixels', () => {
      const width = 10
      const height = 10
      const totalPixels = width * height
      const data = new Uint8ClampedArray(totalPixels * 4)

      // Fill all pixels with mid-gray
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128
        data[i + 1] = 128
        data[i + 2] = 128
        data[i + 3] = 255
      }

      const imageData = new ImageData(data, width, height)

      const palette: RGB[] = [
        { r: 255, g: 255, b: 255 }, // White
        { r: 0, g: 0, b: 0 },       // Black
      ]

      const targetPercentages = [50, 50]

      // Create mask: first half background (0), second half foreground (255)
      const mask = new Uint8Array(totalPixels)
      for (let i = 0; i < totalPixels / 2; i++) {
        mask[i] = 0 // Background
      }
      for (let i = totalPixels / 2; i < totalPixels; i++) {
        mask[i] = 255 // Foreground
      }

      const result = quantizeWithTargetPercentages(
        imageData,
        palette,
        targetPercentages,
        mask,
        15,
        5
      )

      // Background pixels should remain unchanged (mid-gray)
      for (let i = 0; i < (totalPixels / 2) * 4; i += 4) {
        expect(result.data[i]).toBe(128)
        expect(result.data[i + 1]).toBe(128)
        expect(result.data[i + 2]).toBe(128)
      }

      // Foreground pixels should be quantized to palette (white or black)
      let foregroundQuantized = 0
      for (let i = (totalPixels / 2) * 4; i < result.data.length; i += 4) {
        const r = result.data[i]
        if (r === 255 || r === 0) {
          foregroundQuantized++
        }
      }

      expect(foregroundQuantized).toBe(totalPixels / 2)
    })
  })

  describe('LAB Color Space Conversion', () => {
    it('should convert RGB to LAB and back correctly', () => {
      const testColors: RGB[] = [
        { r: 255, g: 255, b: 255 }, // White
        { r: 0, g: 0, b: 0 },       // Black
        { r: 255, g: 0, b: 0 },     // Red
        { r: 0, g: 255, b: 0 },     // Green
        { r: 0, g: 0, b: 255 },     // Blue
        { r: 128, g: 128, b: 128 }, // Gray
      ]

      testColors.forEach(color => {
        const lab = rgbToLab(color)
        const rgb = labToRgb(lab)

        // Allow small rounding errors (±2)
        expect(Math.abs(rgb.r - color.r)).toBeLessThanOrEqual(2)
        expect(Math.abs(rgb.g - color.g)).toBeLessThanOrEqual(2)
        expect(Math.abs(rgb.b - color.b)).toBeLessThanOrEqual(2)
      })
    })

    it('should calculate white L* as ~100 and black L* as ~0', () => {
      const white = rgbToLab({ r: 255, g: 255, b: 255 })
      const black = rgbToLab({ r: 0, g: 0, b: 0 })

      expect(white.l).toBeGreaterThan(95)
      expect(white.l).toBeLessThanOrEqual(100)
      expect(black.l).toBeGreaterThanOrEqual(0)
      expect(black.l).toBeLessThan(5)
    })
  })

  describe('Delta E 2000 Color Distance', () => {
    it('should return 0 for identical colors', () => {
      const lab1 = { l: 50, a: 0, b: 0 }
      const lab2 = { l: 50, a: 0, b: 0 }

      const distance = deltaE2000(lab1, lab2)
      expect(distance).toBe(0)
    })

    it('should return higher values for more distant colors', () => {
      const white = rgbToLab({ r: 255, g: 255, b: 255 })
      const black = rgbToLab({ r: 0, g: 0, b: 0 })
      const gray = rgbToLab({ r: 128, g: 128, b: 128 })

      const whiteToBlack = deltaE2000(white, black)
      const whiteToGray = deltaE2000(white, gray)
      const grayToBlack = deltaE2000(gray, black)

      // White to black should be largest distance
      expect(whiteToBlack).toBeGreaterThan(whiteToGray)
      expect(whiteToBlack).toBeGreaterThan(grayToBlack)

      // All should be positive
      expect(whiteToBlack).toBeGreaterThan(0)
      expect(whiteToGray).toBeGreaterThan(0)
      expect(grayToBlack).toBeGreaterThan(0)
    })

    it('should be perceptually uniform (similar visual difference = similar deltaE)', () => {
      // Two pairs of grays with visually similar steps
      const gray1a = rgbToLab({ r: 100, g: 100, b: 100 })
      const gray1b = rgbToLab({ r: 120, g: 120, b: 120 })

      const gray2a = rgbToLab({ r: 150, g: 150, b: 150 })
      const gray2b = rgbToLab({ r: 170, g: 170, b: 170 })

      const delta1 = deltaE2000(gray1a, gray1b)
      const delta2 = deltaE2000(gray2a, gray2b)

      // Similar RGB step should produce similar Delta E
      // Allow 50% variation due to lightness non-linearity
      expect(Math.abs(delta1 - delta2)).toBeLessThan(delta1 * 0.5)
    })
  })

  describe('K-means Segmentation', () => {
    it('should segment image into foreground and background', () => {
      // Create a simple image: left half dark, right half light
      const width = 100
      const height = 100
      const data = new Uint8ClampedArray(width * height * 4)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const value = x < width / 2 ? 50 : 200 // Dark left, light right

          data[idx] = value
          data[idx + 1] = value
          data[idx + 2] = value
          data[idx + 3] = 255
        }
      }

      const imageData = new ImageData(data, width, height)
      const mask = kMeansSegmentation(imageData, 2, 10)

      // Mask should have same length as pixels
      expect(mask.length).toBe(width * height)

      // Mask values should be 0 (background) or 255 (foreground)
      const uniqueValues = new Set(Array.from(mask))
      expect(uniqueValues.size).toBeLessThanOrEqual(2)
      for (const val of uniqueValues) {
        expect(val === 0 || val === 255).toBe(true)
      }

      // Should detect some foreground
      const foregroundCount = Array.from(mask).filter(v => v > 127).length
      const foregroundPercent = (foregroundCount / mask.length) * 100
      expect(foregroundPercent).toBeGreaterThan(10)
      expect(foregroundPercent).toBeLessThan(90)
    })

    it('should assign darker regions to foreground (subject)', () => {
      // Create image with dark center (subject) and light edges (background)
      const width = 50
      const height = 50
      const data = new Uint8ClampedArray(width * height * 4)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const dx = x - width / 2
          const dy = y - height / 2
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)

          // Dark center, light edges
          const value = Math.floor(50 + (dist / maxDist) * 150)

          data[idx] = value
          data[idx + 1] = value
          data[idx + 2] = value
          data[idx + 3] = 255
        }
      }

      const imageData = new ImageData(data, width, height)
      const mask = kMeansSegmentation(imageData, 2, 10)

      // Center pixel should be foreground (255)
      const centerIdx = Math.floor(height / 2) * width + Math.floor(width / 2)
      expect(mask[centerIdx]).toBe(255)

      // Corner pixels should be background (0)
      expect(mask[0]).toBe(0)
      expect(mask[width - 1]).toBe(0)
      expect(mask[width * (height - 1)]).toBe(0)
      expect(mask[width * height - 1]).toBe(0)
    })
  })
})
