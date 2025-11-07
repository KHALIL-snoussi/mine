/**
 * QBRIX-Quality Diamond Painting PDF Generator
 * Creates professional PDF booklet with:
 * - Cover page with preview and materials
 * - 16×16 tile instruction pages
 * - Color legend
 * - Assembly guide
 */

import { AdvancedDiamondResult } from './advancedDiamondGenerator'

// For backwards compatibility with old calls
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
 * Generate QBRIX-style cover page HTML
 */
export function generateQBRIXCoverPage(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  const { beadCounts, dimensions, totalBeads, difficulty, estimatedTime, stylePack, imageDataUrl } = result

  // Calculate total bags needed (each bag contains 200 diamonds)
  const diamondsPerBag = 200
  const totalBags = beadCounts.reduce((sum, bead) => {
    return sum + Math.ceil(bead.count / diamondsPerBag)
  }, 0)

  // Format name
  const formatName = dimensions.widthBeads === 84 && dimensions.heightBeads === 119
    ? 'A4 Portrait'
    : dimensions.widthBeads === 119 && dimensions.heightBeads === 84
    ? 'A4 Landscape'
    : 'A4 Square'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QBRIX Diamond Painting - ${options.title || 'Custom Design'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: white;
      color: #000;
      padding: 30px;
    }

    /* QBRIX Status Strip */
    .status-strip {
      background: #000;
      color: white;
      padding: 12px 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-strip .format {
      font-size: 14px;
    }

    /* Hero Section */
    .hero-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }

    .preview-container {
      border: 2px solid #000;
      padding: 10px;
      background: #EBD4B0;
    }

    .preview-container img {
      width: 100%;
      height: auto;
      display: block;
    }

    .materials-summary {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .stat-box {
      border: 2px solid #000;
      padding: 15px;
      background: white;
    }

    .stat-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      color: #666;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #000;
    }

    .stat-detail {
      font-size: 11px;
      color: #666;
      margin-top: 5px;
    }

    /* Palette Section */
    .palette-section {
      margin-bottom: 40px;
    }

    .section-header {
      font-size: 18px;
      font-weight: bold;
      color: #000;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #000;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
    }

    .color-card {
      border: 2px solid #000;
      background: white;
      text-align: center;
      padding: 10px;
    }

    .color-swatch {
      width: 100%;
      height: 50px;
      border: 1px solid #ccc;
      margin-bottom: 8px;
    }

    .symbol-badge {
      display: inline-block;
      width: 32px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      background: #f5f5f5;
      border: 2px solid #000;
      font-weight: bold;
      font-family: monospace;
      font-size: 18px;
      margin-bottom: 6px;
    }

    .dmc-code {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 4px;
      font-family: monospace;
    }

    .bead-count {
      font-size: 11px;
      color: #666;
      margin-bottom: 2px;
    }

    .bag-count {
      font-size: 10px;
      font-weight: 600;
      color: #000;
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* Summary Table */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
    }

    .summary-table th {
      background: #000;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-table td {
      border: 1px solid #ddd;
      padding: 10px;
      font-size: 12px;
    }

    .summary-table tr:nth-child(even) {
      background: #f9f9f9;
    }

    @media print {
      body {
        padding: 15px;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <!-- QBRIX Status Strip -->
  <div class="status-strip">
    <div class="format">${formatName}</div>
    <div class="style">${stylePack.name} Pack</div>
    <div class="colors">${beadCounts.length} Colors</div>
  </div>

  <!-- Hero Section -->
  <div class="hero-section">
    <div class="preview-container">
      <img src="${imageDataUrl}" alt="Diamond Painting Preview" />
    </div>

    <div class="materials-summary">
      <div class="stat-box">
        <div class="stat-label">Canvas Size</div>
        <div class="stat-value">${dimensions.widthBeads} × ${dimensions.heightBeads}</div>
        <div class="stat-detail">${dimensions.widthCm} × ${dimensions.heightCm} cm</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Total Beads</div>
        <div class="stat-value">${totalBeads.toLocaleString()}</div>
        <div class="stat-detail">${totalBags} bags needed (200/bag)</div>
      </div>

      <div class="stat-box">
        <div class="stat-label">Difficulty</div>
        <div class="stat-value">${difficulty}</div>
        <div class="stat-detail">Est. ${estimatedTime}</div>
      </div>
    </div>
  </div>

  <!-- Palette Section -->
  <div class="palette-section">
    <div class="section-header">Color Palette &amp; Bead Requirements</div>

    <div class="color-grid">
      ${beadCounts
        .filter(bead => bead.count > 0)
        .map(
          (bead) => `
        <div class="color-card">
          <div class="color-swatch" style="background-color: ${bead.dmcColor.hex};"></div>
          <div class="symbol-badge">${bead.symbol}</div>
          <div class="dmc-code">DMC ${bead.dmcColor.code}</div>
          <div class="bead-count">${bead.count.toLocaleString()} beads</div>
          <div class="bead-count">${bead.percentage.toFixed(1)}%</div>
          <div class="bag-count">${Math.ceil(bead.count / diamondsPerBag)} bag${Math.ceil(bead.count / diamondsPerBag) !== 1 ? 's' : ''}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Detailed Materials Table -->
    <table class="summary-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>DMC Code</th>
          <th>Color Name</th>
          <th>Beads Needed</th>
          <th>Bags to Order</th>
          <th>% of Total</th>
        </tr>
      </thead>
      <tbody>
        ${beadCounts
          .filter(bead => bead.count > 0)
          .map(
            (bead) => `
          <tr>
            <td style="text-align: center; font-weight: bold; font-family: monospace;">${bead.symbol}</td>
            <td style="font-weight: bold; font-family: monospace;">DMC ${bead.dmcColor.code}</td>
            <td>${bead.dmcColor.name}</td>
            <td style="font-weight: bold;">${bead.count.toLocaleString()}</td>
            <td style="font-weight: bold;">${Math.ceil(bead.count / diamondsPerBag)}</td>
            <td>${bead.percentage.toFixed(1)}%</td>
          </tr>
        `
          )
          .join('')}
        <tr style="background: #f0f0f0; font-weight: bold;">
          <td colspan="3">TOTAL</td>
          <td>${totalBeads.toLocaleString()}</td>
          <td>${totalBags}</td>
          <td>100%</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `
}

/**
 * Generate QBRIX-style tile instruction page
 */
export function generateTilePage(
  result: DiamondPaintingResult,
  tileIndex: number
): string {
  const { tiles, stylePack, beadCounts, dimensions } = result
  const tile = tiles[tileIndex]

  if (!tile) {
    throw new Error(`Tile ${tileIndex} not found`)
  }

  // Get color mapping
  const colorMap = new Map(
    beadCounts.map(bc => [bc.dmcColor.code, { color: bc.dmcColor, symbol: bc.symbol }])
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tile ${tile.tileNumber} of ${tiles.length}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: white;
      padding: 20px;
    }

    .status-strip {
      background: #000;
      color: white;
      padding: 10px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }

    .tile-header {
      margin-bottom: 20px;
      text-align: center;
    }

    .tile-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .tile-info {
      font-size: 12px;
      color: #666;
    }

    .grid-container {
      display: inline-block;
      border: 3px solid #000;
      background: #EBD4B0;
      padding: 10px;
    }

    .grid-wrapper {
      display: grid;
      grid-template-columns: 30px repeat(${tile.width}, 1fr);
      grid-template-rows: 30px repeat(${tile.height}, 1fr);
      gap: 0;
    }

    .corner-cell {
      grid-column: 1;
      grid-row: 1;
      background: #fff;
      border: 1px solid #999;
    }

    .col-label {
      background: #fff;
      border: 1px solid #999;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
      padding: 5px 2px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    .row-label {
      background: #fff;
      border: 1px solid #999;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
      padding: 2px 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bead-cell {
      width: 28px;
      height: 28px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-family: monospace;
      font-size: 14px;
      position: relative;
    }

    .legend-section {
      margin-top: 30px;
      padding: 15px;
      border: 2px solid #000;
      background: white;
    }

    .legend-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }

    .legend-symbol {
      width: 24px;
      height: 24px;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-family: monospace;
      background: #f5f5f5;
    }

    .legend-swatch {
      width: 24px;
      height: 24px;
      border: 1px solid #999;
    }

    @media print {
      body {
        padding: 10px;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="status-strip">
    <div>Tile ${tile.tileNumber} of ${tiles.length}</div>
    <div>Position: Row ${tile.y + 1}, Col ${tile.x + 1}</div>
    <div>${stylePack.name} Pack</div>
  </div>

  <div class="tile-header">
    <div class="tile-number">Tile #${tile.tileNumber}</div>
    <div class="tile-info">
      Rows ${tile.startRow + 1}-${tile.startRow + tile.height} •
      Columns ${tile.startCol + 1}-${tile.startCol + tile.width}
    </div>
  </div>

  <div style="text-align: center;">
    <div class="grid-container">
      <div class="grid-wrapper">
        <!-- Corner cell -->
        <div class="corner-cell"></div>

        <!-- Column labels -->
        ${Array.from({ length: tile.width }, (_, i) => `
          <div class="col-label">${tile.startCol + i + 1}</div>
        `).join('')}

        <!-- Grid rows with row labels -->
        ${tile.beads.map((row, y) => `
          <div class="row-label">${tile.startRow + y + 1}</div>
          ${row.map((cell) => {
            const mapping = colorMap.get(cell.dmcCode)
            return `
              <div class="bead-cell" style="background-color: ${cell.rgb.r > 200 && cell.rgb.g > 200 && cell.rgb.b > 200 ? '#fff' : mapping?.color.hex || '#fff'};">
                <span style="color: ${cell.rgb.r + cell.rgb.g + cell.rgb.b > 400 ? '#000' : '#fff'}; text-shadow: ${cell.rgb.r + cell.rgb.g + cell.rgb.b > 400 ? '0 0 2px #fff' : '0 0 2px #000'};">
                  ${mapping?.symbol || cell.symbol}
                </span>
              </div>
            `
          }).join('')}
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Color Legend for this tile -->
  <div class="legend-section">
    <div class="legend-title">Colors in this tile:</div>
    <div class="legend-grid">
      ${Array.from(new Set(tile.beads.flat().map(c => c.dmcCode)))
        .map(code => {
          const mapping = colorMap.get(code)
          if (!mapping) return ''
          return `
            <div class="legend-item">
              <div class="legend-symbol">${mapping.symbol}</div>
              <div class="legend-swatch" style="background-color: ${mapping.color.hex};"></div>
              <div>
                <div style="font-weight: bold;">DMC ${code}</div>
                <div style="font-size: 10px; color: #666;">${mapping.color.name}</div>
              </div>
            </div>
          `
        })
        .filter(Boolean)
        .join('')}
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate materials list as HTML (for display or PDF conversion)
 */
export function generateMaterialsListHTML(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  const { beadCounts, dimensions, totalBeads, difficulty, estimatedTime } = result

  // Calculate total bags needed (each bag typically contains 200 diamonds)
  const diamondsPerBag = 200
  const totalBags = beadCounts.reduce((sum, bead) => {
    return sum + Math.ceil(bead.count / diamondsPerBag)
  }, 0)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Diamond Painting Materials List - ${options.title || 'Custom Design'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      padding: 40px;
      background: #ffffff;
      color: #333;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
    }

    h1 {
      font-size: 32px;
      color: #6366f1;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 5px;
    }

    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 24px;
      color: #6366f1;
      margin-bottom: 15px;
      border-left: 4px solid #6366f1;
      padding-left: 15px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .info-value {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
    }

    .difficulty-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
    }

    .difficulty-easy { background: #d1fae5; color: #065f46; }
    .difficulty-medium { background: #fef3c7; color: #92400e; }
    .difficulty-hard { background: #fed7aa; color: #9a3412; }
    .difficulty-expert { background: #fee2e2; color: #991b1b; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
    }

    thead {
      background: #6366f1;
      color: white;
    }

    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
    }

    tbody tr:hover {
      background: #f9fafb;
    }

    .color-swatch {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 4px;
      border: 2px solid #d1d5db;
      vertical-align: middle;
    }

    .symbol-badge {
      display: inline-block;
      width: 30px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      background: #f3f4f6;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      font-weight: bold;
      font-family: monospace;
    }

    .instructions {
      background: #f0f9ff;
      padding: 25px;
      border-radius: 8px;
      border-left: 4px solid #0ea5e9;
    }

    .instructions h3 {
      color: #0369a1;
      margin-bottom: 15px;
    }

    .instructions ol {
      margin-left: 20px;
    }

    .instructions li {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .tips {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      border-left: 4px solid #f59e0b;
    }

    .tips h4 {
      color: #92400e;
      margin-bottom: 10px;
    }

    .tips ul {
      margin-left: 20px;
    }

    .tips li {
      margin-bottom: 8px;
      color: #78350f;
    }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💎 Diamond Painting Materials List</h1>
    ${options.title ? `<div class="subtitle">${options.title}</div>` : ''}
    ${options.customerName ? `<div class="subtitle">Prepared for: ${options.customerName}</div>` : ''}
    <div class="subtitle">Generated: ${new Date().toLocaleDateString()}</div>
  </div>

  <!-- Project Overview -->
  <div class="section">
    <h2>📋 Project Overview</h2>
    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">Canvas Size</div>
        <div class="info-value">${dimensions.widthBeads} × ${dimensions.heightBeads} diamonds</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
          ${dimensions.widthCm} × ${dimensions.heightCm} cm<br>
          ${(dimensions.widthCm / 2.54).toFixed(1)} × ${(dimensions.heightCm / 2.54).toFixed(1)} inches
        </div>
      </div>

      <div class="info-box">
        <div class="info-label">Total Diamonds</div>
        <div class="info-value">${totalBeads.toLocaleString()}</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
          Approximately ${totalBags} bags needed
        </div>
      </div>

      <div class="info-box">
        <div class="info-label">Colors Used</div>
        <div class="info-value">${beadCounts.length} DMC Colors</div>
        <div style="margin-top: 8px;">
          <span class="difficulty-badge difficulty-${difficulty.toLowerCase()}">${difficulty}</span>
        </div>
      </div>

      <div class="info-box">
        <div class="info-label">Estimated Time</div>
        <div class="info-value">${estimatedTime}</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
          Based on average placement speed
        </div>
      </div>
    </div>
  </div>

  <!-- DMC Colors Required -->
  <div class="section">
    <h2>🎨 DMC Colors Required</h2>
    <p style="margin-bottom: 15px; color: #6b7280;">
      Order these DMC color codes from your diamond painting supplier. Each bag typically contains 200 diamonds.
    </p>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Color</th>
          <th>DMC Code</th>
          <th>Color Name</th>
          <th>Quantity</th>
          <th>Bags Needed</th>
          <th>% of Total</th>
        </tr>
      </thead>
      <tbody>
        ${beadCounts
          .map(
            (bead) => `
          <tr>
            <td>
              <span class="symbol-badge">${bead.symbol}</span>
            </td>
            <td>
              <span class="color-swatch" style="background-color: ${bead.dmcColor.hex};"></span>
            </td>
            <td style="font-weight: bold; font-family: monospace;">${bead.dmcColor.code}</td>
            <td>${bead.dmcColor.name}</td>
            <td style="font-weight: bold;">${bead.count.toLocaleString()}</td>
            <td>${Math.ceil(bead.count / diamondsPerBag)}</td>
            <td>${bead.percentage.toFixed(1)}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <!-- Materials & Tools Checklist -->
  <div class="section">
    <h2>🛠️ Complete Materials & Tools Checklist</h2>
    <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #e5e7eb;">
      <h3 style="margin-bottom: 15px; color: #1f2937;">Essential Items:</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div>☐ High-quality adhesive canvas (${dimensions.widthCm} × ${dimensions.heightCm} cm)</div>
        <div>☐ Diamond applicator pen/tool</div>
        <div>☐ Wax/putty for pen tip</div>
        <div>☐ Diamond tray with grooves</div>
        <div>☐ ${beadCounts.length} labeled storage bags/containers</div>
        <div>☐ Tweezers for corrections</div>
        <div>☐ Protective covering sheet</div>
        <div>☐ Roller or book for sealing</div>
      </div>

      <h3 style="margin: 20px 0 15px; color: #1f2937;">Optional but Recommended:</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div>☐ LED light pad or lamp</div>
        <div>☐ Magnifying glass</div>
        <div>☐ Multi-diamond pen (for faster work)</div>
        <div>☐ Storage organizer with labels</div>
        <div>☐ Frame (after completion)</div>
        <div>☐ Sealing glue or mod podge</div>
      </div>
    </div>
  </div>

  <!-- Instructions -->
  <div class="section">
    <div class="instructions">
      <h3>📖 Step-by-Step Instructions</h3>
      <ol>
        <li><strong>Prepare Your Workspace:</strong> Find a clean, flat surface with good lighting. Organize your DMC diamonds by color code using the labels provided.</li>
        <li><strong>Understand the Pattern:</strong> Each symbol on the canvas corresponds to a DMC color. Match symbols to the legend/materials list.</li>
        <li><strong>Start Small:</strong> Peel back only a small section of the protective film. Working in sections prevents the adhesive from drying out.</li>
        <li><strong>Pick Up Diamonds:</strong> Dip the pen tip in wax, then press onto a diamond. The diamond will stick to the pen.</li>
        <li><strong>Place Diamonds:</strong> Carefully place each diamond on its corresponding symbol. Press gently to secure.</li>
        <li><strong>Work Systematically:</strong> Complete one color at a time, or work row by row. Find what works best for you!</li>
        <li><strong>Check Your Work:</strong> Periodically step back to check for misplaced diamonds or gaps.</li>
        <li><strong>Seal and Frame:</strong> When complete, roll with a roller to secure all diamonds. Consider sealing with mod podge and framing.</li>
      </ol>

      <div class="tips">
        <h4>💡 Pro Tips for Success:</h4>
        <ul>
          <li><strong>Lighting is Key:</strong> Use a LED light pad or bright lamp to easily see symbols on the canvas.</li>
          <li><strong>Stay Organized:</strong> Label all your diamond bags with DMC codes before starting.</li>
          <li><strong>Take Breaks:</strong> Diamond painting should be relaxing! Take breaks to avoid eye strain.</li>
          <li><strong>Multi-Placer Tool:</strong> For large areas of one color, consider using a multi-diamond pen (places 3-9 at once).</li>
          <li><strong>Storage:</strong> If pausing for extended periods, cover your work with the protective sheet.</li>
          <li><strong>Corrections:</strong> Use tweezers to carefully remove and replace any misplaced diamonds.</li>
          <li><strong>Final Touch:</strong> After completion, frame your artwork or apply a sealant to preserve it for years to come!</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Ordering Information -->
  <div class="section">
    <h2>🛒 Where to Order Supplies</h2>
    <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #e5e7eb;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        You can order DMC diamonds and supplies from popular diamond painting suppliers:
      </p>
      <ul style="margin-left: 20px; line-height: 1.8;">
        <li><strong>Diamond Art Club</strong> - High-quality drills and canvases</li>
        <li><strong>ARTDOT</strong> - Wide selection of DMC colors and tools</li>
        <li><strong>Paint With Diamonds</strong> - Complete kits and individual colors</li>
        <li><strong>Amazon / Etsy</strong> - Search for "DMC diamond painting drills" by color code</li>
      </ul>
      <p style="margin-top: 15px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
        <strong>Important:</strong> When ordering, specify "DMC" color codes to ensure you receive the exact colors shown in this materials list.
        Order <strong>${totalBags} total bags</strong> (approximately ${totalBeads.toLocaleString()} diamonds).
      </p>
    </div>
  </div>

  <div class="footer">
    <p><strong>Diamond Painting AI</strong> - Transform Your Photos into Sparkling Art</p>
    <p style="margin-top: 5px;">This materials list is part of your custom diamond painting pattern.</p>
    <p style="margin-top: 5px;">For questions or support, visit our website or contact customer service.</p>
  </div>
</body>
</html>
  `

  return html
}

/**
 * Generate pattern legend as HTML
 */
export function generatePatternLegendHTML(beadCounts: import('./advancedDiamondGenerator').BeadCount[]): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Diamond Painting Legend</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }

    h1 {
      color: #6366f1;
      text-align: center;
    }

    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 30px;
    }

    .legend-item {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      background: white;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .color-box {
      width: 50px;
      height: 50px;
      border-radius: 6px;
      border: 2px solid #d1d5db;
      flex-shrink: 0;
    }

    .symbol {
      font-size: 24px;
      font-weight: bold;
      font-family: monospace;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .info {
      flex: 1;
    }

    .dmc-code {
      font-weight: bold;
      font-size: 18px;
      color: #1f2937;
    }

    .color-name {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <h1>Color Legend</h1>
  <div class="legend-grid">
    ${beadCounts
      .map(
        (bead) => `
      <div class="legend-item">
        <div class="symbol">${bead.symbol}</div>
        <div class="color-box" style="background-color: ${bead.dmcColor.hex};"></div>
        <div class="info">
          <div class="dmc-code">DMC ${bead.dmcColor.code}</div>
          <div class="color-name">${bead.dmcColor.name}</div>
        </div>
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
  `

  return html
}

/**
 * Download QBRIX-style cover page
 */
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

/**
 * Download specific tile page
 */
export function downloadTilePage(
  result: DiamondPaintingResult,
  tileIndex: number
): void {
  const html = generateTilePage(result, tileIndex)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tile-${tileIndex + 1}-of-${result.tiles.length}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Download all tile pages as separate HTML files (zipped)
 */
export function downloadAllTiles(result: DiamondPaintingResult): void {
  // For now, download them sequentially
  // In production, you'd want to use JSZip to create a single zip file
  result.tiles.forEach((_, index) => {
    setTimeout(() => downloadTilePage(result, index), index * 100)
  })
}

/**
 * Print QBRIX cover page
 */
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

/**
 * Print specific tile page
 */
export function printTilePage(result: DiamondPaintingResult, tileIndex: number): void {
  const html = generateTilePage(result, tileIndex)
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

/**
 * Download materials list as HTML file (legacy)
 */
export function downloadMaterialsList(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  // Use new QBRIX cover page instead
  downloadQBRIXCover(result, options)
}

/**
 * Print materials list (legacy)
 */
export function printMaterialsList(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  // Use new QBRIX cover page instead
  printQBRIXCover(result, options)
}
