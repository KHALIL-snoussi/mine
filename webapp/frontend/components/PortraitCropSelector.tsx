'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface PortraitCropSelectorProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel?: () => void
}

// Portrait aspect ratio (3:4)
const PORTRAIT_ASPECT_RATIO = 3 / 4

// Responsive crop sizing configuration
// Optimized for A4 printing (210mm × 297mm at 300 DPI = ~2480 × 3508 pixels)
const CROP_SIZE_CONFIG = {
  // Crop will be this percentage of the image width
  // 75% gives good subject focus while showing more than just the face
  imageWidthPercentage: 0.75, // 75% of image width

  // Minimum crop dimensions (in pixels) - suitable for A4 at lower DPI
  minWidth: 1000,
  minHeight: 1333, // 1000 * (4/3) to maintain aspect ratio

  // Maximum crop dimensions (in pixels) - suitable for A4 at high quality (300 DPI)
  maxWidth: 2400,
  maxHeight: 3200, // 2400 * (4/3)
}

// Calculate responsive crop dimensions based on image size
function calculateCropDimensions(imageWidth: number, imageHeight: number): { width: number; height: number } {
  // Start with a percentage of the image width
  let cropWidth = Math.round(imageWidth * CROP_SIZE_CONFIG.imageWidthPercentage)
  let cropHeight = Math.round(cropWidth / PORTRAIT_ASPECT_RATIO)

  // Apply minimum constraints
  if (cropWidth < CROP_SIZE_CONFIG.minWidth) {
    cropWidth = CROP_SIZE_CONFIG.minWidth
    cropHeight = CROP_SIZE_CONFIG.minHeight
  }

  // Apply maximum constraints
  if (cropWidth > CROP_SIZE_CONFIG.maxWidth) {
    cropWidth = CROP_SIZE_CONFIG.maxWidth
    cropHeight = CROP_SIZE_CONFIG.maxHeight
  }

  // Ensure crop doesn't exceed image dimensions
  if (cropWidth > imageWidth) {
    cropWidth = imageWidth
    cropHeight = Math.round(cropWidth / PORTRAIT_ASPECT_RATIO)
  }

  if (cropHeight > imageHeight) {
    cropHeight = imageHeight
    cropWidth = Math.round(cropHeight * PORTRAIT_ASPECT_RATIO)
  }

  return { width: cropWidth, height: cropHeight }
}

