/**
 * Professional Color Utilities for Diamond Painting
 * Includes LAB color space for perceptually accurate quantization
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export interface LAB {
  l: number // Lightness: 0-100
  a: number // Green-Red: -128 to 127
  b: number // Blue-Yellow: -128 to 127
}

export interface XYZ {
  x: number
  y: number
  z: number
}

/**
 * Convert RGB to XYZ (D65 illuminant)
 */
export function rgbToXyz(rgb: RGB): XYZ {
  // Normalize RGB to 0-1
  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  // Apply gamma correction (sRGB)
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  // Convert to XYZ using D65 illuminant matrix
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041

  return { x: x * 100, y: y * 100, z: z * 100 }
}

/**
 * Convert XYZ to LAB (D65 reference white)
 */
export function xyzToLab(xyz: XYZ): LAB {
  // D65 reference white
  const refX = 95.047
  const refY = 100.000
  const refZ = 108.883

  // Normalize by reference white
  let x = xyz.x / refX
  let y = xyz.y / refY
  let z = xyz.z / refZ

  // Apply LAB transformation function
  const epsilon = 0.008856
  const kappa = 903.3

  x = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116
  y = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116
  z = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116

  const l = 116 * y - 16
  const a = 500 * (x - y)
  const b = 200 * (y - z)

  return { l, a, b }
}

/**
 * Convert RGB to LAB (one-step convenience)
 */
export function rgbToLab(rgb: RGB): LAB {
  const xyz = rgbToXyz(rgb)
  return xyzToLab(xyz)
}

/**
 * Convert LAB to XYZ
 */
export function labToXyz(lab: LAB): XYZ {
  const refX = 95.047
  const refY = 100.000
  const refZ = 108.883

  const fy = (lab.l + 16) / 116
  const fx = lab.a / 500 + fy
  const fz = fy - lab.b / 200

  const epsilon = 0.008856
  const kappa = 903.3

  const xr = Math.pow(fx, 3) > epsilon ? Math.pow(fx, 3) : (116 * fx - 16) / kappa
  const yr = lab.l > kappa * epsilon ? Math.pow((lab.l + 16) / 116, 3) : lab.l / kappa
  const zr = Math.pow(fz, 3) > epsilon ? Math.pow(fz, 3) : (116 * fz - 16) / kappa

  return {
    x: xr * refX,
    y: yr * refY,
    z: zr * refZ,
  }
}

/**
 * Convert XYZ to RGB
 */
export function xyzToRgb(xyz: XYZ): RGB {
  // Normalize from 0-100 to 0-1
  const x = xyz.x / 100
  const y = xyz.y / 100
  const z = xyz.z / 100

  // Apply inverse D65 matrix
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252

  // Apply inverse gamma correction (sRGB)
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b

  // Clamp to 0-255
  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255))),
  }
}

/**
 * Convert LAB to RGB (one-step convenience)
 */
export function labToRgb(lab: LAB): RGB {
  const xyz = labToXyz(lab)
  return xyzToRgb(xyz)
}

/**
 * Calculate Delta E (CIE76) - perceptual color difference in LAB
 * Lower values = more similar colors
 */
export function deltaE(lab1: LAB, lab2: LAB): number {
  const dL = lab1.l - lab2.l
  const da = lab1.a - lab2.a
  const db = lab1.b - lab2.b
  return Math.sqrt(dL * dL + da * da + db * db)
}

/**
 * Calculate Delta E (CIE2000) - more accurate perceptual difference
 * This is the industry standard for color matching
 */
export function deltaE2000(lab1: LAB, lab2: LAB): number {
  // Simplified CIE2000 implementation
  // Full implementation would include weighting factors for different applications

  const kL = 1.0 // Lightness weight
  const kC = 1.0 // Chroma weight
  const kH = 1.0 // Hue weight

  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)
  const Cbar = (C1 + C2) / 2

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))))

  const a1p = lab1.a * (1 + G)
  const a2p = lab2.a * (1 + G)

  const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b)
  const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b)

  const dL = lab2.l - lab1.l
  const dC = C2p - C1p

  // Simplified hue difference
  const dH = Math.sqrt(Math.max(0, (lab2.a - lab1.a) * (lab2.a - lab1.a) + (lab2.b - lab1.b) * (lab2.b - lab1.b) - dC * dC))

  const SL = 1 + (0.015 * Math.pow(lab1.l - 50, 2)) / Math.sqrt(20 + Math.pow(lab1.l - 50, 2))
  const SC = 1 + 0.045 * C1p
  const SH = 1 + 0.015 * C1p

  const dE = Math.sqrt(
    Math.pow(dL / (kL * SL), 2) +
    Math.pow(dC / (kC * SC), 2) +
    Math.pow(dH / (kH * SH), 2)
  )

  return dE
}

