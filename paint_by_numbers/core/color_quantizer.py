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


def assign_colors_to_palette(image: np.ndarray, palette: np.ndarray) -> np.ndarray:
    """
    Assign each pixel in image to the nearest color in palette

    Args:
        image: Input image (H, W, 3) in BGR
        palette: Color palette (N, 3) in BGR

    Returns:
        Quantized image with pixels assigned to palette colors
    """
    h, w = image.shape[:2]
    pixels = image.reshape(-1, 3).astype(np.float32)

    # Find nearest palette color for each pixel
    distances = np.linalg.norm(pixels[:, np.newaxis] - palette[np.newaxis, :], axis=2)
    labels = np.argmin(distances, axis=1)

    # Create quantized image
    quantized = palette[labels].reshape(h, w, 3).astype(np.uint8)

    return quantized


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

        # Enhanced color control parameters
        self.max_single_color_percentage = getattr(config, 'MAX_SINGLE_COLOR_PERCENTAGE', 40.0) if config else 40.0
        self.avoid_pure_black = getattr(config, 'AVOID_PURE_BLACK', True) if config else True
        self.avoid_pure_white = getattr(config, 'AVOID_PURE_WHITE', False) if config else False
        self.vibrancy_boost = getattr(config, 'VIBRANCY_BOOST', 1.15) if config else 1.15
        self.simplify_background = getattr(config, 'SIMPLIFY_BACKGROUND', False) if config else False

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

    def _is_pure_black(self, color: np.ndarray, threshold: int = 30) -> bool:
        """Check if a color is pure or near-pure black."""
        return np.all(color <= threshold)

    def _is_pure_white(self, color: np.ndarray, threshold: int = 225) -> bool:
        """Check if a color is pure or near-pure white."""
        return np.all(color >= threshold)

    def _adjust_black_to_dark_shade(self, color: np.ndarray, image: np.ndarray, labels: np.ndarray, color_idx: int) -> np.ndarray:
        """
        Replace pure black with a dark shade that better represents the dark areas.

        Args:
            color: The black or near-black color to adjust
            image: Original image
            labels: Cluster labels
            color_idx: Index of this color in the palette

        Returns:
            Adjusted dark color (not pure black)
        """
        # Find pixels assigned to this color
        mask = labels.reshape(image.shape[:2]) == color_idx
        masked_pixels = image[mask]

        if len(masked_pixels) == 0:
            # Fallback: use dark gray
            return np.array([40, 40, 40], dtype=np.uint8)

        # Calculate average of the darkest pixels (but not pure black)
        # Filter out pure black pixels
        non_black_mask = np.any(masked_pixels > 5, axis=1)
        if np.any(non_black_mask):
            filtered_pixels = masked_pixels[non_black_mask]
            avg_color = np.mean(filtered_pixels, axis=0)
            # Ensure it's dark but not pure black (minimum 25 in each channel)
            avg_color = np.clip(avg_color, 25, 80)
        else:
            # All pixels are pure black, use a dark gray with slight warmth
            avg_color = np.array([35, 32, 30], dtype=np.float32)

        return avg_color.astype(np.uint8)

    def _detect_and_split_dominant_color(self, image: np.ndarray, palette: np.ndarray,
                                         labels: np.ndarray, n_colors: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Detect if one color dominates too much of the image and split it.

        Args:
            image: Original image
            palette: Current color palette
            labels: Pixel labels
            n_colors: Target number of colors

        Returns:
            Tuple of (updated_palette, updated_labels, updated_quantized_image)
        """
        h, w = image.shape[:2]
        total_pixels = h * w

        # Calculate color percentages
        unique, counts = np.unique(labels, return_counts=True)
        percentages = (counts / total_pixels) * 100

        # Find if any color is too dominant
        dominant_mask = percentages > self.max_single_color_percentage

        if not np.any(dominant_mask):
            # No dominant colors, return unchanged
            quantized = palette[labels].reshape(h, w, 3)
            return palette, labels, quantized

        logger.info(f"Detected dominant color(s) covering >{self.max_single_color_percentage}% of image")

        # For each dominant color, try to split it
        for idx in np.where(dominant_mask)[0]:
            color_idx = unique[idx]
            percentage = percentages[idx]

            logger.info(f"  Color {color_idx} covers {percentage:.1f}% - splitting into 2 shades")

            # Get pixels belonging to this color
            color_mask = (labels == color_idx)
            color_pixels_flat = image.reshape(-1, 3)[color_mask]

            # Check if this is a dark color (likely black issue)
            is_dark = np.mean(palette[color_idx]) < 60

            if is_dark:
                # For dark colors, split into two shades by brightness
                brightnesses = np.mean(color_pixels_flat, axis=1)
                median_brightness = np.median(brightnesses)

                # Create two clusters: darker and lighter
                darker_mask = brightnesses <= median_brightness
                lighter_mask = brightnesses > median_brightness

                darker_pixels = color_pixels_flat[darker_mask]
                lighter_pixels = color_pixels_flat[lighter_mask]

                if len(darker_pixels) > 0 and len(lighter_pixels) > 0:
                    color1 = np.mean(darker_pixels, axis=0).astype(np.uint8)
                    color2 = np.mean(lighter_pixels, axis=0).astype(np.uint8)

                    # Ensure they're visually distinct (at least 20 units apart)
                    if np.linalg.norm(color1.astype(float) - color2.astype(float)) < 20:
                        # Make them more distinct
                        color1 = np.clip(color1 * 0.7, 0, 255).astype(np.uint8)
                        color2 = np.clip(color2 * 1.3, 0, 255).astype(np.uint8)

                    # Replace the dominant color with two colors
                    palette[color_idx] = color1

                    # Add new color if we have room
                    if len(palette) < n_colors + 5:  # Allow some extra colors
                        palette = np.vstack([palette, color2])
                        # Reassign lighter pixels to new color
                        color_mask_2d = labels.reshape(h, w) == color_idx
                        image_brightnesses = np.mean(image, axis=2)
                        light_mask_2d = image_brightnesses > median_brightness
                        combined_mask = color_mask_2d & light_mask_2d
                        labels_2d = labels.reshape(h, w)
                        labels_2d[combined_mask] = len(palette) - 1
                        labels = labels_2d.flatten()
            else:
                # For other colors, use K-means to split into 2 sub-clusters
                if len(color_pixels_flat) > 100:
                    kmeans = KMeans(n_clusters=2, random_state=42, n_init=3)
                    sub_labels = kmeans.fit_predict(color_pixels_flat)
                    sub_centers = kmeans.cluster_centers_.astype(np.uint8)

                    # Replace original color and add new one
                    palette[color_idx] = sub_centers[0]
                    if len(palette) < n_colors + 5:
                        palette = np.vstack([palette, sub_centers[1]])
                        # Reassign pixels
                        flat_labels = labels.copy()
                        color_indices = np.where(color_mask)[0]
                        for i, sub_label in enumerate(sub_labels):
                            if sub_label == 1:
                                flat_labels[color_indices[i]] = len(palette) - 1
                        labels = flat_labels

        # Recreate quantized image
        quantized = palette[labels].reshape(h, w, 3)

        return palette, labels, quantized

    def _enhance_vibrancy(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance color vibrancy before quantization.

        Args:
            image: Input RGB image

        Returns:
            Enhanced RGB image with boosted vibrancy
        """
        if self.vibrancy_boost == 1.0:
            return image

        cv2 = require_cv2()

        # Convert to HSV for saturation adjustment
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV).astype(np.float32)

        # Boost saturation
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * self.vibrancy_boost, 0, 255)

        # Convert back to RGB
        enhanced = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)

        logger.info(f"Enhanced color vibrancy by {self.vibrancy_boost}x")
        return enhanced

    def _replace_pure_colors(self, palette: np.ndarray, image: np.ndarray, labels: np.ndarray) -> np.ndarray:
        """
        Replace pure black/white in palette with more natural alternatives.

        Args:
            palette: Color palette
            image: Original image
            labels: Pixel labels

        Returns:
            Adjusted palette
        """
        adjusted_palette = palette.copy()

        for i, color in enumerate(palette):
            if self.avoid_pure_black and self._is_pure_black(color):
                logger.info(f"Replacing pure black (color {i}) with dark shade")
                adjusted_palette[i] = self._adjust_black_to_dark_shade(color, image, labels, i)

            if self.avoid_pure_white and self._is_pure_white(color):
                logger.info(f"Replacing pure white (color {i}) with off-white")
                # Use a warm off-white instead of pure white
                adjusted_palette[i] = np.array([245, 242, 238], dtype=np.uint8)

        return adjusted_palette

    def _detect_background_color(self, image: np.ndarray, labels: np.ndarray,
                                  palette: np.ndarray) -> Optional[int]:
        """
        Detect which color index represents the background.

        Background is typically:
        - The largest region by pixel count
        - Located at image edges
        - Relatively uniform

        Args:
            image: Original image
            labels: Pixel labels
            palette: Color palette

        Returns:
            Color index of background, or None if not detected
        """
        h, w = image.shape[:2]
        total_pixels = h * w

        # Get color counts
        unique, counts = np.unique(labels, return_counts=True)
        percentages = (counts / total_pixels) * 100

        # Find colors that appear on the edges
        edge_pixels = np.concatenate([
            labels[0, :],          # Top edge
            labels[-1, :],         # Bottom edge
            labels[:, 0],          # Left edge
            labels[:, -1]          # Right edge
        ])

        edge_unique, edge_counts = np.unique(edge_pixels, return_counts=True)
        edge_percentages = (edge_counts / len(edge_pixels)) * 100

        # Find candidate backgrounds
        # A background color should:
        # 1. Appear frequently on edges (>30%)
        # 2. Cover a significant portion of the image (>15%)
        background_candidates = []

        for i, color_idx in enumerate(unique):
            overall_pct = percentages[i]

            # Check if this color appears on edges
            edge_idx = np.where(edge_unique == color_idx)[0]
            if len(edge_idx) > 0:
                edge_pct = edge_percentages[edge_idx[0]]

                if edge_pct > 30 and overall_pct > 15:
                    # This is likely a background color
                    background_candidates.append((color_idx, overall_pct, edge_pct))

        if not background_candidates:
            return None

        # Sort by overall percentage (largest region wins)
        background_candidates.sort(key=lambda x: x[1], reverse=True)

        background_idx = background_candidates[0][0]
        logger.info(f"Detected background color: {background_idx} "
                   f"(covers {background_candidates[0][1]:.1f}% of image, "
                   f"{background_candidates[0][2]:.1f}% of edges)")

        return int(background_idx)

    def _simplify_background(self, palette: np.ndarray, labels: np.ndarray,
                            background_idx: int) -> np.ndarray:
        """
        Simplify or lighten the background color.

        Args:
            palette: Color palette
            labels: Pixel labels
            background_idx: Index of background color

        Returns:
            Adjusted palette with simplified background
        """
        bg_color = palette[background_idx]

        # Check if background is dark
        is_dark_bg = np.mean(bg_color) < 80

        if is_dark_bg:
            logger.info(f"Background is dark (avg: {np.mean(bg_color):.0f}) - lightening")

            # Replace with a much lighter shade that preserves the hue
            cv2 = require_cv2()

            # Convert to HSV to preserve hue
            bg_color_hsv = cv2.cvtColor(
                bg_color.reshape(1, 1, 3), cv2.COLOR_RGB2HSV
            ).reshape(3)

            # Increase value (brightness) significantly
            bg_color_hsv[2] = min(220, bg_color_hsv[2] * 3)  # Triple brightness
            # Reduce saturation slightly for a neutral background
            bg_color_hsv[1] = min(bg_color_hsv[1] * 0.7, 255)

            # Convert back to RGB
            new_bg_color = cv2.cvtColor(
                bg_color_hsv.reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_HSV2RGB
            ).reshape(3)

            palette[background_idx] = new_bg_color

            logger.info(f"Changed background from RGB{tuple(bg_color)} to RGB{tuple(new_bg_color)}")

        return palette

    def _is_skin_tone(self, color: np.ndarray) -> bool:
        """
        Detect if a color is a skin tone using HSV criteria.

        Args:
            color: RGB color (0-255)

        Returns:
            True if color is likely a skin tone
        """
        cv2 = require_cv2()

        # Convert to HSV
        color_hsv = cv2.cvtColor(
            color.reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV
        ).reshape(3).astype(float)

        h, s, v = color_hsv[0], color_hsv[1], color_hsv[2]

        # Skin tone HSV ranges (empirically determined)
        # Hue: 0-50 (red-orange-yellow range)
        # Saturation: 20-170 (not too gray, not too vibrant)
        # Value: 40-255 (not too dark)
        is_skin_hue = (h >= 0 and h <= 50) or (h >= 340)  # Wrapping around red
        is_skin_sat = s >= 20 and s <= 170
        is_skin_val = v >= 40

        return is_skin_hue and is_skin_sat and is_skin_val

    def _enforce_minimum_color_distance(self, palette: np.ndarray, min_distance: float = 25.0) -> np.ndarray:
        """
        Enforce minimum perceptual distance between palette colors for vivid separation.

        Args:
            palette: Color palette in RGB
            min_distance: Minimum Delta E distance in LAB space

        Returns:
            Adjusted palette with better color separation
        """
        if len(palette) <= 1:
            return palette

        logger.info(f"Enforcing minimum color distance: {min_distance} Delta E")

        # Convert to LAB for perceptual distance
        palette_lab = rgb_to_lab(palette)

        # Iteratively push colors apart
        max_iterations = 10
        adjustment_factor = 1.5

        for iteration in range(max_iterations):
            adjusted = False

            for i in range(len(palette_lab)):
                for j in range(i + 1, len(palette_lab)):
                    # Calculate perceptual distance
                    distance = delta_e_cie2000(palette_lab[i], palette_lab[j])

                    if distance < min_distance:
                        # Colors too similar - push them apart
                        adjusted = True

                        # Calculate midpoint
                        mid = (palette_lab[i] + palette_lab[j]) / 2

                        # Push colors away from midpoint
                        diff_i = palette_lab[i] - mid
                        diff_j = palette_lab[j] - mid

                        palette_lab[i] = mid + diff_i * adjustment_factor
                        palette_lab[j] = mid + diff_j * adjustment_factor

                        # Clip to valid LAB range
                        palette_lab[i] = np.clip(palette_lab[i], [0, -128, -128], [100, 127, 127])
                        palette_lab[j] = np.clip(palette_lab[j], [0, -128, -128], [100, 127, 127])

            if not adjusted:
                break

        # Convert back to RGB
        adjusted_palette = lab_to_rgb(palette_lab)

        # Verify improvements
        min_dist_before = float('inf')
        min_dist_after = float('inf')

        palette_lab_orig = rgb_to_lab(palette)
        for i in range(len(palette)):
            for j in range(i + 1, len(palette)):
                dist_before = delta_e_cie2000(palette_lab_orig[i], palette_lab_orig[j])
                dist_after = delta_e_cie2000(palette_lab[i], palette_lab[j])
                min_dist_before = min(min_dist_before, dist_before)
                min_dist_after = min(min_dist_after, dist_after)

        logger.info(f"Color separation: min distance {min_dist_before:.1f} → {min_dist_after:.1f} Delta E")

        return adjusted_palette

    def _reduce_dark_clutter_in_skin(self, image: np.ndarray, palette: np.ndarray,
                                     labels: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Reduce dark speckling in skin tone areas by merging very dark regions.

        Args:
            image: Original image
            palette: Color palette
            labels: Pixel labels

        Returns:
            Tuple of (adjusted_palette, adjusted_labels)
        """
        h, w = image.shape[:2]
        labels_2d = labels.reshape(h, w) if len(labels.shape) == 1 else labels

        # Identify skin tone colors
        skin_color_indices = []
        dark_color_indices = []

        for i, color in enumerate(palette):
            if self._is_skin_tone(color):
                skin_color_indices.append(i)
            elif np.mean(color) < 60:  # Dark color
                dark_color_indices.append(i)

        if not skin_color_indices or not dark_color_indices:
            return palette, labels_2d

        logger.info(f"Found {len(skin_color_indices)} skin tones and {len(dark_color_indices)} dark colors")

        # For each dark color, check if it appears in small regions near skin tones
        for dark_idx in dark_color_indices:
            dark_mask = (labels_2d == dark_idx)

            # Find connected components of this dark color
            cv2 = require_cv2()
            num_labels, components, stats, centroids = cv2.connectedComponentsWithStats(
                dark_mask.astype(np.uint8), connectivity=8
            )

            # Check each dark region
            for region_idx in range(1, num_labels):  # Skip background (0)
                area = stats[region_idx, cv2.CC_STAT_AREA]

                # If region is small (< 200 pixels), consider merging
                if area < 200:
                    # Get region mask
                    region_mask = (components == region_idx)

                    # Dilate to find neighboring colors
                    kernel = np.ones((5, 5), np.uint8)
                    dilated = cv2.dilate(region_mask.astype(np.uint8), kernel, iterations=1)
                    neighbor_mask = dilated & ~region_mask

                    # Get neighboring color labels
                    neighbor_labels = labels_2d[neighbor_mask]
                    if len(neighbor_labels) == 0:
                        continue

                    # Find most common neighbor
                    unique_neighbors, counts = np.unique(neighbor_labels, return_counts=True)

                    # Prefer skin tone neighbors
                    skin_neighbors = [n for n in unique_neighbors if n in skin_color_indices]

                    if skin_neighbors:
                        # Merge into most common skin tone neighbor
                        neighbor_counts = counts[[list(unique_neighbors).index(n) for n in skin_neighbors]]
                        best_neighbor = skin_neighbors[np.argmax(neighbor_counts)]

                        logger.info(f"Merging small dark region ({area}px) into skin tone {best_neighbor}")
                        labels_2d[region_mask] = best_neighbor

        return palette, labels_2d

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

        # Otherwise use K-means clustering with enhancements
        if n_colors is None:
            n_colors = self.config.DEFAULT_NUM_COLORS

        # Validate n_colors
        n_colors = max(self.config.MIN_NUM_COLORS,
                      min(n_colors, self.config.MAX_NUM_COLORS))

        h, w = image.shape[:2]

        # ENHANCEMENT 1: Apply vibrancy boost before quantization
        enhanced_image = self._enhance_vibrancy(image)

        clustering_image, color_space = self._prepare_for_clustering(enhanced_image)
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

        # ENHANCEMENT 2: Replace pure black/white if enabled
        palette = self._replace_pure_colors(palette, enhanced_image, labels)

        # ENHANCEMENT 3: Detect and split dominant colors
        palette, labels, quantized = self._detect_and_split_dominant_color(
            enhanced_image, palette, labels, n_colors
        )

        # ENHANCEMENT 4: Simplify background if enabled
        if self.simplify_background:
            background_idx = self._detect_background_color(enhanced_image, labels, palette)
            if background_idx is not None:
                palette = self._simplify_background(palette, labels, background_idx)

        # ENHANCEMENT 5: Enforce minimum color distance for vivid separation
        min_color_distance = getattr(self.config, 'MIN_COLOR_DISTANCE', 25.0)
        if min_color_distance > 0:
            palette = self._enforce_minimum_color_distance(palette, min_color_distance)

        # ENHANCEMENT 6: Reduce dark clutter in skin tones
        reduce_skin_clutter = getattr(self.config, 'REDUCE_SKIN_CLUTTER', True)
        if reduce_skin_clutter:
            palette, labels_2d = self._reduce_dark_clutter_in_skin(enhanced_image, palette, labels)
            labels = labels_2d.flatten()

        # Update stored values
        n_colors_actual = len(palette)
        self.labels = labels.reshape(h, w)

        # Sort palette by brightness if requested
        if sort_palette and n_colors_actual > 1:
            # Create mapping from old to new labels
            sorted_palette = sort_colors_by_brightness(palette)
            old_to_new = np.zeros(n_colors_actual, dtype=int)

            for new_idx, sorted_color in enumerate(sorted_palette):
                # Find which old index this color came from
                for old_idx, orig_color in enumerate(palette):
                    if np.array_equal(sorted_color, orig_color):
                        old_to_new[old_idx] = new_idx
                        break

            # Remap labels
            labels_flat = self.labels.flatten()
            labels_flat = np.array([old_to_new[label] if label < len(old_to_new) else label for label in labels_flat])
            self.labels = labels_flat.reshape(h, w)
            palette = sorted_palette

        self.palette = palette

        # Create final quantized image
        quantized = palette[self.labels.flatten()].reshape(h, w, 3)
        self.quantized_image = ensure_uint8(quantized)

        logger.info(f"Color quantization complete: {len(palette)} colors (requested: {n_colors})")
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
