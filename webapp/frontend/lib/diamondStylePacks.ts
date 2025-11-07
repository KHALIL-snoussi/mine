/**
 * Fixed Style Packs for Diamond Painting (Qbrix-style)
 * Each pack has a curated, fixed palette of 20-30 colors
 */

import { DMCColor } from './dmcColors'

export interface StylePack {
  id: string
  name: string
  description: string
  colors: DMCColor[] // Fixed palette of 20-30 colors
}

/**
 * A4 ORIGINAL PACK - Natural, realistic tones
 * Perfect for portraits, landscapes, pets
 */
export const A4_ORIGINAL_PACK: StylePack = {
  id: 'a4_original',
  name: 'A4 Original',
  description: 'Natural photorealistic tones for portraits and landscapes',
  colors: [
    // Whites & Creams (3)
    { code: 'WHITE', name: 'White', rgb: [252, 251, 248], hex: '#FCFBF8', category: 'White' },
    { code: 'ECRU', name: 'Ecru', rgb: [240, 234, 218], hex: '#F0EADA', category: 'Cream' },
    { code: '746', name: 'Off White', rgb: [252, 250, 240], hex: '#FCFAF0', category: 'Cream' },

    // Blacks & Grays (4)
    { code: '310', name: 'Black', rgb: [0, 0, 0], hex: '#000000', category: 'Black' },
    { code: '413', name: 'Dark Pewter Gray', rgb: [86, 86, 86], hex: '#565656', category: 'Gray' },
    { code: '414', name: 'Steel Gray', rgb: [140, 140, 140], hex: '#8C8C8C', category: 'Gray' },
    { code: '762', name: 'Light Pearl Gray', rgb: [236, 236, 236], hex: '#ECECEC', category: 'Gray' },

    // Skin Tones (4)
    { code: '950', name: 'Light Desert Sand', rgb: [238, 211, 196], hex: '#EED3C4', category: 'Skin' },
    { code: '945', name: 'Tawny', rgb: [250, 211, 187], hex: '#FAD3BB', category: 'Skin' },
    { code: '3774', name: 'Very Light Desert Sand', rgb: [255, 236, 224], hex: '#FFECE0', category: 'Skin' },
    { code: '3773', name: 'Medium Desert Sand', rgb: [221, 182, 155], hex: '#DDB69B', category: 'Skin' },

    // Browns (3)
    { code: '434', name: 'Light Brown', rgb: [152, 94, 51], hex: '#985E33', category: 'Brown' },
    { code: '801', name: 'Dark Coffee Brown', rgb: [101, 57, 25], hex: '#653919', category: 'Brown' },
    { code: '838', name: 'Dark Beige Brown', rgb: [89, 73, 55], hex: '#594937', category: 'Brown' },

    // Reds & Pinks (3)
    { code: '321', name: 'Red', rgb: [199, 0, 0], hex: '#C70000', category: 'Red' },
    { code: '818', name: 'Baby Pink', rgb: [255, 214, 229], hex: '#FFD6E5', category: 'Pink' },
    { code: '899', name: 'Medium Rose', rgb: [246, 114, 147], hex: '#F67293', category: 'Pink' },

    // Oranges & Yellows (3)
    { code: '740', name: 'Tangerine', rgb: [255, 139, 0], hex: '#FF8B00', category: 'Orange' },
    { code: '972', name: 'Deep Canary', rgb: [255, 181, 21], hex: '#FFB515', category: 'Yellow' },
    { code: '727', name: 'Very Light Topaz', rgb: [255, 243, 193], hex: '#FFF3C1', category: 'Yellow' },

    // Greens (3)
    { code: '700', name: 'Bright Green', rgb: [10, 117, 36], hex: '#0A7524', category: 'Green' },
    { code: '702', name: 'Kelly Green', rgb: [89, 163, 61], hex: '#59A33D', category: 'Green' },
    { code: '3348', name: 'Light Yellow Green', rgb: [200, 216, 184], hex: '#C8D8B8', category: 'Green' },

    // Blues (3)
    { code: '798', name: 'Dark Delft Blue', rgb: [70, 105, 135], hex: '#466987', category: 'Blue' },
    { code: '809', name: 'Delft Blue', rgb: [148, 186, 217], hex: '#94BAD9', category: 'Blue' },
    { code: '3325', name: 'Light Baby Blue', rgb: [204, 225, 239], hex: '#CCE1EF', category: 'Blue' },

    // Purples (2)
    { code: '208', name: 'Dark Lavender', rgb: [121, 79, 139], hex: '#794F8B', category: 'Purple' },
    { code: '211', name: 'Light Lavender', rgb: [221, 201, 221], hex: '#DDC9DD', category: 'Purple' },
  ]
}

/**
 * A4 VINTAGE PACK - Warm, nostalgic tones
 * Perfect for vintage photos, warm scenes
 */