/**
 * Find closest color in LAB palette using perceptual distance
 */
export function findClosestColorLAB(targetRgb: RGB, palette: RGB[]): { color: RGB; index: number; distance: number } {
  const targetLab = rgbToLab(targetRgb)

  let minDistance = Infinity
  let closestIndex = 0

  for (let i = 0; i < palette.length; i++) {
    const paletteLab = rgbToLab(palette[i])
    const distance = deltaE2000(targetLab, paletteLab)

    if (distance < minDistance) {
      minDistance = distance
      closestIndex = i
    }
  }

  return {
    color: palette[closestIndex],
    index: closestIndex,
    distance: minDistance,
  }
}

/**
 * Apply white balance correction
 */
export function whiteBalance(imageData: ImageData): void {
  const data = imageData.data

  // Calculate average RGB values (gray world assumption)
  let sumR = 0, sumG = 0, sumB = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i]
    sumG += data[i + 1]
    sumB += data[i + 2]
  }

  const avgR = sumR / pixelCount
  const avgG = sumG / pixelCount
  const avgB = sumB / pixelCount
  const avgGray = (avgR + avgG + avgB) / 3

  // Calculate correction factors
  const scaleR = avgGray / avgR
  const scaleG = avgGray / avgG
  const scaleB = avgGray / avgB

  // Apply correction
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * scaleR)
    data[i + 1] = Math.min(255, data[i + 1] * scaleG)
    data[i + 2] = Math.min(255, data[i + 2] * scaleB)
  }
}

/**
 * Apply bilateral filter (edge-preserving smoothing)
 * Reduces noise while keeping edges sharp
 */
export function bilateralFilter(
  imageData: ImageData,
  spatialSigma: number = 3,
  rangeSigma: number = 30,
  kernelRadius: number = 5
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data.length)

  const spatialCoeff = -0.5 / (spatialSigma * spatialSigma)
  const rangeCoeff = -0.5 / (rangeSigma * rangeSigma)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0
      const centerR = data[idx]
      const centerG = data[idx + 1]
      const centerB = data[idx + 2]

      // Sample neighborhood
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          const nx = Math.min(width - 1, Math.max(0, x + kx))
          const ny = Math.min(height - 1, Math.max(0, y + ky))
          const nidx = (ny * width + nx) * 4

          // Spatial distance
          const spatialDist = kx * kx + ky * ky
          const spatialWeight = Math.exp(spatialDist * spatialCoeff)

          // Range (color) distance
          const dR = data[nidx] - centerR
          const dG = data[nidx + 1] - centerG
          const dB = data[nidx + 2] - centerB
          const rangeDist = dR * dR + dG * dG + dB * dB
          const rangeWeight = Math.exp(rangeDist * rangeCoeff)

          const weight = spatialWeight * rangeWeight

          sumR += data[nidx] * weight
          sumG += data[nidx + 1] * weight
          sumB += data[nidx + 2] * weight
          sumWeight += weight
        }
      }

      output[idx] = sumR / sumWeight
      output[idx + 1] = sumG / sumWeight
      output[idx + 2] = sumB / sumWeight
      output[idx + 3] = data[idx + 3] // Preserve alpha
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Apply unsharp mask (controlled sharpening)
 * Enhances edges without creating halos
 */
