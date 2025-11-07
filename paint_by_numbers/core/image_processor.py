"""
Image Processing Module - Handles image loading and preprocessing
"""

import numpy as np
from typing import Optional, Tuple
from pathlib import Path

# Handle imports for both package and script usage
try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import resize_image, ensure_uint8
    from paint_by_numbers.logger import logger
    from paint_by_numbers.utils.opencv import require_cv2
    from paint_by_numbers.core.intelligent_upscaler import IntelligentUpscaler
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import resize_image, ensure_uint8
    from logger import logger
    from utils.opencv import require_cv2
    from core.intelligent_upscaler import IntelligentUpscaler


class ImageProcessor:
    """Handles image loading, validation, and preprocessing"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize image processor

        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.original_image = None
        self.processed_image = None
        self.upscaler = IntelligentUpscaler(target_format='ultra_hd')
        self.upscale_metadata = None

    def _apply_white_balance(self, image: np.ndarray) -> np.ndarray:
        """Apply simple gray-world white balance with optional clipping."""
        if not getattr(self.config, "AUTO_WHITE_BALANCE", False):
            return image

        clip = float(getattr(self.config, "WHITE_BALANCE_CLIP", 0.0))
        float_img = image.astype(np.float32)

        if clip > 0:
            lower = np.percentile(float_img, clip * 100, axis=(0, 1))
            upper = np.percentile(float_img, (1.0 - clip) * 100, axis=(0, 1))
            float_img = np.clip(float_img, lower, upper)

        avg_rgb = float_img.reshape(-1, 3).mean(axis=0)
        mean_gray = np.mean(avg_rgb)
        scale = mean_gray / np.maximum(avg_rgb, 1e-6)
        balanced = float_img * scale
        return np.clip(balanced, 0, 255).astype(np.uint8)

    def _apply_tone_balance(self, image: np.ndarray) -> np.ndarray:
        """Normalize image luminance towards configured target."""
        if not getattr(self.config, "APPLY_TONE_BALANCE", False):
            return image

        cv2 = require_cv2()
        target = float(getattr(self.config, "TONE_BALANCE_TARGET", 0.55))
        target = np.clip(target, 0.05, 0.95)

        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB).astype(np.float32)
        l_channel = lab[:, :, 0] / 255.0
        mean_l = float(np.mean(l_channel))

        if mean_l <= 1e-3:
            return image

        denominator = np.log(max(mean_l, 1e-3))
        if abs(denominator) < 1e-6:
            return image

        gamma = np.log(target) / denominator
        # Stabilize extremes to prevent NaNs
        l_channel = np.power(np.clip(l_channel, 1e-4, 1.0), gamma)
        lab[:, :, 0] = np.clip(l_channel * 255.0, 0, 255)

        balanced = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)
        return balanced

    def _apply_local_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance local contrast using CLAHE in LAB space."""
        if not getattr(self.config, "APPLY_LOCAL_CONTRAST", False):
            return image

        cv2 = require_cv2()
        clip_limit = float(getattr(self.config, "CLAHE_CLIP_LIMIT", 2.0))
        tile_grid = getattr(self.config, "CLAHE_TILE_GRID_SIZE", (8, 8))
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=max(0.1, clip_limit),
                                tileGridSize=tuple(tile_grid))
        l_channel = clahe.apply(l_channel)

        enhanced_lab = cv2.merge([l_channel, a_channel, b_channel])
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

    def _apply_unsharp_mask(self, image: np.ndarray) -> np.ndarray:
        """Sharpen image using unsharp masking."""
        if not getattr(self.config, "APPLY_SHARPENING", False):
            return image

        cv2 = require_cv2()
        amount = float(getattr(self.config, "SHARPEN_AMOUNT", 0.5))
        radius = int(max(1, getattr(self.config, "SHARPEN_RADIUS", 3)))

        kernel_size = radius * 2 + 1
        blurred = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        sharpened = cv2.addWeighted(image, 1.0 + amount, blurred, -amount, 0)
        return np.clip(sharpened, 0, 255).astype(np.uint8)

    def load_image(self, image_path: str) -> np.ndarray:
        """
        Load and validate image from file

        Args:
            image_path: Path to image file

        Returns:
            Loaded image in RGB format

        Raises:
            FileNotFoundError: If image file doesn't exist
            ValueError: If image is invalid, too small, or too large
            MemoryError: If image is too large to process
        """
        # Check if file exists
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        # Validate file extension
        valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        if path.suffix.lower() not in valid_extensions:
            logger.warning(f"File extension '{path.suffix}' may not be a supported image format. "
                          f"Supported: {', '.join(valid_extensions)}")

        # Check if it's actually a file (not a directory)
        if not path.is_file():
            raise ValueError(f"Path is not a file: {image_path}")

        # Check file size to prevent loading extremely large files
        file_size_mb = path.stat().st_size / (1024 * 1024)
        if file_size_mb > 100:  # 100MB limit
            raise ValueError(
                f"Image file too large: {file_size_mb:.1f}MB. "
                f"Maximum supported file size is 100MB."
            )

        cv2 = require_cv2()

        # Load image with error handling
        try:
            image = cv2.imread(str(path))
        except Exception as e:
            raise ValueError(f"Failed to read image file: {e}")

        if image is None:
            raise ValueError(f"Failed to load image: {image_path}. "
                           f"This may not be a valid image file or the format is not supported.")

        # Validate image dimensions
        h, w = image.shape[:2]

        # Check minimum size
        min_w, min_h = self.config.MIN_IMAGE_SIZE
        if h < min_h or w < min_w:
            raise ValueError(
                f"Image too small. Minimum size is {min_w}x{min_h}, "
                f"got {w}x{h}"
            )

        # Check maximum size to prevent memory issues
        MAX_DIMENSION = 10000  # 10k pixels per dimension
        if h > MAX_DIMENSION or w > MAX_DIMENSION:
            raise ValueError(
                f"Image dimensions too large: {w}x{h}. "
                f"Maximum dimension is {MAX_DIMENSION} pixels. "
                f"Please resize your image before processing."
            )

        # Estimate memory usage (3 bytes per pixel for RGB)
        estimated_memory_mb = (w * h * 3) / (1024 * 1024)
        if estimated_memory_mb > 300:  # 300MB limit for single image
            logger.warning(
                f"Large image detected ({w}x{h}, ~{estimated_memory_mb:.1f}MB). "
                f"Processing may be slow or fail on systems with limited memory."
            )

        # Convert BGR to RGB with error handling
        try:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        except cv2.error as e:
            raise ValueError(f"Failed to convert image color space: {e}")

        self.original_image = image
        logger.info(f"Successfully loaded image: {w}x{h} pixels")

        # ========================================
        # INTELLIGENT UPSCALING FOR BEST QUALITY
        # ========================================
        # Automatically upscale small images for crystal-clear results
        upscaled_image, upscale_info = self.upscaler.process(image, force_upscale=False)

        if upscale_info['was_upscaled']:
            self.upscale_metadata = upscale_info
            logger.info("🚀 INTELLIGENT UPSCALING APPLIED")
            logger.info(f"   Original: {upscale_info['original_size'][0]}x{upscale_info['original_size'][1]} "
                       f"({upscale_info['original_megapixels']:.1f}MP)")
            logger.info(f"   Enhanced: {upscale_info['final_size'][0]}x{upscale_info['final_size'][1]} "
                       f"({upscale_info['final_megapixels']:.1f}MP)")
            logger.info(f"   Quality Improvement: +{upscale_info['quality_improvement']:.0f}%")
            logger.info(f"   Method: {upscale_info['upscale_method']}")
            if upscale_info['has_faces']:
                logger.info("   ✨ Face-optimized processing enabled!")

            # Use the upscaled image
            self.original_image = upscaled_image
            return upscaled_image
        else:
            logger.info("   Image resolution is already optimal - no upscaling needed")
            return image

    def preprocess(self, image: Optional[np.ndarray] = None,
                   apply_bilateral: bool = True,
                   apply_gaussian: bool = True) -> np.ndarray:
        """
        Preprocess image for optimal paint-by-numbers conversion

        Args:
            image: Input image (uses loaded image if None)
            apply_bilateral: Apply bilateral filter for edge-preserving smoothing
            apply_gaussian: Apply Gaussian blur for noise reduction

        Returns:
            Preprocessed image
        """
        if image is None:
            if self.original_image is None:
                raise ValueError("No image loaded. Call load_image() first.")
            image = self.original_image.copy()

        cv2 = require_cv2()
        # Resize if needed
        processed = resize_image(image, self.config.MAX_IMAGE_SIZE)
        processed = ensure_uint8(processed)

        # Global color and tone normalization first for stable clustering
        processed = self._apply_white_balance(processed)
        processed = self._apply_tone_balance(processed)

        # Pre-denoise to avoid fragmenting regions before clustering
        if getattr(self.config, "APPLY_DENOISE", False):
            h = float(getattr(self.config, "DENOISE_STRENGTH", 7))
            h_color = float(getattr(self.config, "DENOISE_COLOR_STRENGTH", 7))
            try:
                processed = cv2.fastNlMeansDenoisingColored(
                    processed, None, h, h_color, 7, 21
                )
            except AttributeError:
                if 'logger' in globals():
                    logger.warning(
                        "OpenCV build missing fastNlMeansDenoisingColored; skipping denoise step"
                    )

        # Apply Gaussian blur for subtle noise smoothing
        if apply_gaussian:
            kernel = self.config.GAUSSIAN_BLUR_KERNEL
            processed = cv2.GaussianBlur(processed, kernel, 0)

        # Apply MULTI-PASS bilateral filter for ULTRA edge-preserving smoothing
        # ULTRA QUALITY MODE: 3 passes for extreme smoothness (+60-90 seconds)
        if apply_bilateral:
            num_bilateral_passes = 3  # More passes = smoother but slower
            for pass_num in range(num_bilateral_passes):
                processed = cv2.bilateralFilter(
                    processed,
                    d=self.config.BILATERAL_FILTER_D,
                    sigmaColor=self.config.BILATERAL_SIGMA_COLOR,
                    sigmaSpace=self.config.BILATERAL_SIGMA_SPACE
                )
                logger.debug(f"   Bilateral filter pass {pass_num + 1}/{num_bilateral_passes} complete")

        # Reinforce local contrast before quantization
        processed = self._apply_local_contrast(processed)

        # Final sharpening to keep contours crisp
        processed = self._apply_unsharp_mask(processed)

        processed = ensure_uint8(processed)

        self.processed_image = processed
        return processed

    def apply_portrait_smoothing(self, image: Optional[np.ndarray] = None,
                                 face_blur_kernel: int = 25,
                                 detection_margin: float = 1.5) -> np.ndarray:
        """
        Apply intelligent face-aware smoothing for portrait optimization.
        Detects faces and applies strong smoothing ONLY to skin areas,
        keeping hair, eyes, and glasses sharp.

        This is THE KEY to reducing over-segmentation in portraits!

        Args:
            image: Input image (uses processed image if None)
            face_blur_kernel: Blur strength for face (15-31, must be odd)
            detection_margin: Expand detected face by this factor

        Returns:
            Portrait-smoothed image with smooth skin, sharp details
        """
        if image is None:
            if self.processed_image is None:
                raise ValueError("No processed image. Call preprocess() first.")
            image = self.processed_image.copy()
        else:
            image = image.copy()

        cv2 = require_cv2()

        try:
            # Import face detector
            try:
                from paint_by_numbers.intelligence.subject_detector import SubjectDetector
            except ImportError:
                import sys
                from pathlib import Path
                sys.path.insert(0, str(Path(__file__).parent.parent))
                from intelligence.subject_detector import SubjectDetector

            # Detect face region
            detector = SubjectDetector()
            face_region = detector.detect_best_subject(image,
                                                       expand_faces=True,
                                                       expansion_factor=detection_margin)

            logger.info(f"   Detected {face_region.subject_type} region for portrait smoothing")
            logger.info(f"   Face region: ({face_region.x}, {face_region.y}, {face_region.width}, {face_region.height})")

            # Create smooth mask with feathered edges
            emphasis_mask = detector.create_emphasis_mask(image, face_region, feather_size=50)

            # Ensure blur kernel is odd
            if face_blur_kernel % 2 == 0:
                face_blur_kernel += 1

            # Apply STRONG Gaussian blur to reduce skin texture detail
            # This is critical - strong blur = fewer regions on face!
            face_blurred = cv2.GaussianBlur(image, (face_blur_kernel, face_blur_kernel), 0)

            logger.info(f"   Applied {face_blur_kernel}x{face_blur_kernel} Gaussian blur to face region")

            # Blend: smooth face, sharp background/hair
            result = np.zeros_like(image, dtype=np.float32)
            for c in range(3):  # RGB channels
                result[:, :, c] = (
                    emphasis_mask * face_blurred[:, :, c].astype(np.float32) +
                    (1 - emphasis_mask) * image[:, :, c].astype(np.float32)
                )

            result = np.clip(result, 0, 255).astype(np.uint8)

            logger.info("   ✓ Portrait smoothing complete - face regions will be much smoother!")
            return result

        except Exception as e:
            logger.warning(f"   Face detection failed ({e}), applying gentle global smoothing")
            # Fallback: gentle global smoothing
            kernel = min(face_blur_kernel, 15)
            if kernel % 2 == 0:
                kernel += 1
            return cv2.GaussianBlur(image, (kernel, kernel), 0)

    def merge_small_regions(self, quantized_image: np.ndarray,
                           min_region_size: int = 500,
                           aggressive: bool = True) -> np.ndarray:
        """
        Aggressively merge small regions to create larger, paintable areas.
        Critical for portrait quality - reduces 1000+ regions to 80-120.

        Args:
            quantized_image: Color-quantized image
            min_region_size: Minimum pixels per region (500-1000 for portraits)
            aggressive: Use aggressive merging (recommended for portraits)

        Returns:
            Image with merged regions
        """
        cv2 = require_cv2()
        result = quantized_image.copy()
        h, w = result.shape[:2]

        logger.info(f"   Starting region merging (min size: {min_region_size}px, aggressive: {aggressive})")

        # Convert to labels for analysis
        result_gray = cv2.cvtColor(result, cv2.COLOR_RGB2GRAY)
        _, labels = cv2.connectedComponents(result_gray)

        original_regions = labels.max() + 1
        merged_count = 0

        # Find all unique colors
        unique_colors = {}
        for y in range(h):
            for x in range(w):
                color = tuple(result[y, x])
                if color not in unique_colors:
                    unique_colors[color] = []
                unique_colors[color].append((y, x))

        # Process each color to find and merge small regions
        for color, pixels in unique_colors.items():
            if len(pixels) < min_region_size:
                # Small region - find nearest similar color to merge with
                # Get first pixel location
                py, px = pixels[0]

                # Find neighboring pixels of different colors
                best_neighbor = None
                best_distance = float('inf')

                # Search in a window around this pixel
                search_radius = 5
                for dy in range(-search_radius, search_radius + 1):
                    for dx in range(-search_radius, search_radius + 1):
                        ny, nx = py + dy, px + dx
                        if 0 <= ny < h and 0 <= nx < w:
                            neighbor_color = tuple(result[ny, nx])
                            if neighbor_color != color:
                                # Calculate color distance
                                dist = sum((a - b) ** 2 for a, b in zip(color, neighbor_color))
                                if dist < best_distance:
                                    best_distance = dist
                                    best_neighbor = neighbor_color

                # Merge this small region with best neighbor
                if best_neighbor is not None:
                    for py, px in pixels:
                        result[py, px] = best_neighbor
                    merged_count += 1

        if aggressive:
            # ULTRA QUALITY: EXTREME aggressive merging of similar adjacent colors
            # This dramatically reduces region count for maximum paintability
            similarity_threshold = 1200  # ULTRA aggressive merging (3x larger threshold)

            for _ in range(5):  # ULTRA QUALITY: 5 passes for extreme merging (+30-45 seconds)
                changed = False
                result_gray = cv2.cvtColor(result, cv2.COLOR_RGB2GRAY)
                _, labels = cv2.connectedComponents(result_gray)

                for label_id in range(1, labels.max() + 1):
                    mask = (labels == label_id)
                    if not mask.any():
                        continue

                    # Get this region's color
                    ys, xs = np.where(mask)
                    if len(ys) == 0:
                        continue
                    region_color = tuple(result[ys[0], xs[0]])

                    # Find edge pixels
                    kernel = np.ones((3, 3), np.uint8)
                    dilated = cv2.dilate(mask.astype(np.uint8), kernel, iterations=1)
                    edge = dilated - mask.astype(np.uint8)
                    edge_ys, edge_xs = np.where(edge > 0)

                    if len(edge_ys) == 0:
                        continue

                    # Find most common neighbor color
                    neighbor_colors = {}
                    for ey, ex in zip(edge_ys, edge_xs):
                        nc = tuple(result[ey, ex])
                        if nc != region_color:
                            neighbor_colors[nc] = neighbor_colors.get(nc, 0) + 1

                    if neighbor_colors:
                        # Get most common neighbor
                        best_neighbor = max(neighbor_colors.items(), key=lambda x: x[1])[0]

                        # Check if similar enough to merge
                        color_dist = sum((a - b) ** 2 for a, b in zip(region_color, best_neighbor))
                        if color_dist < similarity_threshold:
                            result[mask] = best_neighbor
                            merged_count += 1
                            changed = True

                if not changed:
                    break

        # Count final regions
        result_gray = cv2.cvtColor(result, cv2.COLOR_RGB2GRAY)
        _, labels = cv2.connectedComponents(result_gray)
        final_regions = labels.max() + 1

        logger.info(f"   ✓ Region merging complete: {original_regions} → {final_regions} regions ({merged_count} merges)")

        return result

    def enhance_edges(self, image: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Enhance edges in the image

        Args:
            image: Input image (uses processed image if None)

        Returns:
            Edge-enhanced image
        """
        if image is None:
            if self.processed_image is None:
                raise ValueError("No processed image. Call preprocess() first.")
            image = self.processed_image

        cv2 = require_cv2()
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l_channel, a, b = cv2.split(lab)

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
        clip = float(getattr(self.config, "CLAHE_CLIP_LIMIT", 2.0))
        tile_grid = getattr(self.config, "CLAHE_TILE_GRID_SIZE", (8, 8))
        clahe = cv2.createCLAHE(clipLimit=max(0.1, clip), tileGridSize=tuple(tile_grid))
        l_channel = clahe.apply(l_channel)

        # Merge channels
        enhanced_lab = cv2.merge([l_channel, a, b])

        # Convert back to RGB
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

        return enhanced

    def detect_edges(self, image: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Detect edges using Canny edge detection

        Args:
            image: Input image (uses processed image if None)

        Returns:
            Binary edge map
        """
        if image is None:
            if self.processed_image is None:
                raise ValueError("No processed image. Call preprocess() first.")
            image = self.processed_image

        cv2 = require_cv2()
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        # Apply Canny edge detection
        edges = cv2.Canny(
            gray,
            self.config.EDGE_THRESHOLD_LOW,
            self.config.EDGE_THRESHOLD_HIGH
        )

        return edges

    def apply_majority_filter(self, image: np.ndarray,
                             edge_mask: Optional[np.ndarray] = None,
                             edge_threshold: int = 30) -> np.ndarray:
        """
        Apply 3×3 majority filter to remove single-pixel noise.
        Only affects non-edge pixels to preserve important details.

        Args:
            image: Input quantized image
            edge_mask: Optional edge strength map (0-255)
            edge_threshold: Threshold above which pixels are considered edges

        Returns:
            Filtered image
        """
        cv2 = require_cv2()
        h, w = image.shape[:2]

        # Generate edge mask if not provided
        if edge_mask is None:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            edge_mask = cv2.Canny(gray, 30, 100)

        output = image.copy()

        for y in range(1, h - 1):
            for x in range(1, w - 1):
                # Skip edge pixels
                if edge_mask[y, x] > edge_threshold:
                    continue

                # Count color occurrences in 3×3 neighborhood
                color_counts = {}

                for ky in range(-1, 2):
                    for kx in range(-1, 2):
                        ny, nx = y + ky, x + kx
                        color = tuple(image[ny, nx])
                        color_counts[color] = color_counts.get(color, 0) + 1

                # Find majority color
                majority_color = max(color_counts.items(), key=lambda x: x[1])[0]
                output[y, x] = majority_color

        return output

    def get_image_info(self) -> dict:
        """
        Get information about the loaded image

        Returns:
            Dictionary with image information
        """
        if self.original_image is None:
            return {"loaded": False}

        h, w = self.original_image.shape[:2]
        return {
            "loaded": True,
            "width": w,
            "height": h,
            "channels": self.original_image.shape[2] if len(self.original_image.shape) > 2 else 1,
            "dtype": str(self.original_image.dtype),
            "size_mb": self.original_image.nbytes / (1024 * 1024)
        }
