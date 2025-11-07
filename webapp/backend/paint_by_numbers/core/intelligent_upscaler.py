"""
Intelligent Image Upscaler
Automatically upscales and enhances images for optimal quality
Especially optimized for portrait/face images
"""

import numpy as np
from typing import Tuple, Optional
from ..utils.opencv import require_cv2

cv2 = require_cv2()


class IntelligentUpscaler:
    """
    Intelligent upscaler that automatically enhances images to optimal resolution

    Features:
    - Automatic resolution detection
    - Smart upscaling for small images
    - Face-optimized enhancement
    - Sharpness preservation
    """

    # Target resolutions for different paper formats
    TARGET_RESOLUTIONS = {
        'a4_portrait': (2480, 3508),      # A4 @ 300 DPI
        'a4_landscape': (3508, 2480),
        'a3_portrait': (3508, 4960),      # A3 @ 300 DPI
        'a3_landscape': (4960, 3508),
        'ultra_hd': (3508, 4960),         # Default ultra HD
    }

    # Minimum recommended resolution
    MIN_RECOMMENDED_SIZE = 2000

    def __init__(self, target_format: str = 'ultra_hd'):
        """
        Initialize upscaler

        Args:
            target_format: Target paper format (a4_portrait, a3_portrait, ultra_hd)
        """
        self.target_format = target_format
        self.target_resolution = self.TARGET_RESOLUTIONS.get(target_format, (3508, 4960))

    def needs_upscaling(self, image: np.ndarray) -> bool:
        """
        Check if image needs upscaling

        Args:
            image: Input image

        Returns:
            True if image should be upscaled
        """
        height, width = image.shape[:2]
        max_dim = max(height, width)
        min_dim = min(height, width)

        # Upscale if smaller than minimum recommended size
        return max_dim < self.MIN_RECOMMENDED_SIZE or min_dim < self.MIN_RECOMMENDED_SIZE

    def calculate_optimal_size(self, image: np.ndarray) -> Tuple[int, int]:
        """
        Calculate optimal upscaling size based on image content and target

        Args:
            image: Input image

        Returns:
            Optimal (width, height) for upscaling
        """
        height, width = image.shape[:2]
        aspect_ratio = width / height

        target_width, target_height = self.target_resolution
        target_aspect = target_width / target_height

        # Maintain aspect ratio while maximizing quality
        if aspect_ratio > target_aspect:
            # Landscape or square
            new_width = target_width
            new_height = int(target_width / aspect_ratio)
        else:
            # Portrait
            new_height = target_height
            new_width = int(target_height * aspect_ratio)

        # Ensure minimum size
        max_dim = max(new_width, new_height)
        if max_dim < self.MIN_RECOMMENDED_SIZE:
            scale = self.MIN_RECOMMENDED_SIZE / max_dim
            new_width = int(new_width * scale)
            new_height = int(new_height * scale)

        return (new_width, new_height)

    def detect_faces(self, image: np.ndarray) -> bool:
        """
        Detect if image contains faces (for face-optimized processing)

        Args:
            image: Input image

        Returns:
            True if faces detected
        """
        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Use Haar Cascade for fast face detection
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )

            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            return len(faces) > 0

        except Exception:
            # If face detection fails, assume no faces
            return False

    def upscale_with_quality(self, image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """
        Upscale image using high-quality interpolation

        Args:
            image: Input image
            target_size: Target (width, height)

        Returns:
            Upscaled image
        """
        # Use INTER_CUBIC for upscaling (best quality)
        upscaled = cv2.resize(image, target_size, interpolation=cv2.INTER_CUBIC)

        # Apply sharpening to restore detail lost in upscaling
        upscaled = self._sharpen_image(upscaled, amount=0.5)

        # Denoise to remove interpolation artifacts
        upscaled = cv2.fastNlMeansDenoisingColored(upscaled, None, 3, 3, 7, 21)

        return upscaled

    def upscale_for_faces(self, image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """
        Upscale with face-optimized processing

        Args:
            image: Input image with faces
            target_size: Target (width, height)

        Returns:
            Upscaled image optimized for faces
        """
        # Step 1: Initial upscaling with LANCZOS4 (best for faces)
        upscaled = cv2.resize(image, target_size, interpolation=cv2.INTER_LANCZOS4)

        # Step 2: Enhance skin tones (optional, can be commented out)
        upscaled = self._enhance_skin_tones(upscaled)

        # Step 3: Sharpen with face-specific settings
        upscaled = self._sharpen_image(upscaled, amount=0.7)

        # Step 4: Apply bilateral filter to smooth skin while preserving edges
        upscaled = cv2.bilateralFilter(upscaled, 5, 50, 50)

        # Step 5: Light denoising
        upscaled = cv2.fastNlMeansDenoisingColored(upscaled, None, 2, 2, 7, 21)

        # Step 6: Final detail enhancement with CLAHE
        upscaled = self._enhance_details(upscaled)

        return upscaled

    def _sharpen_image(self, image: np.ndarray, amount: float = 0.5) -> np.ndarray:
        """
        Sharpen image using unsharp mask

        Args:
            image: Input image
            amount: Sharpening amount (0-1)

        Returns:
            Sharpened image
        """
        # Create Gaussian blur
        blurred = cv2.GaussianBlur(image, (0, 0), 3)

        # Unsharp mask: original + amount * (original - blurred)
        sharpened = cv2.addWeighted(image, 1.0 + amount, blurred, -amount, 0)

        return sharpened

    def _enhance_skin_tones(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance skin tones for portraits

        Args:
            image: Input image

        Returns:
            Image with enhanced skin tones
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Slightly enhance the A channel (red-green) for better skin tones
        a = cv2.convertScaleAbs(a, alpha=1.05, beta=2)

        # Merge and convert back
        enhanced_lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        return enhanced

    def _enhance_details(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance fine details using CLAHE

        Args:
            image: Input image

        Returns:
            Image with enhanced details
        """
        # Convert to LAB
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l = clahe.apply(l)

        # Merge and convert back
        enhanced_lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        return enhanced

    def process(self, image: np.ndarray, force_upscale: bool = False) -> Tuple[np.ndarray, dict]:
        """
        Intelligently process and upscale image

        Args:
            image: Input image
            force_upscale: Force upscaling even if not needed

        Returns:
            Tuple of (processed_image, metadata)
        """
        height, width = image.shape[:2]
        original_size = (width, height)

        metadata = {
            'original_size': original_size,
            'original_megapixels': (width * height) / 1_000_000,
            'was_upscaled': False,
            'has_faces': False,
            'upscale_method': None,
            'final_size': original_size,
            'final_megapixels': (width * height) / 1_000_000,
            'quality_improvement': 0
        }

        # Check if upscaling is needed
        needs_upscale = force_upscale or self.needs_upscaling(image)

        if not needs_upscale:
            return image, metadata

        # Detect faces for optimized processing
        has_faces = self.detect_faces(image)
        metadata['has_faces'] = has_faces

        # Calculate optimal size
        target_size = self.calculate_optimal_size(image)

        # Upscale with appropriate method
        if has_faces:
            processed = self.upscale_for_faces(image, target_size)
            metadata['upscale_method'] = 'face_optimized'
        else:
            processed = self.upscale_with_quality(image, target_size)
            metadata['upscale_method'] = 'quality_optimized'

        # Update metadata
        final_height, final_width = processed.shape[:2]
        metadata['was_upscaled'] = True
        metadata['final_size'] = (final_width, final_height)
        metadata['final_megapixels'] = (final_width * final_height) / 1_000_000
        metadata['quality_improvement'] = (
            (metadata['final_megapixels'] / metadata['original_megapixels'] - 1) * 100
        )

        return processed, metadata


def upscale_image_intelligently(
    image: np.ndarray,
    target_format: str = 'ultra_hd',
    force_upscale: bool = False
) -> Tuple[np.ndarray, dict]:
    """
    Convenience function to intelligently upscale an image

    Args:
        image: Input image
        target_format: Target paper format
        force_upscale: Force upscaling even if not needed

    Returns:
        Tuple of (upscaled_image, metadata)
    """
    upscaler = IntelligentUpscaler(target_format=target_format)
    return upscaler.process(image, force_upscale=force_upscale)
