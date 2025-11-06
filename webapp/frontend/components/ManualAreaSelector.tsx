'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/Button'

interface ManualAreaSelectorProps {
  imageUrl: string
  onAreaSelect: (area: SelectedArea | null) => void
  className?: string
}

export interface SelectedArea {
  x: number          // Position as ratio (0-1)
  y: number
  width: number      // Size as ratio (0-1)
  height: number
}

export default function ManualAreaSelector({
  imageUrl,
  onAreaSelect,
  className = ''
}: ManualAreaSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Draw canvas
  useEffect(() => {
    if (!image || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
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
    setCanvasSize({ width: drawWidth, height: drawHeight })

    // Draw image
    ctx.drawImage(image, 0, 0, drawWidth, drawHeight)

    // Draw selected area overlay if exists
    if (selectedArea) {
      // Darken everything except selected area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
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
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.setLineDash([10, 5])
      ctx.strokeRect(selX, selY, selW, selH)
      ctx.setLineDash([])

      // Draw corner handles
      drawCornerHandles(ctx, selX, selY, selW, selH)

      // Draw label
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(selX, selY - 35, 200, 32)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('✨ Emphasized Area', selX + 8, selY - 12)

      // Draw size percentage
      const percentage = Math.round(selectedArea.width * selectedArea.height * 100)
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(selX + selW - 80, selY + selH + 5, 80, 28)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(`${percentage}% area`, selX + selW - 72, selY + selH + 22)
    } else {
      // Show hint overlay when no selection
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.fillRect(0, 0, drawWidth, drawHeight)

      // Draw hint text
      ctx.fillStyle = '#3b82f6'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('👆 Drag to select area you want to emphasize', drawWidth / 2, drawHeight / 2)
      ctx.font = '14px sans-serif'
      ctx.fillText('(Face, subject, main focus area)', drawWidth / 2, drawHeight / 2 + 25)
    }
  }, [image, selectedArea])

  const drawCornerHandles = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const handleSize = 12
    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2 }, // Top-left
      { x: x + w - handleSize / 2, y: y - handleSize / 2 }, // Top-right
      { x: x - handleSize / 2, y: y + h - handleSize / 2 }, // Bottom-left
      { x: x + w - handleSize / 2, y: y + h - handleSize / 2 }, // Bottom-right
    ]

    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2

    handles.forEach(handle => {
      ctx.beginPath()
      ctx.arc(handle.x + handleSize / 2, handle.y + handleSize / 2, handleSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / canvasSize.width)
    const y = ((e.clientY - rect.top) / canvasSize.height)

    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)
    setDragStart(coords)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return

    const coords = getCanvasCoordinates(e)
    const width = Math.abs(coords.x - dragStart.x)
    const height = Math.abs(coords.y - dragStart.y)

    const newArea: SelectedArea = {
      x: Math.min(dragStart.x, coords.x),
      y: Math.min(dragStart.y, coords.y),
      width: Math.min(width, 1),
      height: Math.min(height, 1),
    }

    // Only set if area is at least 5% of image
    if (newArea.width * newArea.height > 0.05) {
      setSelectedArea(newArea)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)

    if (selectedArea) {
      onAreaSelect(selectedArea)
    }
  }

  const handleReset = () => {
    setSelectedArea(null)
    onAreaSelect(null)
  }

  const handleSelectWholeImage = () => {
    const wholeImage: SelectedArea = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    }
    setSelectedArea(wholeImage)
    onAreaSelect(wholeImage)
  }

  const handleSelectCenter = () => {
    // Pre-select center 60% of image
    const centerArea: SelectedArea = {
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6,
    }
    setSelectedArea(centerArea)
    onAreaSelect(centerArea)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Select Area to Emphasize (Optional)
            </h3>
            <p className="text-sm text-slate-700 mb-3">
              <strong>Drag a rectangle</strong> around the area you want to emphasize (face, subject, etc.).
              We'll use <strong>more colors and detail</strong> in this area while simplifying the background.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                ✨ Drag to select area
              </div>
              {selectedArea && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Area selected: {Math.round(selectedArea.width * selectedArea.height * 100)}% of image
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 bg-slate-50"
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSelectCenter}
            variant="outline"
            size="sm"
          >
            📍 Select Center
          </Button>
          <Button
            onClick={handleSelectWholeImage}
            variant="outline"
            size="sm"
          >
            🖼️ Use Whole Image
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={!selectedArea}
          >
            🔄 Clear Selection
          </Button>
        </div>

        {selectedArea && (
          <div className="text-sm font-semibold text-slate-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <span className="text-green-600">✓</span> Area selected: {' '}
            {Math.round(selectedArea.width * 100)}% × {Math.round(selectedArea.height * 100)}%
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 p-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div className="flex-1 text-sm text-slate-700">
            <p className="font-bold text-slate-900 mb-2">How This Improves Quality:</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Selected area gets 65-75% of colors</strong> for maximum detail and clarity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Background gets 25-35% of colors</strong> (simplified but still looks good)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Emphasized area uses smaller regions</strong> = 3-5x more detail!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Skip this step to process the whole image normally</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
        <p className="font-semibold text-slate-900 mb-3">💡 Common Use Cases:</p>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 mb-1">👤 Portraits</p>
            <p className="text-slate-600 text-xs">Select face + shoulders for clear facial features</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 mb-1">🐕 Pets</p>
            <p className="text-slate-600 text-xs">Select animal body for detailed fur/features</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800 mb-1">🏞️ Landscapes</p>
            <p className="text-slate-600 text-xs">Select main subject (tree, building, etc.)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
