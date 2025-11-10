/**
 * Smart Region Merging - Phase 4 Advanced Feature
 *
 * Reduces color fragmentation by intelligently merging adjacent regions
 * with similar colors, resulting in cleaner patterns with fewer isolated pixels.
 *
 * Features:
 * - Connected component analysis for region identification
 * - LAB color space similarity (Delta E) for perceptual merging
 * - Size-based merging for tiny isolated regions
 * - Subject-aware merging (preserves detail in faces/subjects)
 * - Multi-pass optimization for complex patterns
 */

import type { ImageData } from 'canvas'

export interface RegionMergingOptions {
  /** Enable region merging (default: true) */
  enableMerging?: boolean

  /** Color similarity threshold in Delta E (default: 8) */
  mergeSimilarityThreshold?: number

  /** Minimum region size before considering merge (default: 20 pixels) */
  minRegionSizeBeforeMerge?: number

  /** Maximum region size to merge (default: 500 pixels) */
  maxRegionSizeToMerge?: number

  /** Subject mask for region-aware merging */
  subjectMask?: ImageData

  /** Preserve more detail in subject regions (default: true) */
  preserveSubjectDetail?: boolean

  /** Number of merge passes (default: 2) */
  mergePasses?: number
}

export interface RegionMergingResult {
  mergedImage: ImageData
  regionsFound: number
  regionsMerged: number
  fragmentationReduction: number // Percentage
  statistics: {
    initialFragmentation: number
    finalFragmentation: number
    largestRegionSize: number
    averageRegionSize: number
    tinyRegionsRemoved: number
  }
}

interface Region {
  id: number
  pixels: number[]  // Flat indices: [idx1, idx2, ...]
  color: [number, number, number]  // RGB
  colorLAB: [number, number, number]  // LAB for comparison
  size: number
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
  adjacentRegions: Set<number>  // Region IDs
  isSubject: boolean
}

/**
 * Main entry point for smart region merging
 */
export async function performSmartRegionMerging(
  imageData: ImageData,
  options: RegionMergingOptions = {}
): Promise<RegionMergingResult> {
  const {
    enableMerging = true,
    mergeSimilarityThreshold = 8,
    minRegionSizeBeforeMerge = 20,
    maxRegionSizeToMerge = 500,
    subjectMask,
    preserveSubjectDetail = true,
    mergePasses = 2
  } = options

  if (!enableMerging) {
    return {
      mergedImage: imageData,
      regionsFound: 0,
      regionsMerged: 0,
      fragmentationReduction: 0,
      statistics: {
        initialFragmentation: 0,
        finalFragmentation: 0,
        largestRegionSize: 0,
        averageRegionSize: 0,
        tinyRegionsRemoved: 0
      }
    }
  }

  console.log('🔄 Smart Region Merging: Starting analysis...')

  let currentImage = cloneImageData(imageData)
  let totalRegionsMerged = 0
  let initialFragmentation = 0
  let tinyRegionsRemoved = 0

  for (let pass = 0; pass < mergePasses; pass++) {
    console.log(`  Pass ${pass + 1}/${mergePasses}...`)

    // Step 1: Identify all regions (connected components)
    const regions = identifyRegions(currentImage, subjectMask, preserveSubjectDetail)

    if (pass === 0) {
      initialFragmentation = calculateFragmentation(regions)
      console.log(`    Found ${regions.length} regions (fragmentation: ${initialFragmentation.toFixed(1)}%)`)
    }

    // Step 2: Build adjacency graph
    buildAdjacencyGraph(regions, currentImage.width, currentImage.height)

    // Step 3: Find merge candidates
    const mergeCandidates = findMergeCandidates(
      regions,
      mergeSimilarityThreshold,
      minRegionSizeBeforeMerge,
      maxRegionSizeToMerge
    )

    if (mergeCandidates.length === 0) {
      console.log(`    No merge candidates found, stopping at pass ${pass + 1}`)
      break
    }

    console.log(`    Found ${mergeCandidates.length} merge candidates`)

    // Step 4: Apply merges
    const mergeResult = applyMerges(currentImage, regions, mergeCandidates)
    currentImage = mergeResult.image
    totalRegionsMerged += mergeResult.mergeCount
    tinyRegionsRemoved += mergeResult.tinyRegionsRemoved

    console.log(`    Merged ${mergeResult.mergeCount} regions (${mergeResult.tinyRegionsRemoved} tiny regions removed)`)
  }

  // Final statistics
  const finalRegions = identifyRegions(currentImage, subjectMask, preserveSubjectDetail)
  const finalFragmentation = calculateFragmentation(finalRegions)
  const fragmentationReduction = ((initialFragmentation - finalFragmentation) / initialFragmentation) * 100

  const regionSizes = finalRegions.map(r => r.size)
  const largestRegionSize = Math.max(...regionSizes)
  const averageRegionSize = regionSizes.reduce((a, b) => a + b, 0) / regionSizes.length

  console.log(`✅ Region Merging Complete:`)
  console.log(`   Regions: ${regions.length} → ${finalRegions.length}`)
  console.log(`   Merged: ${totalRegionsMerged} regions`)
  console.log(`   Fragmentation: ${initialFragmentation.toFixed(1)}% → ${finalFragmentation.toFixed(1)}% (${fragmentationReduction.toFixed(1)}% reduction)`)

  return {
    mergedImage: currentImage,
    regionsFound: finalRegions.length,
    regionsMerged: totalRegionsMerged,
    fragmentationReduction,
    statistics: {
      initialFragmentation,
      finalFragmentation,
      largestRegionSize,
      averageRegionSize,
      tinyRegionsRemoved
    }
  }
}

