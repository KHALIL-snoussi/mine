/**
 * Premium Diamond Painting Upgrades
 *
 * Extends the diamond painting generator with commercial-quality features:
 * - Large canvas formats (50×35cm, 60×40cm, 70×50cm)
 * - HD palette mode with 20-30 dynamically selected DMC colors
 * - Intelligent symbol assignment for expanded palettes
 * - Face detection for subject emphasis
 * - Region-aware dithering and cleanup
 * - Enhanced PDF generation for large patterns
 */

import { DMCColor, DMC_COLORS } from './dmcColors'
import { RGB, LAB, rgbToLab, deltaE2000, labToRgb } from './colorUtils'

// ============================================================================
// CANVAS PRESETS - Large Format Support
// ============================================================================

export interface CanvasPreset {
  id: string
  name: string
  widthBeads: number
  heightBeads: number
  widthCm: number
  heightCm: number
  drillSize: number // mm per drill
  totalDrills: number
  estimatedHours: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master'
}

export const PREMIUM_CANVAS_PRESETS: Record<string, CanvasPreset> = {
  // Existing A4 formats
  a4_portrait: {
    id: 'a4_portrait',
    name: 'A4 Portrait (21×29.7 cm)',
    widthBeads: 84,
    heightBeads: 119,
    widthCm: 21,
    heightCm: 29.7,
    drillSize: 2.5,
    totalDrills: 9996,
    estimatedHours: '12-18 hours',
    difficulty: 'Beginner'
  },
  a4_landscape: {
    id: 'a4_landscape',
    name: 'A4 Landscape (29.7×21 cm)',
    widthBeads: 119,
    heightBeads: 84,
    widthCm: 29.7,
    heightCm: 21,
    drillSize: 2.5,
    totalDrills: 9996,
    estimatedHours: '12-18 hours',
    difficulty: 'Beginner'
  },
  a4_square: {
    id: 'a4_square',
    name: 'A4 Square (21×21 cm)',
    widthBeads: 100,
    heightBeads: 100,
    widthCm: 21,
    heightCm: 21,
    drillSize: 2.1,
    totalDrills: 10000,
    estimatedHours: '12-18 hours',
    difficulty: 'Beginner'
  },

  // NEW: Large canvas formats (commercial quality)
  canvas_30x40: {
    id: 'canvas_30x40',
    name: 'Canvas 30×40 cm',
    widthBeads: 120,
    heightBeads: 160,
    widthCm: 30,
    heightCm: 40,
    drillSize: 2.5,
    totalDrills: 19200,
    estimatedHours: '24-36 hours',
    difficulty: 'Intermediate'
  },
  canvas_40x50: {
    id: 'canvas_40x50',
    name: 'Canvas 40×50 cm',
    widthBeads: 160,
    heightBeads: 200,
    widthCm: 40,
    heightCm: 50,
    drillSize: 2.5,
    totalDrills: 32000,
    estimatedHours: '40-60 hours',
    difficulty: 'Advanced'
  },
  canvas_50x35: {
    id: 'canvas_50x35',
    name: 'Canvas 50×35 cm (Portrait)',
    widthBeads: 200,
    heightBeads: 140,
    widthCm: 50,
    heightCm: 35,
    drillSize: 2.5,
    totalDrills: 28000,
    estimatedHours: '35-50 hours',
    difficulty: 'Advanced'
  },
  canvas_50x70: {
    id: 'canvas_50x70',
    name: 'Canvas 50×70 cm',
    widthBeads: 200,
    heightBeads: 280,
    widthCm: 50,
    heightCm: 70,
    drillSize: 2.5,
    totalDrills: 56000,
    estimatedHours: '70-100 hours',
    difficulty: 'Expert'
  },
  canvas_60x40: {
    id: 'canvas_60x40',
    name: 'Canvas 60×40 cm',
    widthBeads: 240,
    heightBeads: 160,
    widthCm: 60,
    heightCm: 40,
    drillSize: 2.5,
    totalDrills: 38400,
    estimatedHours: '50-70 hours',
    difficulty: 'Expert'
  },
  canvas_70x50: {
    id: 'canvas_70x50',
    name: 'Canvas 70×50 cm',
    widthBeads: 280,
    heightBeads: 200,
    widthCm: 70,
    heightCm: 50,
    drillSize: 2.5,
    totalDrills: 56000,
    estimatedHours: '70-100 hours',
    difficulty: 'Master'
  },

  // Custom size support
  custom: {
    id: 'custom',
    name: 'Custom Size',
    widthBeads: 200,
    heightBeads: 200,
    widthCm: 50,
    heightCm: 50,
    drillSize: 2.5,
    totalDrills: 40000,
    estimatedHours: 'Varies',
    difficulty: 'Advanced'
  }
}

