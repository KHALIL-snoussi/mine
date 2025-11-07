/**
 * Diamond Painting PDF Generator
 * Creates comprehensive PDF with pattern, legend, and materials list
 */

import { DiamondPaintingResult, DiamondGrid, calculatePhysicalSize } from './diamondPaintingGenerator'
import { DMCColorUsage } from './diamondPaintingGenerator'

export interface PDFGeneratorOptions {
  includePattern: boolean
  includeLegend: boolean
  includeMaterialsList: boolean
  includeInstructions: boolean
  title?: string
  customerName?: string
}

/**
 * Generate materials list as HTML (for display or PDF conversion)
 */
export function generateMaterialsListHTML(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): string {
  const { colorsUsed, dimensions, estimatedDiamonds, difficulty, estimatedTime } = result
  const physicalSize = calculatePhysicalSize(dimensions.width, dimensions.height)

  // Calculate total bags needed (each bag typically contains 200 diamonds)
  const diamondsPerBag = 200
  const totalBags = colorsUsed.reduce((sum, color) => {
    return sum + Math.ceil(color.count / diamondsPerBag)
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
        <div class="info-value">${dimensions.width} × ${dimensions.height} diamonds</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
          ${physicalSize.cm.width} × ${physicalSize.cm.height} cm<br>
          ${physicalSize.inches.width} × ${physicalSize.inches.height} inches
        </div>
      </div>

      <div class="info-box">
        <div class="info-label">Total Diamonds</div>
        <div class="info-value">${estimatedDiamonds.toLocaleString()}</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
          Approximately ${totalBags} bags needed
        </div>
      </div>

      <div class="info-box">
        <div class="info-label">Colors Used</div>
        <div class="info-value">${colorsUsed.length} DMC Colors</div>
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
        ${colorsUsed
          .map(
            (color) => `
          <tr>
            <td>
              <span class="symbol-badge">${color.symbol}</span>
            </td>
            <td>
              <span class="color-swatch" style="background-color: ${color.dmcColor.hex};"></span>
            </td>
            <td style="font-weight: bold; font-family: monospace;">${color.dmcColor.code}</td>
            <td>${color.dmcColor.name}</td>
            <td style="font-weight: bold;">${color.count.toLocaleString()}</td>
            <td>${Math.ceil(color.count / diamondsPerBag)}</td>
            <td>${color.percentage.toFixed(1)}%</td>
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
        <div>☐ High-quality adhesive canvas (${physicalSize.cm.width} × ${physicalSize.cm.height} cm)</div>
        <div>☐ Diamond applicator pen/tool</div>
        <div>☐ Wax/putty for pen tip</div>
        <div>☐ Diamond tray with grooves</div>
        <div>☐ ${colorsUsed.length} labeled storage bags/containers</div>
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
        Order <strong>${totalBags} total bags</strong> (approximately ${estimatedDiamonds.toLocaleString()} diamonds).
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
export function generatePatternLegendHTML(colorsUsed: DMCColorUsage[]): string {
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
    ${colorsUsed
      .map(
        (color) => `
      <div class="legend-item">
        <div class="symbol">${color.symbol}</div>
        <div class="color-box" style="background-color: ${color.dmcColor.hex};"></div>
        <div class="info">
          <div class="dmc-code">DMC ${color.dmcColor.code}</div>
          <div class="color-name">${color.dmcColor.name}</div>
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
 * Download materials list as HTML file
 */
export function downloadMaterialsList(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  const html = generateMaterialsListHTML(result, options)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diamond-painting-materials-${options.title || 'custom'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Print materials list
 */
export function printMaterialsList(
  result: DiamondPaintingResult,
  options: { title?: string; customerName?: string } = {}
): void {
  const html = generateMaterialsListHTML(result, options)
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
