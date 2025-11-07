/**
 * DMC Color Library for Diamond Painting
 * Contains standard DMC color codes with RGB values
 * Based on DMC's official color chart used in diamond painting
 */

export interface DMCColor {
  code: string // DMC color code (e.g., "310", "B5200")
  name: string // Color name
  rgb: [number, number, number] // RGB values
  hex: string // Hex color code
  category: string // Color category (e.g., "Black", "White", "Red", "Blue", etc.)
}

/**
 * Popular DMC colors used in diamond painting
 * This is a curated list of the most commonly used colors
 */
export const DMC_COLORS: DMCColor[] = [
  // Whites & Creams
  { code: 'B5200', name: 'Snow White', rgb: [255, 255, 255], hex: '#FFFFFF', category: 'White' },
  { code: 'WHITE', name: 'White', rgb: [252, 251, 248], hex: '#FCFBF8', category: 'White' },
  { code: 'ECRU', name: 'Ecru', rgb: [240, 234, 218], hex: '#F0EADA', category: 'Cream' },
  { code: '3865', name: 'Winter White', rgb: [249, 247, 241], hex: '#F9F7F1', category: 'White' },
  { code: '746', name: 'Off White', rgb: [252, 250, 240], hex: '#FCFAF0', category: 'Cream' },
  { code: '712', name: 'Cream', rgb: [255, 251, 239], hex: '#FFFBEF', category: 'Cream' },

  // Blacks & Grays
  { code: '310', name: 'Black', rgb: [0, 0, 0], hex: '#000000', category: 'Black' },
  { code: '3799', name: 'Very Dark Pewter Gray', rgb: [66, 66, 66], hex: '#424242', category: 'Gray' },
  { code: '413', name: 'Dark Pewter Gray', rgb: [86, 86, 86], hex: '#565656', category: 'Gray' },
  { code: '414', name: 'Dark Steel Gray', rgb: [140, 140, 140], hex: '#8C8C8C', category: 'Gray' },
  { code: '168', name: 'Very Light Pewter', rgb: [209, 209, 209], hex: '#D1D1D1', category: 'Gray' },
  { code: '762', name: 'Very Light Pearl Gray', rgb: [236, 236, 236], hex: '#ECECEC', category: 'Gray' },

  // Reds
  { code: '321', name: 'Red', rgb: [199, 0, 0], hex: '#C70000', category: 'Red' },
  { code: '304', name: 'Medium Red', rgb: [184, 0, 0], hex: '#B80000', category: 'Red' },
  { code: '666', name: 'Bright Red', rgb: [227, 29, 66], hex: '#E31D42', category: 'Red' },
  { code: '817', name: 'Very Dark Coral Red', rgb: [187, 0, 0], hex: '#BB0000', category: 'Red' },
  { code: '815', name: 'Medium Garnet', rgb: [131, 0, 0], hex: '#830000', category: 'Red' },
  { code: '902', name: 'Very Dark Garnet', rgb: [115, 0, 38], hex: '#730026', category: 'Red' },
  { code: '3350', name: 'Medium Dusty Rose', rgb: [204, 102, 119], hex: '#CC6677', category: 'Pink' },
  { code: '3687', name: 'Mauve', rgb: [188, 89, 102], hex: '#BC5966', category: 'Pink' },

  // Pinks
  { code: '818', name: 'Baby Pink', rgb: [255, 214, 229], hex: '#FFD6E5', category: 'Pink' },
  { code: '776', name: 'Medium Pink', rgb: [247, 155, 183], hex: '#F79BB7', category: 'Pink' },
  { code: '899', name: 'Medium Rose', rgb: [246, 114, 147], hex: '#F67293', category: 'Pink' },
  { code: '3708', name: 'Light Melon', rgb: [254, 165, 180], hex: '#FEA5B4', category: 'Pink' },
  { code: '3706', name: 'Medium Melon', rgb: [255, 123, 140], hex: '#FF7B8C', category: 'Pink' },

  // Oranges & Yellows
  { code: '740', name: 'Tangerine', rgb: [255, 139, 0], hex: '#FF8B00', category: 'Orange' },
  { code: '741', name: 'Medium Tangerine', rgb: [255, 163, 0], hex: '#FFA300', category: 'Orange' },
  { code: '970', name: 'Light Pumpkin', rgb: [247, 139, 19], hex: '#F78B13', category: 'Orange' },
  { code: '972', name: 'Deep Canary', rgb: [255, 181, 21], hex: '#FFB515', category: 'Yellow' },
  { code: '973', name: 'Bright Canary', rgb: [255, 227, 0], hex: '#FFE300', category: 'Yellow' },
  { code: '307', name: 'Lemon', rgb: [253, 237, 84], hex: '#FDED54', category: 'Yellow' },
  { code: '444', name: 'Dark Lemon', rgb: [255, 214, 0], hex: '#FFD600', category: 'Yellow' },
  { code: '727', name: 'Very Light Topaz', rgb: [255, 243, 193], hex: '#FFF3C1', category: 'Yellow' },

  // Greens
  { code: '699', name: 'Green', rgb: [5, 101, 23], hex: '#056517', category: 'Green' },
  { code: '700', name: 'Bright Green', rgb: [10, 117, 36], hex: '#0A7524', category: 'Green' },
  { code: '701', name: 'Light Green', rgb: [79, 138, 66], hex: '#4F8A42', category: 'Green' },
  { code: '702', name: 'Kelly Green', rgb: [89, 163, 61], hex: '#59A33D', category: 'Green' },
  { code: '703', name: 'Chartreuse', rgb: [123, 182, 97], hex: '#7BB661', category: 'Green' },
  { code: '704', name: 'Bright Chartreuse', rgb: [174, 209, 109], hex: '#AED16D', category: 'Green' },
  { code: '907', name: 'Light Parrot Green', rgb: [200, 219, 87], hex: '#C8DB57', category: 'Green' },
  { code: '911', name: 'Medium Emerald Green', rgb: [21, 122, 87], hex: '#157A57', category: 'Green' },
  { code: '912', name: 'Light Emerald Green', rgb: [23, 150, 111], hex: '#17966F', category: 'Green' },
  { code: '3346', name: 'Hunter Green', rgb: [83, 128, 89], hex: '#538059', category: 'Green' },
  { code: '3347', name: 'Medium Yellow Green', rgb: [117, 153, 107], hex: '#75996B', category: 'Green' },
  { code: '3348', name: 'Light Yellow Green', rgb: [200, 216, 184], hex: '#C8D8B8', category: 'Green' },

  // Blues
  { code: '311', name: 'Medium Navy Blue', rgb: [1, 65, 112], hex: '#014170', category: 'Blue' },
  { code: '312', name: 'Very Dark Baby Blue', rgb: [35, 78, 112], hex: '#234E70', category: 'Blue' },
  { code: '322', name: 'Dark Baby Blue', rgb: [90, 143, 184], hex: '#5A8FB8', category: 'Blue' },
  { code: '334', name: 'Medium Baby Blue', rgb: [132, 177, 203], hex: '#84B1CB', category: 'Blue' },
  { code: '809', name: 'Delft Blue', rgb: [148, 186, 217], hex: '#94BAD9', category: 'Blue' },
  { code: '798', name: 'Dark Delft Blue', rgb: [70, 105, 135], hex: '#466987', category: 'Blue' },
  { code: '796', name: 'Dark Royal Blue', rgb: [25, 73, 138], hex: '#19498A', category: 'Blue' },
  { code: '820', name: 'Very Dark Royal Blue', rgb: [13, 54, 113], hex: '#0D3671', category: 'Blue' },
  { code: '825', name: 'Dark Blue', rgb: [53, 93, 140], hex: '#355D8C', category: 'Blue' },
  { code: '826', name: 'Medium Blue', rgb: [88, 134, 179], hex: '#5886B3', category: 'Blue' },
  { code: '827', name: 'Very Light Blue', rgb: [189, 214, 231], hex: '#BDD6E7', category: 'Blue' },
  { code: '3325', name: 'Light Baby Blue', rgb: [204, 225, 239], hex: '#CCE1EF', category: 'Blue' },
  { code: '3755', name: 'Baby Blue', rgb: [158, 194, 216], hex: '#9EC2D8', category: 'Blue' },
  { code: '3760', name: 'Medium Wedgewood', rgb: [110, 157, 175], hex: '#6E9DAF', category: 'Blue' },

  // Purples & Violets
  { code: '208', name: 'Very Dark Lavender', rgb: [121, 79, 139], hex: '#794F8B', category: 'Purple' },
  { code: '209', name: 'Dark Lavender', rgb: [163, 123, 167], hex: '#A37BA7', category: 'Purple' },
  { code: '210', name: 'Medium Lavender', rgb: [195, 159, 195], hex: '#C39FC3', category: 'Purple' },
  { code: '211', name: 'Light Lavender', rgb: [221, 201, 221], hex: '#DDC9DD', category: 'Purple' },
  { code: '550', name: 'Very Dark Violet', rgb: [92, 24, 92], hex: '#5C185C', category: 'Purple' },
  { code: '552', name: 'Medium Violet', rgb: [128, 58, 107], hex: '#803A6B', category: 'Purple' },
  { code: '553', name: 'Violet', rgb: [163, 99, 139], hex: '#A3638B', category: 'Purple' },
  { code: '554', name: 'Light Violet', rgb: [222, 192, 214], hex: '#DEC0D6', category: 'Purple' },
  { code: '3607', name: 'Light Plum', rgb: [199, 79, 139], hex: '#C74F8B', category: 'Purple' },
  { code: '3608', name: 'Medium Plum', rgb: [220, 119, 170], hex: '#DC77AA', category: 'Purple' },
  { code: '3609', name: 'Ultra Light Plum', rgb: [247, 192, 222], hex: '#F7C0DE', category: 'Purple' },

  // Browns & Tans
  { code: '433', name: 'Medium Brown', rgb: [122, 69, 31], hex: '#7A451F', category: 'Brown' },
  { code: '434', name: 'Light Brown', rgb: [152, 94, 51], hex: '#985E33', category: 'Brown' },
  { code: '435', name: 'Very Light Brown', rgb: [184, 119, 72], hex: '#B87748', category: 'Brown' },
  { code: '436', name: 'Tan', rgb: [203, 144, 81], hex: '#CB9051', category: 'Brown' },
  { code: '437', name: 'Light Tan', rgb: [228, 187, 142], hex: '#E4BB8E', category: 'Brown' },
  { code: '738', name: 'Very Light Tan', rgb: [236, 204, 158], hex: '#ECCC9E', category: 'Brown' },
  { code: '801', name: 'Dark Coffee Brown', rgb: [101, 57, 25], hex: '#653919', category: 'Brown' },
  { code: '838', name: 'Very Dark Beige Brown', rgb: [89, 73, 55], hex: '#594937', category: 'Brown' },
  { code: '839', name: 'Dark Beige Brown', rgb: [106, 86, 67], hex: '#6A5643', category: 'Brown' },
  { code: '840', name: 'Medium Beige Brown', rgb: [154, 124, 92], hex: '#9A7C5C', category: 'Brown' },
  { code: '841', name: 'Light Beige Brown', rgb: [182, 155, 126], hex: '#B69B7E', category: 'Brown' },
  { code: '842', name: 'Very Light Beige Brown', rgb: [209, 186, 161], hex: '#D1BAA1', category: 'Brown' },
  { code: '3371', name: 'Black Brown', rgb: [37, 26, 22], hex: '#251A16', category: 'Brown' },
  { code: '3781', name: 'Dark Mocha Brown', rgb: [108, 84, 67], hex: '#6C5443', category: 'Brown' },
  { code: '3782', name: 'Light Mocha Brown', rgb: [209, 186, 161], hex: '#D1BAA1', category: 'Brown' },

  // Skin Tones
  { code: '950', name: 'Light Desert Sand', rgb: [238, 211, 196], hex: '#EED3C4', category: 'Skin' },
  { code: '951', name: 'Light Tawny', rgb: [255, 226, 207], hex: '#FFE2CF', category: 'Skin' },
  { code: '3773', name: 'Medium Desert Sand', rgb: [221, 182, 155], hex: '#DDB69B', category: 'Skin' },
  { code: '3774', name: 'Very Light Desert Sand', rgb: [255, 236, 224], hex: '#FFECE0', category: 'Skin' },
  { code: '945', name: 'Tawny', rgb: [250, 211, 187], hex: '#FAD3BB', category: 'Skin' },
  { code: '3856', name: 'Ultra Light Mahogany', rgb: [255, 211, 181], hex: '#FFD3B5', category: 'Skin' },
  { code: '3855', name: 'Light Autumn Gold', rgb: [250, 186, 133], hex: '#FABA85', category: 'Skin' },

  // Metallics & Special
  { code: 'E168', name: 'Light Silver', rgb: [212, 212, 212], hex: '#D4D4D4', category: 'Metallic' },
  { code: 'E301', name: 'Medium Lemon', rgb: [255, 236, 139], hex: '#FFEC8B', category: 'Metallic' },
  { code: 'E415', name: 'Pearl Gray', rgb: [200, 200, 200], hex: '#C8C8C8', category: 'Metallic' },
  { code: 'E436', name: 'Light Tan', rgb: [230, 190, 138], hex: '#E6BE8A', category: 'Metallic' },
  { code: 'E746', name: 'Off White', rgb: [252, 250, 238], hex: '#FCFAEE', category: 'Metallic' },
  { code: 'E3821', name: 'Light Straw', rgb: [243, 206, 117], hex: '#F3CE75', category: 'Metallic' },
]