export default function PortraitCropSelector({
  imageUrl,
  onCropComplete,
  onCancel,
}: PortraitCropSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [cropDimensions, setCropDimensions] = useState({ width: 600, height: 800 })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)

      // Calculate responsive crop dimensions based on image size
      const calculatedCropDimensions = calculateCropDimensions(img.width, img.height)
      setCropDimensions(calculatedCropDimensions)

      // Calculate scale to fit the image in the container (max 800px wide)
      const maxDisplayWidth = 800
      const maxDisplayHeight = 600
      const scaleX = maxDisplayWidth / img.width
      const scaleY = maxDisplayHeight / img.height
      const displayScale = Math.min(scaleX, scaleY, 1) // Don't upscale

      setScale(displayScale)
      const displayWidth = img.width * displayScale
      const displayHeight = img.height * displayScale
      setCanvasSize({ width: displayWidth, height: displayHeight })

      // Center the crop frame initially
      const cropDisplayWidth = calculatedCropDimensions.width * displayScale
      const cropDisplayHeight = calculatedCropDimensions.height * displayScale

      setCropPosition({
        x: Math.max(0, (displayWidth - cropDisplayWidth) / 2),
        y: Math.max(0, (displayHeight - cropDisplayHeight) / 2),
      })
    }
    img.src = imageUrl
  }, [imageUrl])

  // Draw the canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Draw the image
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height)

    // Draw overlay (darken area outside crop)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear the crop area
    const cropDisplayWidth = cropDimensions.width * scale
    const cropDisplayHeight = cropDimensions.height * scale

    ctx.clearRect(cropPosition.x, cropPosition.y, cropDisplayWidth, cropDisplayHeight)
    ctx.drawImage(
      image,
      cropPosition.x / scale,
      cropPosition.y / scale,
      cropDimensions.width,
      cropDimensions.height,
      cropPosition.x,
      cropPosition.y,
      cropDisplayWidth,
      cropDisplayHeight
    )

    // Draw crop frame border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.strokeRect(cropPosition.x, cropPosition.y, cropDisplayWidth, cropDisplayHeight)

    // Draw corner handles
    const handleSize = 12
    ctx.fillStyle = '#3b82f6'
    const corners = [
      { x: cropPosition.x, y: cropPosition.y }, // top-left
      { x: cropPosition.x + cropDisplayWidth, y: cropPosition.y }, // top-right
      { x: cropPosition.x, y: cropPosition.y + cropDisplayHeight }, // bottom-left
      { x: cropPosition.x + cropDisplayWidth, y: cropPosition.y + cropDisplayHeight }, // bottom-right
    ]
    corners.forEach(corner => {
      ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize)
    })

    // Draw dimension label
    ctx.fillStyle = '#3b82f6'
    ctx.font = 'bold 14px system-ui'
    ctx.fillText(
      `${cropDimensions.width} × ${cropDimensions.height}px (Portrait)`,
      cropPosition.x + 10,
      cropPosition.y + 25
    )
  }, [image, cropPosition, scale, canvasSize, cropDimensions])

  // Handle mouse/touch events for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cropDisplayWidth = cropDimensions.width * scale
    const cropDisplayHeight = cropDimensions.height * scale

    // Check if click is inside crop frame
    if (
      x >= cropPosition.x &&
      x <= cropPosition.x + cropDisplayWidth &&
      y >= cropPosition.y &&
      y <= cropPosition.y + cropDisplayHeight
    ) {
      setIsDragging(true)
      canvas.style.cursor = 'grabbing'
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cropDisplayWidth = cropDimensions.width * scale
    const cropDisplayHeight = cropDimensions.height * scale

    // Calculate new position (keeping crop frame within bounds)
    const newX = Math.max(0, Math.min(x - cropDisplayWidth / 2, canvasSize.width - cropDisplayWidth))
    const newY = Math.max(0, Math.min(y - cropDisplayHeight / 2, canvasSize.height - cropDisplayHeight))

    setCropPosition({ x: newX, y: newY })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }

  // Handle crop confirmation
  const handleConfirmCrop = () => {
    if (!image) return

    // Create a new canvas for the cropped image at original resolution
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = cropDimensions.width
    cropCanvas.height = cropDimensions.height
    const ctx = cropCanvas.getContext('2d')
    if (!ctx) return

    // Calculate source coordinates in original image
    const sourceX = cropPosition.x / scale
    const sourceY = cropPosition.y / scale

    // Draw the cropped portion at original resolution
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      cropDimensions.width,
      cropDimensions.height,
      0,
      0,
      cropDimensions.width,
      cropDimensions.height
    )

    // Convert to blob and call callback
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        onCropComplete(croppedUrl)
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="rounded-2xl border-2 border-primary-300 bg-white p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">📐 Position Your Portrait Frame</h3>
        <p className="mt-1 text-sm text-slate-600">
          Drag the blue frame to select the area you want to process.
          The frame is automatically sized at <strong>{cropDimensions.width} × {cropDimensions.height}px</strong> (portrait orientation) based on your image.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative mb-4 flex justify-center overflow-hidden rounded-xl bg-slate-100"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
          className="max-w-full"
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleConfirmCrop}
          disabled={!image}
          className="flex-1"
        >
          ✓ Confirm Selection
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-primary-50 p-3 text-xs text-primary-700">
        <p><strong>💡 Tip:</strong> Position the frame to include your main subject (face, object, etc.).
        All processing will happen inside this cropped area only.</p>
      </div>
    </div>
  )
}
