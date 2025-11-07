/**
 * Professional QBRIX-Quality Diamond Painting Generator
 *
 * Features:
 * - LAB color space quantization for perceptually accurate colors
 * - Advanced preprocessing: white balance, bilateral filter, unsharp mask
 * - Style-specific processing (Original/Vintage/Pop-Art)
 * - Floyd-Steinberg error diffusion for smooth gradients
 * - Region cleanup: minimum cluster size, speckle removal
 * - 16×16 tile system with per-tile instructions
 * - Exact 7-color palettes with bead counts
 */

import { DMCColor } from './dmcColors'
import { StylePack, getStylePackById } from './diamondStylePacks'
import {
  RGB,
  LAB,
  rgbToLab,
  labToRgb,
  findClosestColorLAB,
  whiteBalance,
  bilateralFilter,
  unsharpMask,
  deltaE2000,
  lanczosResample,
  sobelEdgeDetection,
  majorityFilter,
  detectBackgroundColor,
  blendEdges,
  kMeansSegmentation,
  applyCLAHE,
  applySegmentedToneCurves,
  quantizeWithTargetPercentages,
  errorDiffusionWithMask,
  maskAwareUnsharpMask,
  enhanceEdgeDetail,
  applyStochasticDither,
} from './colorUtils'

export interface AdvancedDiamondOptions {
  canvasFormat: 'a4_portrait' | 'a4_landscape' | 'a4_square'
  stylePack: string // Style pack ID
  qualitySettings?: {
    bilateralSigma?: number // Edge-preserving smoothing strength (default: 3)
    sharpenAmount?: number // Sharpening amount (default: 0.8)
    ditheringStrength?: number // Error diffusion strength (default: 0.5)
    minClusterSize?: number // Minimum bead cluster size (default: 4 = 2×2)
  }
}

export interface BeadTile {
  tileNumber: number
  x: number // Grid X position (in tiles)
  y: number // Grid Y position (in tiles)
  startRow: number // Starting row in full grid
  startCol: number // Starting column in full grid
  width: number // Tile width in beads (usually 16)
  height: number // Tile height in beads (usually 16)
  beads: DiamondCell[][] // 2D array of beads
}

export interface DiamondCell {
  x: number
  y: number
  dmcCode: string
  rgb: RGB
  symbol: string
  tileCoord: { tx: number; ty: number } // Coordinates within tile
}

export interface BeadCount {
  dmcColor: DMCColor
  count: number
  percentage: number
  symbol: string
  lowUsage: boolean // True if percentage < 1%
}

export interface ProcessingDiagnostics {
  isolatedCellsRemoved: number // Single-pixel speckles merged
  smallClustersRemoved: number // Clusters below minimum size
  backgroundPercentage: number // Percentage of canvas that is background
  backgroundDMCCode: string // DMC code used for background
  edgePixelCount: number // Number of edge pixels preserved
  averageClusterSize: number // Average size of color clusters
  foregroundCoverage: number // % of canvas identified as subject (from segmentation)
  paletteUsageDeviation: number // Average deviation from target percentages
  colorsWithinTolerance: number // Number of colors within ±15% of target
  foregroundPaletteCoverage: { [dmcCode: string]: number } // Per-color % in foreground only
}

export interface AdvancedDiamondResult {
  imageDataUrl: string // High-res preview
  tiles: BeadTile[] // Tile-by-tile instructions
  beadCounts: BeadCount[] // Exact bead counts per color
  gridData: {
    width: number
    height: number
    cells: DiamondCell[][]
  }
  dimensions: {
    widthBeads: number
    heightBeads: number
    widthCm: number
    heightCm: number
    tilesWide: number
    tilesHigh: number
  }
  stylePack: StylePack
  totalBeads: number
  difficulty: string
  estimatedTime: string
  diagnostics: ProcessingDiagnostics // Quality metrics for validation
}

