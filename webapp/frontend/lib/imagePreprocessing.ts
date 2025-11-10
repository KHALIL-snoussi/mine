/**
 * Professional Image Preprocessing for Commercial-Quality Output
 *
 * Provides automatic image enhancement to rival commercial platforms:
 * - Intelligent upscaling for low-resolution images
 * - Automatic white balance correction
 * - CLAHE (Contrast Limited Adaptive Histogram Equalization)
 * - Smart sharpening with edge detection
 * - Noise reduction while preserving detail
 */

export interface PreprocessingOptions {
  minResolution?: number // Minimum recommended resolution (default: 1500px)
  targetDPI?: number // Target DPI for output (default: 300)
  autoWhiteBalance?: boolean // Apply white balance correction (default: true)
  autoContrast?: boolean // Apply CLAHE for better contrast (default: true)
  autoSharpen?: boolean // Apply intelligent sharpening (default: true)
  upscaleIfNeeded?: boolean // Upscale small images (default: true)
  noiseReduction?: boolean // Apply bilateral filtering (default: true)
}

export interface PreprocessingResult {
  processedImage: ImageData
  wasUpscaled: boolean
  originalSize: { width: number; height: number }
  finalSize: { width: number; height: number }
  appliedEnhancements: string[]
}

/**
 * Comprehensive image preprocessing pipeline
 */
export async function preprocessImage(
  imageData: ImageData,
  options: PreprocessingOptions = {}
): Promise<PreprocessingResult> {
  const {
    minResolution = 1500,
    targetDPI = 300,
    autoWhiteBalance = true,
    autoContrast = true,
    autoSharpen = true,
    upscaleIfNeeded = true,
    noiseReduction = true
  } = options

  const originalSize = { width: imageData.width, height: imageData.height }
  const appliedEnhancements: string[] = []
  let processed = imageData

  // Step 1: Intelligent upscaling if image is too small
  let wasUpscaled = false
  if (upscaleIfNeeded) {
    const maxDim = Math.max(originalSize.width, originalSize.height)
    if (maxDim < minResolution) {
      const scaleFactor = Math.ceil(minResolution / maxDim)
      processed = await intelligentUpscale(processed, scaleFactor)
      wasUpscaled = true
      appliedEnhancements.push(`Upscaled ${scaleFactor}x (${maxDim}px → ${Math.max(processed.width, processed.height)}px)`)
    }
  }

  // Step 2: Noise reduction (bilateral filter)
  if (noiseReduction) {
    processed = applyBilateralFilter(processed, 3, 50)
    appliedEnhancements.push('Noise reduction')
  }

  // Step 3: Auto white balance
  if (autoWhiteBalance) {
    const balanced = autoWhiteBalance_GrayWorld(processed)
    if (balanced.adjusted) {
      processed = balanced.image
      appliedEnhancements.push('White balance correction')
    }
  }

  // Step 4: CLAHE for contrast enhancement
  if (autoContrast) {
    processed = applyCLAHE(processed, 2.0, 16)
    appliedEnhancements.push('Adaptive contrast enhancement (CLAHE)')
  }

  // Step 5: Intelligent sharpening
  if (autoSharpen) {
    processed = applyAdaptiveSharpening(processed, 1.0, 1.5)
    appliedEnhancements.push('Adaptive sharpening')
  }

  return {
    processedImage: processed,
    wasUpscaled,
    originalSize,
    finalSize: { width: processed.width, height: processed.height },
    appliedEnhancements
  }
}

/**
 * Intelligent upscaling using Lanczos-3 interpolation
 * Superior to bicubic for preserving edges and details
 */
async function intelligentUpscale(imageData: ImageData, scaleFactor: number): Promise<ImageData> {
  const { width, height, data } = imageData
  const newWidth = width * scaleFactor
  const newHeight = height * scaleFactor

  // Use Lanczos-3 resampling for high-quality upscaling
  return lanczosResample(imageData, newWidth, newHeight, 3)
}

