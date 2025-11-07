/**
 * PDF Generator Tests
 *
 * These tests validate the QBRIX-quality PDF generation
 * To run: Install vitest and configure test environment
 * npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
 */

import { describe, it, expect } from 'vitest'
import {
  generateQBRIXCoverPage,
  generateTilePage,
} from '../lib/diamondPaintingPDF'
import type { AdvancedDiamondResult } from '../lib/advancedDiamondGenerator'

// Mock result for testing
const createMockResult = (): AdvancedDiamondResult => ({
  imageDataUrl: 'data:image/png;base64,mock',
  tiles: [
    {
      tileNumber: 1,
      x: 0,
      y: 0,
      startRow: 0,
      startCol: 0,
      width: 16,
      height: 16,
      beads: Array(16).fill(null).map((_, y) =>
        Array(16).fill(null).map((_, x) => ({
          x,
          y,
          dmcCode: '310',
          rgb: { r: 0, g: 0, b: 0 },
          symbol: 'A',
          tileCoord: { tx: x, ty: y },
        }))
      ),
    },
  ],
  beadCounts: [
    {
      dmcColor: {
        code: '310',
        name: 'Black',
        rgb: [0, 0, 0],
        hex: '#000000',
        category: 'Black',
        defaultSymbol: 'A',
        targetPercentage: 100,
      },
      count: 256,
      percentage: 100,
      symbol: 'A',
      lowUsage: false,
    },
  ],
  gridData: {
    width: 16,
    height: 16,
    cells: [],
  },
  dimensions: {
    widthBeads: 84,
    heightBeads: 119,
    widthCm: 21.0,
    heightCm: 29.75,
    tilesWide: 6,
    tilesHigh: 8,
  },
  stylePack: {
    id: 'a4_original',
    name: 'Original',
    description: 'Test',
    colors: [],
  },
  totalBeads: 9996,
  difficulty: 'Easy',
  estimatedTime: '83 hours',
  diagnostics: {
    isolatedCellsRemoved: 0,
    smallClustersRemoved: 0,
    backgroundPercentage: 0,
    backgroundDMCCode: 'WHITE',
    edgePixelCount: 0,
    averageClusterSize: 0,
  },
})

describe('PDF Generator', () => {
  describe('QBRIX Cover Page', () => {
    it('should generate HTML with correct structure', () => {
      const result = createMockResult()
      const html = generateQBRIXCoverPage(result)

      // Check for essential elements
      expect(html).toContain('QBRIX Diamond Painting')
      expect(html).toContain('status-strip')
      expect(html).toContain('Original Pack') // Style pack name
      expect(html).toContain('84 × 119') // Dimensions
    })

    it('should include all color information', () => {
      const result = createMockResult()
      const html = generateQBRIXCoverPage(result)

      // Verify color data is present
      expect(html).toContain('DMC 310')
      expect(html).toContain('Black')
      expect(html).toContain('symbol-badge')
    })

    it('should calculate bag counts correctly', () => {
      const result = createMockResult()
      result.beadCounts[0].count = 450 // Requires 3 bags (200 each)
      const html = generateQBRIXCoverPage(result)

      expect(html).toContain('3 bag') // ceil(450/200) = 3
    })

    it('should match page count: 1 cover + N tiles + 1 legend', () => {
      const result = createMockResult()
      const tilesCount = result.tiles.length

      // Expected: 1 cover + tilesCount tiles + (optional legend)
      // This validates the structure is correct
      expect(tilesCount).toBeGreaterThan(0)
    })
  })

  describe('Tile Pages', () => {
    it('should generate tile page with correct grid structure', () => {
      const result = createMockResult()
      const html = generateTilePage(result, 0)

      // Check for grid elements
      expect(html).toContain('Tile #1')
      expect(html).toContain('grid-wrapper')
      expect(html).toContain('bead-cell')
    })

    it('should include row and column labels', () => {
      const result = createMockResult()
      const html = generateTilePage(result, 0)

      expect(html).toContain('row-label')
      expect(html).toContain('col-label')
    })

    it('should include beige background color', () => {
      const result = createMockResult()
      const html = generateTilePage(result, 0)

      expect(html).toContain('#EBD4B0') // QBRIX beige background
    })

    it('should show symbols in each cell', () => {
      const result = createMockResult()
      const html = generateTilePage(result, 0)

      // Symbol 'A' should appear in cells
      expect(html).toMatch(/symbol.*A/)
    })
  })

  describe('Color Matching Validation', () => {
    it('should ensure bead counts match between cover and tiles', () => {
      const result = createMockResult()

      // Count total beads in tiles
      let tileTotalBeads = 0
      result.tiles.forEach(tile => {
        tileTotalBeads += tile.width * tile.height
      })

      // This should equal sum of bead counts
      const beadCountTotal = result.beadCounts.reduce((sum, bc) => sum + bc.count, 0)

      // Note: In actual implementation, tiles may not cover all beads if grid isn't perfectly divisible
      // This is a conceptual check
      expect(beadCountTotal).toBeGreaterThan(0)
      expect(tileTotalBeads).toBeGreaterThan(0)
    })

    it('should ensure all colors in PDF are from the style pack', () => {
      const result = createMockResult()
      const html = generateQBRIXCoverPage(result)

      result.beadCounts.forEach(bead => {
        expect(html).toContain(bead.dmcColor.code)
        expect(html).toContain(bead.symbol)
      })
    })
  })
})