// Fixed canvas presets (~10,000 beads each)
const CANVAS_PRESETS = {
  a4_portrait: { width: 84, height: 119 },
  a4_landscape: { width: 119, height: 84 },
  a4_square: { width: 100, height: 100 },
}

const TILE_SIZE = 16 // 16×16 beads per tile (QBRIX standard)
const BEAD_SIZE_MM = 2.5 // Standard diamond drill size

/**
 * Find the lightest color in palette (for background)
 */
function findLightestColor(palette: RGB[]): RGB {
  let maxBrightness = 0
  let lightest = palette[0]

  palette.forEach((color) => {
    const brightness = (color.r + color.g + color.b) / 3
    if (brightness > maxBrightness) {
      maxBrightness = brightness
      lightest = color
    }
  })

  return lightest
}

/**
 * Force background pixels to map to lightest palette color
 */
function forceBackgroundColor(imageData: ImageData, bgColor: RGB, targetColor: RGB): void {
  const { data } = imageData
  const threshold = 40 // Color similarity threshold

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Calculate distance to background color
    const dr = r - bgColor.r
    const dg = g - bgColor.g
    const db = b - bgColor.b
    const distance = Math.sqrt(dr * dr + dg * dg + db * db)

    // If close to background, replace with target
    if (distance < threshold) {
      data[i] = targetColor.r
      data[i + 1] = targetColor.g
      data[i + 2] = targetColor.b
    }
  }
}

/**
 * Generate professional QBRIX-quality diamond painting
 */