/**
 * Lanczos-3 resampling (high-quality resize)
 */
function lanczosResample(imageData: ImageData, newWidth: number, newHeight: number, a: number = 3): ImageData {
  const { width, height, data } = imageData
  const output = new ImageData(newWidth, newHeight)
  const scaleX = width / newWidth
  const scaleY = height / newHeight

  // Lanczos kernel
  const lanczos = (x: number): number => {
    if (x === 0) return 1
    if (x < -a || x > a) return 0
    const piX = Math.PI * x
    return (a * Math.sin(piX) * Math.sin(piX / a)) / (piX * piX)
  }

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = x * scaleX
      const srcY = y * scaleY

      let r = 0, g = 0, b = 0, alpha = 0, weightSum = 0

      // Sample neighborhood
      for (let sy = Math.floor(srcY) - a + 1; sy <= Math.floor(srcY) + a; sy++) {
        for (let sx = Math.floor(srcX) - a + 1; sx <= Math.floor(srcX) + a; sx++) {
          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const weight = lanczos(srcX - sx) * lanczos(srcY - sy)
            const idx = (sy * width + sx) * 4

            r += data[idx] * weight
            g += data[idx + 1] * weight
            b += data[idx + 2] * weight
            alpha += data[idx + 3] * weight
            weightSum += weight
          }
        }
      }

      const outIdx = (y * newWidth + x) * 4
      output.data[outIdx] = Math.round(r / weightSum)
      output.data[outIdx + 1] = Math.round(g / weightSum)
      output.data[outIdx + 2] = Math.round(b / weightSum)
      output.data[outIdx + 3] = Math.round(alpha / weightSum)
    }
  }

  return output
}

/**
 * Automatic white balance using Gray World algorithm
 */
function autoWhiteBalance_GrayWorld(imageData: ImageData): { image: ImageData; adjusted: boolean } {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Calculate average RGB values
  let avgR = 0, avgG = 0, avgB = 0
  const totalPixels = width * height

  for (let i = 0; i < data.length; i += 4) {
    avgR += data[i]
    avgG += data[i + 1]
    avgB += data[i + 2]
  }

  avgR /= totalPixels
  avgG /= totalPixels
  avgB /= totalPixels

  // Calculate gray reference (average of averages)
  const gray = (avgR + avgG + avgB) / 3

  // Calculate correction factors
  const factorR = gray / avgR
  const factorG = gray / avgG
  const factorB = gray / avgB

  // Only apply if there's significant imbalance (>5% deviation)
  const maxDeviation = Math.max(
    Math.abs(factorR - 1),
    Math.abs(factorG - 1),
    Math.abs(factorB - 1)
  )

  if (maxDeviation < 0.05) {
    return { image: imageData, adjusted: false }
  }

  // Apply correction
  for (let i = 0; i < data.length; i += 4) {
    output[i] = Math.min(255, Math.max(0, data[i] * factorR))
    output[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factorG))
    output[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factorB))
    output[i + 3] = data[i + 3]
  }

  return { image: new ImageData(output, width, height), adjusted: true }
}

/**
 * CLAHE (Contrast Limited Adaptive Histogram Equalization)
 * Superior to global histogram equalization for local contrast
 */
