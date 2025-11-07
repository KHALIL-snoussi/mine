/**
 * Diamond Painting Generator
 * Creates pixelated/mosaic-style diamond painting patterns
 * Different from paint-by-numbers: uses smaller "pixels" and more colors
 */

import { DMCColor, findClosestDMCColor, getPopularDMCPalette } from './dmcColors'

export interface DiamondPaintingOptions {
  gridSize?: number // Size of each diamond in pixels (default: 8-16)
  maxColors?: number // Maximum number of DMC colors to use (default: 40)
  canvasSize?: 'small' | 'medium' | 'large' | 'xlarge' // Final canvas size
  drillShape?: 'square' | 'round' // Diamond drill shape
  quality?: 'standard' | 'high' | 'ultra' // Quality preset
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

// Quality presets
const QUALITY_PRESETS = {
  standard: { gridSize: 12, maxColors: 30 },
  high: { gridSize: 10, maxColors: 40 },
  ultra: { gridSize: 8, maxColors: 50 },
}

// Canvas size presets (in diamonds)
const CANVAS_SIZES = {
  small: { maxDimension: 40 },   // ~40x40 diamonds
  medium: { maxDimension: 60 },  // ~60x60 diamonds
  large: { maxDimension: 80 },   // ~80x80 diamonds
  xlarge: { maxDimension: 100 }, // ~100x100 diamonds
}

/**
 * Generate diamond painting pattern from an image
 */
export async function generateDiamondPainting(
  imageUrl: string,
  options: DiamondPaintingOptions = {}
): Promise<DiamondPaintingResult> {
  return new Promise((resolve, reject) => {
    // Set defaults
    const quality = options.quality || 'high'
    const preset = QUALITY_PRESETS[quality]
    const gridSize = options.gridSize || preset.gridSize
    const maxColors = options.maxColors || preset.maxColors
    const canvasSize = options.canvasSize || 'medium'
    const drillShape = options.drillShape || 'square'

    // Load image
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        // Calculate dimensions based on canvas size
        const maxDim = CANVAS_SIZES[canvasSize].maxDimension
        let gridWidth = Math.floor(img.width / gridSize)
        let gridHeight = Math.floor(img.height / gridSize)

        // Scale to canvas size
        if (gridWidth > gridHeight && gridWidth > maxDim) {
          gridHeight = Math.floor((gridHeight / gridWidth) * maxDim)
          gridWidth = maxDim
        } else if (gridHeight > maxDim) {
          gridWidth = Math.floor((gridWidth / gridHeight) * maxDim)
          gridHeight = maxDim
        }

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

        // Extract colors from image
        const colorMap = new Map<string, { rgb: [number, number, number]; count: number }>()

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const key = `${r},${g},${b}`

          if (!colorMap.has(key)) {
            colorMap.set(key, { rgb: [r, g, b], count: 0 })
          }
          colorMap.get(key)!.count++
        }

        // Convert to array and sort by frequency
        const colors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, maxColors * 2) // Get more colors than needed for better quantization

        // Create color palette from DMC colors
        const dmcPalette = getPopularDMCPalette(maxColors)

        // Map image colors to DMC colors
        const colorToDMC = new Map<string, DMCColor>()
        for (const color of colors) {
          const key = color.rgb.join(',')
          const dmcColor = findClosestDMCColor(color.rgb)
          colorToDMC.set(key, dmcColor)
        }

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

            const key = `${r},${g},${b}`
            let dmcColor = colorToDMC.get(key)

            // If not in map, find closest
            if (!dmcColor) {
              dmcColor = findClosestDMCColor([r, g, b])
            }

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
          const dmcColor = dmcPalette.find(c => c.code === dmcCode) || findClosestDMCColor([0, 0, 0])
          colorsUsed.push({
            dmcColor,
            count,
            symbol: dmcCodeToSymbol.get(dmcCode) || '?',
            percentage: (count / totalDiamonds) * 100,
          })
        }

        // Sort by usage (most used first)
        colorsUsed.sort((a, b) => b.count - a.count)

        // Generate preview image (with diamond effect)
        const previewCanvas = document.createElement('canvas')
        const previewSize = 800 // Preview size in pixels
        const diamondSize = Math.max(1, Math.floor(previewSize / Math.max(gridWidth, gridHeight)))

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

            // Add diamond effect (subtle border)
            if (diamondSize > 3) {
              previewCtx.strokeStyle = `rgba(0,0,0,0.1)`
              previewCtx.lineWidth = 1
              previewCtx.strokeRect(x * diamondSize, y * diamondSize, diamondSize, diamondSize)

              // Add slight highlight for realism
              if (diamondSize > 6) {
                const highlight = drillShape === 'round' ? drawRoundHighlight : drawSquareHighlight
                highlight(previewCtx, x * diamondSize, y * diamondSize, diamondSize)
              }
            }
          }
        }

        const imageDataUrl = previewCanvas.toDataURL('image/png', 0.95)

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