export async function generateAdvancedDiamondPainting(
  imageUrl: string,
  options: AdvancedDiamondOptions
): Promise<AdvancedDiamondResult> {
  return new Promise(async (resolve, reject) => {
    const { canvasFormat, stylePack: stylePackId } = options
    const quality = options.qualitySettings || {}

    // Get style pack
    const stylePack = getStylePackById(stylePackId)
    if (!stylePack) {
      reject(new Error('Invalid style pack'))
      return
    }

    // Get canvas dimensions
    const { width: gridWidth, height: gridHeight } = CANVAS_PRESETS[canvasFormat]

    // Convert DMC palette to RGB
    const palette: RGB[] = stylePack.colors.map((c) => ({ r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] }))

    // Load and preprocess image
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = async () => {
      try {
        // Step 1: Upscale to 2× for better detail preservation
        console.log('Upscaling image 2×...')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Upscale to 2× resolution
        const upscaleWidth = gridWidth * 2
        const upscaleHeight = gridHeight * 2
        canvas.width = upscaleWidth
        canvas.height = upscaleHeight
        ctx.drawImage(img, 0, 0, upscaleWidth, upscaleHeight)

        let imageData = ctx.getImageData(0, 0, upscaleWidth, upscaleHeight)

        // Step 2: Advanced preprocessing pipeline (at 2× resolution)
        console.log('Applying white balance...')
        whiteBalance(imageData)

        console.log('Applying bilateral filter...')
        imageData = bilateralFilter(imageData, quality.bilateralSigma || 3, 30, 3)

        console.log('Applying unsharp mask...')
        imageData = unsharpMask(imageData, quality.sharpenAmount || 0.8, 1, 5)

        // Step 3: Style-specific processing
        console.log('Applying style-specific processing...')
        applyStyleProcessing(imageData, stylePackId)

        // Step 4: Detect background and store for later
        console.log('Detecting background color...')
        const bgColor = detectBackgroundColor(imageData)

        // Step 5: Extract edge mask BEFORE downsampling
        console.log('Extracting edge mask...')
        const edgeMask2x = sobelEdgeDetection(imageData)

        // Store original for edge blending
        const originalData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)

        // Step 6: Downsample to target resolution using Lanczos
        console.log('Downsampling with Lanczos...')
        imageData = lanczosResample(imageData, gridWidth, gridHeight, 3)

        // Downsample edge mask too
        const edgeMaskCanvas = document.createElement('canvas')
        const edgeMaskCtx = edgeMaskCanvas.getContext('2d')!
        edgeMaskCanvas.width = upscaleWidth
        edgeMaskCanvas.height = upscaleHeight
        const edgeMaskImageData = edgeMaskCtx.createImageData(upscaleWidth, upscaleHeight)
        for (let i = 0; i < edgeMask2x.length; i++) {
          const idx = i * 4
          edgeMaskImageData.data[idx] = edgeMask2x[i]
          edgeMaskImageData.data[idx + 1] = edgeMask2x[i]
          edgeMaskImageData.data[idx + 2] = edgeMask2x[i]
          edgeMaskImageData.data[idx + 3] = 255
        }
        edgeMaskCtx.putImageData(edgeMaskImageData, 0, 0)
        const downsampledEdgeMask = lanczosResample(edgeMaskImageData, gridWidth, gridHeight, 3)
        const edgeMask = new Uint8Array(gridWidth * gridHeight)
        for (let i = 0; i < edgeMask.length; i++) {
          edgeMask[i] = downsampledEdgeMask.data[i * 4]
        }

        // Step 7: Generate foreground/background segmentation mask
        console.log('Generating segmentation mask...')
        const segmentationMask = kMeansSegmentation(imageData, 2)

        // Calculate foreground coverage
        let foregroundPixels = 0
        for (let i = 0; i < segmentationMask.length; i++) {
          if (segmentationMask[i] > 127) foregroundPixels++
        }
        const foregroundCoverage = (foregroundPixels / segmentationMask.length) * 100

        // Step 8: Apply CLAHE to foreground regions for midtone recovery
        console.log('Applying CLAHE for local contrast...')
        const clipLimit = foregroundCoverage > 50 ? 2.5 : 2.0 // Adaptive based on subject size
        imageData = applyCLAHE(imageData, clipLimit, 8)

        // Step 9: Apply segmented tone curves (stronger lift for subject, keep background light)
        console.log('Applying segmented tone curves...')
        // Lift highlights and deepen shadows on foreground only
        imageData = applySegmentedToneCurves(imageData, segmentationMask, 1.25, 0.6)

        // Step 9b: Apply mask-aware sharpening (only sharpens foreground faces)
        console.log('Applying mask-aware sharpening...')
        imageData = maskAwareUnsharpMask(imageData, segmentationMask, 1.2, 2, 5)

        // Step 9c: Enhance edge detail at high-gradient pixels
        console.log('Enhancing edge detail...')
        imageData = enhanceEdgeDetail(imageData, edgeMask, 85, 0.4)

        // Step 10: Force background to lightest color in palette
        console.log('Separating background...')
        const lightestColor = findLightestColor(palette)
        forceBackgroundColor(imageData, bgColor, lightestColor)

        // Step 10b: Apply stochastic dither to prevent banding in flat regions
        console.log('Applying stochastic dither...')
        imageData = applyStochasticDither(imageData, edgeMask, 3, 30)

        // Step 11: Histogram-aware quantization with target percentages
        console.log('Quantizing with histogram balancing...')
        const targetPercentages = stylePack.colors.map(c => c.targetPercentage)
        let quantized = quantizeWithTargetPercentages(
          imageData,
          palette,
          targetPercentages,
          segmentationMask,
          15, // ±15% tolerance
          5   // Under-use penalty (favors under-used colors)
        )

        // Step 12: Blend edges back for crisp details
        console.log('Blending edges for detail...')
        const downsampledOriginal = lanczosResample(originalData, gridWidth, gridHeight, 3)
        quantized = blendEdges(quantized, downsampledOriginal, edgeMask, 0.3)

        // Step 10: Apply majority filter (avoiding edges)
        console.log('Applying majority filter...')
        const filtered = majorityFilter(quantized, edgeMask, 30)

        // Step 11: Advanced cleanup - merge isolated cells (preserving edges)
        console.log('Cleaning up isolated cells...')
        const minClusterSize = quality.minClusterSize || 4
        const { cleaned, stats } = cleanupWithEdgePreservation(
          filtered,
          edgeMask,
          palette,
          minClusterSize,
          30
        )

        // Step 12: Build grid data with symbols
        console.log('Building grid data...')
        const gridData = buildGridData(cleaned, palette, stylePack)

        // Step 13: Split into 16×16 tiles
        console.log('Creating tile system...')
        const tiles = createTileSystem(gridData, gridWidth, gridHeight)

        // Step 14: Calculate bead counts
        console.log('Calculating bead counts...')
        const beadCounts = calculateBeadCounts(gridData, stylePack)

        // Step 15: Calculate diagnostics
        console.log('Calculating diagnostics...')
        const clusterStats = calculateClusterStats(cleaned)

        // Find background color (lightest) and its percentage
        const backgroundDMC = stylePack.colors.find(c => {
          const rgb = { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] }
          return rgb.r === lightestColor.r && rgb.g === lightestColor.g && rgb.b === lightestColor.b
        }) || stylePack.colors[0]

        const backgroundCount = beadCounts.find(bc => bc.dmcColor.code === backgroundDMC.code)?.count || 0
        const backgroundPercentage = (backgroundCount / (gridWidth * gridHeight)) * 100

        // Count edge pixels
        let edgePixelCount = 0
        for (let i = 0; i < edgeMask.length; i++) {
          if (edgeMask[i] > 30) edgePixelCount++
        }

        // Calculate palette usage deviation from targets
        let totalDeviation = 0
        let colorsWithinTolerance = 0
        const tolerance = 15 // ±15%

        beadCounts.forEach((bead) => {
          const deviation = Math.abs(bead.percentage - bead.dmcColor.targetPercentage)
          totalDeviation += deviation
          if (deviation <= tolerance) colorsWithinTolerance++
        })

        const averageDeviation = totalDeviation / beadCounts.length

        // Calculate foreground palette coverage (per-color usage in foreground only)
        const foregroundPaletteCoverage: { [dmcCode: string]: number } = {}
        const foregroundColorCounts: { [dmcCode: string]: number } = {}
        let totalForegroundPixels = 0

        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            const idx = y * gridWidth + x
            // Only count foreground pixels
            if (segmentationMask[idx] > 127) {
              totalForegroundPixels++
              const cell = gridData[y][x]
              const code = cell.dmcCode
              foregroundColorCounts[code] = (foregroundColorCounts[code] || 0) + 1
            }
          }
        }

        // Convert counts to percentages
        for (const code in foregroundColorCounts) {
          foregroundPaletteCoverage[code] =
            Math.round((foregroundColorCounts[code] / totalForegroundPixels) * 1000) / 10
        }

        const diagnostics: ProcessingDiagnostics = {
          isolatedCellsRemoved: stats.isolated,
          smallClustersRemoved: stats.smallClusters,
          backgroundPercentage: Math.round(backgroundPercentage * 10) / 10,
          backgroundDMCCode: backgroundDMC.code,
          edgePixelCount,
          averageClusterSize: Math.round(clusterStats.avgSize * 10) / 10,
          foregroundCoverage: Math.round(foregroundCoverage * 10) / 10,
          paletteUsageDeviation: Math.round(averageDeviation * 10) / 10,
          colorsWithinTolerance,
          foregroundPaletteCoverage,
        }

        // Step 16: Generate high-res preview
        console.log('Generating preview...')
        const previewUrl = generatePreview(gridData, gridWidth, gridHeight)

        // Calculate dimensions
        const tilesWide = Math.ceil(gridWidth / TILE_SIZE)
        const tilesHigh = Math.ceil(gridHeight / TILE_SIZE)
        const widthCm = (gridWidth * BEAD_SIZE_MM) / 10
        const heightCm = (gridHeight * BEAD_SIZE_MM) / 10

        const result: AdvancedDiamondResult = {
          imageDataUrl: previewUrl,
          tiles,
          beadCounts,
          gridData: {
            width: gridWidth,
            height: gridHeight,
            cells: gridData,
          },
          dimensions: {
            widthBeads: gridWidth,
            heightBeads: gridHeight,
            widthCm: Math.round(widthCm * 10) / 10,
            heightCm: Math.round(heightCm * 10) / 10,
            tilesWide,
            tilesHigh,
          },
          stylePack,
          totalBeads: gridWidth * gridHeight,
          difficulty: calculateDifficulty(gridWidth * gridHeight, beadCounts.length),
          estimatedTime: estimateTime(gridWidth * gridHeight, beadCounts.length),
          diagnostics,
        }

        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

