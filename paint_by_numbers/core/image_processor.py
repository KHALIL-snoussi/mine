"""
Image Processing Module - Handles image loading and preprocessing
"""

import cv2
import numpy as np
from typing import Optional, Tuple
from pathlib import Path

# Handle imports for both package and script usage
try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.utils.helpers import resize_image, ensure_uint8
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from utils.helpers import resize_image, ensure_uint8


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

    def load_image(self, image_path: str) -> np.ndarray:
        """
        Load and validate image from file

        Args:
            image_path: Path to image file

        Returns:
            Loaded image in RGB format

        Raises:
            FileNotFoundError: If image file doesn't exist
            ValueError: If image is invalid or too small
        """
        # Check if file exists
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        # Load image
        image = cv2.imread(str(path))
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")

        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Validate image size
        h, w = image.shape[:2]
        min_w, min_h = self.config.MIN_IMAGE_SIZE

        if h < min_h or w < min_w:
            raise ValueError(
                f"Image too small. Minimum size is {min_w}x{min_h}, "
                f"got {w}x{h}"
            )

        self.original_image = image
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

        # Resize if needed
        image = resize_image(image, self.config.MAX_IMAGE_SIZE)

        # Convert to float for processing
        processed = image.astype(np.float32)

        # Apply Gaussian blur for noise reduction
        if apply_gaussian:
            kernel = self.config.GAUSSIAN_BLUR_KERNEL
            processed = cv2.GaussianBlur(processed, kernel, 0)

        # Apply bilateral filter for edge-preserving smoothing
        if apply_bilateral:
            # Bilateral filter works on uint8, so convert temporarily
            temp = processed.astype(np.uint8)
            temp = cv2.bilateralFilter(
                temp,
                d=self.config.BILATERAL_FILTER_D,
                sigmaColor=self.config.BILATERAL_SIGMA_COLOR,
                sigmaSpace=self.config.BILATERAL_SIGMA_SPACE
            )
            processed = temp.astype(np.float32)

        # Convert back to uint8
        processed = ensure_uint8(processed)

        self.processed_image = processed
        return processed

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

        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l_channel, a, b = cv2.split(lab)

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
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

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        # Apply Canny edge detection
        edges = cv2.Canny(
            gray,
            self.config.EDGE_THRESHOLD_LOW,
            self.config.EDGE_THRESHOLD_HIGH
        )

        return edges

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
