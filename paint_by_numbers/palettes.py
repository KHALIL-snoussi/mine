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