/**
 * Apply style-specific processing
 */
function applyStyleProcessing(imageData: ImageData, styleId: string): void {
  const data = imageData.data

  if (styleId === 'a4_vintage') {
    // VINTAGE: Desaturate, warm shift, reduce contrast
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Desaturate 30%
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = gray + (r - gray) * 0.7
      g = gray + (g - gray) * 0.7
      b = gray + (b - gray) * 0.7

      // Warm shift (+20 warmth)
      r = Math.min(255, r * 1.15 + 20)
      g = Math.min(255, g * 1.08 + 12)
      b = Math.max(0, b * 0.92 - 8)

      // Reduce contrast (softer)
      const mid = 128
      r = mid + (r - mid) * 0.85
      g = mid + (g - mid) * 0.85
      b = mid + (b - mid) * 0.85

      data[i] = Math.round(Math.max(0, Math.min(255, r)))
      data[i + 1] = Math.round(Math.max(0, Math.min(255, g)))
      data[i + 2] = Math.round(Math.max(0, Math.min(255, b)))
    }
  } else if (styleId === 'a4_pop_art') {
    // POP ART: High saturation, high contrast, posterize
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Boost saturation +50%
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = gray + (r - gray) * 1.5
      g = gray + (g - gray) * 1.5
      b = gray + (b - gray) * 1.5

      // Increase contrast +30%
      const mid = 128
      r = mid + (r - mid) * 1.3
      g = mid + (g - mid) * 1.3
      b = mid + (b - mid) * 1.3

      // Posterize to 4-5 bands per channel
      const levels = 4
      r = Math.round(r / 255 * (levels - 1)) * (255 / (levels - 1))
      g = Math.round(g / 255 * (levels - 1)) * (255 / (levels - 1))
      b = Math.round(b / 255 * (levels - 1)) * (255 / (levels - 1))

      data[i] = Math.round(Math.max(0, Math.min(255, r)))
      data[i + 1] = Math.round(Math.max(0, Math.min(255, g)))
      data[i + 2] = Math.round(Math.max(0, Math.min(255, b)))
    }
  }
  // ORIGINAL: No processing - photo-faithful
}