export const A4_VINTAGE_PACK: StylePack = {
  id: 'a4_vintage',
  name: 'A4 Vintage',
  description: 'Warm nostalgic tones with sepia and earth colors',
  colors: [
    // Warm Whites & Creams (3)
    { code: 'ECRU', name: 'Ecru', rgb: [240, 234, 218], hex: '#F0EADA', category: 'Cream' },
    { code: '712', name: 'Cream', rgb: [255, 251, 239], hex: '#FFFBEF', category: 'Cream' },
    { code: '738', name: 'Very Light Tan', rgb: [236, 204, 158], hex: '#ECCC9E', category: 'Brown' },

    // Warm Grays & Browns (5)
    { code: '3371', name: 'Black Brown', rgb: [37, 26, 22], hex: '#251A16', category: 'Brown' },
    { code: '838', name: 'Dark Beige Brown', rgb: [89, 73, 55], hex: '#594937', category: 'Brown' },
    { code: '840', name: 'Medium Beige Brown', rgb: [154, 124, 92], hex: '#9A7C5C', category: 'Brown' },
    { code: '842', name: 'Light Beige Brown', rgb: [209, 186, 161], hex: '#D1BAA1', category: 'Brown' },
    { code: '3781', name: 'Dark Mocha', rgb: [108, 84, 67], hex: '#6C5443', category: 'Brown' },

    // Vintage Skin Tones (4)
    { code: '945', name: 'Tawny', rgb: [250, 211, 187], hex: '#FAD3BB', category: 'Skin' },
    { code: '950', name: 'Light Desert Sand', rgb: [238, 211, 196], hex: '#EED3C4', category: 'Skin' },
    { code: '3855', name: 'Light Autumn Gold', rgb: [250, 186, 133], hex: '#FABA85', category: 'Skin' },
    { code: '3856', name: 'Ultra Light Mahogany', rgb: [255, 211, 181], hex: '#FFD3B5', category: 'Skin' },

    // Warm Reds & Oranges (4)
    { code: '817', name: 'Dark Coral Red', rgb: [187, 0, 0], hex: '#BB0000', category: 'Red' },
    { code: '902', name: 'Garnet', rgb: [115, 0, 38], hex: '#730026', category: 'Red' },
    { code: '920', name: 'Medium Copper', rgb: [193, 94, 44], hex: '#C15E2C', category: 'Orange' },
    { code: '970', name: 'Light Pumpkin', rgb: [247, 139, 19], hex: '#F78B13', category: 'Orange' },

    // Muted Yellows & Golds (3)
    { code: '3820', name: 'Dark Straw', rgb: [223, 182, 95], hex: '#DFB65F', category: 'Yellow' },
    { code: '3822', name: 'Light Straw', rgb: [246, 220, 152], hex: '#F6DC98', category: 'Yellow' },
    { code: '437', name: 'Light Tan', rgb: [228, 187, 142], hex: '#E4BB8E', category: 'Brown' },

    // Muted Greens (3)
    { code: '522', name: 'Fern Green', rgb: [150, 150, 127], hex: '#96967F', category: 'Green' },
    { code: '3346', name: 'Hunter Green', rgb: [83, 128, 89], hex: '#538059', category: 'Green' },
    { code: '3347', name: 'Yellow Green', rgb: [117, 153, 107], hex: '#75996B', category: 'Green' },

    // Dusty Blues & Purples (3)
    { code: '930', name: 'Dark Antique Blue', rgb: [74, 100, 120], hex: '#4A6478', category: 'Blue' },
    { code: '931', name: 'Medium Antique Blue', rgb: [106, 133, 151], hex: '#6A8597', category: 'Blue' },
    { code: '3042', name: 'Light Antique Violet', rgb: [199, 181, 193], hex: '#C7B5C1', category: 'Purple' },

    // Dusty Pinks (2)
    { code: '3354', name: 'Light Dusty Rose', rgb: [242, 213, 219], hex: '#F2D5DB', category: 'Pink' },
    { code: '3350', name: 'Dusty Rose', rgb: [204, 102, 119], hex: '#CC6677', category: 'Pink' },
  ]
}

/**
 * A4 POP ART PACK - Bold, vibrant colors
 * Perfect for modern art, bright scenes
 */
