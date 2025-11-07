/**
 * Diamond Painting Generator - Qbrix Style
 * Fixed A4 canvas sizes with curated style packs
 */

import { DMCColor, findClosestDMCColor } from './dmcColors'
import { StylePack, getStylePackById } from './diamondStylePacks'

export interface DiamondPaintingOptions {
  canvasFormat?: 'a4_portrait' | 'a4_landscape' | 'a4_square' // Fixed A4 formats
  stylePack?: string // Style pack ID
}

export interface DiamondPaintingResult {
  imageDataUrl: string // Preview image
  gridData: DiamondGrid // Grid data for the pattern
  colorsUsed: DMCColorUsage[] // DMC colors used with quantities
  dimensions: {
    width: number // Width in diamonds
    height: number // Height in diamonds
    pixelWidth: number // Width in pixels
    pixelHeight: number // Height in pixels
  }
  estimatedDiamonds: number // Total number of diamonds needed
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  estimatedTime: string // Estimated completion time
  stylePack: StylePack // Style pack used
}

export interface DiamondGrid {
  cells: DiamondCell[][] // 2D array of diamond cells
  width: number // Grid width
  height: number // Grid height
}

export interface DiamondCell {
  x: number // X position in grid
  y: number // Y position in grid
  dmcCode: string // DMC color code
  rgb: [number, number, number] // RGB color
  symbol: string // Symbol for the pattern (A-Z, 0-9, etc.)
}

export interface DMCColorUsage {
  dmcColor: DMCColor
  count: number // Number of diamonds needed
  symbol: string // Symbol used in pattern
  percentage: number // Percentage of total diamonds
}

// Fixed A4 canvas presets (~10,000 diamonds each for optimal quality)
// Based on real A4 dimensions (21cm x 29.7cm) with 2.5mm diamond drills
const A4_CANVAS_PRESETS = {
  a4_portrait: { width: 84, height: 119 },    // 21cm x 29.7cm = 9,996 diamonds
  a4_landscape: { width: 119, height: 84 },   // 29.7cm x 21cm = 9,996 diamonds
  a4_square: { width: 100, height: 100 },     // 25cm x 25cm = 10,000 diamonds
}

/**
 * Generate diamond painting pattern from an image - Qbrix Style
 * Uses fixed A4 canvas and curated style packs
 */
export async function generateDiamondPainting(
  imageUrl: string,
  options: DiamondPaintingOptions = {}
): Promise<DiamondPaintingResult> {
  return new Promise(async (resolve, reject) => {
    // Set defaults - Fixed A4 format
    const canvasFormat = options.canvasFormat || 'a4_square'
    const stylePackId = options.stylePack || 'a4_original'

    // Get style pack
    const stylePack = getStylePackById(stylePackId)
    if (!stylePack) {
      reject(new Error('Invalid style pack'))
      return
    }

    // Get fixed A4 dimensions
    const { width: gridWidth, height: gridHeight } = A4_CANVAS_PRESETS[canvasFormat]

    // Load image
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        // Use fixed A4 grid dimensions (no scaling needed)
        // gridWidth and gridHeight are already set from A4_CANVAS_PRESETS

        // Create canvas for processing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Set canvas to grid dimensions (each pixel = one diamond)
        canvas.width = gridWidth
        canvas.height = gridHeight

        // Draw image scaled down to grid size
        ctx.drawImage(img, 0, 0, gridWidth, gridHeight)

        // Get image data
        const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight)
        const data = imageData.data

        // Use fixed palette from style pack (20-30 colors)
        const dmcPalette = stylePack.colors

        // Map image pixels directly to fixed DMC palette
        // No color extraction - we quantize directly to the style pack colors

        // Build grid data with DMC colors
        const grid: DiamondGrid = {
          cells: [],
          width: gridWidth,
          height: gridHeight,
        }

        const dmcUsageMap = new Map<string, number>()
        const uniqueDMCs = new Set<string>()

        for (let y = 0; y < gridHeight; y++) {
          const row: DiamondCell[] = []
          for (let x = 0; x < gridWidth; x++) {
            const idx = (y * gridWidth + x) * 4
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]

            // Find closest color in the fixed style pack palette
            const dmcColor = findClosestColorInPalette([r, g, b], dmcPalette)

            uniqueDMCs.add(dmcColor.code)

            // Update usage count
            dmcUsageMap.set(dmcColor.code, (dmcUsageMap.get(dmcColor.code) || 0) + 1)

            // Assign symbol (cycle through A-Z, 0-9, then special characters)
            const symbolIndex = Array.from(uniqueDMCs).indexOf(dmcColor.code)
            const symbol = getSymbol(symbolIndex)

            row.push({
              x,
              y,
              dmcCode: dmcColor.code,
              rgb: dmcColor.rgb,
              symbol,
            })
          }
          grid.cells.push(row)
        }

        // Calculate color usage statistics
        const totalDiamonds = gridWidth * gridHeight
        const colorsUsed: DMCColorUsage[] = []
        const dmcCodeToSymbol = new Map<string, string>()

        Array.from(uniqueDMCs).forEach((code, index) => {
          dmcCodeToSymbol.set(code, getSymbol(index))
        })

        for (const [dmcCode, count] of dmcUsageMap) {
          const dmcColor = dmcPalette.find(c => c.code === dmcCode)
          if (dmcColor) {
            colorsUsed.push({
              dmcColor,
              count,
              symbol: dmcCodeToSymbol.get(dmcCode) || '?',
              percentage: (count / totalDiamonds) * 100,
            })
          }
        }

        // Sort by usage (most used first)
        colorsUsed.sort((a, b) => b.count - a.count)

        // Generate preview image at high resolution
        const previewCanvas = document.createElement('canvas')
        const previewSize = 2000 // High resolution output
        const diamondSize = Math.floor(previewSize / Math.max(gridWidth, gridHeight))

        previewCanvas.width = gridWidth * diamondSize
        previewCanvas.height = gridHeight * diamondSize

        const previewCtx = previewCanvas.getContext('2d')
        if (!previewCtx) {
          reject(new Error('Could not create preview context'))
          return
        }

        // Draw diamonds
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const cell = grid.cells[y][x]
            const [r, g, b] = cell.rgb

            previewCtx.fillStyle = `rgb(${r},${g},${b})`
            previewCtx.fillRect(x * diamondSize, y * diamondSize, diamondSize, diamondSize)

            // Add diamond grid effect
            if (diamondSize > 2) {
              previewCtx.strokeStyle = `rgba(0,0,0,0.12)`
              previewCtx.lineWidth = Math.max(1, diamondSize * 0.06)
              previewCtx.strokeRect(x * diamondSize, y * diamondSize, diamondSize, diamondSize)

              // Add subtle highlight
              if (diamondSize > 4) {
                drawSquareHighlight(previewCtx, x * diamondSize, y * diamondSize, diamondSize)
              }
            }
          }
        }

        const imageDataUrl = previewCanvas.toDataURL('image/png', 1.0) // Maximum quality PNG

        // Calculate difficulty
        const difficulty = calculateDifficulty(colorsUsed.length, totalDiamonds)

        // Estimate completion time
        const estimatedTime = estimateCompletionTime(totalDiamonds, colorsUsed.length)

        resolve({
          imageDataUrl,
          gridData: grid,
          colorsUsed,
          dimensions: {
            width: gridWidth,
            height: gridHeight,
            pixelWidth: gridWidth * diamondSize,
            pixelHeight: gridHeight * diamondSize,
          },
          estimatedDiamonds: totalDiamonds,
          difficulty,
          estimatedTime,
          stylePack,
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = imageUrl
  })
}

