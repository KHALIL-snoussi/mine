/**
 * QBRIX-Authentic Diamond Painting PDF Generator
 * Exact replica of QBRIX booklet format
 */

import { AdvancedDiamondResult } from './advancedDiamondGenerator'

export type DiamondPaintingResult = AdvancedDiamondResult

export interface PDFGeneratorOptions {
  includePattern: boolean
  includeLegend: boolean
  includeMaterialsList: boolean
  includeInstructions: boolean
  title?: string
  customerName?: string
}

/**
 * Generate QBRIX-authentic cover page HTML body content
 */
function generateCoverPageBody(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  const { beadCounts, dimensions, totalBeads, difficulty, estimatedTime, stylePack, imageDataUrl } = result

  const diamondsPerBag = 200
  const totalBags = beadCounts.reduce((sum, bead) => sum + Math.ceil(bead.count / diamondsPerBag), 0)

  const formatName = dimensions.widthBeads === 84 && dimensions.heightBeads === 119
    ? 'A4 PORTRAIT'
    : dimensions.widthBeads === 119 && dimensions.heightBeads === 84
    ? 'A4 LANDSCAPE'
    : 'A4 SQUARE'

  return `
  <!-- QBRIX Header Strip -->
  <div class="qbrix-header">
    <div class="brand">QBRIX</div>
    <div>${formatName}</div>
    <div>${stylePack.name.toUpperCase()} • ${beadCounts.length} COLORS</div>
  </div>

  <div class="content-area">
    <!-- Palette Swatches (ABOVE mosaic) -->
    <div class="palette-row">
      <div class="palette-title">Color Palette &amp; Bead Requirements</div>
      <div class="palette-swatches">
        ${beadCounts
          .filter(bead => bead.count > 0)
          .map(bead => `
        <div class="swatch-item">
          <div class="swatch-color" style="background-color: ${bead.dmcColor.hex};"></div>
          <div class="swatch-symbol">${bead.symbol}</div>
          <div class="swatch-dmc">DMC ${bead.dmcColor.code}</div>
          <div class="swatch-count">${bead.count.toLocaleString()}</div>
          <div class="swatch-count">${bead.percentage.toFixed(1)}%</div>
        </div>
          `).join('')}
      </div>
    </div>

    <!-- Hero Mosaic on Beige Mat -->
    <div class="mosaic-container">
      <img src="${imageDataUrl}" alt="Diamond Painting Pattern" />
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Difficulty</div>
        <div class="stat-value">${difficulty}</div>
        <div class="stat-detail">${estimatedTime}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Canvas Size</div>
        <div class="stat-value">${dimensions.widthBeads}×${dimensions.heightBeads}</div>
        <div class="stat-detail">${dimensions.widthCm}×${dimensions.heightCm} cm</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Beads</div>
        <div class="stat-value">${(totalBeads / 1000).toFixed(1)}K</div>
        <div class="stat-detail">${totalBags} bags needed</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Colors</div>
        <div class="stat-value">${beadCounts.length}</div>
        <div class="stat-detail">DMC codes</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="qbrix-footer">
    #QBRIX DIAMOND PAINTING KIT • QR: WWW.QBRIX.COM
  </div>
  `
}

/**
 * Generate tile spread page body content (12 tiles in 3×4 grid)
 */