export const A4_POP_ART_PACK: StylePack = {
  id: 'a4_pop_art',
  name: 'A4 Pop Art',
  description: 'Bold vibrant colors for modern and artistic styles',
  colors: [
    // Pure Whites & Blacks (2)
    { code: 'B5200', name: 'Snow White', rgb: [255, 255, 255], hex: '#FFFFFF', category: 'White' },
    { code: '310', name: 'Black', rgb: [0, 0, 0], hex: '#000000', category: 'Black' },

    // Bright Reds & Pinks (4)
    { code: '666', name: 'Bright Red', rgb: [227, 29, 66], hex: '#E31D42', category: 'Red' },
    { code: '321', name: 'Red', rgb: [199, 0, 0], hex: '#C70000', category: 'Red' },
    { code: '3708', name: 'Melon', rgb: [254, 165, 180], hex: '#FEA5B4', category: 'Pink' },
    { code: '3607', name: 'Plum', rgb: [199, 79, 139], hex: '#C74F8B', category: 'Purple' },

    // Vibrant Oranges & Yellows (4)
    { code: '740', name: 'Tangerine', rgb: [255, 139, 0], hex: '#FF8B00', category: 'Orange' },
    { code: '741', name: 'Medium Tangerine', rgb: [255, 163, 0], hex: '#FFA300', category: 'Orange' },
    { code: '973', name: 'Bright Canary', rgb: [255, 227, 0], hex: '#FFE300', category: 'Yellow' },
    { code: '307', name: 'Lemon', rgb: [253, 237, 84], hex: '#FDED54', category: 'Yellow' },

    // Electric Greens (4)
    { code: '704', name: 'Bright Chartreuse', rgb: [174, 209, 109], hex: '#AED16D', category: 'Green' },
    { code: '907', name: 'Light Parrot Green', rgb: [200, 219, 87], hex: '#C8DB57', category: 'Green' },
    { code: '700', name: 'Bright Green', rgb: [10, 117, 36], hex: '#0A7524', category: 'Green' },
    { code: '912', name: 'Emerald Green', rgb: [23, 150, 111], hex: '#17966F', category: 'Green' },

    // Vivid Blues & Cyans (4)
    { code: '996', name: 'Electric Blue', rgb: [0, 164, 214], hex: '#00A4D6', category: 'Blue' },
    { code: '809', name: 'Delft Blue', rgb: [148, 186, 217], hex: '#94BAD9', category: 'Blue' },
    { code: '3843', name: 'Electric Blue', rgb: [20, 170, 208], hex: '#14AAD0', category: 'Blue' },
    { code: '3325', name: 'Baby Blue', rgb: [204, 225, 239], hex: '#CCE1EF', category: 'Blue' },

    // Bold Purples (3)
    { code: '550', name: 'Very Dark Violet', rgb: [92, 24, 92], hex: '#5C185C', category: 'Purple' },
    { code: '553', name: 'Violet', rgb: [163, 99, 139], hex: '#A3638B', category: 'Purple' },
    { code: '210', name: 'Medium Lavender', rgb: [195, 159, 195], hex: '#C39FC3', category: 'Purple' },

    // Hot Pinks & Magentas (3)
    { code: '3609', name: 'Ultra Light Plum', rgb: [247, 192, 222], hex: '#F7C0DE', category: 'Pink' },
    { code: '3608', name: 'Medium Plum', rgb: [220, 119, 170], hex: '#DC77AA', category: 'Purple' },
    { code: '602', name: 'Medium Cranberry', rgb: [229, 72, 119], hex: '#E54877', category: 'Pink' },

    // Mid Grays (2)
    { code: '414', name: 'Steel Gray', rgb: [140, 140, 140], hex: '#8C8C8C', category: 'Gray' },
    { code: '762', name: 'Light Pearl Gray', rgb: [236, 236, 236], hex: '#ECECEC', category: 'Gray' },
  ]
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

/**
 * Automatically detect the best style pack for an image
 * Based on color temperature and saturation
 */
export async function detectStylePack(imageUrl: string): Promise<StylePack> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(A4_ORIGINAL_PACK) // Default fallback
        return
      }

      // Sample colors from image
      const sampleSize = 50
      canvas.width = sampleSize
      canvas.height = sampleSize
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
      const data = imageData.data

      let totalSaturation = 0
      let totalWarmth = 0
      let totalBrightness = 0
      let pixelCount = 0

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // Calculate saturation
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const saturation = max === 0 ? 0 : (max - min) / max

        // Calculate warmth (red/orange bias)
        const warmth = (r - b) / 255

        // Calculate brightness
        const brightness = (r + g + b) / (3 * 255)

        totalSaturation += saturation
        totalWarmth += warmth
        totalBrightness += brightness
        pixelCount++
      }

      const avgSaturation = totalSaturation / pixelCount
      const avgWarmth = totalWarmth / pixelCount
      const avgBrightness = totalBrightness / pixelCount

      // Decision logic:
      // High saturation (>0.4) + high brightness (>0.5) = POP ART
      // Warm tone (warmth > 0.1) + lower saturation = VINTAGE
      // Otherwise = ORIGINAL

      if (avgSaturation > 0.4 && avgBrightness > 0.5) {
        resolve(A4_POP_ART_PACK)
      } else if (avgWarmth > 0.1 && avgSaturation < 0.4) {
        resolve(A4_VINTAGE_PACK)
      } else {
        resolve(A4_ORIGINAL_PACK)
      }
    }

    img.onerror = () => {
      resolve(A4_ORIGINAL_PACK) // Default fallback
    }

    img.src = imageUrl
  })
}
