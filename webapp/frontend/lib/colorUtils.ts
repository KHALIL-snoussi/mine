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