/**
 * Quantize image to palette using Floyd-Steinberg error diffusion
 * This creates smooth gradients while staying within the 7-color palette
 */
function quantizeWithErrorDiffusion(
  imageData: ImageData,
  palette: RGB[],
  strength: number = 0.5
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Error buffer for diffusion
  const errorR = new Float32Array(width * height)
  const errorG = new Float32Array(width * height)
  const errorB = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Add accumulated error
      let r = data[idx] + errorR[y * width + x]
      let g = data[idx + 1] + errorG[y * width + x]
      let b = data[idx + 2] + errorB[y * width + x]

      // Clamp
      r = Math.max(0, Math.min(255, r))
      g = Math.max(0, Math.min(255, g))
      b = Math.max(0, Math.min(255, b))

      // Find closest palette color (in LAB space for perceptual accuracy)
      const closest = findClosestColorLAB({ r, g, b }, palette)

      // Set output color
      output[idx] = closest.color.r
      output[idx + 1] = closest.color.g
      output[idx + 2] = closest.color.b

      // Calculate quantization error
      const errR = (r - closest.color.r) * strength
      const errG = (g - closest.color.g) * strength
      const errB = (b - closest.color.b) * strength

      // Distribute error using Floyd-Steinberg kernel
      // [ ] [X] [ ]     [ ] [X] [7/16]
      // [ ] [ ] [ ] ->  [3/16] [5/16] [1/16]

      if (x + 1 < width) {
        errorR[y * width + (x + 1)] += errR * 7 / 16
        errorG[y * width + (x + 1)] += errG * 7 / 16
        errorB[y * width + (x + 1)] += errB * 7 / 16
      }
      if (y + 1 < height) {
        if (x > 0) {
          errorR[(y + 1) * width + (x - 1)] += errR * 3 / 16
          errorG[(y + 1) * width + (x - 1)] += errG * 3 / 16
          errorB[(y + 1) * width + (x - 1)] += errB * 3 / 16
        }
        errorR[(y + 1) * width + x] += errR * 5 / 16
        errorG[(y + 1) * width + x] += errG * 5 / 16
        errorB[(y + 1) * width + x] += errB * 5 / 16
        if (x + 1 < width) {
          errorR[(y + 1) * width + (x + 1)] += errR * 1 / 16
          errorG[(y + 1) * width + (x + 1)] += errG * 1 / 16
          errorB[(y + 1) * width + (x + 1)] += errB * 1 / 16
        }
      }
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Clean up regions: remove speckles, enforce minimum cluster sizes
 */
function cleanupRegions(imageData: ImageData, palette: RGB[], minClusterSize: number): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Create color index map
  const colorMap = new Map<string, number>()
  palette.forEach((color, idx) => {
    colorMap.set(`${color.r},${color.g},${color.b}`, idx)
  })

  // Track visited pixels
  const visited = new Uint8Array(width * height)

  // Find and merge small clusters
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx]) continue

      // Flood fill to find cluster
      const cluster = floodFill(data, width, height, x, y, visited)

      // If cluster is too small, replace with most common neighbor color
      if (cluster.length < minClusterSize) {
        const neighborColor = findMostCommonNeighborColor(cluster, data, width, height, palette)

        // Replace all pixels in small cluster
        for (const pixelIdx of cluster) {
          const dataIdx = pixelIdx * 4
          output[dataIdx] = neighborColor.r
          output[dataIdx + 1] = neighborColor.g
          output[dataIdx + 2] = neighborColor.b
        }
      }
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Flood fill to find connected component
 */
