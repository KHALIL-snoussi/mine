/**
 * Vitest Test Setup
 *
 * This file configures the test environment
 * Rename to test-setup.ts to activate
 */

import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock HTMLCanvasElement for Node.js environment
// Note: Requires 'canvas' package: npm install -D canvas
if (typeof HTMLCanvasElement === 'undefined') {
  global.HTMLCanvasElement = class HTMLCanvasElement {
    getContext() {
      return {
        fillStyle: '',
        fillRect: () => {},
        strokeStyle: '',
        strokeRect: () => {},
        drawImage: () => {},
        getImageData: () => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1,
        }),
        putImageData: () => {},
        createImageData: () => ({
          data: new Uint8ClampedArray(4),
          width: 1,
          height: 1,
        }),
        createRadialGradient: () => ({
          addColorStop: () => {},
        }),
        canvas: {
          toDataURL: () => 'data:image/png;base64,mock',
        },
      }
    }

    toDataURL() {
      return 'data:image/png;base64,mock'
    }
  } as any
}

// Mock Image for Node.js environment
if (typeof Image === 'undefined') {
  global.Image = class Image {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''
    width = 0
    height = 0
    crossOrigin = ''

    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload()
      }, 0)
    }
  } as any
}

// Mock document.createElement for specific elements
const originalCreateElement = document.createElement.bind(document)
document.createElement = function(tagName: string, options?: any) {
  if (tagName === 'canvas') {
    return new HTMLCanvasElement() as any
  }
  return originalCreateElement(tagName, options)
}

console.log('✓ Test environment configured')