/**
 * Identify all connected regions using flood fill
 */
function identifyRegions(
  imageData: ImageData,
  subjectMask: ImageData | undefined,
  preserveSubjectDetail: boolean
): Region[] {
  const { width, height, data } = imageData
  const visited = new Uint8Array(width * height)
  const regions: Region[] = []
  let regionId = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x

      if (visited[idx]) continue

      // Start flood fill
      const region = floodFill(imageData, x, y, visited, regionId++, subjectMask, preserveSubjectDetail)

      if (region.size > 0) {
        regions.push(region)
      }
    }
  }

  return regions
}

/**
 * Flood fill to identify a single connected region
 */
function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  visited: Uint8Array,
  regionId: number,
  subjectMask: ImageData | undefined,
  preserveSubjectDetail: boolean
): Region {
  const { width, height, data } = imageData
  const startIdx = startY * width + startX

  const targetR = data[startIdx * 4]
  const targetG = data[startIdx * 4 + 1]
  const targetB = data[startIdx * 4 + 2]

  const pixels: number[] = []
  const stack: [number, number][] = [[startX, startY]]

  let minX = startX, maxX = startX
  let minY = startY, maxY = startY

  let isSubject = false
  if (subjectMask && preserveSubjectDetail) {
    const maskValue = subjectMask.data[startIdx * 4]
    isSubject = maskValue > 127
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop()!

    if (x < 0 || x >= width || y < 0 || y >= height) continue

    const idx = y * width + x

    if (visited[idx]) continue

    const r = data[idx * 4]
    const g = data[idx * 4 + 1]
    const b = data[idx * 4 + 2]

    // Must be exact same color
    if (r !== targetR || g !== targetG || b !== targetB) continue

    visited[idx] = 1
    pixels.push(idx)

    // Update bounds
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)

    // Add neighbors
    stack.push([x + 1, y])
    stack.push([x - 1, y])
    stack.push([x, y + 1])
    stack.push([x, y - 1])
  }

  const colorLAB = rgbToLab(targetR, targetG, targetB)

  return {
    id: regionId,
    pixels,
    color: [targetR, targetG, targetB],
    colorLAB,
    size: pixels.length,
    bounds: { minX, maxX, minY, maxY },
    adjacentRegions: new Set(),
    isSubject
  }
}

/**
 * Build adjacency graph between regions
 */
function buildAdjacencyGraph(regions: Region[], width: number, height: number): void {
  // Create region lookup map
  const regionMap = new Map<number, number>()  // pixelIdx -> regionId

  for (const region of regions) {
    for (const pixelIdx of region.pixels) {
      regionMap.set(pixelIdx, region.id)
    }
  }

  // Check each region's boundary pixels for neighbors
  for (const region of regions) {
    const checked = new Set<number>()

    for (const pixelIdx of region.pixels) {
      const x = pixelIdx % width
      const y = Math.floor(pixelIdx / width)

      // Check 4-connected neighbors
      const neighbors = [
        pixelIdx + 1,      // right
        pixelIdx - 1,      // left
        pixelIdx + width,  // down
        pixelIdx - width   // up
      ]

      for (const neighborIdx of neighbors) {
        if (neighborIdx < 0 || neighborIdx >= width * height) continue

        const neighborRegionId = regionMap.get(neighborIdx)

        if (neighborRegionId !== undefined && neighborRegionId !== region.id && !checked.has(neighborRegionId)) {
          region.adjacentRegions.add(neighborRegionId)
          checked.add(neighborRegionId)
        }
      }
    }
  }
}

/**
 * Find merge candidates based on similarity and size
 */