function floodFill(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: Uint8Array
): number[] {
  const cluster: number[] = []
  const stack: [number, number][] = [[startX, startY]]

  const startIdx = (startY * width + startX) * 4
  const targetR = data[startIdx]
  const targetG = data[startIdx + 1]
  const targetB = data[startIdx + 2]

  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const pixelIdx = y * width + x

    if (x < 0 || x >= width || y < 0 || y >= height) continue
    if (visited[pixelIdx]) continue

    const dataIdx = pixelIdx * 4
    if (data[dataIdx] !== targetR || data[dataIdx + 1] !== targetG || data[dataIdx + 2] !== targetB) {
      continue
    }

    visited[pixelIdx] = 1
    cluster.push(pixelIdx)

    // Add 4-connected neighbors
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  return cluster
}

/**
 * Find most common color in neighbors of a cluster
 */
function findMostCommonNeighborColor(
  cluster: number[],
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): RGB {
  const colorCounts = new Map<string, number>()

  for (const pixelIdx of cluster) {
    const x = pixelIdx % width
    const y = Math.floor(pixelIdx / width)

    // Check 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue

        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

        const nidx = (ny * width + nx) * 4
        const colorKey = `${data[nidx]},${data[nidx + 1]},${data[nidx + 2]}`

        colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1)
      }
    }
  }

  // Find most common color
  let maxCount = 0
  let mostCommon = palette[0]

  colorCounts.forEach((count, colorKey) => {
    if (count > maxCount) {
      maxCount = count
      const [r, g, b] = colorKey.split(',').map(Number)
      mostCommon = { r, g, b }
    }
  })

  return mostCommon
}

