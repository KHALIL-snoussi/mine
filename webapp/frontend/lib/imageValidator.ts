/**
 * Image Validation Utilities
 * Ensures uploaded images meet quality standards before processing
 */

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

export interface ImageInfo {
  width: number
  height: number
  fileSize: number
  format: string
  aspectRatio: number
}

export async function validateImage(file: File): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    warnings: [],
    errors: [],
    suggestions: []
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    result.valid = false
    result.errors.push(`Invalid file type. Please upload JPG, PNG, or WebP images.`)
    return result
  }

  // Check file size (min 50KB, max 10MB)
  const fileSizeMB = file.size / (1024 * 1024)
  if (file.size < 50 * 1024) {
    result.valid = false
    result.errors.push(`File too small (${fileSizeMB.toFixed(2)}MB). Minimum 50KB for good quality.`)
  }
  if (file.size > 10 * 1024 * 1024) {
    result.valid = false
    result.errors.push(`File too large (${fileSizeMB.toFixed(2)}MB). Maximum 10MB allowed.`)
  }

  // Load image to check dimensions
  try {
    const imageInfo = await getImageInfo(file)

    // Check minimum dimensions
    if (imageInfo.width < 400 || imageInfo.height < 400) {
      result.valid = false
      result.errors.push(
        `Image too small (${imageInfo.width}x${imageInfo.height}). ` +
        `Minimum 400x400 pixels for good results.`
      )
    }

    // Check maximum dimensions (warn, don't block)
    if (imageInfo.width > 4000 || imageInfo.height > 4000) {
      result.warnings.push(
        `Large image (${imageInfo.width}x${imageInfo.height}). ` +
        `Will be resized to 2000px for processing.`
      )
    }

    // Check aspect ratio
    if (imageInfo.aspectRatio > 3 || imageInfo.aspectRatio < 0.33) {
      result.warnings.push(
        `Unusual aspect ratio. Very wide/tall images may not paint well. ` +
        `Consider cropping to a more square format.`
      )
    }

    // Quality suggestions
    if (imageInfo.width >= 800 && imageInfo.height >= 800) {
      result.suggestions.push('✓ Good resolution for high-quality template')
    }

    if (imageInfo.width < 800 || imageInfo.height < 800) {
      result.suggestions.push(
        '💡 For best results, use images 800x800 pixels or larger'
      )
    }

    // File size suggestions
    if (fileSizeMB < 0.5) {
      result.suggestions.push(
        '💡 Small file size may indicate low quality. Use high-quality photos for best results.'
      )
    }

  } catch (error) {
    result.valid = false
    result.errors.push('Failed to read image file. File may be corrupted.')
  }

  return result
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height,
        fileSize: file.size,
        format: file.type,
        aspectRatio: img.width / img.height
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function getImageQualityAdvice(info: ImageInfo): string[] {
  const advice: string[] = []

  // Resolution advice
  if (info.width < 600 || info.height < 600) {
    advice.push('📸 Low resolution detected. Result may have large, blocky regions.')
  } else if (info.width >= 1200 && info.height >= 1200) {
    advice.push('✨ Excellent resolution! You\'ll get a detailed, high-quality template.')
  }

  // File size advice
  const sizeMB = info.fileSize / (1024 * 1024)
  if (sizeMB < 0.3) {
    advice.push('⚠️ Very small file size. Image may be heavily compressed.')
  }

  // Aspect ratio advice
  if (info.aspectRatio > 2) {
    advice.push('📐 Wide image. Consider using Artistic or Vibrant models.')
  } else if (info.aspectRatio < 0.5) {
    advice.push('📐 Tall image. Consider using Artistic or Vibrant models.')
  }

  return advice
}

export function recommendModel(info: ImageInfo): {
  modelId: string
  reason: string
} {
  // Simple/small images - use vintage for softer look
  if (info.width < 800 && info.height < 800) {
    return {
      modelId: 'vintage',
      reason: 'Smaller image works best with Vintage model (muted colors, fewer regions)'
    }
  }

  // Large, high-res images - use full_color_hd for maximum detail
  if (info.width >= 1500 && info.height >= 1500) {
    return {
      modelId: 'full_color_hd',
      reason: 'High resolution image - Full Color HD model will preserve fine details'
    }
  }

  // Wide/tall images - use pop_art for bold contrast
  if (info.aspectRatio > 2 || info.aspectRatio < 0.5) {
    return {
      modelId: 'pop_art',
      reason: 'Unusual aspect ratio - Pop-Art model handles this well with high contrast'
    }
  }

  // Default to original (natural photorealistic)
  return {
    modelId: 'original',
    reason: 'Standard image - Original model provides natural photorealistic results'
  }
}