function applyCLAHE(imageData: ImageData, clipLimit: number = 2.0, tileSize: number = 16): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Convert to LAB color space (apply CLAHE only to L channel)
  const labData = new Float32Array(width * height * 3)

  // RGB to LAB conversion
  for (let i = 0; i < data.length; i += 4) {
    const idx = (i / 4) * 3
    const lab = rgbToLab(data[i], data[i + 1], data[i + 2])
    labData[idx] = lab.l
    labData[idx + 1] = lab.a
    labData[idx + 2] = lab.b
  }

  // Apply CLAHE to L channel
  const tilesX = Math.ceil(width / tileSize)
  const tilesY = Math.ceil(height / tileSize)

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * tileSize
      const y0 = ty * tileSize
      const x1 = Math.min(x0 + tileSize, width)
      const y1 = Math.min(y0 + tileSize, height)

      // Build histogram for this tile
      const hist = new Array(256).fill(0)
      let tilePixels = 0

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * width + x) * 3
          const lValue = Math.round(labData[idx] * 255 / 100)
          hist[Math.min(255, Math.max(0, lValue))]++
          tilePixels++
        }
      }

      // Clip histogram
      const clipValue = Math.round(clipLimit * tilePixels / 256)
      let excess = 0
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipValue) {
          excess += hist[i] - clipValue
          hist[i] = clipValue
        }
      }

      // Redistribute excess
      const redistributePerBin = Math.floor(excess / 256)
      for (let i = 0; i < 256; i++) {
        hist[i] += redistributePerBin
      }

      // Calculate CDF
      const cdf = new Array(256)
      cdf[0] = hist[0]
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i]
      }

      // Normalize CDF
      const cdfMin = cdf.find(v => v > 0) || 0
      const cdfMax = cdf[255]

      // Apply equalization to tile
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * width + x) * 3
          const lValue = Math.round(labData[idx] * 255 / 100)
          const clampedL = Math.min(255, Math.max(0, lValue))
          const newL = ((cdf[clampedL] - cdfMin) / (cdfMax - cdfMin)) * 100
          labData[idx] = newL
        }
      }
    }
  }

  // Convert back to RGB
  for (let i = 0; i < data.length; i += 4) {
    const idx = (i / 4) * 3
    const rgb = labToRgb(labData[idx], labData[idx + 1], labData[idx + 2])
    output[i] = rgb.r
    output[i + 1] = rgb.g
    output[i + 2] = rgb.b
    output[i + 3] = data[i + 3]
  }

  return new ImageData(output, width, height)
}

/**
 * Adaptive sharpening with edge detection
 * Sharpens details without over-sharpening smooth areas
 */
function applyAdaptiveSharpening(imageData: ImageData, amount: number = 1.0, radius: number = 1.5): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)

  // Detect edges using Sobel
  const edgeMask = sobelEdgeDetection(imageData)

  // Apply unsharp mask with edge-adaptive strength
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const edgeStrength = edgeMask[y * width + x] / 255

      // Stronger sharpening on edges, gentler on smooth areas
      const localAmount = amount * (0.3 + 0.7 * edgeStrength)

      // Calculate blurred value (simple 3x3 average)
      let blurR = 0, blurG = 0, blurB = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4
          blurR += data[nIdx]
          blurG += data[nIdx + 1]
          blurB += data[nIdx + 2]
        }
      }
      blurR /= 9
      blurG /= 9
      blurB /= 9

      // Unsharp mask: original + amount * (original - blurred)
      output[idx] = Math.min(255, Math.max(0, data[idx] + localAmount * (data[idx] - blurR)))
      output[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + localAmount * (data[idx + 1] - blurG)))
      output[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + localAmount * (data[idx + 2] - blurB)))
      output[idx + 3] = data[idx + 3]
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Sobel edge detection
 */
function sobelEdgeDetection(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData
  const edges = new Uint8Array(width * height)

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          const ki = (ky + 1) * 3 + (kx + 1)

          gx += gray * sobelX[ki]
          gy += gray * sobelY[ki]
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edges[y * width + x] = Math.min(255, magnitude)
    }
  }

  return edges
}

/**
 * Bilateral filter for noise reduction while preserving edges
 */