export function unsharpMask(
  imageData: ImageData,
  amount: number = 1.0,
  radius: number = 1,
  threshold: number = 0
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Create blurred version using simple box blur
  const blurred = boxBlur(imageData, radius)

  // Subtract blurred from original and add back scaled
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) { // RGB channels
      const original = data[i + c]
      const blur = blurred.data[i + c]
      const diff = original - blur

      // Only sharpen if difference exceeds threshold
      if (Math.abs(diff) > threshold) {
        output[i + c] = Math.max(0, Math.min(255, original + diff * amount))
      }
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Simple box blur for unsharp mask
 */
function boxBlur(imageData: ImageData, radius: number): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data.length)
  const kernelSize = radius * 2 + 1
  const kernelArea = kernelSize * kernelSize

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      let sumR = 0, sumG = 0, sumB = 0

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = Math.min(width - 1, Math.max(0, x + kx))
          const ny = Math.min(height - 1, Math.max(0, y + ky))
          const nidx = (ny * width + nx) * 4

          sumR += data[nidx]
          sumG += data[nidx + 1]
          sumB += data[nidx + 2]
        }
      }

      output[idx] = sumR / kernelArea
      output[idx + 1] = sumG / kernelArea
      output[idx + 2] = sumB / kernelArea
      output[idx + 3] = data[idx + 3]
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Lanczos resampling for high-quality downsampling
 * Better than bilinear/bicubic for preserving detail
 */
export function lanczosResample(
  sourceData: ImageData,
  targetWidth: number,
  targetHeight: number,
  lobes: number = 3
): ImageData {
  const { width: srcWidth, height: srcHeight, data: srcData } = sourceData
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4)

  const xRatio = srcWidth / targetWidth
  const yRatio = srcHeight / targetHeight

  // Lanczos kernel function
  const lanczos = (x: number): number => {
    if (x === 0) return 1
    if (Math.abs(x) >= lobes) return 0
    const piX = Math.PI * x
    return (lobes * Math.sin(piX) * Math.sin(piX / lobes)) / (piX * piX)
  }

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = (x + 0.5) * xRatio - 0.5
      const srcY = (y + 0.5) * yRatio - 0.5

      let r = 0, g = 0, b = 0, totalWeight = 0

      const startX = Math.max(0, Math.floor(srcX - lobes))
      const endX = Math.min(srcWidth - 1, Math.ceil(srcX + lobes))
      const startY = Math.max(0, Math.floor(srcY - lobes))
      const endY = Math.min(srcHeight - 1, Math.ceil(srcY + lobes))

      for (let sy = startY; sy <= endY; sy++) {
        for (let sx = startX; sx <= endX; sx++) {
          const xWeight = lanczos(sx - srcX)
          const yWeight = lanczos(sy - srcY)
          const weight = xWeight * yWeight

          const idx = (sy * srcWidth + sx) * 4
          r += srcData[idx] * weight
          g += srcData[idx + 1] * weight
          b += srcData[idx + 2] * weight
          totalWeight += weight
        }
      }

      const outIdx = (y * targetWidth + x) * 4
      if (totalWeight > 0) {
        output[outIdx] = Math.max(0, Math.min(255, r / totalWeight))
        output[outIdx + 1] = Math.max(0, Math.min(255, g / totalWeight))
        output[outIdx + 2] = Math.max(0, Math.min(255, b / totalWeight))
      }
      output[outIdx + 3] = 255 // Alpha
    }
  }

  return new ImageData(output, targetWidth, targetHeight)
}

/**
 * Sobel edge detection - returns edge strength map (0-255)
 */
export function sobelEdgeDetection(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData
  const edges = new Uint8Array(width * height)

  // Sobel kernels
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]

          gx += gray * sobelX[ky + 1][kx + 1]
          gy += gray * sobelY[ky + 1][kx + 1]
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edges[y * width + x] = Math.min(255, magnitude)
    }
  }

  return edges
}

/**
 * Apply 3×3 majority filter to remove single-pixel noise
 * Only affects non-edge pixels
 */