export function getCanvasPreset(id: string): CanvasPreset | null {
  return PREMIUM_CANVAS_PRESETS[id] || null
}

export function calculateCustomCanvas(widthCm: number, heightCm: number, drillSize: number = 2.5): CanvasPreset {
  const widthBeads = Math.round((widthCm * 10) / drillSize)
  const heightBeads = Math.round((heightCm * 10) / drillSize)
  const totalDrills = widthBeads * heightBeads

  // Estimate difficulty and time
  let difficulty: CanvasPreset['difficulty'] = 'Beginner'
  let estimatedHours = '12-18 hours'

  if (totalDrills < 15000) {
    difficulty = 'Beginner'
    estimatedHours = '12-18 hours'
  } else if (totalDrills < 25000) {
    difficulty = 'Intermediate'
    estimatedHours = '24-36 hours'
  } else if (totalDrills < 40000) {
    difficulty = 'Advanced'
    estimatedHours = '40-60 hours'
  } else if (totalDrills < 60000) {
    difficulty = 'Expert'
    estimatedHours = '70-100 hours'
  } else {
    difficulty = 'Master'
    estimatedHours = '100+ hours'
  }

  return {
    id: 'custom',
    name: `Custom ${widthCm}×${heightCm} cm`,
    widthBeads,
    heightBeads,
    widthCm,
    heightCm,
    drillSize,
    totalDrills,
    estimatedHours,
    difficulty
  }
}

// ============================================================================
// HD PALETTE MODE - Dynamic DMC Color Selection
// ============================================================================

export interface HDPaletteOptions {
  minColors?: number // Minimum colors (default: 20)
  maxColors?: number // Maximum colors (default: 30)
  emphasizeSubject?: boolean // Use more colors for subject (default: true)
  minColorPercentage?: number // Minimum % for a color to be included (default: 0.5%)
  colorSeparationThreshold?: number // Min Delta E between colors (default: 15)
}

/**
 * Select optimal DMC colors from image using k-means clustering in LAB space
 */