function applyBilateralFilter(imageData: ImageData, sigma_space: number = 3, sigma_color: number = 50): ImageData {
  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)
  const windowSize = Math.ceil(sigma_space * 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0

      const centerR = data[idx]
      const centerG = data[idx + 1]
      const centerB = data[idx + 2]

      for (let dy = -windowSize; dy <= windowSize; dy++) {
        for (let dx = -windowSize; dx <= windowSize; dx++) {
          const ny = y + dy
          const nx = x + dx

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = (ny * width + nx) * 4

            // Spatial weight (Gaussian based on distance)
            const spatialDist = dx * dx + dy * dy
            const spatialWeight = Math.exp(-spatialDist / (2 * sigma_space * sigma_space))

            // Color weight (Gaussian based on color difference)
            const colorDiff = Math.sqrt(
              Math.pow(data[nIdx] - centerR, 2) +
              Math.pow(data[nIdx + 1] - centerG, 2) +
              Math.pow(data[nIdx + 2] - centerB, 2)
            )
            const colorWeight = Math.exp(-colorDiff / (2 * sigma_color * sigma_color))

            const weight = spatialWeight * colorWeight

            sumR += data[nIdx] * weight
            sumG += data[nIdx + 1] * weight
            sumB += data[nIdx + 2] * weight
            sumWeight += weight
          }
        }
      }

      output[idx] = Math.round(sumR / sumWeight)
      output[idx + 1] = Math.round(sumG / sumWeight)
      output[idx + 2] = Math.round(sumB / sumWeight)
      output[idx + 3] = data[idx + 3]
    }
  }

  return new ImageData(output, width, height)
}

/**
 * RGB to LAB conversion
 */
function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // Normalize RGB to 0-1
  let rNorm = r / 255
  let gNorm = g / 255
  let bNorm = b / 255

  // Apply gamma correction
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92

  // Convert to XYZ
  const x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375
  const y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750
  const z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041

  // Normalize for D65 illuminant
  const xn = x / 0.95047
  const yn = y / 1.00000
  const zn = z / 1.08883

  // Convert to LAB
  const fx = xn > 0.008856 ? Math.pow(xn, 1/3) : (7.787 * xn + 16/116)
  const fy = yn > 0.008856 ? Math.pow(yn, 1/3) : (7.787 * yn + 16/116)
  const fz = zn > 0.008856 ? Math.pow(zn, 1/3) : (7.787 * zn + 16/116)

  const l = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bVal = 200 * (fy - fz)

  return { l, a, b: bVal }
}

/**
 * LAB to RGB conversion
 */
function labToRgb(l: number, a: number, b: number): { r: number; g: number; b: number } {
  // LAB to XYZ
  const fy = (l + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200

  const xr = fx > 0.206897 ? Math.pow(fx, 3) : (fx - 16/116) / 7.787
  const yr = fy > 0.206897 ? Math.pow(fy, 3) : (fy - 16/116) / 7.787
  const zr = fz > 0.206897 ? Math.pow(fz, 3) : (fz - 16/116) / 7.787

  const x = xr * 0.95047
  const y = yr * 1.00000
  const z = zr * 1.08883

  // XYZ to RGB
  let r = x *  3.2404542 + y * -1.5371385 + z * -0.4985314
  let g = x * -0.9692660 + y *  1.8760108 + z *  0.0415560
  let bVal = x *  0.0556434 + y * -0.2040259 + z *  1.0572252

  // Apply inverse gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g
  bVal = bVal > 0.0031308 ? 1.055 * Math.pow(bVal, 1/2.4) - 0.055 : 12.92 * bVal

  return {
    r: Math.round(Math.min(255, Math.max(0, r * 255))),
    g: Math.round(Math.min(255, Math.max(0, g * 255))),
    b: Math.round(Math.min(255, Math.max(0, bVal * 255)))
  }
}

export {
  preprocessImage,
  intelligentUpscale,
  autoWhiteBalance_GrayWorld,
  applyCLAHE,
  applyAdaptiveSharpening,
  applyBilateralFilter,
  sobelEdgeDetection,
  rgbToLab,
  labToRgb
}
