"""
Unified Color Palette System
Provides predefined color palettes for consistent paint-by-numbers generation
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
import json
from pathlib import Path


# Standard color palettes - RGB format
STANDARD_PALETTES = {
    "classic_12": [
        (255, 255, 255),  # White
        (0, 0, 0),        # Black
        (255, 0, 0),      # Red
        (0, 255, 0),      # Green
        (0, 0, 255),      # Blue
        (255, 255, 0),    # Yellow
        (255, 0, 255),    # Magenta
        (0, 255, 255),    # Cyan
        (128, 0, 0),      # Maroon
        (0, 128, 0),      # Dark Green
        (0, 0, 128),      # Navy
        (128, 128, 128),  # Gray
    ],

    "classic_18": [
        (255, 255, 255),  # White
        (0, 0, 0),        # Black
        (255, 0, 0),      # Red
        (0, 255, 0),      # Green
        (0, 0, 255),      # Blue
        (255, 255, 0),    # Yellow
        (255, 165, 0),    # Orange
        (128, 0, 128),    # Purple
        (255, 192, 203),  # Pink
        (165, 42, 42),    # Brown
        (128, 128, 128),  # Gray
        (255, 215, 0),    # Gold
        (0, 128, 128),    # Teal
        (230, 230, 250),  # Lavender
        (255, 228, 196),  # Bisque
        (47, 79, 79),     # Dark Slate Gray
        (176, 224, 230),  # Powder Blue
        (240, 128, 128),  # Light Coral
    ],

    "classic_24": [
        (255, 255, 255),  # White
        (0, 0, 0),        # Black
        (255, 0, 0),      # Red
        (0, 255, 0),      # Green
        (0, 0, 255),      # Blue
        (255, 255, 0),    # Yellow
        (255, 165, 0),    # Orange
        (128, 0, 128),    # Purple
        (255, 192, 203),  # Pink
        (165, 42, 42),    # Brown
        (128, 128, 128),  # Gray
        (255, 215, 0),    # Gold
        (0, 128, 128),    # Teal
        (230, 230, 250),  # Lavender
        (255, 228, 196),  # Bisque
        (64, 224, 208),   # Turquoise
        (255, 99, 71),    # Tomato
        (0, 128, 0),      # Dark Green
        (0, 0, 128),      # Navy
        (255, 0, 255),    # Magenta
        (0, 255, 255),    # Cyan
        (128, 0, 0),      # Maroon
        (192, 192, 192),  # Silver
        (255, 140, 0),    # Dark Orange
    ],

    "pastel_12": [
        (255, 182, 193),  # Light Pink
        (255, 218, 185),  # Peach
        (255, 255, 224),  # Light Yellow
        (240, 255, 240),  # Honeydew
        (224, 255, 255),  # Light Cyan
        (230, 230, 250),  # Lavender
        (255, 228, 225),  # Misty Rose
        (245, 245, 220),  # Beige
        (240, 248, 255),  # Alice Blue
        (245, 222, 179),  # Wheat
        (221, 160, 221),  # Plum
        (176, 224, 230),  # Powder Blue
    ],

    "earth_tones_12": [
        (139, 69, 19),    # Saddle Brown
        (160, 82, 45),    # Sienna
        (205, 133, 63),   # Peru
        (210, 180, 140),  # Tan
        (222, 184, 135),  # Burlywood
        (188, 143, 143),  # Rosy Brown
        (128, 128, 0),    # Olive
        (85, 107, 47),    # Dark Olive Green
        (107, 142, 35),   # Olive Drab
        (154, 205, 50),   # Yellow Green
        (112, 128, 144),  # Slate Gray
        (119, 136, 153),  # Light Slate Gray
    ],

    "vibrant_18": [
        (255, 0, 0),      # Red
        (255, 127, 0),    # Orange
        (255, 255, 0),    # Yellow
        (127, 255, 0),    # Chartreuse
        (0, 255, 0),      # Green
        (0, 255, 127),    # Spring Green
        (0, 255, 255),    # Cyan
        (0, 127, 255),    # Azure
        (0, 0, 255),      # Blue
        (127, 0, 255),    # Violet
        (255, 0, 255),    # Magenta
        (255, 0, 127),    # Rose
        (255, 255, 255),  # White
        (192, 192, 192),  # Silver
        (128, 128, 128),  # Gray
        (64, 64, 64),     # Dark Gray
        (0, 0, 0),        # Black
        (255, 105, 180),  # Hot Pink
    ],

    "nature_15": [
        (135, 206, 235),  # Sky Blue
        (34, 139, 34),    # Forest Green
        (107, 142, 35),   # Olive Drab
        (139, 69, 19),    # Saddle Brown
        (160, 82, 45),    # Sienna
        (210, 180, 140),  # Tan
        (255, 255, 0),    # Yellow (Sun)
        (255, 165, 0),    # Orange
        (128, 128, 128),  # Gray (Rocks)
        (176, 196, 222),  # Light Steel Blue
        (70, 130, 180),   # Steel Blue
        (46, 139, 87),    # Sea Green
        (154, 205, 50),   # Yellow Green
        (255, 255, 255),  # White
        (0, 0, 0),        # Black
    ],

    # ===== PREMIUM PALETTES FOR 3-MODEL SYSTEM =====

    # ORIGINAL MODEL - Natural Photorealistic Palette
    "realistic_natural": [
        (255, 255, 255),  # Pure White
        (245, 245, 240),  # Off White
        (15, 15, 15),     # Near Black
        (65, 65, 65),     # Charcoal
        (128, 128, 128),  # Medium Gray
        (192, 192, 192),  # Light Gray
        (220, 180, 160),  # Skin Tone Light
        (180, 130, 100),  # Skin Tone Medium
        (120, 80, 60),    # Skin Tone Dark
        (185, 85, 75),    # Natural Red
        (220, 120, 90),   # Warm Coral
        (240, 180, 120),  # Peach
        (95, 130, 160),   # Sky Blue
        (70, 100, 140),   # Deep Blue
        (85, 120, 85),    # Forest Green
        (140, 165, 100),  # Sage Green
        (160, 110, 75),   # Natural Brown
        (210, 190, 140),  # Sand
        (190, 160, 130),  # Warm Tan
        (245, 220, 120),  # Soft Yellow
    ],

    # VINTAGE MODEL - Warm Nostalgic Palette
    "vintage_warm": [
        (250, 245, 235),  # Cream White
        (235, 220, 200),  # Antique White
        (40, 35, 30),     # Vintage Black
        (90, 75, 60),     # Sepia Brown
        (145, 130, 110),  # Taupe Gray
        (190, 175, 155),  # Warm Gray
        (210, 170, 140),  # Vintage Skin
        (175, 135, 105),  # Golden Skin
        (140, 100, 75),   # Bronze Skin
        (185, 95, 75),    # Muted Red
        (205, 140, 95),   # Terra Cotta
        (220, 180, 135),  # Warm Peach
        (140, 150, 165),  # Dusty Blue
        (95, 110, 125),   # Vintage Blue
        (105, 125, 95),   # Olive Green
        (165, 175, 130),  # Sage
        (140, 100, 70),   # Walnut Brown
        (190, 165, 130),  # Wheat
        (205, 180, 145),  # Biscuit
        (220, 200, 140),  # Vintage Gold
    ],

    # POP-ART MODEL - Bold Vibrant Palette
    "pop_art_bold": [
        (255, 255, 255),  # Bright White
        (0, 0, 0),        # Pure Black
        (255, 30, 60),    # Electric Red
        (255, 100, 180),  # Hot Pink
        (255, 180, 0),    # Golden Yellow
        (255, 120, 0),    # Vivid Orange
        (0, 180, 255),    # Cyan Blue
        (0, 80, 200),     # Bold Blue
        (120, 0, 200),    # Purple
        (255, 0, 140),    # Magenta
        (0, 220, 100),    # Neon Green
        (180, 255, 0),    # Lime Green
        (255, 200, 255),  # Bright Pink
        (180, 230, 255),  # Sky Cyan
        (255, 230, 100),  # Sunshine Yellow
        (200, 50, 50),    # Deep Red
    ],
}


COLOR_NAMES = {
    "classic_12": [
        "White", "Black", "Red", "Green", "Blue", "Yellow",
        "Magenta", "Cyan", "Maroon", "Dark Green", "Navy", "Gray"
    ],
    "classic_18": [
        "White", "Black", "Red", "Green", "Blue", "Yellow",
        "Orange", "Purple", "Pink", "Brown", "Gray", "Gold",
        "Teal", "Lavender", "Bisque", "Dark Slate", "Powder Blue", "Light Coral"
    ],
    "classic_24": [
        "White", "Black", "Red", "Green", "Blue", "Yellow",
        "Orange", "Purple", "Pink", "Brown", "Gray", "Gold",
        "Teal", "Lavender", "Bisque", "Turquoise", "Tomato", "Dark Green",
        "Navy", "Magenta", "Cyan", "Maroon", "Silver", "Dark Orange"
    ],
    "pastel_12": [
        "Light Pink", "Peach", "Light Yellow", "Honeydew", "Light Cyan", "Lavender",
        "Misty Rose", "Beige", "Alice Blue", "Wheat", "Plum", "Powder Blue"
    ],
    "earth_tones_12": [
        "Saddle Brown", "Sienna", "Peru", "Tan", "Burlywood", "Rosy Brown",
        "Olive", "Dark Olive Green", "Olive Drab", "Yellow Green", "Slate Gray", "Light Slate Gray"
    ],
    "vibrant_18": [
        "Red", "Orange", "Yellow", "Chartreuse", "Green", "Spring Green",
        "Cyan", "Azure", "Blue", "Violet", "Magenta", "Rose",
        "White", "Silver", "Gray", "Dark Gray", "Black", "Hot Pink"
    ],
    "nature_15": [
        "Sky Blue", "Forest Green", "Olive Drab", "Saddle Brown", "Sienna", "Tan",
        "Yellow", "Orange", "Gray", "Light Steel Blue", "Steel Blue", "Sea Green",
        "Yellow Green", "White", "Black"
    ],

    # Premium Palettes Names
    "realistic_natural": [
        "Pure White", "Off White", "Near Black", "Charcoal", "Medium Gray", "Light Gray",
        "Light Skin", "Medium Skin", "Dark Skin", "Natural Red", "Warm Coral", "Peach",
        "Sky Blue", "Deep Blue", "Forest Green", "Sage Green", "Natural Brown", "Sand",
        "Warm Tan", "Soft Yellow"
    ],

    "vintage_warm": [
        "Cream White", "Antique White", "Vintage Black", "Sepia Brown", "Taupe Gray", "Warm Gray",
        "Vintage Skin", "Golden Skin", "Bronze Skin", "Muted Red", "Terra Cotta", "Warm Peach",
        "Dusty Blue", "Vintage Blue", "Olive Green", "Sage", "Walnut Brown", "Wheat",
        "Biscuit", "Vintage Gold"
    ],

    "pop_art_bold": [
        "Bright White", "Pure Black", "Electric Red", "Hot Pink", "Golden Yellow", "Vivid Orange",
        "Cyan Blue", "Bold Blue", "Purple", "Magenta", "Neon Green", "Lime Green",
        "Bright Pink", "Sky Cyan", "Sunshine Yellow", "Deep Red"
    ],
}


class PaletteManager:
    """Manages color palettes for paint-by-numbers generation"""

    def __init__(self):
        self.custom_palettes: Dict[str, List[Tuple[int, int, int]]] = {}
        self.custom_palette_names: Dict[str, List[str]] = {}

    def get_palette(self, palette_name: str) -> np.ndarray:
        """
        Get a color palette by name

        Args:
            palette_name: Name of the palette

        Returns:
            Numpy array of RGB colors

        Raises:
            ValueError: If palette name doesn't exist
        """
        if palette_name in STANDARD_PALETTES:
            colors = STANDARD_PALETTES[palette_name]
        elif palette_name in self.custom_palettes:
            colors = self.custom_palettes[palette_name]
        else:
            available = list(STANDARD_PALETTES.keys()) + list(self.custom_palettes.keys())
            raise ValueError(
                f"Palette '{palette_name}' not found. "
                f"Available palettes: {', '.join(available)}"
            )

        return np.array(colors, dtype=np.uint8)

    def get_color_names(self, palette_name: str) -> List[str]:
        """
        Get color names for a palette

        Args:
            palette_name: Name of the palette

        Returns:
            List of color names
        """
        if palette_name in COLOR_NAMES:
            return COLOR_NAMES[palette_name]
        elif palette_name in self.custom_palette_names:
            return self.custom_palette_names[palette_name]
        else:
            # Generate default names
            n_colors = len(self.get_palette(palette_name))
            return [f"Color {i+1}" for i in range(n_colors)]

    def add_custom_palette(self, name: str, colors: List[Tuple[int, int, int]],
                          color_names: Optional[List[str]] = None):
        """
        Add a custom color palette

        Args:
            name: Name for the palette
            colors: List of RGB color tuples
            color_names: Optional list of color names
        """
        self.custom_palettes[name] = colors

        if color_names:
            if len(color_names) != len(colors):
                raise ValueError("Number of color names must match number of colors")
            self.custom_palette_names[name] = color_names

    def save_palette(self, palette_name: str, filepath: str):
        """
        Save a palette to JSON file

        Args:
            palette_name: Name of palette to save
            filepath: Path to save file
        """
        palette = self.get_palette(palette_name).tolist()
        names = self.get_color_names(palette_name)

        data = {
            "name": palette_name,
            "colors": palette,
            "color_names": names
        }

        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    def load_palette(self, filepath: str) -> str:
        """
        Load a palette from JSON file

        Args:
            filepath: Path to palette file

        Returns:
            Name of loaded palette
        """
        with open(filepath, 'r') as f:
            data = json.load(f)

        name = data["name"]
        colors = [tuple(c) for c in data["colors"]]
        color_names = data.get("color_names")

        self.add_custom_palette(name, colors, color_names)
        return name

    def list_palettes(self) -> List[str]:
        """
        Get list of all available palette names

        Returns:
            List of palette names
        """
        return list(STANDARD_PALETTES.keys()) + list(self.custom_palettes.keys())

    def get_palette_info(self, palette_name: str) -> dict:
        """
        Get information about a palette

        Args:
            palette_name: Name of the palette

        Returns:
            Dictionary with palette information
        """
        palette = self.get_palette(palette_name)
        names = self.get_color_names(palette_name)

        return {
            "name": palette_name,
            "num_colors": len(palette),
            "colors": palette.tolist(),
            "color_names": names,
            "is_custom": palette_name in self.custom_palettes
        }