function generateTileSpreadBody(
  result: DiamondPaintingResult,
  startTileIndex: number
): string {
  const { tiles, beadCounts } = result
  const tilesOnPage = tiles.slice(startTileIndex, startTileIndex + 12)

  if (tilesOnPage.length === 0) {
    return ''
  }

  const colorMap = new Map(
    beadCounts.map(bc => [bc.dmcColor.code, { color: bc.dmcColor, symbol: bc.symbol }])
  )

  const pageLabel = `${startTileIndex + 1}–${Math.min(startTileIndex + 12, tiles.length)}`

  return `
  <div class="page-header">${pageLabel} ▢</div>

  <div class="tiles-grid">
    ${tilesOnPage.map(tile => {
      // Get unique colors in this tile
      const tileColors = new Set<string>()
      tile.beads.forEach(row => {
        row.forEach(cell => tileColors.add(cell.dmcCode))
      })

      return `
    <div class="tile-container">
      <div class="tile-header">
        <div class="tile-number">${tile.tileNumber} |</div>
      </div>

      <div class="grid-wrapper">
        <div class="grid-with-indices">
          <!-- Corner cell -->
          <div class="corner-cell"></div>

          <!-- Column indices (1-16) -->
          ${Array.from({ length: 16 }, (_, i) => `
          <div class="col-index">${i + 1}</div>
          `).join('')}

          <!-- Rows with row indices -->
          ${tile.beads.map((row, rowIdx) => `
          <!-- Row index -->
          <div class="row-index">${rowIdx + 1}</div>

          <!-- Bead cells in this row -->
          ${row.map(cell => {
            const mapping = colorMap.get(cell.dmcCode)
            const isLight = cell.rgb.r + cell.rgb.g + cell.rgb.b > 400
            return `
          <div class="bead-cell" style="color: ${isLight ? '#000' : '#FFF'};">
            ${mapping?.symbol || cell.symbol}
          </div>
            `
          }).join('')}
          `).join('')}
        </div>
      </div>

      <!-- Per-tile legend -->
      <div class="tile-legend">
        ${Array.from(tileColors).slice(0, 8).map(code => {
          const mapping = colorMap.get(code)
          if (!mapping) return ''
          return `
        <div class="legend-item">
          <div class="legend-symbol">${mapping.symbol}</div>
          <div class="legend-swatch" style="background-color: ${mapping.color.hex};"></div>
          <div class="legend-code">${code}</div>
        </div>
          `
        }).filter(Boolean).join('')}
        ${tileColors.size > 8 ? `<div style="font-size: 6px; color: #666;">+${tileColors.size - 8} more</div>` : ''}
      </div>
    </div>
      `
    }).join('')}
  </div>
  `
}

/**
 * Generate complete QBRIX booklet (cover + all tile spreads) as single HTML document
 */
