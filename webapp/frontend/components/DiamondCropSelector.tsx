'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from './ui/Button'

interface DiamondCropSelectorProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
}

interface SubjectBounds {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

interface EdgeWarnings {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
}

export default function DiamondCropSelector({
  imageUrl,
  onCropComplete,
  onCancel,
}: DiamondCropSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [subjectBounds, setSubjectBounds] = useState<SubjectBounds | null>(null)
  const [edgeWarnings, setEdgeWarnings] = useState<EdgeWarnings>({
    top: false,
    bottom: false,
    left: false,
    right: false,
  })

  // Portrait aspect ratio: 84 beads × 119 beads = 0.7059
  const PORTRAIT_RATIO = 84 / 119

  // Crop area (percentage of canvas) - always maintains portrait ratio
  const [cropArea, setCropArea] = useState({
    x: 0.15,
    y: 0.1,
    width: 0.7,
    height: 0.7 / PORTRAIT_RATIO,
  })

  // Detect subject using saliency-based approach
  const detectSubject = useCallback((img: HTMLImageElement): SubjectBounds => {
    const tempCanvas = document.createElement('canvas')
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return { x: 0.25, y: 0.1, width: 0.5, height: 0.8, confidence: 0 }
    }

    // Scale down for faster processing
    const scale = Math.min(1, 400 / Math.max(img.width, img.height))
    const width = Math.floor(img.width * scale)
    const height = Math.floor(img.height * scale)
    tempCanvas.width = width
    tempCanvas.height = height

    ctx.drawImage(img, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Calculate saliency map (brightness + edge detection + center bias)
    const saliency = new Float32Array(width * height)

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        // Brightness
        const brightness = (r + g + b) / 3

        // Sobel edge detection
        const gx =
          -data[((y - 1) * width + (x - 1)) * 4] +
          data[((y - 1) * width + (x + 1)) * 4] +
          -2 * data[(y * width + (x - 1)) * 4] +
          2 * data[(y * width + (x + 1)) * 4] +
          -data[((y + 1) * width + (x - 1)) * 4] +
          data[((y + 1) * width + (x + 1)) * 4]

        const gy =
          -data[((y - 1) * width + (x - 1)) * 4] +
          -2 * data[((y - 1) * width + x) * 4] +
          -data[((y - 1) * width + (x + 1)) * 4] +
          data[((y + 1) * width + (x - 1)) * 4] +
          2 * data[((y + 1) * width + x) * 4] +
          data[((y + 1) * width + (x + 1)) * 4]

        const edgeStrength = Math.sqrt(gx * gx + gy * gy)

        // Center bias (faces usually in upper-center)
        const centerX = width / 2
        const centerY = height * 0.4
        const dx = (x - centerX) / width
        const dy = (y - centerY) / height
        const distFromCenter = Math.sqrt(dx * dx + dy * dy)
        const centerBias = Math.max(0, 1 - distFromCenter * 2)

        // Skin tone detection (for face)
        const isSkin = r > g && g > b && r > 95 && r - g > 15 && (r - b) > 15
        const skinBonus = isSkin ? 100 : 0

        saliency[y * width + x] = brightness * 0.3 + edgeStrength * 0.4 + centerBias * 100 + skinBonus
      }
    }

    // Find bounding box of high-saliency regions
    const threshold = saliency.reduce((sum, val) => sum + val, 0) / saliency.length * 1.2

    let minX = width, maxX = 0, minY = height, maxY = 0
    let saliencyCount = 0

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (saliency[y * width + x] > threshold) {
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
          saliencyCount++
        }
      }
    }

    if (saliencyCount < width * height * 0.05) {
      // Not enough salient regions, return center default
      return { x: 0.25, y: 0.1, width: 0.5, height: 0.8, confidence: 0.1 }
    }

    // Add margins (10% headroom on top, 5% on sides)
    const margin = Math.min(width, height) * 0.05
    minX = Math.max(0, minX - margin)
    minY = Math.max(0, minY - margin * 2) // More headroom on top
    maxX = Math.min(width, maxX + margin)
    maxY = Math.min(height, maxY + margin)

    // Convert to relative coordinates
    const relX = minX / width
    const relY = minY / height
    const relWidth = (maxX - minX) / width
    const relHeight = (maxY - minY) / height

    // Fit to portrait ratio
    const currentRatio = relWidth / relHeight
    let finalX = relX
    let finalY = relY
    let finalWidth = relWidth
    let finalHeight = relHeight

    if (currentRatio > PORTRAIT_RATIO) {
      // Too wide, constrain width
      finalWidth = relHeight * PORTRAIT_RATIO
      finalX = relX + (relWidth - finalWidth) / 2
    } else {
      // Too tall, constrain height
      finalHeight = relWidth / PORTRAIT_RATIO
      finalY = relY + (relHeight - finalHeight) / 2
    }

    // Ensure bounds within canvas
    finalX = Math.max(0, Math.min(finalX, 1 - finalWidth))
    finalY = Math.max(0, Math.min(finalY, 1 - finalHeight))

    const confidence = Math.min(1, saliencyCount / (width * height * 0.3))

    return { x: finalX, y: finalY, width: finalWidth, height: finalHeight, confidence }
  }, [PORTRAIT_RATIO])

  // Load image and auto-detect subject
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)

      // Detect subject and auto-center
      const bounds = detectSubject(img)
      setSubjectBounds(bounds)

      if (bounds.confidence > 0.3) {
        setCropArea({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        })
      } else {
        // Fallback to centered crop
        const defaultHeight = 0.8
        const defaultWidth = defaultHeight * PORTRAIT_RATIO
        setCropArea({
          x: (1 - defaultWidth) / 2,
          y: 0.1,
          width: defaultWidth,
          height: defaultHeight,
        })
      }
    }
    img.src = imageUrl
  }, [imageUrl, detectSubject, PORTRAIT_RATIO])

  // Check for edge warnings
  useEffect(() => {
    const threshold = 0.05 // 5% from edge
    setEdgeWarnings({
      top: cropArea.y < threshold,
      bottom: cropArea.y + cropArea.height > 1 - threshold,
      left: cropArea.x < threshold,
      right: cropArea.x + cropArea.width > 1 - threshold,
    })
  }, [cropArea])

  // Draw canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to fit container
    const container = canvas.parentElement
    if (!container) return

    const maxWidth = Math.min(800, container.clientWidth - 40)
    const maxHeight = 600

    let width = image.width
    let height = image.height

    // Scale to fit
    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height)
      width = width * scale
      height = height * scale
    }

    canvas.width = width
    canvas.height = height

    // Draw image
    ctx.drawImage(image, 0, 0, width, height)

    // Draw darkened overlay
    const cropX = cropArea.x * width
    const cropY = cropArea.y * height
    const cropW = cropArea.width * width
    const cropH = cropArea.height * height

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, width, height)

    // Clear the crop area
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(cropX, cropY, cropW, cropH)
    ctx.restore()

    // Draw crop border
    const hasWarning = edgeWarnings.top || edgeWarnings.bottom || edgeWarnings.left || edgeWarnings.right
    ctx.strokeStyle = hasWarning ? '#ef4444' : '#6366f1'
    ctx.lineWidth = 3
    ctx.strokeRect(cropX, cropY, cropW, cropH)

    // Draw edge warning indicators
    if (edgeWarnings.top) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.fillRect(cropX, cropY, cropW, 10)
    }
    if (edgeWarnings.bottom) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.fillRect(cropX, cropY + cropH - 10, cropW, 10)
    }
    if (edgeWarnings.left) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.fillRect(cropX, cropY, 10, cropH)
    }
    if (edgeWarnings.right) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.fillRect(cropX + cropW - 10, cropY, 10, cropH)
    }

    // Draw corner handles
    const handleSize = 12
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = hasWarning ? '#ef4444' : '#6366f1'
    ctx.lineWidth = 2

    const handles = [
      [cropX, cropY],
      [cropX + cropW, cropY],
      [cropX, cropY + cropH],
      [cropX + cropW, cropY + cropH],
    ]

    handles.forEach(([hx, hy]) => {
      ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize)
      ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize)
    })

    // Draw dimension text with ratio
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3

    const dimText = `84 × 119 beads (Portrait)`
    ctx.strokeText(dimText, cropX + cropW / 2, cropY - 15)
    ctx.fillText(dimText, cropX + cropW / 2, cropY - 15)

    // Draw confidence indicator if available
    if (subjectBounds && subjectBounds.confidence > 0.3) {
      ctx.font = '12px sans-serif'
      const confText = `Subject detected (${Math.round(subjectBounds.confidence * 100)}%)`
      ctx.strokeText(confText, cropX + cropW / 2, cropY + cropH + 25)
      ctx.fillText(confText, cropX + cropW / 2, cropY + cropH + 25)
    }
  }, [image, cropArea, edgeWarnings, subjectBounds])

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / canvas.width
    const y = (e.clientY - rect.top) / canvas.height

    // Check if clicking on resize handles
    const handleSize = 12 / canvas.width
    const handles = [
      { name: 'tl', x: cropArea.x, y: cropArea.y },
      { name: 'tr', x: cropArea.x + cropArea.width, y: cropArea.y },
      { name: 'bl', x: cropArea.x, y: cropArea.y + cropArea.height },
      { name: 'br', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
    ]

    for (const handle of handles) {
      if (
        Math.abs(x - handle.x) < handleSize &&
        Math.abs(y - handle.y) < handleSize
      ) {
        setIsResizing(true)
        setResizeHandle(handle.name)
        setDragStart({ x, y })
        return
      }
    }

    // Check if clicking inside crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / canvas.width
    const y = (e.clientY - rect.top) / canvas.height

    if (isResizing && resizeHandle) {
      let newCrop = { ...cropArea }

      switch (resizeHandle) {
        case 'tl':
          newCrop.width = cropArea.width + (cropArea.x - x)
          newCrop.x = x
          break
        case 'tr':
          newCrop.width = x - cropArea.x
          break
        case 'bl':
          newCrop.width = cropArea.width + (cropArea.x - x)
          newCrop.x = x
          break
        case 'br':
          newCrop.width = x - cropArea.x
          break
      }

      // ALWAYS maintain portrait ratio
      newCrop.height = newCrop.width / PORTRAIT_RATIO

      // Adjust y position for top handles to keep bottom fixed
      if (resizeHandle === 'tl' || resizeHandle === 'tr') {
        newCrop.y = cropArea.y + cropArea.height - newCrop.height
      }

      // Constrain to canvas
      if (newCrop.x < 0) {
        newCrop.width += newCrop.x
        newCrop.height = newCrop.width / PORTRAIT_RATIO
        newCrop.x = 0
      }
      if (newCrop.x + newCrop.width > 1) {
        newCrop.width = 1 - newCrop.x
        newCrop.height = newCrop.width / PORTRAIT_RATIO
      }
      if (newCrop.y < 0) {
        newCrop.height += newCrop.y
        newCrop.width = newCrop.height * PORTRAIT_RATIO
        newCrop.y = 0
      }
      if (newCrop.y + newCrop.height > 1) {
        newCrop.height = 1 - newCrop.y
        newCrop.width = newCrop.height * PORTRAIT_RATIO
      }

      // Minimum size
      if (newCrop.width < 0.2) {
        newCrop.width = 0.2
        newCrop.height = newCrop.width / PORTRAIT_RATIO
      }

      setCropArea(newCrop)
    } else if (isDragging) {
      let newX = x - dragStart.x
      let newY = y - dragStart.y

      // Constrain to canvas
      newX = Math.max(0, Math.min(newX, 1 - cropArea.width))
      newY = Math.max(0, Math.min(newY, 1 - cropArea.height))

      setCropArea({ ...cropArea, x: newX, y: newY })
    }
  }

  // Mouse up handler
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  // Re-center to subject
  const handleRecenter = () => {
    if (image) {
      const bounds = detectSubject(image)
      setSubjectBounds(bounds)

      if (bounds.confidence > 0.3) {
        setCropArea({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        })
      }
    }
  }

  // Adjust vertical position only
  const handleAdjustVertical = (direction: 'up' | 'down') => {
    const step = 0.05
    let newY = cropArea.y + (direction === 'up' ? -step : step)
    newY = Math.max(0, Math.min(newY, 1 - cropArea.height))
    setCropArea({ ...cropArea, y: newY })
  }

  // Reset to default
  const handleReset = () => {
    const defaultHeight = 0.8
    const defaultWidth = defaultHeight * PORTRAIT_RATIO
    setCropArea({
      x: (1 - defaultWidth) / 2,
      y: 0.1,
      width: defaultWidth,
      height: defaultHeight,
    })
  }

  // Crop and complete
  const handleCrop = () => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const cropCanvas = document.createElement('canvas')
    const ctx = cropCanvas.getContext('2d')
    if (!ctx) return

    // Calculate actual crop dimensions
    const scaleX = image.width / canvas.width
    const scaleY = image.height / canvas.height

    const cropX = cropArea.x * canvas.width * scaleX
    const cropY = cropArea.y * canvas.height * scaleY
    const cropW = cropArea.width * canvas.width * scaleX
    const cropH = cropArea.height * canvas.height * scaleY

    cropCanvas.width = cropW
    cropCanvas.height = cropH

    // Draw cropped image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    )

    const croppedUrl = cropCanvas.toDataURL('image/jpeg', 0.95)
    onCropComplete(croppedUrl)
  }

  const hasWarning = edgeWarnings.top || edgeWarnings.bottom || edgeWarnings.left || edgeWarnings.right

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/30 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Portrait Crop (84 × 119 beads)
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          The frame is locked to portrait ratio (A4 format). Drag to reposition or resize by pulling corners.
          {subjectBounds && subjectBounds.confidence > 0.3 && (
            <span className="text-green-600 font-medium"> Subject detected and auto-centered.</span>
          )}
        </p>

        {hasWarning && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Warning: Subject is too close to the {edgeWarnings.top && 'top'}{edgeWarnings.bottom && 'bottom'}{edgeWarnings.left && 'left'}{edgeWarnings.right && 'right'} edge.
              Zoom out or re-center to avoid cropping important details.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'move' : isResizing ? 'nwse-resize' : 'default', maxWidth: '100%' }}
            className="rounded-lg shadow-lg"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleCrop} className="flex-1">
            ✓ Confirm Selection
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button
            onClick={handleRecenter}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            🎯 Re-center
          </button>
          <button
            onClick={() => handleAdjustVertical('up')}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            ↑ Move Up
          </button>
          <button
            onClick={() => handleAdjustVertical('down')}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            ↓ Move Down
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
