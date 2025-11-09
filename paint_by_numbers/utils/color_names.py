"""
Color naming utility - Maps RGB colors to human-readable names
Uses CSS3/X11 color names for better legend readability
"""

import numpy as np
from typing import Tuple, List
import colorsys


# Extended CSS3/X11 color names with RGB values
CSS_COLORS = {
    # Whites and blacks
    'White': (255, 255, 255),
    'Snow': (255, 250, 250),
    'Ivory': (255, 255, 240),
    'Black': (0, 0, 0),
    'Charcoal': (54, 69, 79),

    # Grays
    'Light Gray': (211, 211, 211),
    'Silver': (192, 192, 192),
    'Gray': (128, 128, 128),
    'Dark Gray': (169, 169, 169),
    'Slate Gray': (112, 128, 144),

    # Reds
    'Light Pink': (255, 182, 193),
    'Pink': (255, 192, 203),
    'Hot Pink': (255, 105, 180),
    'Deep Pink': (255, 20, 147),
    'Light Coral': (240, 128, 128),
    'Indian Red': (205, 92, 92),
    'Crimson': (220, 20, 60),
    'Red': (255, 0, 0),
    'Firebrick': (178, 34, 34),
    'Dark Red': (139, 0, 0),
    'Maroon': (128, 0, 0),

    # Oranges
    'Light Salmon': (255, 160, 122),
    'Salmon': (250, 128, 114),
    'Dark Salmon': (233, 150, 122),
    'Coral': (255, 127, 80),
    'Tomato': (255, 99, 71),
    'Orange Red': (255, 69, 0),
    'Orange': (255, 165, 0),
    'Dark Orange': (255, 140, 0),
    'Peach': (255, 218, 185),

    # Yellows
    'Light Yellow': (255, 255, 224),
    'Lemon': (255, 250, 205),
    'Yellow': (255, 255, 0),
    'Gold': (255, 215, 0),
    'Goldenrod': (218, 165, 32),
    'Dark Goldenrod': (184, 134, 11),
    'Khaki': (240, 230, 140),
    'Olive': (128, 128, 0),

    # Greens
    'Light Green': (144, 238, 144),
    'Pale Green': (152, 251, 152),
    'Lime': (0, 255, 0),
    'Lime Green': (50, 205, 50),
    'Spring Green': (0, 255, 127),
    'Medium Spring Green': (0, 250, 154),
    'Aquamarine': (127, 255, 212),
    'Turquoise': (64, 224, 208),
    'Sea Green': (46, 139, 87),
    'Green': (0, 128, 0),
    'Forest Green': (34, 139, 34),
    'Dark Green': (0, 100, 0),
    'Olive Drab': (107, 142, 35),
    'Teal': (0, 128, 128),

    # Cyans
    'Light Cyan': (224, 255, 255),
    'Cyan': (0, 255, 255),
    'Aqua': (0, 255, 255),
    'Dark Cyan': (0, 139, 139),

    # Blues
    'Light Sky Blue': (135, 206, 250),
    'Sky Blue': (135, 206, 235),
    'Light Blue': (173, 216, 230),
    'Powder Blue': (176, 224, 230),
    'Steel Blue': (70, 130, 180),
    'Cornflower Blue': (100, 149, 237),
    'Deep Sky Blue': (0, 191, 255),
    'Dodger Blue': (30, 144, 255),
    'Royal Blue': (65, 105, 225),
    'Blue': (0, 0, 255),
    'Medium Blue': (0, 0, 205),
    'Dark Blue': (0, 0, 139),
    'Navy': (0, 0, 128),
    'Midnight Blue': (25, 25, 112),

    # Purples
    'Lavender': (230, 230, 250),
    'Thistle': (216, 191, 216),
    'Plum': (221, 160, 221),
    'Violet': (238, 130, 238),
    'Orchid': (218, 112, 214),
    'Fuchsia': (255, 0, 255),
    'Magenta': (255, 0, 255),
    'Medium Purple': (147, 112, 219),
    'Purple': (128, 0, 128),
    'Dark Violet': (148, 0, 211),
    'Dark Magenta': (139, 0, 139),
    'Indigo': (75, 0, 130),

    # Browns
    'Cornsilk': (255, 248, 220),
    'Blanched Almond': (255, 235, 205),
    'Bisque': (255, 228, 196),
    'Wheat': (245, 222, 179),
    'Burlywood': (222, 184, 135),
    'Tan': (210, 180, 140),
    'Sandy Brown': (244, 164, 96),
    'Peru': (205, 133, 63),
    'Chocolate': (210, 105, 30),
    'Saddle Brown': (139, 69, 19),
    'Sienna': (160, 82, 45),
    'Brown': (165, 42, 42),
    'Dark Brown': (101, 67, 33),
    'Beige': (245, 245, 220),
    'Cream': (255, 253, 208),
}


