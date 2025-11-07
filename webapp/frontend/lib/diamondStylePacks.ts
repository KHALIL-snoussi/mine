/**
 * Fixed Style Packs for Diamond Painting (QBRIX-style)
 * Each pack has exactly 7 curated DMC colors
 * All styles use same A4 canvas (~10k diamonds) with different processing
 */

import { DMCColor } from './dmcColors'

export interface StylePackColor extends DMCColor {
  defaultSymbol: string // Guaranteed unique symbol
  targetPercentage: number // Expected usage percentage
}

export interface StylePack {
  id: string
  name: string
  description: string
  colors: StylePackColor[] // Fixed palette of 7 colors with metadata

  // Palette balancing metadata
  foregroundTarget: number // Target % for foreground colors (e.g., 45)
  backgroundTarget: number // Target % for background colors (e.g., 55)
  minColorPercent: number // Floor: no color drops below this % (e.g., 3-5)

  // Visual style adjustments
  contrastBoost: number // 1.0 = none, 1.5 = high, 0.85 = soft
  saturationBias: number // -0.2 to +0.5 (negative desaturates, positive boosts)
}

/**
 * ORIGINAL - Neutral, photo-faithful treatment
 * Colors stay close to the source image, balanced contrast
 */
export const A4_ORIGINAL_PACK: StylePack = {
  id: 'a4_original',
  name: 'Original',
  description: 'Neutral, photo-faithful treatment with balanced colors',
  colors: [
    { code: '310', name: 'Black', rgb: [0, 0, 0], hex: '#000000', category: 'Black', defaultSymbol: 'A', targetPercentage: 12 },
    { code: 'WHITE', name: 'White', rgb: [252, 251, 248], hex: '#FCFBF8', category: 'White', defaultSymbol: 'B', targetPercentage: 18 },
    { code: '414', name: 'Steel Gray', rgb: [140, 140, 140], hex: '#8C8C8C', category: 'Gray', defaultSymbol: 'C', targetPercentage: 15 },
    { code: '945', name: 'Tawny', rgb: [250, 211, 187], hex: '#FAD3BB', category: 'Skin', defaultSymbol: 'D', targetPercentage: 25 },
    { code: '434', name: 'Light Brown', rgb: [152, 94, 51], hex: '#985E33', category: 'Brown', defaultSymbol: 'E', targetPercentage: 14 },
    { code: '809', name: 'Delft Blue', rgb: [148, 186, 217], hex: '#94BAD9', category: 'Blue', defaultSymbol: 'F', targetPercentage: 10 },
    { code: '702', name: 'Kelly Green', rgb: [89, 163, 61], hex: '#59A33D', category: 'Green', defaultSymbol: 'G', targetPercentage: 6 },
  ],
  foregroundTarget: 45,
  backgroundTarget: 55,
  minColorPercent: 5, // All 7 colors must appear with at least 5%
  contrastBoost: 1.0, // Neutral - no boost
  saturationBias: 0.0, // Neutral - preserve natural colors
}

/**
 * VINTAGE - Muted, warm-leaning palette inspired by aged prints
 * Soft contrast, sepia/yellow shift, nostalgic look
 */
export const A4_VINTAGE_PACK: StylePack = {
  id: 'a4_vintage',
  name: 'Vintage',
  description: 'Warm nostalgic tones with sepia shift and soft contrast',
  colors: [
    { code: '3371', name: 'Black Brown', rgb: [37, 26, 22], hex: '#251A16', category: 'Brown', defaultSymbol: 'A', targetPercentage: 14 },
    { code: 'ECRU', name: 'Ecru', rgb: [240, 234, 218], hex: '#F0EADA', category: 'Cream', defaultSymbol: 'B', targetPercentage: 20 },
    { code: '838', name: 'Dark Beige Brown', rgb: [89, 73, 55], hex: '#594937', category: 'Brown', defaultSymbol: 'C', targetPercentage: 16 },
    { code: '738', name: 'Very Light Tan', rgb: [236, 204, 158], hex: '#ECCC9E', category: 'Brown', defaultSymbol: 'D', targetPercentage: 22 },
    { code: '3781', name: 'Dark Mocha', rgb: [108, 84, 67], hex: '#6C5443', category: 'Brown', defaultSymbol: 'E', targetPercentage: 15 },
    { code: '945', name: 'Tawny', rgb: [250, 211, 187], hex: '#FAD3BB', category: 'Skin', defaultSymbol: 'F', targetPercentage: 8 },
    { code: '3820', name: 'Dark Straw', rgb: [223, 182, 95], hex: '#DFB65F', category: 'Yellow', defaultSymbol: 'G', targetPercentage: 5 },
  ],
  foregroundTarget: 42,
  backgroundTarget: 58,
  minColorPercent: 4, // Softer floor - warm browns can overlap
  contrastBoost: 0.85, // Softer contrast for vintage feel
  saturationBias: -0.15, // Slight desaturation for aged look
}

/**
 * POP ART - Bold, posterized aesthetic
 * High saturation, sharp outlines, flat color blocks, comic-style
 */
export const A4_POP_ART_PACK: StylePack = {
  id: 'a4_pop_art',
  name: 'Pop Art',
  description: 'Bold vibrant colors with high saturation and comic-style blocks',
  colors: [
    { code: '310', name: 'Black', rgb: [0, 0, 0], hex: '#000000', category: 'Black', defaultSymbol: 'A', targetPercentage: 15 },
    { code: 'B5200', name: 'Snow White', rgb: [255, 255, 255], hex: '#FFFFFF', category: 'White', defaultSymbol: 'B', targetPercentage: 16 },
    { code: '666', name: 'Bright Red', rgb: [227, 29, 66], hex: '#E31D42', category: 'Red', defaultSymbol: 'C', targetPercentage: 18 },
    { code: '996', name: 'Electric Blue', rgb: [0, 164, 214], hex: '#00A4D6', category: 'Blue', defaultSymbol: 'D', targetPercentage: 16 },
    { code: '973', name: 'Bright Canary', rgb: [255, 227, 0], hex: '#FFE300', category: 'Yellow', defaultSymbol: 'E', targetPercentage: 14 },
    { code: '602', name: 'Medium Cranberry', rgb: [229, 72, 119], hex: '#E54877', category: 'Pink', defaultSymbol: 'F', targetPercentage: 12 },
    { code: '700', name: 'Bright Green', rgb: [10, 117, 36], hex: '#0A7524', category: 'Green', defaultSymbol: 'G', targetPercentage: 9 },
  ],
  foregroundTarget: 50,
  backgroundTarget: 50,
  minColorPercent: 7, // ALL colors must be visible (comic style)
  contrastBoost: 1.6, // High contrast for punchy pop-art look
  saturationBias: 0.4, // Strong saturation boost
}

/**
 * Get all style packs
 */
export function getAllStylePacks(): StylePack[] {
  return [A4_ORIGINAL_PACK, A4_VINTAGE_PACK, A4_POP_ART_PACK]
}

/**
 * Get style pack by ID
 */
export function getStylePackById(id: string): StylePack | undefined {
  return getAllStylePacks().find(pack => pack.id === id)
}