export function generateCompleteBooklet(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  const totalTiles = result.tiles.length
  const tilesPerPage = 12
  const numSpreadPages = Math.ceil(totalTiles / tilesPerPage)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QBRIX Diamond Painting Booklet</title>
  <style>
    @page {
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Helvetica Neue', sans-serif;
      background: #FFF;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Cover page styles */
    .cover-page {
      width: 210mm;
      min-height: 297mm;
      background: #FFF;
      margin: 0 auto;
    }

    .qbrix-header {
      background: #000;
      color: #FFF;
      padding: 10px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .qbrix-header .brand {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 4px;
    }

    .content-area {
      padding: 20px 25px;
    }

    .palette-row {
      margin-bottom: 20px;
    }

    .palette-title {
      font-size: 11px;
      font-weight: 900;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 3px solid #000;
    }

    .palette-swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .swatch-item {
      flex: 0 0 auto;
      width: calc(14.285% - 7px);
      background: #FFF;
      border: 2px solid #000;
      padding: 6px;
      text-align: center;
    }

    .swatch-color {
      width: 100%;
      height: 45px;
      border: 1px solid #CCC;
      margin-bottom: 5px;
    }

    .swatch-symbol {
      font-size: 14px;
      font-weight: 900;
      font-family: 'Courier New', monospace;
      color: #000;
      margin-bottom: 3px;
    }

    .swatch-dmc {
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
      color: #000;
      margin-bottom: 2px;
    }

    .swatch-count {
      font-size: 8px;
      color: #666;
      line-height: 1.2;
    }

    .mosaic-container {
      background: #EBD4B0;
      padding: 20px;
      margin-bottom: 20px;
      text-align: center;
      border: 2px solid #000;
    }

    .mosaic-container img {
      max-width: 100%;
      max-height: 350px;
      border: 2px solid #000;
      display: inline-block;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-box {
      background: #FFF;
      border: 2px solid #000;
      padding: 12px;
      text-align: center;
    }

    .stat-label {
      font-size: 9px;
      font-weight: 700;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 900;
      color: #000;
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .stat-detail {
      font-size: 9px;
      color: #666;
      line-height: 1.3;
    }

    .qbrix-footer {
      position: absolute;
      bottom: 15px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* Tile spread page styles */
    .tile-page {
      width: 297mm;
      height: 210mm;
      background: #FFF;
      padding: 8mm;
      margin: 0 auto;
    }

    .page-header {
      text-align: right;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #000;
    }

    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 10px;
      height: calc(210mm - 20mm);
    }

    .tile-container {
      border: 2px solid #000;
      background: #FFF;
      padding: 6px;
      display: flex;
      flex-direction: column;
    }

    .tile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .tile-number {
      font-size: 12px;
      font-weight: 900;
      color: #000;
      padding: 2px 6px;
      background: #FFF;
      border: 2px solid #000;
      border-left: 4px solid #000;
    }

    .grid-wrapper {
      flex: 1;
      background: #EBD4B0;
      border: 2px solid #000;
      padding: 4px;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .grid-with-indices {
      display: grid;
      grid-template-columns: 20px repeat(16, 1fr);
      grid-template-rows: 20px repeat(16, 1fr);
      gap: 0;
      flex: 1;
    }

    .corner-cell {
      background: #F5F5F5;
      border: 1px solid #CCC;
    }

    .col-index {
      background: #F5F5F5;
      border: 1px solid #CCC;
      font-size: 7px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    .row-index {
      background: #F5F5F5;
      border: 1px solid #CCC;
      font-size: 7px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bead-cell {
      background: #EBD4B0;
      border: 0.5px solid rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', monospace;
      font-size: 6px;
      font-weight: 700;
      overflow: hidden;
    }

    .tile-legend {
      margin-top: 4px;
      padding: 3px;
      background: #F9F9F9;
      border: 1px solid #DDD;
      font-size: 7px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-height: 25px;
      overflow: hidden;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .legend-symbol {
      font-family: 'Courier New', monospace;
      font-weight: 900;
      font-size: 7px;
      width: 10px;
      height: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F5F5F5;
      border: 1px solid #999;
    }

    .legend-swatch {
      width: 10px;
      height: 10px;
      border: 1px solid #999;
    }

    .legend-code {
      font-size: 6px;
      font-weight: 700;
      font-family: monospace;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover-page">
    ${generateCoverPageBody(result, options)}
  </div>

  <!-- Tile Spread Pages -->
  ${Array.from({ length: numSpreadPages }, (_, i) => {
    const startIndex = i * tilesPerPage
    const bodyContent = generateTileSpreadBody(result, startIndex)
    if (!bodyContent) return ''
    return `
  <div class="page tile-page">
    ${bodyContent}
  </div>
    `
  }).filter(Boolean).join('')}
</body>
</html>
  `
}

/**
 * Generate QBRIX cover page as standalone HTML
 */
export function generateQBRIXCoverPage(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QBRIX Diamond Painting Kit</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    /* Include cover page styles from generateCompleteBooklet */
    /* ... (same as in complete booklet) */
  </style>
</head>
<body>
  <div class="cover-page">
    ${generateCoverPageBody(result, options)}
  </div>
</body>
</html>
  `
}

/**
 * Generate tile spread page as standalone HTML
 */
export function generateTileSpreadPage(
  result: DiamondPaintingResult,
  startTileIndex: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QBRIX Tiles</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    /* Include tile page styles from generateCompleteBooklet */
  </style>
</head>
<body>
  <div class="tile-page">
    ${generateTileSpreadBody(result, startTileIndex)}
  </div>
</body>
</html>
  `
}

/**
 * Download complete QBRIX booklet
 */
export function downloadCompleteBooklet(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  const html = generateCompleteBooklet(result, options)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `qbrix-booklet-${options.title || 'custom'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Print complete QBRIX booklet
 */
export function printCompleteBooklet(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  const html = generateCompleteBooklet(result, options)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

/**
 * Print specific tile page (opens booklet and scrolls to tile)
 */
export function printTilePage(result: DiamondPaintingResult, tileIndex: number): void {
  const html = generateCompleteBooklet(result, {})
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    // Scroll to the appropriate page (1 cover + tile page)
    const tilesPerPage = 12
    const pageNumber = Math.floor(tileIndex / tilesPerPage) + 1 // +1 for cover

    setTimeout(() => {
      const pages = printWindow.document.querySelectorAll('.page')
      if (pages[pageNumber]) {
        pages[pageNumber].scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 250)
  }
}

/**
 * Download specific tile page (downloads complete booklet)
 */
export function downloadTilePage(result: DiamondPaintingResult, tileIndex: number): void {
  downloadCompleteBooklet(result, { title: `tile-${tileIndex + 1}` })
}

// Legacy compatibility exports
export function downloadMaterialsList(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  downloadCompleteBooklet(result, options)
}

export function printMaterialsList(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  printCompleteBooklet(result, options)
}

export function downloadAllTiles(result: DiamondPaintingResult): void {
  downloadCompleteBooklet(result, {})
}

export function downloadQBRIXCover(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  const html = generateQBRIXCoverPage(result, options)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `qbrix-cover-${options.title || 'custom'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printQBRIXCover(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  const html = generateQBRIXCoverPage(result, options)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
