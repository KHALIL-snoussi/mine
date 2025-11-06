'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface PortraitCropSelectorProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel?: () => void
}

// Fixed portrait dimensions (3:4 aspect ratio)
const CROP_WIDTH = 600
const CROP_HEIGHT = 800

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

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)

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
      const cropDisplayWidth = CROP_WIDTH * displayScale
      const cropDisplayHeight = CROP_HEIGHT * displayScale

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
    const cropDisplayWidth = CROP_WIDTH * scale
    const cropDisplayHeight = CROP_HEIGHT * scale

    ctx.clearRect(cropPosition.x, cropPosition.y, cropDisplayWidth, cropDisplayHeight)
    ctx.drawImage(
      image,
      cropPosition.x / scale,
      cropPosition.y / scale,
      CROP_WIDTH,
      CROP_HEIGHT,
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
      `${CROP_WIDTH} × ${CROP_HEIGHT}px (Portrait)`,
      cropPosition.x + 10,
      cropPosition.y + 25
    )
  }, [image, cropPosition, scale, canvasSize])

  // Handle mouse/touch events for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cropDisplayWidth = CROP_WIDTH * scale
    const cropDisplayHeight = CROP_HEIGHT * scale

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

    const cropDisplayWidth = CROP_WIDTH * scale
    const cropDisplayHeight = CROP_HEIGHT * scale

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
    cropCanvas.width = CROP_WIDTH
    cropCanvas.height = CROP_HEIGHT
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
      CROP_WIDTH,
      CROP_HEIGHT,
      0,
      0,
      CROP_WIDTH,
      CROP_HEIGHT
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
          The frame is fixed at <strong>{CROP_WIDTH} × {CROP_HEIGHT}px</strong> (portrait orientation).
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