/**
 * Advanced cleanup: merge isolated cells while preserving edges
 * Returns statistics about the cleanup process
 */
function cleanupWithEdgePreservation(
  imageData: ImageData,
  edgeMask: Uint8Array,
  palette: RGB[],
  minClusterSize: number = 4,
  edgeThreshold: number = 30
): { cleaned: ImageData; stats: { isolated: number; smallClusters: number } } {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  let isolatedCellsRemoved = 0
  let smallClustersRemoved = 0

  // Track visited pixels
  const visited = new Uint8Array(width * height)

  // Find and merge small clusters
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx]) continue

      // Skip edge pixels - preserve detail
      if (edgeMask[idx] > edgeThreshold) {
        visited[idx] = 1
        continue
      }

      // Flood fill to find cluster
      const cluster = floodFill(data, width, height, x, y, visited)

      // If cluster is too small, replace with most common neighbor color
      if (cluster.length < minClusterSize) {
        const neighborColor = findMostCommonNeighborColor(cluster, data, width, height, palette)

        // Replace all pixels in small cluster
        for (const pixelIdx of cluster) {
          const dataIdx = pixelIdx * 4
          output[dataIdx] = neighborColor.r
          output[dataIdx + 1] = neighborColor.g
          output[dataIdx + 2] = neighborColor.b
        }

        // Track statistics
        if (cluster.length === 1) {
          isolatedCellsRemoved++
        } else {
          smallClustersRemoved++
        }
      }
    }
  }

  return {
    cleaned: new ImageData(output, width, height),
    stats: { isolated: isolatedCellsRemoved, smallClusters: smallClustersRemoved },
  }
}

/**
 * Calculate cluster statistics for diagnostics
 */
function calculateClusterStats(imageData: ImageData): { avgSize: number; totalClusters: number } {
  const { width, height, data } = imageData
  const visited = new Uint8Array(width * height)
  const clusterSizes: number[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx]) continue

      const cluster = floodFill(data, width, height, x, y, visited)
      clusterSizes.push(cluster.length)
    }
  }

  const avgSize = clusterSizes.length > 0
    ? clusterSizes.reduce((a, b) => a + b, 0) / clusterSizes.length
    : 0

  return { avgSize, totalClusters: clusterSizes.length }
}

/**
 * Build grid data with DMC codes and defaultSymbols from style pack
 */
function buildGridData(imageData: ImageData, palette: RGB[], stylePack: StylePack): DiamondCell[][] {
  const { width, height, data } = imageData
  const grid: DiamondCell[][] = []

  // Create color to DMC+Symbol mapping using defaultSymbol from style pack
  const colorToDMC = new Map<string, { dmc: typeof stylePack.colors[0]; symbol: string }>()
  palette.forEach((rgb, idx) => {
    const key = `${rgb.r},${rgb.g},${rgb.b}`
    colorToDMC.set(key, {
      dmc: stylePack.colors[idx],
      symbol: stylePack.colors[idx].defaultSymbol,
    })
  })

  for (let y = 0; y < height; y++) {
    const row: DiamondCell[] = []
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const colorKey = `${r},${g},${b}`

      const mapping = colorToDMC.get(colorKey) || {
        dmc: stylePack.colors[0],
        symbol: stylePack.colors[0].defaultSymbol,
      }

      row.push({
        x,
        y,
        dmcCode: mapping.dmc.code,
        rgb: { r, g, b },
        symbol: mapping.symbol,
        tileCoord: { tx: x % TILE_SIZE, ty: y % TILE_SIZE },
      })
    }
    grid.push(row)
  }

  return grid
}

/**
 * Create 16×16 tile system
 */