export function majorityFilter(
  imageData: ImageData,
  edgeMask: Uint8Array,
  edgeThreshold: number = 30
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x

      // Skip if this is an edge pixel
      if (edgeMask[idx] > edgeThreshold) continue

      // Count color occurrences in 3×3 neighborhood
      const colorCounts = new Map<string, { count: number; rgb: [number, number, number] }>()

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nidx = ((y + ky) * width + (x + kx)) * 4
          const r = data[nidx]
          const g = data[nidx + 1]
          const b = data[nidx + 2]
          const key = `${r},${g},${b}`

          const existing = colorCounts.get(key)
          if (existing) {
            existing.count++
          } else {
            colorCounts.set(key, { count: 1, rgb: [r, g, b] })
          }
        }
      }

      // Find majority color
      let maxCount = 0
      let majorityColor: [number, number, number] = [data[idx * 4], data[idx * 4 + 1], data[idx * 4 + 2]]

      colorCounts.forEach((info) => {
        if (info.count > maxCount) {
          maxCount = info.count
          majorityColor = info.rgb
        }
      })

      // Apply majority color if different from current
      const dataIdx = idx * 4
      output[dataIdx] = majorityColor[0]
      output[dataIdx + 1] = majorityColor[1]
      output[dataIdx + 2] = majorityColor[2]
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Detect dominant background color via border sampling
 */
export function detectBackgroundColor(imageData: ImageData): RGB {
  const { width, height, data } = imageData
  const borderPixels: RGB[] = []

  // Sample top and bottom borders
  for (let x = 0; x < width; x++) {
    // Top border
    const topIdx = x * 4
    borderPixels.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] })

    // Bottom border
    const bottomIdx = ((height - 1) * width + x) * 4
    borderPixels.push({ r: data[bottomIdx], g: data[bottomIdx + 1], b: data[bottomIdx + 2] })
  }

  // Sample left and right borders (excluding corners to avoid double-counting)
  for (let y = 1; y < height - 1; y++) {
    // Left border
    const leftIdx = (y * width) * 4
    borderPixels.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] })

    // Right border
    const rightIdx = (y * width + (width - 1)) * 4
    borderPixels.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] })
  }

  // Cluster border colors and find most common
  const colorCounts = new Map<string, { count: number; rgb: RGB }>()

  borderPixels.forEach((rgb) => {
    // Quantize to reduce noise (round to nearest 16)
    const qr = Math.round(rgb.r / 16) * 16
    const qg = Math.round(rgb.g / 16) * 16
    const qb = Math.round(rgb.b / 16) * 16
    const key = `${qr},${qg},${qb}`

    const existing = colorCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      colorCounts.set(key, { count: 1, rgb: { r: qr, g: qg, b: qb } })
    }
  })

  // Find most common color
  let maxCount = 0
  let bgColor: RGB = { r: 255, g: 255, b: 255 } // Default to white

  colorCounts.forEach((info) => {
    if (info.count > maxCount) {
      maxCount = info.count
      bgColor = info.rgb
    }
  })

  return bgColor
}

/**
 * Blend edges back into quantized image for crisp details
 */
export function blendEdges(
  quantizedData: ImageData,
  originalData: ImageData,
  edgeMask: Uint8Array,
  edgeStrength: number = 0.5
): ImageData {
  const { width, height, data: quantData } = quantizedData
  const { data: origData } = originalData
  const output = new Uint8ClampedArray(quantData)

  for (let i = 0; i < width * height; i++) {
    const edgeValue = edgeMask[i] / 255 // Normalize 0-1
    const blend = edgeValue * edgeStrength

    const idx = i * 4
    output[idx] = quantData[idx] * (1 - blend) + origData[idx] * blend
    output[idx + 1] = quantData[idx + 1] * (1 - blend) + origData[idx + 1] * blend
    output[idx + 2] = quantData[idx + 2] * (1 - blend) + origData[idx + 2] * blend
  }

  return new ImageData(output, width, height)
}

/**
 * K-Means clustering for foreground/background segmentation
 * Returns a binary mask (0 = background, 255 = foreground)
 */
