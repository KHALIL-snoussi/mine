'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from './ui/Button'

interface DiamondCropSelectorProps {
  imageUrl: string
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'free' // Added aspect ratio options
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
}

export default function DiamondCropSelector({
  imageUrl,
  aspectRatio = 'square',
  onCropComplete,
  onCancel,
}: DiamondCropSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  // Crop area (percentage of canvas)
  const [cropArea, setCropArea] = useState({
    x: 0.15, // 15% from left
    y: 0.15, // 15% from top
    width: 0.7, // 70% width
    height: 0.7, // 70% height
  })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      // Initialize crop area based on aspect ratio
      if (aspectRatio === 'portrait') {
        setCropArea({ x: 0.25, y: 0.1, width: 0.5, height: 0.8 })
      } else if (aspectRatio === 'landscape') {
        setCropArea({ x: 0.1, y: 0.25, width: 0.8, height: 0.5 })
      } else if (aspectRatio === 'square') {
        const size = 0.7
        setCropArea({ x: 0.15, y: 0.15, width: size, height: size })
      }
    }
    img.src = imageUrl
  }, [imageUrl, aspectRatio])

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

    // Draw overlay (darken outside crop area)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, width, height)

    // Clear crop area
    const cropX = cropArea.x * width
    const cropY = cropArea.y * height
    const cropW = cropArea.width * width
    const cropH = cropArea.height * height

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    // Draw darkened overlay
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, width, height)

    // Clear the crop area
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(cropX, cropY, cropW, cropH)
    ctx.restore()

    // Draw crop border
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 3
    ctx.strokeRect(cropX, cropY, cropW, cropH)

    // Draw corner handles
    const handleSize = 12
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2

    // Top-left
    ctx.fillRect(cropX - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(cropX - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize)

    // Top-right
    ctx.fillRect(cropX + cropW - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(cropX + cropW - handleSize / 2, cropY - handleSize / 2, handleSize, handleSize)

    // Bottom-left
    ctx.fillRect(cropX - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(cropX - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize)

    // Bottom-right
    ctx.fillRect(cropX + cropW - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(cropX + cropW - handleSize / 2, cropY + cropH - handleSize / 2, handleSize, handleSize)

    // Draw dimension text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3

    const dimText = `${Math.round(cropW)} × ${Math.round(cropH)} px`
    ctx.strokeText(dimText, cropX + cropW / 2, cropY - 15)
    ctx.fillText(dimText, cropX + cropW / 2, cropY - 15)
  }, [image, cropArea])

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
          newCrop.height = cropArea.height + (cropArea.y - y)
          newCrop.x = x
          newCrop.y = y
          break
        case 'tr':
          newCrop.width = x - cropArea.x
          newCrop.height = cropArea.height + (cropArea.y - y)
          newCrop.y = y
          break
        case 'bl':
          newCrop.width = cropArea.width + (cropArea.x - x)
          newCrop.height = y - cropArea.y
          newCrop.x = x
          break
        case 'br':
          newCrop.width = x - cropArea.x
          newCrop.height = y - cropArea.y
          break
      }

      // Maintain aspect ratio if needed
      if (aspectRatio === 'square') {
        const size = Math.min(newCrop.width, newCrop.height)
        newCrop.width = size
        newCrop.height = size
      } else if (aspectRatio === 'portrait') {
        newCrop.height = newCrop.width * 1.4 // 3:4 ratio
      } else if (aspectRatio === 'landscape') {
        newCrop.width = newCrop.height * 1.4 // 4:3 ratio
      }

      // Constrain to canvas
      newCrop.x = Math.max(0, Math.min(newCrop.x, 1 - newCrop.width))
      newCrop.y = Math.max(0, Math.min(newCrop.y, 1 - newCrop.height))
      newCrop.width = Math.max(0.1, Math.min(newCrop.width, 1 - newCrop.x))
      newCrop.height = Math.max(0.1, Math.min(newCrop.height, 1 - newCrop.y))

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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/30 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Select the area for your diamond painting
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Drag the frame to select the area you want to convert. Resize by dragging the corners.
          The selected area will be processed in high detail.
        </p>

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

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => setCropArea({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 })}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            Reset Square
          </button>
          <button
            onClick={() => setCropArea({ x: 0.25, y: 0.1, width: 0.5, height: 0.8 })}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            Portrait
          </button>
          <button
            onClick={() => setCropArea({ x: 0.1, y: 0.25, width: 0.8, height: 0.5 })}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary-300 hover:bg-primary-50"
          >
            Landscape
          </button>
        </div>
      </div>
    </div>
  )
}
