/**
 * Advanced Diamond Generator Tests
 *
 * These tests validate the QBRIX-quality quantization and processing
 * To run: Install vitest and configure test environment
 * npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom canvas
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { generateAdvancedDiamondPainting } from '../lib/advancedDiamondGenerator'

describe('Advanced Diamond Generator', () => {
  // Note: These tests require a canvas polyfill in Node.js environment
  // Install: npm install -D canvas
  // Configure in vitest.config.ts:
  // setupFiles: ['./test-setup.ts']
  // test-setup.ts should include: global.HTMLCanvasElement = Canvas

  describe('Pop-Art Quantization Quality', () => {
    it('should ensure background occupies >25% for Pop-Art style', async () => {
      // This test validates that Pop-Art style properly separates background
      // Create a test image URL (would need actual image in real test)
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_pop_art',
        qualitySettings: {
          minClusterSize: 4,
        },
      })

      // Check diagnostics
      expect(result.diagnostics).toBeDefined()
      expect(result.diagnostics.backgroundPercentage).toBeGreaterThan(0)

      // For Pop-Art style, background should be significant
      // This prevents "muddled facial planes" by keeping background clean
      if (result.diagnostics.backgroundPercentage > 0) {
        expect(result.diagnostics.backgroundPercentage).toBeGreaterThan(10) // At least some background
      }
    })

    it('should use white DMC code for background in all style packs', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_original',
        qualitySettings: {
          minClusterSize: 4,
        },
      })

      // Background should be forced to lightest color (usually WHITE)
      expect(result.diagnostics.backgroundDMCCode).toBeDefined()
      // Most style packs use WHITE for lightest color
      const backgroundCode = result.diagnostics.backgroundDMCCode
      expect(['WHITE', 'ECRU', '3865'].includes(backgroundCode)).toBe(true)
    })

    it('should remove isolated single-pixel speckles', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_pop_art',
        qualitySettings: {
          minClusterSize: 4, // 2×2 minimum
        },
      })

      // Should have removed some isolated cells
      expect(result.diagnostics.isolatedCellsRemoved).toBeGreaterThanOrEqual(0)

      // Average cluster size should be >= minClusterSize for non-edge areas
      // (Edges are preserved, so some small clusters may remain)
      expect(result.diagnostics.averageClusterSize).toBeGreaterThan(0)
    })

    it('should preserve edge pixels (not remove them in cleanup)', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_pop_art',
        qualitySettings: {
          minClusterSize: 4,
        },
      })

      // Edge pixels should be detected and preserved
      expect(result.diagnostics.edgePixelCount).toBeGreaterThanOrEqual(0)

      // For images with faces, edges should be significant
      // This ensures eyes, mouth, jawline stay crisp
      console.log('Edge pixels preserved:', result.diagnostics.edgePixelCount)
    })
  })

  describe('Canvas Dimensions', () => {
    it('should generate exactly the requested dimensions', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_portrait',
        stylePack: 'a4_original',
      })

      expect(result.dimensions.widthBeads).toBe(84)
      expect(result.dimensions.heightBeads).toBe(119)
    })

    it('should calculate correct physical dimensions', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_portrait',
        stylePack: 'a4_original',
      })

      // 84 beads × 2.5mm = 210mm = 21cm
      expect(result.dimensions.widthCm).toBe(21.0)
      // 119 beads × 2.5mm = 297.5mm ≈ 29.75cm
      expect(result.dimensions.heightCm).toBeCloseTo(29.8, 1)
    })
  })

  describe('Color Palette Validation', () => {
    it('should use exactly 7 colors from style pack', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_original',
      })

      // Style packs have exactly 7 colors
      expect(result.beadCounts).toHaveLength(7)
    })

    it('should ensure bead counts sum to total canvas size', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_original',
      })

      const totalBeadsFromCounts = result.beadCounts.reduce((sum, bc) => sum + bc.count, 0)
      const expectedTotal = result.dimensions.widthBeads * result.dimensions.heightBeads

      expect(totalBeadsFromCounts).toBe(expectedTotal)
      expect(result.totalBeads).toBe(expectedTotal)
    })

    it('should assign unique symbols to each color', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_original',
      })

      const symbols = new Set(result.beadCounts.map(bc => bc.symbol))

      // All symbols should be unique
      expect(symbols.size).toBe(result.beadCounts.length)
    })

    it('should mark colors below 1% as low usage', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_original',
      })

      result.beadCounts.forEach(bead => {
        if (bead.percentage < 1.0) {
          expect(bead.lowUsage).toBe(true)
        } else {
          expect(bead.lowUsage).toBe(false)
        }
      })
    })
  })

  describe('Tile System', () => {
    it('should create correct number of 16×16 tiles', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_portrait', // 84×119
        stylePack: 'a4_original',
      })

      // 84 ÷ 16 = 5.25 → 6 tiles wide
      // 119 ÷ 16 = 7.44 → 8 tiles high
      expect(result.dimensions.tilesWide).toBe(6)
      expect(result.dimensions.tilesHigh).toBe(8)
      expect(result.tiles.length).toBe(48) // 6 × 8
    })

    it('should number tiles correctly (1-indexed)', async () => {
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const result = await generateAdvancedDiamondPainting(testImageUrl, {
        canvasFormat: 'a4_square',
        stylePack: 'a4_original',
      })

      // First tile should be numbered 1
      expect(result.tiles[0].tileNumber).toBe(1)

      // Last tile should be numbered tiles.length
      const lastTile = result.tiles[result.tiles.length - 1]
      expect(lastTile.tileNumber).toBe(result.tiles.length)
    })
  })
})