/**
 * Find the closest color in a specific palette
 */
function findClosestColorInPalette(
  rgb: [number, number, number],
  palette: DMCColor[]
): DMCColor {
  let minDistance = Infinity
  let closestColor = palette[0]

  for (const dmcColor of palette) {
    const distance = colorDistance(rgb, dmcColor.rgb)
    if (distance < minDistance) {
      minDistance = distance
      closestColor = dmcColor
    }
  }

  return closestColor
}

/**
 * Calculate Euclidean distance between two colors
 */
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1
  const [r2, g2, b2] = rgb2

  // Weighted Euclidean distance (more perceptually accurate)
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2

  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db)
}

/**
 * Get symbol for a color index
 */
function getSymbol(index: number): string {
  const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=[]{}!?'
  return symbols[index % symbols.length]
}

/**
 * Draw square diamond highlight
 */
function drawSquareHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  // Top-left highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(x, y, size * 0.4, 1)
  ctx.fillRect(x, y, 1, size * 0.4)
}

/**
 * Draw round diamond highlight
 */
function drawRoundHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  // Circular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath()
  ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.15, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Calculate difficulty based on colors and size
 */
function calculateDifficulty(
  colorCount: number,
  totalDiamonds: number
): 'Easy' | 'Medium' | 'Hard' | 'Expert' {
  const complexity = colorCount * Math.log(totalDiamonds)

  if (complexity < 150) return 'Easy'
  if (complexity < 250) return 'Medium'
  if (complexity < 400) return 'Hard'
  return 'Expert'
}

/**
 * Estimate completion time
 */
function estimateCompletionTime(totalDiamonds: number, colorCount: number): string {
  // Average placement rate: 150-200 diamonds per hour for experienced users
  // Slower for beginners: 80-100 diamonds per hour
  // Factor in color changes

  const placementRate = 120 // diamonds per hour (average)
  const colorChangeTime = colorCount * 2 // 2 minutes per color change in hours

  const hours = totalDiamonds / placementRate + (colorChangeTime / 60)

  if (hours < 2) {
    return `${Math.round(hours * 60)} minutes`
  } else if (hours < 10) {
    return `${Math.round(hours * 2) / 2} hours`
  } else {
    return `${Math.round(hours)} hours`
  }
}

/**
 * Export grid as text pattern (for PDF generation)
 */
export function exportGridAsText(grid: DiamondGrid): string {
  let text = ''
  for (const row of grid.cells) {
    for (const cell of row) {
      text += cell.symbol
    }
    text += '\n'
  }
  return text
}

/**
 * Calculate physical size in inches/cm
 */
export function calculatePhysicalSize(
  gridWidth: number,
  gridHeight: number,
  diamondSizeMM: number = 2.5 // Standard diamond drill size is 2.5mm
): { inches: { width: number; height: number }; cm: { width: number; height: number } } {
  const widthMM = gridWidth * diamondSizeMM
  const heightMM = gridHeight * diamondSizeMM

  const widthInches = widthMM / 25.4
  const heightInches = heightMM / 25.4

  const widthCM = widthMM / 10
  const heightCM = heightMM / 10

  return {
    inches: {
      width: Math.round(widthInches * 10) / 10,
      height: Math.round(heightInches * 10) / 10,
    },
    cm: {
      width: Math.round(widthCM * 10) / 10,
      height: Math.round(heightCM * 10) / 10,
    },
  }
}