export function kMeansSegmentation(imageData: ImageData, k: number = 2): Uint8Array {
  const { width, height, data } = imageData
  const pixels: LAB[] = []

  // Convert all pixels to LAB
  for (let i = 0; i < data.length; i += 4) {
    const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
    pixels.push(rgbToLab(rgb))
  }

  // Sample border pixels to initialize background cluster
  const borderSamples: LAB[] = []
  const borderThickness = 5

  // Top and bottom borders
  for (let y = 0; y < borderThickness; y++) {
    for (let x = 0; x < width; x++) {
      borderSamples.push(pixels[y * width + x])
      borderSamples.push(pixels[(height - 1 - y) * width + x])
    }
  }

  // Left and right borders
  for (let y = borderThickness; y < height - borderThickness; y++) {
    for (let x = 0; x < borderThickness; x++) {
      borderSamples.push(pixels[y * width + x])
      borderSamples.push(pixels[y * width + (width - 1 - x)])
    }
  }

  // Initialize centroids: background = mean of border, foreground = mean of center
  let bgCentroid = { l: 0, a: 0, b: 0 }
  borderSamples.forEach(lab => {
    bgCentroid.l += lab.l
    bgCentroid.a += lab.a
    bgCentroid.b += lab.b
  })
  bgCentroid.l /= borderSamples.length
  bgCentroid.a /= borderSamples.length
  bgCentroid.b /= borderSamples.length

  // Center region for foreground
  const centerSamples: LAB[] = []
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  const radius = Math.min(width, height) / 4

  for (let y = cy - radius; y < cy + radius; y++) {
    for (let x = cx - radius; x < cx + radius; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        centerSamples.push(pixels[y * width + x])
      }
    }
  }

  let fgCentroid = { l: 0, a: 0, b: 0 }
  centerSamples.forEach(lab => {
    fgCentroid.l += lab.l
    fgCentroid.a += lab.a
    fgCentroid.b += lab.b
  })
  fgCentroid.l /= centerSamples.length
  fgCentroid.a /= centerSamples.length
  fgCentroid.b /= centerSamples.length

  const centroids = [bgCentroid, fgCentroid]

  // K-means iterations
  const maxIterations = 10
  const assignments = new Uint8Array(pixels.length)

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assignment step
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i]
      let minDist = Infinity
      let cluster = 0

      centroids.forEach((centroid, idx) => {
        const dl = pixel.l - centroid.l
        const da = pixel.a - centroid.a
        const db = pixel.b - centroid.b
        const dist = Math.sqrt(dl * dl + da * da + db * db)

        if (dist < minDist) {
          minDist = dist
          cluster = idx
        }
      })

      assignments[i] = cluster
    }

    // Update step
    const counts = [0, 0]
    const sums = [
      { l: 0, a: 0, b: 0 },
      { l: 0, a: 0, b: 0 }
    ]

    for (let i = 0; i < pixels.length; i++) {
      const cluster = assignments[i]
      counts[cluster]++
      sums[cluster].l += pixels[i].l
      sums[cluster].a += pixels[i].a
      sums[cluster].b += pixels[i].b
    }

    centroids.forEach((centroid, idx) => {
      if (counts[idx] > 0) {
        centroid.l = sums[idx].l / counts[idx]
        centroid.a = sums[idx].a / counts[idx]
        centroid.b = sums[idx].b / counts[idx]
      }
    })
  }

  // Convert assignments to mask (0 = background, 255 = foreground)
  const mask = new Uint8Array(pixels.length)
  for (let i = 0; i < pixels.length; i++) {
    mask[i] = assignments[i] === 1 ? 255 : 0
  }

  return mask
}

/**
 * Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
 * Enhances local contrast without amplifying noise
 */