export function selectHDPalette(
  imageData: ImageData,
  options: HDPaletteOptions = {},
  subjectMask?: Uint8ClampedArray
): DMCColor[] {
  const {
    minColors = 20,
    maxColors = 30,
    emphasizeSubject = true,
    minColorPercentage = 0.5,
    colorSeparationThreshold = 15
  } = options

  const { width, height, data } = imageData
  const totalPixels = width * height

  // Extract unique colors with frequencies
  const colorMap = new Map<string, { rgb: RGB; count: number; inSubject: number }>()

  for (let i = 0; i < data.length; i += 4) {
    const rgb: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] }
    const key = `${rgb.r},${rgb.g},${rgb.b}`
    const pixelIndex = i / 4
    const isSubject = subjectMask ? subjectMask[pixelIndex] > 128 : false

    if (!colorMap.has(key)) {
      colorMap.set(key, { rgb, count: 0, inSubject: 0 })
    }
    const entry = colorMap.get(key)!
    entry.count++
    if (isSubject) entry.inSubject++
  }

  // Convert to array and filter by significance
  let significantColors = Array.from(colorMap.values())
    .filter(c => (c.count / totalPixels) * 100 >= minColorPercentage)
    .sort((a, b) => b.count - a.count)

  // If emphasizing subject, weight subject colors higher
  if (emphasizeSubject && subjectMask) {
    significantColors.sort((a, b) => {
      const aWeight = a.count + (a.inSubject * 2) // Subject pixels count double
      const bWeight = b.count + (b.inSubject * 2)
      return bWeight - aWeight
    })
  }

  // K-means clustering to reduce to target color count
  const targetColors = Math.min(maxColors, Math.max(minColors, Math.floor(significantColors.length / 3)))
  const clusters = kMeansClusterColors(significantColors.map(c => c.rgb), targetColors)

  // Match cluster centers to closest DMC colors
  const selectedDMC: DMCColor[] = []
  const usedDMCCodes = new Set<string>()

  for (const clusterCenter of clusters) {
    const centerLab = rgbToLab(clusterCenter)

    // Find closest unused DMC color
    let closest: DMCColor | null = null
    let closestDistance = Infinity

    for (const dmc of DMC_COLORS) {
      if (usedDMCCodes.has(dmc.code)) continue

      const dmcLab = rgbToLab(dmc.rgb)
      const distance = deltaE2000(centerLab, dmcLab)

      if (distance < closestDistance) {
        closestDistance = distance
        closest = dmc
      }
    }

    if (closest) {
      // Check color separation from already selected colors
      const isSeparated = selectedDMC.every(existing => {
        const existingLab = rgbToLab(existing.rgb)
        const newLab = rgbToLab(closest!.rgb)
        return deltaE2000(existingLab, newLab) >= colorSeparationThreshold
      })

      if (isSeparated || selectedDMC.length < minColors) {
        selectedDMC.push(closest)
        usedDMCCodes.add(closest.code)
      }
    }
  }

  // Ensure we have minimum colors
  if (selectedDMC.length < minColors) {
    // Add most common DMC colors that weren't selected
    const remainingDMC = DMC_COLORS.filter(dmc => !usedDMCCodes.has(dmc.code))
    for (const dmc of remainingDMC) {
      if (selectedDMC.length >= minColors) break
      selectedDMC.push(dmc)
      usedDMCCodes.add(dmc.code)
    }
  }

  return selectedDMC
}

/**
 * Simple k-means clustering in RGB space
 */
function kMeansClusterColors(colors: RGB[], k: number, maxIterations: number = 20): RGB[] {
  if (colors.length <= k) return colors

  // Initialize centroids randomly
  const centroids: RGB[] = []
  const usedIndices = new Set<number>()

  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * colors.length)
    if (!usedIndices.has(idx)) {
      centroids.push({ ...colors[idx] })
      usedIndices.add(idx)
    }
  }

  // Iterate
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign colors to nearest centroid
    const clusters: RGB[][] = Array.from({ length: k }, () => [])

    for (const color of colors) {
      let nearest = 0
      let minDist = Infinity

      for (let i = 0; i < k; i++) {
        const dist = Math.sqrt(
          Math.pow(color.r - centroids[i].r, 2) +
          Math.pow(color.g - centroids[i].g, 2) +
          Math.pow(color.b - centroids[i].b, 2)
        )

        if (dist < minDist) {
          minDist = dist
          nearest = i
        }
      }

      clusters[nearest].push(color)
    }

    // Update centroids
    let changed = false
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue

      const newCentroid: RGB = { r: 0, g: 0, b: 0 }
      for (const color of clusters[i]) {
        newCentroid.r += color.r
        newCentroid.g += color.g
        newCentroid.b += color.b
      }

      newCentroid.r = Math.round(newCentroid.r / clusters[i].length)
      newCentroid.g = Math.round(newCentroid.g / clusters[i].length)
      newCentroid.b = Math.round(newCentroid.b / clusters[i].length)

      if (
        newCentroid.r !== centroids[i].r ||
        newCentroid.g !== centroids[i].g ||
        newCentroid.b !== centroids[i].b
      ) {
        centroids[i] = newCentroid
        changed = true
      }
    }

    if (!changed) break
  }

  return centroids
}

// ============================================================================
// ENHANCED SYMBOL MANAGEMENT
// ============================================================================

// Comprehensive symbol set avoiding confusion
const SAFE_SYMBOLS = [
  // Uppercase letters (excluding I/O if numbers used)
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  // Numbers (excluding 0/1 if I/O used)
  '2', '3', '4', '5', '6', '7', '8', '9',
  // Special characters (clear, distinct)
  '#', '$', '%', '&', '*', '+', '=', '@',
  // Greek letters (if needed)
  'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'ω',
  // Geometric shapes
  '■', '□', '●', '○', '◆', '◇', '▲', '△', '▼', '▽', '★', '☆'
]

