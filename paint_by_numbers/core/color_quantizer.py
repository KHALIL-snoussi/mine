"""
Color Quantization Module - Reduces image to limited color palette
"""

import numpy as np
import cv2
from typing import Optional, Tuple
from sklearn.cluster import KMeans, MiniBatchKMeans

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import sort_colors_by_brightness
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import sort_colors_by_brightness


class ColorQuantizer:
    """Handles color quantization using K-means clustering"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize color quantizer

        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.palette = None
        self.quantized_image = None
        self.labels = None

    def quantize(self, image: np.ndarray, n_colors: int = None,
                 sort_palette: bool = True, random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
        """
        Quantize image colors using K-means clustering

        Args:
            image: Input image in RGB format
            n_colors: Number of colors in palette (default from config)
            sort_palette: Sort palette by brightness
            random_state: Random state for reproducibility

        Returns:
            Tuple of (quantized_image, color_palette)
        """
        if n_colors is None:
            n_colors = self.config.DEFAULT_NUM_COLORS

        # Validate n_colors
        n_colors = max(self.config.MIN_NUM_COLORS,
                      min(n_colors, self.config.MAX_NUM_COLORS))

        h, w = image.shape[:2]
        pixels = image.reshape(-1, 3).astype(np.float32)

        # Sample pixels if image is large for faster processing
        n_pixels = len(pixels)
        sample_size = int(n_pixels * self.config.COLOR_SAMPLE_FRACTION)

        if sample_size < n_pixels:
            # Random sampling
            np.random.seed(random_state)
            indices = np.random.choice(n_pixels, sample_size, replace=False)
            sample_pixels = pixels[indices]
        else:
            sample_pixels = pixels

        # Perform K-means clustering
        print(f"Performing K-means clustering with {n_colors} colors...")

        if len(sample_pixels) > 10000:
            # Use MiniBatchKMeans for large datasets
            kmeans = MiniBatchKMeans(
                n_clusters=n_colors,
                random_state=random_state,
                batch_size=1024,
                n_init=10,
                max_iter=300
            )
        else:
            kmeans = KMeans(
                n_clusters=n_colors,
                random_state=random_state,
                n_init=10,
                max_iter=300
            )

        kmeans.fit(sample_pixels)

        # Predict labels for all pixels
        labels = kmeans.predict(pixels)
        self.labels = labels.reshape(h, w)

        # Get color palette (cluster centers)
        palette = kmeans.cluster_centers_.astype(np.uint8)

        # Sort palette by brightness if requested
        if sort_palette:
            # Create mapping from old to new labels
            sorted_palette = sort_colors_by_brightness(palette)
            old_to_new = np.zeros(n_colors, dtype=int)

            for new_idx, sorted_color in enumerate(sorted_palette):
                # Find which old index this color came from
                for old_idx, orig_color in enumerate(palette):
                    if np.array_equal(sorted_color, orig_color):
                        old_to_new[old_idx] = new_idx
                        break

            # Remap labels
            labels = np.array([old_to_new[label] for label in labels])
            self.labels = labels.reshape(h, w)
            palette = sorted_palette

        self.palette = palette

        # Create quantized image
        quantized = palette[labels].reshape(h, w, 3)
        self.quantized_image = quantized

        print(f"Color quantization complete: {n_colors} colors")
        return quantized, palette

    def get_color_counts(self) -> dict:
        """
        Get pixel count for each color in palette

        Returns:
            Dictionary mapping color index to pixel count
        """
        if self.labels is None:
            raise ValueError("No quantization performed. Call quantize() first.")

        unique, counts = np.unique(self.labels, return_counts=True)
        return dict(zip(unique.tolist(), counts.tolist()))

    def get_color_percentages(self) -> dict:
        """
        Get percentage of image for each color

        Returns:
            Dictionary mapping color index to percentage
        """
        counts = self.get_color_counts()
        total = sum(counts.values())

        return {
            color_idx: (count / total) * 100
            for color_idx, count in counts.items()
        }

    def reduce_similar_colors(self, image: np.ndarray, palette: np.ndarray,
                             similarity_threshold: float = 20.0) -> Tuple[np.ndarray, np.ndarray]:
        """
        Merge similar colors in the palette

        Args:
            image: Quantized image
            palette: Color palette
            similarity_threshold: Threshold for color similarity (Euclidean distance)

        Returns:
            Tuple of (updated_image, updated_palette)
        """
        n_colors = len(palette)
        merged = np.zeros(n_colors, dtype=int)

        for i in range(n_colors):
            merged[i] = i

        # Find similar colors
        for i in range(n_colors):
            for j in range(i + 1, n_colors):
                color1 = palette[i].astype(float)
                color2 = palette[j].astype(float)

                # Calculate Euclidean distance
                distance = np.linalg.norm(color1 - color2)

                if distance < similarity_threshold:
                    # Merge j into i
                    merged[j] = merged[i]

        # Remap colors
        unique_colors = sorted(set(merged))
        color_mapping = {old: new for new, old in enumerate(unique_colors)}

        # Create new palette
        new_palette = []
        for color_idx in unique_colors:
            # Average all colors that map to this index
            mask = merged == color_idx
            avg_color = palette[mask].mean(axis=0).astype(np.uint8)
            new_palette.append(avg_color)

        new_palette = np.array(new_palette)

        # Remap image
        h, w = image.shape[:2]
        pixels = image.reshape(-1, 3)
        new_pixels = np.zeros_like(pixels)

        for old_idx, new_idx in color_mapping.items():
            mask = np.all(pixels == palette[old_idx], axis=1)
            new_pixels[mask] = new_palette[new_idx]

        new_image = new_pixels.reshape(h, w, 3)

        print(f"Reduced palette from {n_colors} to {len(new_palette)} colors")
        return new_image, new_palette

    def apply_palette(self, image: np.ndarray, palette: np.ndarray) -> np.ndarray:
        """
        Apply a color palette to an image using nearest color matching

        Args:
            image: Input image
            palette: Color palette to apply

        Returns:
            Quantized image
        """
        h, w = image.shape[:2]
        pixels = image.reshape(-1, 3).astype(np.float32)

        # Find nearest color for each pixel
        palette_float = palette.astype(np.float32)

        # Calculate distances to all palette colors (vectorized)
        distances = np.sqrt(((pixels[:, np.newaxis] - palette_float) ** 2).sum(axis=2))
        labels = np.argmin(distances, axis=1)

        # Map pixels to palette colors
        quantized = palette[labels].reshape(h, w, 3)

        return quantized
