/**
 * QBRIX-Style Diamond Painting PDF Generator
 * Generates authentic QBRIX booklet with:
 * - Cover page (black strip, hero mosaic, palette swatches, stats)
 * - Tile spreads (12 tiles per page in 3×4 grid)
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
 * Generate QBRIX-authentic cover page
 */
export function generateQBRIXCoverPage(
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QBRIX Diamond Painting Kit</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      background: #F5F5F5;
      width: 210mm;
      height: 297mm;
      padding: 0;
      margin: 0;
    }

    /* Black metadata strip at top */
    .qbrix-header {
      background: #000;
      color: #FFF;
      padding: 8px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .qbrix-header .brand {
      font-size: 16px;
      letter-spacing: 3px;
    }

    /* Hero section with mosaic on beige */
    .hero-container {
      background: #EBD4B0;
      padding: 25px;
      margin: 20px;
      text-align: center;
      border: 3px solid #000;
    }

    .hero-container img {
      max-width: 100%;
      max-height: 400px;
      border: 2px solid #000;
      display: inline-block;
    }

    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px;
    }

    .stat-box {
      background: #FFF;
      border: 3px solid #000;
      padding: 15px;
      text-align: center;
    }

    .stat-label {
      font-size: 9px;
      font-weight: 700;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 900;
      color: #000;
      margin-bottom: 4px;
    }

    .stat-detail {
      font-size: 10px;
      color: #666;
    }

    /* Palette section */
    .palette-section {
      margin: 20px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 900;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 4px solid #000;
    }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
    }

    .color-swatch-card {
      background: #FFF;
      border: 2px solid #000;
      padding: 8px;
      text-align: center;
    }

    .color-swatch {
      width: 100%;
      aspect-ratio: 1;
      border: 2px solid #CCC;
      margin-bottom: 6px;
    }

    .swatch-symbol {
      font-size: 16px;
      font-weight: 900;
      font-family: 'Courier New', monospace;
      color: #000;
      margin-bottom: 4px;
    }

    .swatch-dmc {
      font-size: 11px;
      font-weight: 700;
      color: #000;
      margin-bottom: 3px;
      font-family: monospace;
    }

    .swatch-count {
      font-size: 9px;
      color: #666;
    }

    /* Footer */
    .qbrix-footer {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
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
  <!-- QBRIX Header Strip -->
  <div class="qbrix-header">
    <div class="brand">QBRIX</div>
    <div>${formatName}</div>
    <div>${stylePack.name.toUpperCase()} • ${beadCounts.length} COLORS</div>
  </div>

  <!-- Hero Mosaic on Beige -->
  <div class="hero-container">
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

  <!-- Palette Swatches -->
  <div class="palette-section">
    <div class="section-title">Color Palette &amp; Bead Requirements</div>
    <div class="palette-grid">
      ${beadCounts
        .filter(bead => bead.count > 0)
        .map(bead => `
      <div class="color-swatch-card">
        <div class="color-swatch" style="background-color: ${bead.dmcColor.hex};"></div>
        <div class="swatch-symbol">${bead.symbol}</div>
        <div class="swatch-dmc">DMC ${bead.dmcColor.code}</div>
        <div class="swatch-count">${bead.count.toLocaleString()}</div>
        <div class="swatch-count">${bead.percentage.toFixed(1)}%</div>
      </div>
        `).join('')}
    </div>
  </div>

  <!-- Footer -->
  <div class="qbrix-footer">
    #QBRIX Diamond Painting Kit • QR: www.qbrix.com
  </div>
</body>
</html>
  `
}

/**
 * Generate tile spread page (12 tiles in 3×4 grid)
 */
export function generateTileSpreadPage(
  result: DiamondPaintingResult,
  startTileIndex: number
): string {
  const { tiles, beadCounts, stylePack } = result
  const tilesOnPage = tiles.slice(startTileIndex, startTileIndex + 12)

  if (tilesOnPage.length === 0) {
    throw new Error(`No tiles found starting at index ${startTileIndex}`)
  }

  const colorMap = new Map(
    beadCounts.map(bc => [bc.dmcColor.code, { color: bc.dmcColor, symbol: bc.symbol }])
  )

  const pageLabel = `${startTileIndex + 1}–${startTileIndex + tilesOnPage.length}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QBRIX Tiles ${pageLabel}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      background: #FFF;
      padding: 10px;
    }

    .page-header {
      text-align: right;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #000;
    }

    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 12px;
    }

    .tile-container {
      border: 2px solid #000;
      background: #EBD4B0;
      padding: 8px;
      position: relative;
    }

    .tile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 10px;
      font-weight: 700;
    }

    .tile-number-badge {
      font-size: 14px;
      font-weight: 900;
      color: #000;
      padding: 2px 8px;
      background: #FFF;
      border: 2px solid #000;
      border-left: 4px solid #000;
    }

    .tile-grid-wrapper {
      background: #EBD4B0;
      border: 1px solid #999;
      padding: 2px;
    }

    .tile-grid {
      display: grid;
      grid-template-columns: repeat(16, 1fr);
      gap: 0;
    }

    .bead-cell {
      aspect-ratio: 1;
      border: 0.5px solid rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Courier New', monospace;
      font-size: 6px;
      font-weight: 700;
      background: #EBD4B0;
    }

    .tile-legend {
      margin-top: 4px;
      padding: 4px;
      background: #FFF;
      border: 1px solid #CCC;
      font-size: 7px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .legend-symbol {
      font-family: 'Courier New', monospace;
      font-weight: 900;
      font-size: 8px;
      width: 12px;
      height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F5F5F5;
      border: 1px solid #999;
    }

    .legend-swatch {
      width: 12px;
      height: 12px;
      border: 1px solid #999;
    }

    .legend-code {
      font-size: 7px;
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
  <div class="page-header">Tiles ${pageLabel}</div>

  <div class="tiles-grid">
    ${tilesOnPage.map((tile, idx) => {
      const tileColors = new Set(tile.beads.flat().map(c => c.dmcCode))

      return `
    <div class="tile-container">
      <div class="tile-header">
        <div class="tile-number-badge">${tile.tileNumber} |</div>
      </div>

      <div class="tile-grid-wrapper">
        <div class="tile-grid">
          ${tile.beads.flat().map(cell => {
            const mapping = colorMap.get(cell.dmcCode)
            const isLight = cell.rgb.r + cell.rgb.g + cell.rgb.b > 400
            return `
            <div class="bead-cell" style="color: ${isLight ? '#000' : '#FFF'};">
              ${mapping?.symbol || cell.symbol}
            </div>
            `
          }).join('')}
        </div>
      </div>

      <div class="tile-legend">
        ${Array.from(tileColors).map(code => {
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
      </div>
    </div>
      `
    }).join('')}
  </div>
</body>
</html>
  `
}

/**
 * Generate complete QBRIX booklet (cover + all tile spreads)
 */
export function generateCompleteBooklet(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  const coverPage = generateQBRIXCoverPage(result, options)
  const totalTiles = result.tiles.length
  const tilesPerPage = 12
  const numSpreadPages = Math.ceil(totalTiles / tilesPerPage)

  let booklet = coverPage.replace('</body>', '<div style="page-break-after: always;"></div></body>')

  // Add tile spread pages
  for (let i = 0; i < numSpreadPages; i++) {
    const startIndex = i * tilesPerPage
    const spreadPage = generateTileSpreadPage(result, startIndex)

    // Extract body content from spread page
    const bodyMatch = spreadPage.match(/<body>([\s\S]*)<\/body>/)
    if (bodyMatch) {
      const pageBreak = i < numSpreadPages - 1 ? '<div style="page-break-after: always;"></div>' : ''
      booklet = booklet.replace('</body>', `${bodyMatch[1]}${pageBreak}</body>`)
    }
  }

  return booklet
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
