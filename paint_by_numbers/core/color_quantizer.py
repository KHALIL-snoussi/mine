"""
Color Quantization Module - Reduces image to limited color palette
"""

import numpy as np
from typing import Optional, Tuple
from sklearn.cluster import KMeans, MiniBatchKMeans

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import sort_colors_by_brightness, ensure_uint8
    from paint_by_numbers.palettes import PaletteManager
    from paint_by_numbers.logger import logger
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import sort_colors_by_brightness, ensure_uint8
    from palettes import PaletteManager
    from logger import logger
    from utils.opencv import require_cv2


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """
    Convert RGB to LAB color space for perceptual color operations.

    Args:
        rgb: RGB array (can be single color or image) with values 0-255

    Returns:
        LAB array: L (0-100), a (-128 to 127), b (-128 to 127)
    """
    cv2 = require_cv2()

    # Ensure proper shape
    original_shape = rgb.shape
    if len(rgb.shape) == 1:
        # Single color
        rgb = rgb.reshape(1, 1, 3)
    elif len(rgb.shape) == 2:
        # Palette of colors
        rgb = rgb.reshape(1, -1, 3)

    # Convert to uint8 if needed
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)

    # OpenCV conversion
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)

    # Reshape back to original
    if len(original_shape) == 1:
        return lab.reshape(3)
    elif len(original_shape) == 2:
        return lab.reshape(-1, 3)
    else:
        return lab


def lab_to_rgb(lab: np.ndarray) -> np.ndarray:
    """
    Convert LAB to RGB color space.

    Args:
        lab: LAB array

    Returns:
        RGB array with values 0-255
    """
    cv2 = require_cv2()

    # Ensure proper shape
    original_shape = lab.shape
    if len(lab.shape) == 1:
        lab = lab.reshape(1, 1, 3)
    elif len(lab.shape) == 2:
        lab = lab.reshape(1, -1, 3)

    # Clip and convert
    lab = np.clip(lab, [0, -128, -128], [100, 127, 127]).astype(np.uint8)
    rgb = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    # Reshape back
    if len(original_shape) == 1:
        return rgb.reshape(3)
    elif len(original_shape) == 2:
        return rgb.reshape(-1, 3)
    else:
        return rgb


def delta_e_cie2000(lab1: np.ndarray, lab2: np.ndarray) -> float:
    """
    Calculate CIEDE2000 color difference - industry standard for perceptual matching.
    Lower values = more similar colors.

    Args:
        lab1, lab2: LAB color arrays (L, a, b)

    Returns:
        Perceptual color difference (0 = identical, >100 = very different)
    """
    L1, a1, b1 = lab1[0], lab1[1], lab1[2]
    L2, a2, b2 = lab2[0], lab2[1], lab2[2]

    kL = kC = kH = 1.0  # Weighting factors

    C1 = np.sqrt(a1**2 + b1**2)
    C2 = np.sqrt(a2**2 + b2**2)
    Cbar = (C1 + C2) / 2.0

    G = 0.5 * (1 - np.sqrt(Cbar**7 / (Cbar**7 + 25**7)))

    a1p = a1 * (1 + G)
    a2p = a2 * (1 + G)

    C1p = np.sqrt(a1p**2 + b1**2)
    C2p = np.sqrt(a2p**2 + b2**2)

    dL = L2 - L1
    dC = C2p - C1p

    # Simplified hue difference
    dH_squared = (a2 - a1)**2 + (b2 - b1)**2 - dC**2
    dH = np.sqrt(np.maximum(0, dH_squared))

    SL = 1 + (0.015 * (L1 - 50)**2) / np.sqrt(20 + (L1 - 50)**2)
    SC = 1 + 0.045 * C1p
    SH = 1 + 0.015 * C1p

    dE = np.sqrt(
        (dL / (kL * SL))**2 +
        (dC / (kC * SC))**2 +
        (dH / (kH * SH))**2
    )

    return dE