/**
 * Get DMC color by code
 */
export function getDMCColor(code: string): DMCColor | undefined {
  return DMC_COLORS.find(c => c.code === code)
}

/**
 * Find the closest DMC color to a given RGB value
 */
export function findClosestDMCColor(rgb: [number, number, number]): DMCColor {
  let minDistance = Infinity
  let closestColor = DMC_COLORS[0]

  for (const dmcColor of DMC_COLORS) {
    const distance = colorDistance(rgb, dmcColor.rgb)
    if (distance < minDistance) {
      minDistance = distance
      closestColor = dmcColor
    }
  }

  return closestColor
}

/**
 * Calculate Euclidean distance between two RGB colors
 */
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1
  const [r2, g2, b2] = rgb2

  // Weighted Euclidean distance (more perceptually accurate)
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2

  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db)
}

/**
 * Get DMC colors by category
 */
export function getDMCColorsByCategory(category: string): DMCColor[] {
  return DMC_COLORS.filter(c => c.category === category)
}

/**
 * Get all unique categories
 */
export function getDMCCategories(): string[] {
  const categories = new Set(DMC_COLORS.map(c => c.category))
  return Array.from(categories).sort()
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
}

/**
 * Get a curated palette of DMC colors for diamond painting
 * Returns the most popular/commonly used colors
 */
export function getPopularDMCPalette(count: number = 50): DMCColor[] {
  // Return first N colors (these are ordered by popularity)
  return DMC_COLORS.slice(0, Math.min(count, DMC_COLORS.length))
}