def rgb_to_lab(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    """
    Convert RGB to Lab color space for perceptual distance

    Args:
        rgb: RGB tuple (0-255)

    Returns:
        Lab tuple (L: 0-100, a: -128-127, b: -128-127)
    """
    # Normalize RGB to 0-1
    r, g, b = [x / 255.0 for x in rgb]

    # Convert to XYZ
    def to_linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r_lin = to_linear(r)
    g_lin = to_linear(g)
    b_lin = to_linear(b)

    # RGB to XYZ (using D65 illuminant)
    x = r_lin * 0.4124 + g_lin * 0.3576 + b_lin * 0.1805
    y = r_lin * 0.2126 + g_lin * 0.7152 + b_lin * 0.0722
    z = r_lin * 0.0193 + g_lin * 0.1192 + b_lin * 0.9505

    # Normalize for D65 white point
    x = x / 0.95047
    y = y / 1.00000
    z = z / 1.08883

    # XYZ to Lab
    def f(t):
        return t ** (1/3) if t > 0.008856 else (7.787 * t) + (16/116)

    fx = f(x)
    fy = f(y)
    fz = f(z)

    L = (116 * fy) - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)

    return (L, a, b)


def color_distance_lab(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    """
    Calculate perceptual color distance using Lab space

    Args:
        rgb1, rgb2: RGB tuples (0-255)

    Returns:
        Perceptual distance (lower = more similar)
    """
    lab1 = rgb_to_lab(rgb1)
    lab2 = rgb_to_lab(rgb2)

    # Euclidean distance in Lab space
    return np.sqrt(
        (lab1[0] - lab2[0]) ** 2 +
        (lab1[1] - lab2[1]) ** 2 +
        (lab1[2] - lab2[2]) ** 2
    )


def find_closest_color_name(rgb: Tuple[int, int, int]) -> str:
    """
    Find the closest CSS color name to the given RGB value

    Args:
        rgb: RGB tuple (0-255)

    Returns:
        Closest color name
    """
    if isinstance(rgb, np.ndarray):
        rgb = tuple(rgb.tolist())

    min_distance = float('inf')
    closest_name = 'Unknown'

    for name, css_rgb in CSS_COLORS.items():
        distance = color_distance_lab(rgb, css_rgb)

        if distance < min_distance:
            min_distance = distance
            closest_name = name

    return closest_name


def get_color_names_for_palette(palette: np.ndarray) -> List[str]:
    """
    Get human-readable names for all colors in a palette

    Args:
        palette: Array of RGB colors (N, 3)

    Returns:
        List of color names
    """
    color_names = []

    for i, color in enumerate(palette):
        rgb = tuple(color.tolist()) if isinstance(color, np.ndarray) else color
        name = find_closest_color_name(rgb)

        # If we already have this name, add a number
        base_name = name
        suffix = 1
        while name in color_names:
            suffix += 1
            name = f"{base_name} {suffix}"

        color_names.append(name)

    return color_names


def categorize_color(rgb: Tuple[int, int, int]) -> str:
    """
    Categorize a color into broad category

    Args:
        rgb: RGB tuple (0-255)

    Returns:
        Category name (Red, Blue, Green, etc.)
    """
    r, g, b = rgb

    # Convert to HSV for better categorization
    h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
    h = h * 360  # Convert to degrees

    # Check for grayscale
    if s < 0.1:
        if v > 0.9:
            return 'White'
        elif v < 0.2:
            return 'Black'
        else:
            return 'Gray'

    # Categorize by hue
    if h < 15 or h >= 345:
        return 'Red'
    elif 15 <= h < 45:
        return 'Orange'
    elif 45 <= h < 75:
        return 'Yellow'
    elif 75 <= h < 150:
        return 'Green'
    elif 150 <= h < 200:
        return 'Cyan'
    elif 200 <= h < 260:
        return 'Blue'
    elif 260 <= h < 300:
        return 'Purple'
    else:  # 300 <= h < 345
        return 'Magenta'


def get_paint_suggestions(rgb: Tuple[int, int, int]) -> dict:
    """
    Get paint mixing suggestions for a color

    Args:
        rgb: RGB tuple (0-255)

    Returns:
        Dictionary with color info and mixing suggestions
    """
    name = find_closest_color_name(rgb)
    category = categorize_color(rgb)

    r, g, b = rgb
    h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)

    # Generate mixing suggestions based on color theory
    suggestions = []

    if s < 0.1:  # Grayscale
        if v > 0.9:
            suggestions.append("Pure white")
        elif v < 0.2:
            suggestions.append("Pure black")
        else:
            white_pct = int(v * 100)
            black_pct = 100 - white_pct
            suggestions.append(f"{white_pct}% white + {black_pct}% black")
    else:
        # Simplified color mixing hints
        suggestions.append(f"Base: {category}")

        if v < 0.5:
            suggestions.append("Add black to darken")
        elif v > 0.8 and s < 0.5:
            suggestions.append("Add white to lighten")

    return {
        'name': name,
        'category': category,
        'rgb': rgb,
        'hex': '#{:02x}{:02x}{:02x}'.format(r, g, b),
        'mixing_suggestions': suggestions
    }