def assign_colors_to_palette(image: np.ndarray, palette: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Assign each pixel in ``image`` to the nearest entry in ``palette``.

    The previous implementation only returned the quantized image which meant
    downstream consumers (region detection, assembly sheet generation) had to
    recompute label maps.  Returning the label grid alongside the quantized
    image keeps the operation deterministic and gives callers direct access to
    the exact palette indices used for every pixel – critical for QBRIX-style
    reporting where we must prove color allocation.

    Args:
        image: Input image (H, W, 3) in RGB order.
        palette: Color palette (N, 3) in RGB order.

    Returns:
        Tuple containing ``(quantized_image, label_map)`` where ``label_map`` is
        a 2D array of palette indices matching ``image.shape[:2]``.
    """

    h, w = image.shape[:2]
    pixels = image.reshape(-1, 3).astype(np.float32)

    # Find nearest palette color for each pixel
    distances = np.linalg.norm(pixels[:, np.newaxis] - palette[np.newaxis, :], axis=2)
    labels = np.argmin(distances, axis=1)

    # Create quantized image
    quantized = palette[labels].reshape(h, w, 3).astype(np.uint8)

    return quantized, labels.reshape(h, w)


class ColorQuantizer:
    """Handles color quantization using K-means clustering or unified palettes"""

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
        self.palette_manager = PaletteManager()
        self.color_names = []

    def _prepare_for_clustering(self, image: np.ndarray) -> Tuple[np.ndarray, str]:
        """Convert image into selected color space for clustering."""
        color_space = getattr(self.config, "KMEANS_COLOR_SPACE", "rgb").lower()

        if color_space == "lab":
            cv2 = require_cv2()
            converted = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        elif color_space == "hsv":
            cv2 = require_cv2()
            converted = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        else:
            converted = image
            color_space = "rgb"

        return converted, color_space

    def _restore_palette_to_rgb(self, centers: np.ndarray, color_space: str) -> np.ndarray:
        """Convert cluster centers from working color space back to RGB."""
        centers = centers.reshape(-1, 1, 3)

        if color_space == "lab":
            cv2 = require_cv2()
            converted = cv2.cvtColor(centers.astype(np.uint8), cv2.COLOR_LAB2RGB)
        elif color_space == "hsv":
            cv2 = require_cv2()
            converted = cv2.cvtColor(centers.astype(np.uint8), cv2.COLOR_HSV2RGB)
        else:
            converted = centers.astype(np.uint8)

        return converted.reshape(-1, 3)

    def _convert_to_metric_space(self, image: np.ndarray, palette: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Convert inputs to the configured perceptual space for palette projection."""
        metric = getattr(self.config, "PALETTE_DISTANCE_METRIC", "lab").lower()

        if metric == "lab":
            cv2 = require_cv2()
            image_space = cv2.cvtColor(image, cv2.COLOR_RGB2LAB).astype(np.float32)
            palette_space = cv2.cvtColor(
                palette.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_RGB2LAB
            ).reshape(-1, 3).astype(np.float32)
        elif metric == "hsv":
            cv2 = require_cv2()
            image_space = cv2.cvtColor(image, cv2.COLOR_RGB2HSV).astype(np.float32)
            palette_space = cv2.cvtColor(
                palette.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV
            ).reshape(-1, 3).astype(np.float32)
        else:
            image_space = image.astype(np.float32)
            palette_space = palette.astype(np.float32)

        return image_space, palette_space

    def apply_color_style(self, image: np.ndarray) -> np.ndarray:
        """
        Apply color style adjustments (saturation boost, warmth adjustment)
        for Vintage and Pop-Art effects

        Args:
            image: Input RGB image

        Returns:
            Styled RGB image
        """
        # Get style settings from config
        saturation_boost = getattr(self.config, 'SATURATION_BOOST', 1.0)
        warmth_adjustment = getattr(self.config, 'WARMTH_ADJUSTMENT', 0)

        # If no adjustments needed, return original
        if saturation_boost == 1.0 and warmth_adjustment == 0:
            return image

        cv2 = require_cv2()
        styled = image.copy().astype(np.float32)

        # Apply saturation boost (works in HSV space)
        if saturation_boost != 1.0:
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV).astype(np.float32)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_boost, 0, 255)
            styled = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)

        # Apply warmth adjustment (shift red/blue channels)
        if warmth_adjustment != 0:
            # Positive = warmer (more red/yellow), Negative = cooler (more blue)
            styled[:, :, 0] = np.clip(styled[:, :, 0] + warmth_adjustment, 0, 255)  # Red
            styled[:, :, 2] = np.clip(styled[:, :, 2] - warmth_adjustment * 0.5, 0, 255)  # Blue

        return styled.astype(np.uint8)

    def quantize(self, image: np.ndarray, n_colors: int = None,
                 sort_palette: bool = True, random_state: int = 42,
                 use_unified_palette: Optional[bool] = None,
                 palette_name: Optional[str] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Quantize image colors using K-means clustering or unified palette

        Args:
            image: Input image in RGB format
            n_colors: Number of colors in palette (default from config)
            sort_palette: Sort palette by brightness
            random_state: Random state for reproducibility
            use_unified_palette: Use predefined palette (overrides config)
            palette_name: Name of unified palette to use (overrides config)

        Returns:
            Tuple of (quantized_image, color_palette)
        """
        # Determine if we should use unified palette
        if use_unified_palette is None:
            use_unified_palette = self.config.USE_UNIFIED_PALETTE

        if palette_name is None:
            palette_name = self.config.UNIFIED_PALETTE_NAME

        # Use unified palette if requested
        if use_unified_palette:
            return self._quantize_with_unified_palette(image, palette_name)

        # Otherwise use K-means clustering
        if n_colors is None:
            n_colors = self.config.DEFAULT_NUM_COLORS

        # Validate n_colors
        n_colors = max(self.config.MIN_NUM_COLORS,
                      min(n_colors, self.config.MAX_NUM_COLORS))

        h, w = image.shape[:2]

        clustering_image, color_space = self._prepare_for_clustering(image)
        pixels = clustering_image.reshape(-1, 3).astype(np.float32)

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
        logger.info(f"Performing K-means clustering with {n_colors} colors...")

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
        cluster_centers = kmeans.cluster_centers_.astype(np.float32)
        palette = self._restore_palette_to_rgb(cluster_centers, color_space)
        palette = ensure_uint8(palette)

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
        self.quantized_image = ensure_uint8(quantized)

        logger.info(f"Color quantization complete: {n_colors} colors")
        return quantized, palette

    def _quantize_with_unified_palette(self, image: np.ndarray,
                                      palette_name: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Quantize image using a unified predefined palette

        Args:
            image: Input image in RGB format
            palette_name: Name of the palette to use

        Returns:
            Tuple of (quantized_image, color_palette)
        """
        logger.info(f"Using unified palette: {palette_name}")

        # Get the unified palette
        palette = ensure_uint8(self.palette_manager.get_palette(palette_name))
        self.color_names = self.palette_manager.get_color_names(palette_name)

        # Apply the palette to the image
        h, w = image.shape[:2]
        metric_image, metric_palette = self._convert_to_metric_space(image, palette)
        pixels = metric_image.reshape(-1, 3)
        palette_space = metric_palette

        # Find nearest color for each pixel in perceptual space
        logger.info("Mapping pixels to nearest palette colors...")
        diff = pixels[:, np.newaxis, :] - palette_space[np.newaxis, :, :]
        distances = np.linalg.norm(diff, axis=2)
        labels = np.argmin(distances, axis=1)

        self.labels = labels.reshape(h, w)
        self.palette = palette

        # Create quantized image
        quantized = palette[labels].reshape(h, w, 3)
        self.quantized_image = quantized

        # Filter out unused colors
        unique_labels = np.unique(labels)
        if len(unique_labels) < len(palette):
            logger.info(f"Using {len(unique_labels)} of {len(palette)} available colors")

        logger.info(f"Color quantization complete with unified palette: {len(palette)} colors")
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

        logger.info(f"Reduced palette from {n_colors} to {len(new_palette)} colors")
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

    def quantize_with_target_percentages(
        self,
        image: np.ndarray,
        palette: np.ndarray,
        target_percentages: np.ndarray,
        tolerance: float = 15.0,
        under_use_penalty: float = 5.0,
        max_passes: int = 3
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Advanced quantization with target percentage enforcement.
        Prevents color collapse and ensures balanced palette usage.

        Args:
            image: Input image in RGB format
            palette: Color palette (N, 3) in RGB
            target_percentages: Target percentage for each color (N,)
            tolerance: Tolerance for deviation from target (%)
            under_use_penalty: Penalty multiplier for under-used colors (bonus to favor them)
            max_passes: Number of refinement passes

        Returns:
            Tuple of (quantized_image, labels)
        """
        h, w = image.shape[:2]
        total_pixels = h * w

        # Convert image and palette to LAB for perceptual matching
        logger.info("Converting to LAB color space for perceptual quantization...")
        image_lab = rgb_to_lab(image)
        palette_lab = rgb_to_lab(palette)

        # Flatten image
        pixels_lab = image_lab.reshape(-1, 3)

        # Initialize tracking
        current_counts = np.zeros(len(palette), dtype=int)
        assignments = np.full(total_pixels, -1, dtype=int)

        logger.info(f"Performing {max_passes}-pass quantization with target percentages...")

        for pass_idx in range(max_passes):
            for i in range(total_pixels):
                # Skip already assigned pixels in early passes
                if assignments[i] >= 0 and pass_idx < max_passes - 1:
                    continue

                pixel_lab = pixels_lab[i]
                best_idx = -1
                best_score = float('inf')

                for p in range(len(palette)):
                    # Calculate perceptual color difference (CIEDE2000)
                    delta_e = delta_e_cie2000(pixel_lab, palette_lab[p])

                    # Calculate penalty/bonus based on target deviation
                    current_percent = (current_counts[p] / total_pixels) * 100
                    deviation = current_percent - target_percentages[p]

                    penalty = 0.0
                    if deviation > tolerance:
                        # Over target: strong penalty to push pixels away
                        penalty = deviation * 10.0
                    elif deviation < -tolerance:
                        # Under target: negative penalty (bonus) to favor this color
                        penalty = deviation * under_use_penalty

                    score = delta_e + penalty

                    if score < best_score:
                        best_score = score
                        best_idx = p

                # Update assignment
                if assignments[i] >= 0:
                    current_counts[assignments[i]] -= 1
                assignments[i] = best_idx
                current_counts[best_idx] += 1

            # Log progress
            actual_percentages = (current_counts / total_pixels) * 100
            logger.info(f"Pass {pass_idx + 1}/{max_passes} complete. Color usage: " +
                       f"{', '.join([f'{p:.1f}%' for p in actual_percentages])}")

        # Create quantized image
        quantized = palette[assignments].reshape(h, w, 3)
        self.quantized_image = ensure_uint8(quantized)
        self.labels = assignments.reshape(h, w)
        self.palette = palette

        # Log final statistics
        final_percentages = (current_counts / total_pixels) * 100
        logger.info("Target percentage enforcement complete:")
        for i, (target, actual) in enumerate(zip(target_percentages, final_percentages)):
            diff = actual - target
            logger.info(f"  Color {i+1}: Target={target:.1f}%, Actual={actual:.1f}%, Diff={diff:+.1f}%")

        return quantized, self.labels