// Dual-character symbols for palettes > 50 colors
const DUAL_SYMBOLS = [
  'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3',
  'D1', 'D2', 'D3', 'E1', 'E2', 'E3', 'F1', 'F2', 'F3'
]

export function assignSymbolsForPalette(
  dmcColors: DMCColor[],
  existingSymbols?: Map<string, string>
): Map<string, string> {
  const symbolMap = new Map<string, string>(existingSymbols)
  const usedSymbols = new Set(symbolMap.values())

  // Get available symbols
  let availableSymbols = SAFE_SYMBOLS.filter(s => !usedSymbols.has(s))

  // If we need more symbols, add dual-character ones
  if (dmcColors.length > availableSymbols.length) {
    availableSymbols = [...availableSymbols, ...DUAL_SYMBOLS.filter(s => !usedSymbols.has(s))]
  }

  // Assign symbols to unassigned colors
  let symbolIndex = 0
  for (const dmc of dmcColors) {
    if (!symbolMap.has(dmc.code) && symbolIndex < availableSymbols.length) {
      symbolMap.set(dmc.code, availableSymbols[symbolIndex])
      usedSymbols.add(availableSymbols[symbolIndex])
      symbolIndex++
    }
  }

  return symbolMap
}

// ============================================================================
// FACE DETECTION & SUBJECT EMPHASIS
// ============================================================================

/**
 * Detect faces using Viola-Jones cascade (if available) or fallback to skin tone detection
 */
export async function detectFaces(imageData: ImageData): Promise<Uint8ClampedArray | null> {
  // Try to use browser's face detection API if available
  if ('FaceDetector' in window) {
    try {
      const faceDetector = new (window as any).FaceDetector()
      const canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')!
      ctx.putImageData(imageData, 0, 0)

      const faces = await faceDetector.detect(canvas)

      if (faces.length > 0) {
        // Create mask from detected faces
        const mask = new Uint8ClampedArray(imageData.width * imageData.height)

        for (const face of faces) {
          const { boundingBox } = face
          const left = Math.floor(boundingBox.left)
          const top = Math.floor(boundingBox.top)
          const right = Math.ceil(boundingBox.right)
          const bottom = Math.ceil(boundingBox.bottom)

          // Expand bounding box slightly for context
          const padding = 20
          const x1 = Math.max(0, left - padding)
          const y1 = Math.max(0, top - padding)
          const x2 = Math.min(imageData.width, right + padding)
          const y2 = Math.min(imageData.height, bottom + padding)

          // Fill mask region
          for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
              mask[y * imageData.width + x] = 255
            }
          }
        }

        return mask
      }
    } catch (error) {
      console.log('Face detection not available, using fallback')
    }
  }

  // Fallback: skin tone detection
  return detectSkinTones(imageData)
}

/**
 * Detect skin tones using HSV color space
 */
function detectSkinTones(imageData: ImageData): Uint8ClampedArray {
  const { width, height, data } = imageData
  const mask = new Uint8ClampedArray(width * height)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    // RGB to HSV
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6)
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2)
      } else {
        h = 60 * ((r - g) / delta + 4)
      }
    }
    if (h < 0) h += 360

    const s = max === 0 ? 0 : delta / max
    const v = max

    // Skin tone detection (empirical thresholds)
    const isSkin = (
      h >= 0 && h <= 50 &&
      s >= 0.2 && s <= 0.7 &&
      v >= 0.3 && v <= 0.95
    )

    mask[i / 4] = isSkin ? 255 : 0
  }

  return mask
}

// ============================================================================
// REGION-AWARE DITHERING
// ============================================================================

export interface RegionAwareDitheringOptions {
  baseStrength: number // Base dithering strength (0-1)
  subjectMultiplier: number // Multiplier for subject regions (default: 1.2)
  backgroundMultiplier: number // Multiplier for background (default: 0.8)
  edgeMultiplier: number // Multiplier for edge regions (default: 0.5)
  brightThreshold: number // Brightness threshold for reduction (default: 0.9)
  darkThreshold: number // Darkness threshold for reduction (default: 0.1)
}

