'use client'

import { useEffect, useRef } from 'react'
import type { AdvancedDiamondResult } from '@/lib/advancedDiamondGenerator'

interface TileThumbnailProps {
  tile: AdvancedDiamondResult['tiles'][0]
  colorMap: Map<string, { symbol: string; hex: string }>
  onClick?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
  showNumber?: boolean
  ariaLabel?: string
  tabIndex?: number
}

/**
 * Renders a miniature beige grid thumbnail of a tile, matching the PDF layout
 */
export function TileThumbnail({
  tile,
  colorMap,
  onClick,
  onKeyDown,
  className = '',
  showNumber = true,
  ariaLabel,
  tabIndex = 0,
}: TileThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellSize = 3 // Small cells for thumbnail
    const indexSize = 8 // Row/column index strip
    const padding = 2
    const gridSize = 16

    const totalSize = indexSize + gridSize * cellSize + padding * 2

    canvas.width = totalSize
    canvas.height = totalSize

    // Beige background
    ctx.fillStyle = '#EBD4B0'
    ctx.fillRect(0, 0, totalSize, totalSize)

    // Draw corner cell
    ctx.fillStyle = '#F5F5F5'
    ctx.fillRect(padding, padding, indexSize, indexSize)

    // Draw column indices (very small numbers)
    ctx.fillStyle = '#666'
    ctx.font = '4px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let col = 0; col < gridSize; col++) {
      const x = padding + indexSize + col * cellSize + cellSize / 2
      const y = padding + indexSize / 2
      if (col % 4 === 0) { // Only show every 4th number
        ctx.fillText(`${col + 1}`, x, y)
      }
    }

    // Draw row indices
    for (let row = 0; row < gridSize; row++) {
      const x = padding + indexSize / 2
      const y = padding + indexSize + row * cellSize + cellSize / 2
      if (row % 4 === 0) { // Only show every 4th number
        ctx.fillText(`${row + 1}`, x, y)
      }
    }

    // Draw grid cells with symbols
    ctx.font = 'bold 2px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let row = 0; row < tile.beads.length; row++) {
      for (let col = 0; col < tile.beads[row].length; col++) {
        const cell = tile.beads[row][col]
        const x = padding + indexSize + col * cellSize
        const y = padding + indexSize + row * cellSize

        // Draw cell background (beige)
        ctx.fillStyle = '#EBD4B0'
        ctx.fillRect(x, y, cellSize, cellSize)

        // Draw cell border (very subtle)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
        ctx.lineWidth = 0.3
        ctx.strokeRect(x, y, cellSize, cellSize)

        // Draw symbol (very small)
        const mapping = colorMap.get(cell.dmcCode)
        if (mapping && cellSize >= 3) {
          // Determine if text should be dark or light
          const isLight = cell.rgb.r + cell.rgb.g + cell.rgb.b > 400
          ctx.fillStyle = isLight ? '#000' : '#FFF'

          // Only draw symbols if cell is large enough
          const symbolX = x + cellSize / 2
          const symbolY = y + cellSize / 2
          ctx.fillText(mapping.symbol, symbolX, symbolY)
        }
      }
    }

    // Draw border around entire grid
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(padding + indexSize, padding + indexSize, gridSize * cellSize, gridSize * cellSize)
  }, [tile, colorMap])

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        data-tile-button
        className="relative group w-full aspect-square border-2 border-slate-300 hover:border-primary-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-300 focus:outline-none rounded-lg transition-all hover:shadow-md bg-white overflow-hidden"
        aria-label={ariaLabel || `View tile ${tile.tileNumber} instructions`}
      >
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {showNumber && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-white border border-slate-900 text-[10px] font-bold">
            {tile.tileNumber}
          </div>
        )}

        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded font-semibold">
            View
          </span>
        </div>
      </button>
    </div>
  )
}

interface TileLegendProps {
  tile: AdvancedDiamondResult['tiles'][0]
  colorMap: Map<string, { symbol: string; hex: string; name: string }>
  compact?: boolean
}

/**
 * Centralized legend component used in both UI and PDF generation
 */
export function TileLegend({ tile, colorMap, compact = false }: TileLegendProps) {
  // Get unique colors in this tile
  const tileColors = new Set<string>()
  tile.beads.forEach(row => {
    row.forEach(cell => tileColors.add(cell.dmcCode))
  })

  const colors = Array.from(tileColors).slice(0, compact ? 8 : undefined)

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {colors.map(code => {
        const mapping = colorMap.get(code)
        if (!mapping) return null

        return (
          <div
            key={code}
            className="flex items-center gap-1.5"
          >
            <div
              className={`font-bold font-mono ${compact ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} flex items-center justify-center bg-slate-100 border border-slate-400`}
            >
              {mapping.symbol}
            </div>
            <div
              className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} border border-slate-400`}
              style={{ backgroundColor: mapping.hex }}
            />
            <div className={`font-mono font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {code}
            </div>
          </div>
        )
      })}
      {tileColors.size > colors.length && (
        <div className="text-[10px] text-slate-500 self-center">
          +{tileColors.size - colors.length} more
        </div>
      )}
    </div>
  )
}