function findMergeCandidates(
  regions: Region[],
  similarityThreshold: number,
  minRegionSize: number,
  maxRegionSize: number
): Array<{ smallRegion: Region, targetRegion: Region, deltaE: number }> {
  const candidates: Array<{ smallRegion: Region, targetRegion: Region, deltaE: number }> = []

  const regionMap = new Map<number, Region>()
  for (const region of regions) {
    regionMap.set(region.id, region)
  }

  for (const region of regions) {
    // Only merge small regions
    if (region.size < minRegionSize || region.size > maxRegionSize) continue

    // Find best adjacent region to merge into
    let bestTarget: Region | null = null
    let bestDeltaE = Infinity

    for (const adjacentId of region.adjacentRegions) {
      const adjacent = regionMap.get(adjacentId)
      if (!adjacent) continue

      // Skip if both are subject regions (preserve subject detail)
      if (region.isSubject && adjacent.isSubject) {
        // Allow merging if very similar
        const deltaE = calculateDeltaE(region.colorLAB, adjacent.colorLAB)
        if (deltaE > similarityThreshold * 0.5) continue
      }

      const deltaE = calculateDeltaE(region.colorLAB, adjacent.colorLAB)

      if (deltaE < similarityThreshold && deltaE < bestDeltaE) {
        bestDeltaE = deltaE
        bestTarget = adjacent
      }
    }

    if (bestTarget) {
      candidates.push({
        smallRegion: region,
        targetRegion: bestTarget,
        deltaE: bestDeltaE
      })
    }
  }

  // Sort by delta E (merge most similar first)
  candidates.sort((a, b) => a.deltaE - b.deltaE)

  return candidates
}

/**
 * Apply merges to image
 */
function applyMerges(
  imageData: ImageData,
  regions: Region[],
  candidates: Array<{ smallRegion: Region, targetRegion: Region, deltaE: number }>
): { image: ImageData, mergeCount: number, tinyRegionsRemoved: number } {
  const newImage = cloneImageData(imageData)
  const { data } = newImage

  let mergeCount = 0
  let tinyRegionsRemoved = 0
  const mergedRegions = new Set<number>()

  for (const { smallRegion, targetRegion } of candidates) {
    // Skip if already merged
    if (mergedRegions.has(smallRegion.id)) continue

    // Replace all pixels in small region with target color
    for (const pixelIdx of smallRegion.pixels) {
      data[pixelIdx * 4] = targetRegion.color[0]
      data[pixelIdx * 4 + 1] = targetRegion.color[1]
      data[pixelIdx * 4 + 2] = targetRegion.color[2]
    }

    mergedRegions.add(smallRegion.id)
    mergeCount++

    if (smallRegion.size < 10) {
      tinyRegionsRemoved++
    }
  }

  return { image: newImage, mergeCount, tinyRegionsRemoved }
}

/**
 * Calculate fragmentation metric (percentage of regions that are small)
 */
function calculateFragmentation(regions: Region[]): number {
  if (regions.length === 0) return 0

  const smallRegions = regions.filter(r => r.size < 50).length
  return (smallRegions / regions.length) * 100
}

/**
 * Calculate Delta E 2000 between two LAB colors
 */
function calculateDeltaE(lab1: [number, number, number], lab2: [number, number, number]): number {
  const [L1, a1, b1] = lab1
  const [L2, a2, b2] = lab2

  // Simplified Delta E 2000 calculation
  const dL = L1 - L2
  const da = a1 - a2
  const db = b1 - b2

  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const dC = C1 - C2

  const dH2 = da * da + db * db - dC * dC
  const dH = dH2 > 0 ? Math.sqrt(dH2) : 0

  // Simplified weighting
  const sL = 1, sC = 1, sH = 1
  const kL = 1, kC = 1, kH = 1

  const lTerm = dL / (kL * sL)
  const cTerm = dC / (kC * sC)
  const hTerm = dH / (kH * sH)

  return Math.sqrt(lTerm * lTerm + cTerm * cTerm + hTerm * hTerm)
}

/**
 * Convert RGB to LAB color space
 */
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // RGB to XYZ
  let rNorm = r / 255
  let gNorm = g / 255
  let bNorm = b / 255

  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

  const x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375
  const y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750
  const z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041

  // XYZ to LAB (D65 illuminant)
  const xn = x / 0.95047
  const yn = y / 1.00000
  const zn = z / 1.08883

  const fx = xn > 0.008856 ? Math.pow(xn, 1 / 3) : (7.787 * xn + 16 / 116)
  const fy = yn > 0.008856 ? Math.pow(yn, 1 / 3) : (7.787 * yn + 16 / 116)
  const fz = zn > 0.008856 ? Math.pow(zn, 1 / 3) : (7.787 * zn + 16 / 116)

  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bLab = 200 * (fy - fz)

  return [L, a, bLab]
}

/**
 * Clone ImageData
 */
function cloneImageData(imageData: ImageData): ImageData {
  const cloned = new ImageData(imageData.width, imageData.height)
  cloned.data.set(imageData.data)
  return cloned
}