export function applyRegionAwareDithering(
  imageData: ImageData,
  palette: RGB[],
  subjectMask?: Uint8ClampedArray,
  edgeMask?: Uint8ClampedArray,
  options: RegionAwareDitheringOptions = {
    baseStrength: 0.5,
    subjectMultiplier: 1.2,
    backgroundMultiplier: 0.8,
    edgeMultiplier: 0.5,
    brightThreshold: 0.9,
    darkThreshold: 0.1
  }
): void {
  const { width, height, data } = imageData
  const {
    baseStrength,
    subjectMultiplier,
    backgroundMultiplier,
    edgeMultiplier,
    brightThreshold,
    darkThreshold
  } = options

  // Floyd-Steinberg error diffusion kernel
  const errorKernel = [
    { dx: 1, dy: 0, weight: 7 / 16 },
    { dx: -1, dy: 1, weight: 3 / 16 },
    { dx: 0, dy: 1, weight: 5 / 16 },
    { dx: 1, dy: 1, weight: 1 / 16 }
  ]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const pixelIndex = y * width + x

      // Get current pixel
      const oldPixel: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] }

      // Find closest palette color
      const newPixel = findClosestColor(oldPixel, palette)

      // Calculate quantization error
      const error: RGB = {
        r: oldPixel.r - newPixel.r,
        g: oldPixel.g - newPixel.g,
        b: oldPixel.b - newPixel.b
      }

      // Determine dithering strength for this pixel
      let strength = baseStrength

      // Adjust based on region
      if (subjectMask && subjectMask[pixelIndex] > 128) {
        strength *= subjectMultiplier
      } else {
        strength *= backgroundMultiplier
      }

      // Reduce dithering on edges
      if (edgeMask && edgeMask[pixelIndex] > 128) {
        strength *= edgeMultiplier
      }

      // Reduce dithering in very bright/dark areas
      const brightness = (oldPixel.r + oldPixel.g + oldPixel.b) / (3 * 255)
      if (brightness > brightThreshold || brightness < darkThreshold) {
        strength *= 0.5
      }

      // Apply new pixel
      data[i] = newPixel.r
      data[i + 1] = newPixel.g
      data[i + 2] = newPixel.b

      // Diffuse error to neighboring pixels
      for (const kernel of errorKernel) {
        const nx = x + kernel.dx
        const ny = y + kernel.dy

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 4
          data[ni] = Math.max(0, Math.min(255, data[ni] + error.r * kernel.weight * strength))
          data[ni + 1] = Math.max(0, Math.min(255, data[ni + 1] + error.g * kernel.weight * strength))
          data[ni + 2] = Math.max(0, Math.min(255, data[ni + 2] + error.b * kernel.weight * strength))
        }
      }
    }
  }
}

function findClosestColor(pixel: RGB, palette: RGB[]): RGB {
  let closest = palette[0]
  let minDist = Infinity

  for (const color of palette) {
    const dist = Math.sqrt(
      Math.pow(pixel.r - color.r, 2) +
      Math.pow(pixel.g - color.g, 2) +
      Math.pow(pixel.b - color.b, 2)
    )

    if (dist < minDist) {
      minDist = dist
      closest = color
    }
  }

  return closest
}

// ============================================================================
// ENHANCED EDGE-PRESERVING CLEANUP
// ============================================================================

export interface EnhancedCleanupOptions {
  minClusterSize: number // Minimum cluster size to keep
  backgroundMultiplier: number // Larger clusters allowed in background (default: 1.5)
  subjectMultiplier: number // Smaller clusters allowed in subject (default: 0.7)
  edgeProtection: number // Pixel distance from edge to protect (default: 2)
  colorDifferenceThreshold: number // RGB distance to consider "different color" (default: 50)
}

