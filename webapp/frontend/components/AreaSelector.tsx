'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'

interface AreaSelectorProps {
  imageUrl: string
  onAreaSelect: (area: SelectedArea | null) => void
  autoDetectedArea?: SelectedArea | null
  className?: string
}

export interface SelectedArea {
  x: number          // Position as ratio (0-1)
  y: number
  width: number      // Size as ratio (0-1)
  height: number
  type: 'auto' | 'manual'  // Was it auto-detected or user-selected?
}

export default function AreaSelector({
  imageUrl,
  onAreaSelect,
  autoDetectedArea,
  className = ''
}: AreaSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(
    autoDetectedArea || null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      // If auto-detected area exists, use it
      if (autoDetectedArea) {
        setSelectedArea(autoDetectedArea)
      }
    }
    img.src = imageUrl
  }, [imageUrl, autoDetectedArea])

  // Draw canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calculate scaled dimensions maintaining aspect ratio
    const imageAspect = image.width / image.height
    const containerAspect = containerWidth / containerHeight

    let drawWidth, drawHeight

    if (imageAspect > containerAspect) {
      drawWidth = containerWidth
      drawHeight = containerWidth / imageAspect
    } else {
      drawHeight = containerHeight
      drawWidth = containerHeight * imageAspect
    }

    canvas.width = drawWidth
    canvas.height = drawHeight

    // Draw image
    ctx.drawImage(image, 0, 0, drawWidth, drawHeight)

    // Draw selected area overlay
    if (selectedArea) {
      // Darken everything except selected area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, drawWidth, drawHeight)

      // Clear selected area to show original image
      const selX = selectedArea.x * drawWidth
      const selY = selectedArea.y * drawHeight
      const selW = selectedArea.width * drawWidth
      const selH = selectedArea.height * drawHeight

      ctx.clearRect(selX, selY, selW, selH)
      ctx.drawImage(
        image,
        selectedArea.x * image.width,
        selectedArea.y * image.height,
        selectedArea.width * image.width,
        selectedArea.height * image.height,
        selX,
        selY,
        selW,
        selH
      )

      // Draw selection rectangle
      ctx.strokeStyle = selectedArea.type === 'auto' ? '#10b981' : '#3b82f6'
      ctx.lineWidth = 3
      ctx.setLineDash([10, 5])
      ctx.strokeRect(selX, selY, selW, selH)
      ctx.setLineDash([])

      // Draw resize handles
      drawResizeHandles(ctx, selX, selY, selW, selH)

      // Draw label
      const label = selectedArea.type === 'auto' ? '✓ Auto-Detected Face' : '✏️ Custom Selection'
      ctx.fillStyle = selectedArea.type === 'auto' ? '#10b981' : '#3b82f6'
      ctx.fillRect(selX, selY - 30, 180, 28)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(label, selX + 8, selY - 10)
    }
  }, [image, selectedArea])

  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const handleSize = 10
    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2, cursor: 'nw-resize' },
      { x: x + w / 2 - handleSize / 2, y: y - handleSize / 2, cursor: 'n-resize' },
      { x: x + w - handleSize / 2, y: y - handleSize / 2, cursor: 'ne-resize' },
      { x: x - handleSize / 2, y: y + h / 2 - handleSize / 2, cursor: 'w-resize' },
      { x: x + w - handleSize / 2, y: y + h / 2 - handleSize / 2, cursor: 'e-resize' },
      { x: x - handleSize / 2, y: y + h - handleSize / 2, cursor: 'sw-resize' },
      { x: x + w / 2 - handleSize / 2, y: y + h - handleSize / 2, cursor: 's-resize' },
      { x: x + w - handleSize / 2, y: y + h - handleSize / 2, cursor: 'se-resize' },
    ]

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setDragStart({ x, y })
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const width = Math.abs(x - dragStart.x)
    const height = Math.abs(y - dragStart.y)

    const newArea: SelectedArea = {
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.min(width, 1),
      height: Math.min(height, 1),
      type: 'manual'
    }

    setSelectedArea(newArea)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)

    if (selectedArea) {
      onAreaSelect(selectedArea)
    }
  }

  const handleReset = () => {
    if (autoDetectedArea) {
      setSelectedArea(autoDetectedArea)
      onAreaSelect(autoDetectedArea)
    } else {
      setSelectedArea(null)
      onAreaSelect(null)
    }
  }

  const handleSelectWholeImage = () => {
    const wholeImage: SelectedArea = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      type: 'manual'
    }
    setSelectedArea(wholeImage)
    onAreaSelect(wholeImage)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Emphasize Important Areas (Like QBRIX!)
            </h3>
            <p className="text-sm text-slate-700 mb-3">
              Select the area you want to emphasize (face, subject, etc.).
              We'll use more colors and detail in this area while simplifying the background.
            </p>
            <div className="flex flex-wrap gap-2">
              {autoDetectedArea && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Face Auto-Detected!
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                ✨ Drag to select custom area
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200"
        style={{ height: '500px' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-crosshair"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={!autoDetectedArea && !selectedArea}
          >
            🔄 Reset to Auto-Detected
          </Button>
          <Button
            onClick={handleSelectWholeImage}
            variant="outline"
            size="sm"
          >
            🖼️ Use Whole Image
          </Button>
        </div>

        {selectedArea && (
          <div className="text-sm text-slate-600">
            <span className="font-semibold">
              {selectedArea.type === 'auto' ? 'Auto-detected area' : 'Custom selection'}
            </span>
            {' • '}
            {Math.round(selectedArea.width * selectedArea.height * 100)}% of image
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1 text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">How This Improves Quality:</p>
            <ul className="space-y-1">
              <li>• Selected area gets 65-75% of colors for maximum detail</li>
              <li>• Background gets 25-35% of colors (simplified but still looks good)</li>
              <li>• Face clarity dramatically improved - just like QBRIX!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
