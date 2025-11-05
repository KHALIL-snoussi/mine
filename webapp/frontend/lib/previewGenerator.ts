/**
 * Paint-by-Numbers Preview Generator
 * Creates a simulated preview of what the paint-by-numbers template will look like
 */

export interface Palette {
  name: string
  colors: number[][]
}

/**
 * Generate a paint-by-numbers preview from an image
 * @param imageUrl - Data URL or URL of the original image
 * @param palette - Color palette to use for the preview
 * @returns Promise<string> - Data URL of the preview image
 */
export async function generatePaintPreview(
  imageUrl: string,
  palette: Palette
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!imageUrl) {
      reject(new Error('No image provided'))
      return
    }

    if (!palette || !palette.colors || palette.colors.length === 0) {
      reject(new Error('Invalid palette'))
      return
    }

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Preview generation timed out'))
    }, 30000) // 30 second timeout

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        clearTimeout(timeout)

        // Create canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Set canvas size (scale down for performance)
        // Limit to 600px for better performance
        const maxSize = 600
        let width = img.width
        let height = img.height

        if (width > height && width > maxSize) {
          height = Math.floor((height / width) * maxSize)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.floor((width / height) * maxSize)
          height = maxSize
        }

        canvas.width = width
        canvas.height = height

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height)

        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        // Apply paint-by-numbers effect
        applyPaintEffect(data, palette.colors, width, height)

        // Put modified image data back
        ctx.putImageData(imageData, 0, 0)

        // Add subtle edge effect to simulate regions
        addEdgeEffect(ctx, width, height)

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

        // Cleanup
        canvas.width = 0
        canvas.height = 0

        resolve(dataUrl)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Failed to load image'))
    }

    img.src = imageUrl
  })
}

/**
 * Apply paint-by-numbers color quantization effect
 */
function applyPaintEffect(
  data: Uint8ClampedArray,
  paletteColors: number[][],
  width: number,
  height: number
) {
  // Apply slight blur for smoother regions (simulates paint blending)
  const blurRadius = 2
  const blurred = applyBoxBlur(data, width, height, blurRadius)

  // Quantize colors to palette
  for (let i = 0; i < blurred.length; i += 4) {
    const r = blurred[i]
    const g = blurred[i + 1]
    const b = blurred[i + 2]

    // Find closest palette color
    const closest = findClosestColor([r, g, b], paletteColors)

    data[i] = closest[0]
    data[i + 1] = closest[1]
    data[i + 2] = closest[2]
    // Alpha stays the same (data[i + 3])
  }
}

/**
 * Find the closest color in the palette
 */
function findClosestColor(
  color: number[],
  palette: number[][]
): number[] {
  let minDistance = Infinity
  let closestColor = palette[0]

  for (const paletteColor of palette) {
    const distance = colorDistance(color, paletteColor)
    if (distance < minDistance) {
      minDistance = distance
      closestColor = paletteColor
    }
  }

  return closestColor
}

/**
 * Calculate Euclidean distance between two colors
 */
function colorDistance(color1: number[], color2: number[]): number {
  const dr = color1[0] - color2[0]
  const dg = color1[1] - color2[1]
  const db = color1[2] - color2[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Apply simple box blur
 */
function applyBoxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const blurred = new Uint8ClampedArray(data.length)
  const kernel = radius * 2 + 1
  const kernelSize = kernel * kernel

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0
      let count = 0

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1)
          const py = Math.min(Math.max(y + ky, 0), height - 1)
          const idx = (py * width + px) * 4

          r += data[idx]
          g += data[idx + 1]
          b += data[idx + 2]
          a += data[idx + 3]
          count++
        }
      }

      const idx = (y * width + x) * 4
      blurred[idx] = r / count
      blurred[idx + 1] = g / count
      blurred[idx + 2] = b / count
      blurred[idx + 3] = a / count
    }
  }

  return blurred
}

/**
 * Add subtle edge effect to simulate numbered regions
 */
function addEdgeEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Create edge detection layer
  const edges = new Uint8ClampedArray(data.length)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4

      // Compare with neighbors
      const right = ((y * width + (x + 1)) * 4)
      const bottom = (((y + 1) * width + x) * 4)

      const diffRight = Math.abs(data[idx] - data[right]) +
                       Math.abs(data[idx + 1] - data[right + 1]) +
                       Math.abs(data[idx + 2] - data[right + 2])

      const diffBottom = Math.abs(data[idx] - data[bottom]) +
                        Math.abs(data[idx + 1] - data[bottom + 1]) +
                        Math.abs(data[idx + 2] - data[bottom + 2])

      // If significant color difference, it's an edge
      const threshold = 60
      if (diffRight > threshold || diffBottom > threshold) {
        edges[idx] = 80     // Dark gray edge
        edges[idx + 1] = 80
        edges[idx + 2] = 80
        edges[idx + 3] = 255
      }
    }
  }

  // Blend edges with original image
  for (let i = 0; i < data.length; i += 4) {
    if (edges[i + 3] > 0) {
      // Darken edge pixels slightly
      data[i] = Math.max(0, data[i] - 30)
      data[i + 1] = Math.max(0, data[i + 1] - 30)
      data[i + 2] = Math.max(0, data[i + 2] - 30)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Generate a quick preview thumbnail
 * @param imageUrl - Original image URL
 * @param palette - Color palette
 * @returns Promise<string> - Thumbnail data URL
 */
export async function generateThumbnailPreview(
  imageUrl: string,
  palette: Palette
): Promise<string> {
  // Same as generatePaintPreview but smaller size for performance
  return generatePaintPreview(imageUrl, palette)
}