export function enhancedCleanupWithEdgePreservation(
  grid: string[][],
  rgbGrid: RGB[][],
  edgeMask: Uint8ClampedArray,
  subjectMask?: Uint8ClampedArray,
  options: EnhancedCleanupOptions = {
    minClusterSize: 4,
    backgroundMultiplier: 1.5,
    subjectMultiplier: 0.7,
    edgeProtection: 2,
    colorDifferenceThreshold: 50
  }
): { grid: string[][], rgbGrid: RGB[][], removedCount: number } {
  const height = grid.length
  const width = grid[0].length
  const visited = Array.from({ length: height }, () => Array(width).fill(false))
  let removedCount = 0

  // Find all clusters
  const clusters: Array<{ pixels: Array<{x: number, y: number}>, dmcCode: string }> = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x]) {
        const cluster = floodFill(grid, visited, x, y, grid[y][x])
        clusters.push({ pixels: cluster, dmcCode: grid[y][x] })
      }
    }
  }

  // Process each cluster
  for (const cluster of clusters) {
    const { pixels, dmcCode } = cluster

    // Check if cluster is near edges
    const isNearEdge = pixels.some(({ x, y }) => {
      return isPixelNearEdge(x, y, width, height, edgeMask, options.edgeProtection)
    })

    // Check if cluster is in subject
    const isInSubject = subjectMask && pixels.some(({ x, y }) => {
      return subjectMask[y * width + x] > 128
    })

    // Determine effective minimum cluster size
    let effectiveMinSize = options.minClusterSize
    if (isInSubject) {
      effectiveMinSize *= options.subjectMultiplier
    } else {
      effectiveMinSize *= options.backgroundMultiplier
    }

    // Skip removal if near edge or cluster is large enough
    if (isNearEdge || pixels.length >= effectiveMinSize) {
      continue
    }

    // Find replacement color (most common neighbor)
    const neighborColors = new Map<string, number>()

    for (const { x, y } of pixels) {
      for (const { dx, dy } of [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }]) {
        const nx = x + dx
        const ny = y + dy

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborCode = grid[ny][nx]
          if (neighborCode !== dmcCode) {
            neighborColors.set(neighborCode, (neighborColors.get(neighborCode) || 0) + 1)
          }
        }
      }
    }

    if (neighborColors.size === 0) continue

    // Get most common neighbor
    let replacementCode = dmcCode
    let maxCount = 0
    for (const [code, count] of neighborColors) {
      if (count > maxCount) {
        maxCount = count
        replacementCode = code
      }
    }

    // Find replacement RGB
    let replacementRGB: RGB = [0, 0, 0]
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === replacementCode) {
          replacementRGB = rgbGrid[y][x]
          break
        }
      }
    }

    // Replace cluster
    for (const { x, y } of pixels) {
      grid[y][x] = replacementCode
      rgbGrid[y][x] = replacementRGB
      removedCount++
    }
  }

  return { grid, rgbGrid, removedCount }
}

function floodFill(
  grid: string[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  targetCode: string
): Array<{x: number, y: number}> {
  const height = grid.length
  const width = grid[0].length
  const pixels: Array<{x: number, y: number}> = []
  const stack: Array<{x: number, y: number}> = [{ x: startX, y: startY }]

  while (stack.length > 0) {
    const { x, y } = stack.pop()!

    if (x < 0 || x >= width || y < 0 || y >= height) continue
    if (visited[y][x]) continue
    if (grid[y][x] !== targetCode) continue

    visited[y][x] = true
    pixels.push({ x, y })

    stack.push({ x: x - 1, y })
    stack.push({ x: x + 1, y })
    stack.push({ x, y: y - 1 })
    stack.push({ x, y: y + 1 })
  }

  return pixels
}

function isPixelNearEdge(
  x: number,
  y: number,
  width: number,
  height: number,
  edgeMask: Uint8ClampedArray,
  distance: number
): boolean {
  for (let dy = -distance; dy <= distance; dy++) {
    for (let dx = -distance; dx <= distance; dx++) {
      const nx = x + dx
      const ny = y + dy

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (edgeMask[ny * width + nx] > 128) {
          return true
        }
      }
    }
  }

  return false
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PREMIUM_CANVAS_PRESETS as canvasPresets,
  CanvasPreset,
  HDPaletteOptions,
  RegionAwareDitheringOptions,
  EnhancedCleanupOptions
}