export function applyCLAHE(
  imageData: ImageData,
  clipLimit: number = 2.0,
  tileSize: number = 8
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Process only L channel in LAB space
  const lChannel = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const rgb = { r: data[idx], g: data[idx + 1], b: data[idx + 2] }
    lChannel[i] = rgbToLab(rgb).l
  }

  // Calculate tile dimensions
  const tilesX = Math.ceil(width / tileSize)
  const tilesY = Math.ceil(height / tileSize)

  // Process each tile
  const histograms: number[][][] = []

  for (let ty = 0; ty < tilesY; ty++) {
    histograms[ty] = []
    for (let tx = 0; tx < tilesX; tx++) {
      const hist = new Array(256).fill(0)

      // Build histogram for this tile
      const x0 = tx * tileSize
      const y0 = ty * tileSize
      const x1 = Math.min(x0 + tileSize, width)
      const y1 = Math.min(y0 + tileSize, height)

      let pixelCount = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const l = lChannel[y * width + x]
          const bin = Math.min(255, Math.max(0, Math.floor(l * 2.55)))
          hist[bin]++
          pixelCount++
        }
      }

      // Clip histogram
      const clipValue = Math.floor(clipLimit * pixelCount / 256)
      let excess = 0
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipValue) {
          excess += hist[i] - clipValue
          hist[i] = clipValue
        }
      }

      // Redistribute excess
      const increment = excess / 256
      for (let i = 0; i < 256; i++) {
        hist[i] += increment
      }

      // Create CDF
      const cdf = new Array(256)
      cdf[0] = hist[0]
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i]
      }

      // Normalize CDF
      const scale = 100 / (cdf[255] || 1)
      for (let i = 0; i < 256; i++) {
        cdf[i] *= scale
      }

      histograms[ty][tx] = cdf
    }
  }

  // Apply equalization with bilinear interpolation between tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const l = lChannel[idx]
      const bin = Math.min(255, Math.max(0, Math.floor(l * 2.55)))

      // Find which tile this pixel belongs to
      const tx = Math.min(tilesX - 1, Math.floor(x / tileSize))
      const ty = Math.min(tilesY - 1, Math.floor(y / tileSize))

      // Simple lookup (could add bilinear interpolation for smoother results)
      const newL = histograms[ty][tx][bin]

      // Convert back to RGB
      const rgbOrig = { r: data[idx * 4], g: data[idx * 4 + 1], b: data[idx * 4 + 2] }
      const lab = rgbToLab(rgbOrig)
      lab.l = newL

      const newRgb = labToRgb(lab)
      output[idx * 4] = newRgb.r
      output[idx * 4 + 1] = newRgb.g
      output[idx * 4 + 2] = newRgb.b
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Apply different tone curves to foreground and background
 */
export function applySegmentedToneCurves(
  imageData: ImageData,
  mask: Uint8Array,
  brightenFg: number = 1.15,
  desaturateBg: number = 0.7
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const isForeground = mask[i] > 127

    const rgb = { r: data[idx], g: data[idx + 1], b: data[idx + 2] }
    const lab = rgbToLab(rgb)

    if (isForeground) {
      // Brighten subject
      lab.l = Math.min(100, lab.l * brightenFg)
    } else {
      // Desaturate background
      lab.a *= desaturateBg
      lab.b *= desaturateBg
    }

    const newRgb = labToRgb(lab)
    output[idx] = newRgb.r
    output[idx + 1] = newRgb.g
    output[idx + 2] = newRgb.b
  }

  return new ImageData(output, width, height)
}

/**
 * Histogram-aware quantization with target percentage enforcement
 * Supports both over-use penalties (push away from saturated colors)
 * and under-use bonuses (favor colors below target to prevent collapse)
 */
