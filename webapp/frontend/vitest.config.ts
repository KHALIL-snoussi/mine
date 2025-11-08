/**
 * Vitest Configuration Template
 *
 * To enable testing:
 * 1. Install dependencies:
 *    npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom canvas
 *
 * 2. Rename this file to vitest.config.ts
 *
 * 3. Add test script to package.json:
 *    "scripts": {
 *      "test": "vitest",
 *      "test:ui": "vitest --ui",
 *      "test:coverage": "vitest --coverage"
 *    }
 *
 * 4. Run tests:
 *    npm test
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