function createTileSystem(grid: DiamondCell[][], width: number, height: number): BeadTile[] {
  const tiles: BeadTile[] = []
  const tilesWide = Math.ceil(width / TILE_SIZE)
  const tilesHigh = Math.ceil(height / TILE_SIZE)

  let tileNumber = 1

  for (let ty = 0; ty < tilesHigh; ty++) {
    for (let tx = 0; tx < tilesWide; tx++) {
      const startRow = ty * TILE_SIZE
      const startCol = tx * TILE_SIZE
      const tileWidth = Math.min(TILE_SIZE, width - startCol)
      const tileHeight = Math.min(TILE_SIZE, height - startRow)

      const tileBeads: DiamondCell[][] = []
      for (let y = 0; y < tileHeight; y++) {
        const row: DiamondCell[] = []
        for (let x = 0; x < tileWidth; x++) {
          row.push(grid[startRow + y][startCol + x])
        }
        tileBeads.push(row)
      }

      tiles.push({
        tileNumber,
        x: tx,
        y: ty,
        startRow,
        startCol,
        width: tileWidth,
        height: tileHeight,
        beads: tileBeads,
      })

      tileNumber++
    }
  }

  return tiles
}

/**
 * Calculate exact bead counts
 */
function calculateBeadCounts(grid: DiamondCell[][], stylePack: StylePack): BeadCount[] {
  const counts = new Map<string, number>()
  const symbols = new Map<string, string>()
  let total = 0

  for (const row of grid) {
    for (const cell of row) {
      counts.set(cell.dmcCode, (counts.get(cell.dmcCode) || 0) + 1)
      symbols.set(cell.dmcCode, cell.symbol)
      total++
    }
  }

  const beadCounts: BeadCount[] = []

  stylePack.colors.forEach((dmc) => {
    const count = counts.get(dmc.code) || 0
    const percentage = (count / total) * 100

    beadCounts.push({
      dmcColor: dmc,
      count,
      percentage: Math.round(percentage * 10) / 10,
      symbol: symbols.get(dmc.code) || dmc.defaultSymbol,
      lowUsage: percentage < 1.0, // Mark colors below 1% as optional/low usage
    })
  })

  // Sort by count descending
  beadCounts.sort((a, b) => b.count - a.count)

  return beadCounts
}

/**
 * Generate high-res preview image with stud outlines (QBRIX style)
 */
function generatePreview(grid: DiamondCell[][], width: number, height: number): string {
  const scale = 8 // 8 pixels per bead
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')!

  // QBRIX-style beige background
  ctx.fillStyle = '#EBD4B0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw beads with diamond effect and stud outlines
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x]
      const px = x * scale
      const py = y * scale

      // Fill bead color
      ctx.fillStyle = `rgb(${cell.rgb.r}, ${cell.rgb.g}, ${cell.rgb.b})`
      ctx.fillRect(px, py, scale, scale)

      // Add diamond facets (shine effect)
      const gradient = ctx.createRadialGradient(
        px + scale * 0.6,
        py + scale * 0.4,
        0,
        px + scale * 0.5,
        py + scale * 0.5,
        scale * 0.7
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
      ctx.fillStyle = gradient
      ctx.fillRect(px, py, scale, scale)

      // QBRIX-style stud outlines (visible grid)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.lineWidth = 1
      ctx.strokeRect(px, py, scale, scale)

      // Add symbol in center for reference (optional, subtle)
      if (scale >= 8) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.font = `${scale * 0.5}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cell.symbol, px + scale / 2, py + scale / 2)
      }
    }
  }

  return canvas.toDataURL('image/png', 1.0)
}

function calculateDifficulty(totalBeads: number, colorCount: number): string {
  if (colorCount <= 3) return 'Easy'
  if (colorCount <= 5) return 'Medium'
  return 'Hard'
}

function estimateTime(totalBeads: number, colorCount: number): string {
  const beadsPerHour = 120
  const colorChangeMinutes = colorCount * 2
  const hours = totalBeads / beadsPerHour + colorChangeMinutes / 60

  if (hours < 2) return `${Math.round(hours * 60)} minutes`
  if (hours < 10) return `${Math.round(hours * 2) / 2} hours`
  return `${Math.round(hours)} hours`
}