export function quantizeWithTargetPercentages(
  imageData: ImageData,
  palette: RGB[],
  targetPercentages: number[],
  mask: Uint8Array,
  tolerance: number = 15,
  underUsePenalty: number = 5, // Negative penalty (bonus) for under-used colors
  minColorPercent: number = 3 // Floor: no color drops below this %
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)
  const totalPixels = width * height

  // Initialize counters
  const currentCounts = new Array(palette.length).fill(0)
  const assignments = new Int16Array(totalPixels).fill(-1)

  // Convert to LAB for all pixels
  const labPixels: LAB[] = []
  for (let i = 0; i < data.length; i += 4) {
    labPixels.push(rgbToLab({ r: data[i], g: data[i + 1], b: data[i + 2] }))
  }

  const paletteLab = palette.map(rgbToLab)

  // Multi-pass assignment with histogram balancing
  const maxPasses = 3

  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = 0; i < totalPixels; i++) {
      if (assignments[i] >= 0 && pass < maxPasses - 1) continue // Skip already assigned

      const pixelLab = labPixels[i]
      let bestIdx = -1
      let bestScore = Infinity

      for (let p = 0; p < palette.length; p++) {
        // Calculate Delta E
        const deltaE = deltaE2000(pixelLab, paletteLab[p])

        // Calculate penalty/bonus based on target deviation
        const currentPercent = (currentCounts[p] / totalPixels) * 100
        const deviation = currentPercent - targetPercentages[p]

        let penalty = 0

        // FLOOR ENFORCEMENT: If color is below minColorPercent, apply GENTLE bonus
        if (currentPercent < minColorPercent) {
          // Gentle bonus (negative penalty) - 10x gentler to prevent forcing unwanted colors
          penalty = (minColorPercent - currentPercent) * -5
        } else if (deviation > tolerance) {
          // Over target: Moderate penalty to push pixels away
          // Reduced from 25 to 10 for gentler balancing (was too aggressive)
          penalty = deviation * 10
        } else if (deviation < -tolerance) {
          // Under target: negative penalty (bonus) to favor this color
          // This prevents midtones from collapsing to a single color
          penalty = deviation * underUsePenalty // Will be negative, reducing score
        }

        const score = deltaE + penalty

        if (score < bestScore) {
          bestScore = score
          bestIdx = p
        }
      }

      // Update assignment
      if (assignments[i] >= 0) {
        currentCounts[assignments[i]]--
      }
      assignments[i] = bestIdx
      currentCounts[bestIdx]++
    }
  }

  // Apply assignments
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4
    const colorIdx = assignments[i]
    const color = palette[colorIdx]

    output[idx] = color.r
    output[idx + 1] = color.g
    output[idx + 2] = color.b
  }

  return new ImageData(output, width, height)
}

/**
 * Apply stochastic dither to flat regions (prevents banding in cheeks, sky)
 * Adds tiny random LAB variation only where gradients are low
 */
export function applyStochasticDither(
  imageData: ImageData,
  edgeMask: Uint8Array,
  ditherAmount: number = 3,
  edgeThreshold: number = 30
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  for (let i = 0; i < edgeMask.length; i++) {
    // Skip edges (high gradient areas)
    if (edgeMask[i] > edgeThreshold) continue

    const idx = i * 4
    const rgb = { r: data[idx], g: data[idx + 1], b: data[idx + 2] }
    const lab = rgbToLab(rgb)

    // Add small random offset in LAB space
    const randomOffset = () => (Math.random() - 0.5) * ditherAmount * 2
    lab.l = Math.max(0, Math.min(100, lab.l + randomOffset()))
    lab.a = lab.a + randomOffset()
    lab.b = lab.b + randomOffset()

    const dithered = labToRgb(lab)
    output[idx] = Math.max(0, Math.min(255, dithered.r))
    output[idx + 1] = Math.max(0, Math.min(255, dithered.g))
    output[idx + 2] = Math.max(0, Math.min(255, dithered.b))
    output[idx + 3] = 255
  }

  return new ImageData(output, width, height)
}

/**
 * Mask-aware unsharp mask (only sharpens foreground to preserve face detail)
 */
export function maskAwareUnsharpMask(
  imageData: ImageData,
  segmentationMask: Uint8Array,
  amount: number = 1.0,
  radius: number = 1,
  threshold: number = 0
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Create blurred version using simple box blur
  const blurred = new Uint8ClampedArray(data)
  const kernelSize = Math.floor(radius) * 2 + 1
  const halfKernel = Math.floor(kernelSize / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x

      // Only sharpen foreground pixels
      if (segmentationMask[pixelIdx] < 127) {
        continue
      }

      const idx = pixelIdx * 4

      let rSum = 0, gSum = 0, bSum = 0, count = 0

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const ny = Math.min(Math.max(y + ky, 0), height - 1)
          const nx = Math.min(Math.max(x + kx, 0), width - 1)
          const nIdx = (ny * width + nx) * 4

          rSum += data[nIdx]
          gSum += data[nIdx + 1]
          bSum += data[nIdx + 2]
          count++
        }
      }

      blurred[idx] = rSum / count
      blurred[idx + 1] = gSum / count
      blurred[idx + 2] = bSum / count
    }
  }

  // Apply unsharp mask
  for (let i = 0; i < data.length; i += 4) {
    const pixelIdx = Math.floor(i / 4)

    // Only sharpen foreground
    if (segmentationMask[pixelIdx] < 127) {
      output[i] = data[i]
      output[i + 1] = data[i + 1]
      output[i + 2] = data[i + 2]
      output[i + 3] = 255
      continue
    }

    for (let c = 0; c < 3; c++) {
      const original = data[i + c]
      const blur = blurred[i + c]
      const diff = original - blur

      if (Math.abs(diff) > threshold) {
        output[i + c] = Math.max(0, Math.min(255, original + diff * amount))
      } else {
        output[i + c] = original
      }
    }
    output[i + 3] = 255
  }

  return new ImageData(output, width, height)
}

/**
 * Blend thin dark outline back at strong edges (enhances jawline, eyes, seams)
 */
export function enhanceEdgeDetail(
  imageData: ImageData,
  edgeMask: Uint8Array,
  percentile: number = 85,
  blendStrength: number = 0.4
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Calculate percentile threshold
  const sortedEdges = Array.from(edgeMask).sort((a, b) => a - b)
  const thresholdIdx = Math.floor((percentile / 100) * sortedEdges.length)
  const edgeThreshold = sortedEdges[thresholdIdx]

  for (let i = 0; i < edgeMask.length; i++) {
    const idx = i * 4

    if (edgeMask[i] > edgeThreshold) {
      // Strong edge: darken slightly in LAB space
      const rgb = { r: data[idx], g: data[idx + 1], b: data[idx + 2] }
      const lab = rgbToLab(rgb)

      // Darken L channel and increase saturation slightly
      lab.l = Math.max(0, lab.l - 10 * blendStrength)
      lab.a *= (1 + 0.2 * blendStrength)
      lab.b *= (1 + 0.2 * blendStrength)

      const enhanced = labToRgb(lab)
      output[idx] = Math.max(0, Math.min(255, enhanced.r))
      output[idx + 1] = Math.max(0, Math.min(255, enhanced.g))
      output[idx + 2] = Math.max(0, Math.min(255, enhanced.b))
    } else {
      output[idx] = data[idx]
      output[idx + 1] = data[idx + 1]
      output[idx + 2] = data[idx + 2]
    }
    output[idx + 3] = 255
  }

  return new ImageData(output, width, height)
}

/**
 * Edge-preserving error diffusion with mask awareness
 */
export function errorDiffusionWithMask(
  imageData: ImageData,
  palette: RGB[],
  mask: Uint8Array,
  strength: number = 0.5
): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Error buffers
  const errorR = new Float32Array(width * height)
  const errorG = new Float32Array(width * height)
  const errorB = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const pixelIdx = y * width + x

      // Add accumulated error
      let r = data[idx] + errorR[pixelIdx]
      let g = data[idx + 1] + errorG[pixelIdx]
      let b = data[idx + 2] + errorB[pixelIdx]

      r = Math.max(0, Math.min(255, r))
      g = Math.max(0, Math.min(255, g))
      b = Math.max(0, Math.min(255, b))

      // Find closest palette color
      const closest = findClosestColorLAB({ r, g, b }, palette)

      output[idx] = closest.color.r
      output[idx + 1] = closest.color.g
      output[idx + 2] = closest.color.b

      // Calculate error
      const errR = (r - closest.color.r) * strength
      const errG = (g - closest.color.g) * strength
      const errB = (b - closest.color.b) * strength

      // Distribute error only within same mask region
      const currentMask = mask[pixelIdx] > 127

      // Floyd-Steinberg kernel
      const distribute = [
        { dx: 1, dy: 0, weight: 7 / 16 },
        { dx: -1, dy: 1, weight: 3 / 16 },
        { dx: 0, dy: 1, weight: 5 / 16 },
        { dx: 1, dy: 1, weight: 1 / 16 }
      ]

      distribute.forEach(({ dx, dy, weight }) => {
        const nx = x + dx
        const ny = y + dy

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborIdx = ny * width + nx
          const neighborMask = mask[neighborIdx] > 127

          // Only diffuse within same region
          if (neighborMask === currentMask) {
            errorR[neighborIdx] += errR * weight
            errorG[neighborIdx] += errG * weight
            errorB[neighborIdx] += errB * weight
          }
        }
      })
    }
  }

  return new ImageData(output, width, height)
}
