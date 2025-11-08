"""
Subject Detection Module - Detects faces and important subjects in images
Inspired by QBRIX's region emphasis approach

This module automatically detects:
- Human faces
- Pet faces (dogs, cats)
- Salient/important regions
- Center-weighted fallback
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from pathlib import Path

try:
    from paint_by_numbers.logger import logger
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from logger import logger
    from utils.opencv import require_cv2


class SubjectRegion:
    """Represents a detected subject region (face, pet, etc.)"""

    def __init__(self, x: int, y: int, width: int, height: int,
                 confidence: float, subject_type: str):
        """
        Initialize subject region

        Args:
            x: Top-left x coordinate
            y: Top-left y coordinate
            width: Region width
            height: Region height
            confidence: Detection confidence (0-1)
            subject_type: 'face', 'pet', 'salient', 'center'
        """
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.confidence = confidence
        self.subject_type = subject_type

    def get_bbox(self) -> Tuple[int, int, int, int]:
        """Get bounding box (x, y, width, height)"""
        return (self.x, self.y, self.width, self.height)

    def get_center(self) -> Tuple[int, int]:
        """Get center point"""
        return (self.x + self.width // 2, self.y + self.height // 2)

    def expand(self, factor: float = 1.3) -> 'SubjectRegion':
        """
        Expand region by factor (e.g., 1.3 = 30% larger)
        Useful for including context around face
        """
        new_w = int(self.width * factor)
        new_h = int(self.height * factor)
        new_x = max(0, self.x - (new_w - self.width) // 2)
        new_y = max(0, self.y - (new_h - self.height) // 2)

        return SubjectRegion(new_x, new_y, new_w, new_h,
                            self.confidence, self.subject_type)

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'confidence': self.confidence,
            'type': self.subject_type
        }


class SubjectDetector:
    """Detects faces and important subjects in images"""

    def __init__(self):
        """Initialize detector with cascade classifiers"""
        self.cv2 = require_cv2()
        self.face_cascade = None
        self.eye_cascade = None
        self._load_cascades()

    def _load_cascades(self):
        """Load OpenCV cascade classifiers for face detection"""
        try:
            # Load Haar cascades for face detection
            cascade_path = Path(self.cv2.data.haarcascades)

            face_cascade_file = cascade_path / 'haarcascade_frontalface_default.xml'
            eye_cascade_file = cascade_path / 'haarcascade_eye.xml'

            if face_cascade_file.exists():
                self.face_cascade = self.cv2.CascadeClassifier(str(face_cascade_file))
                logger.info("Face cascade loaded successfully")

            if eye_cascade_file.exists():
                self.eye_cascade = self.cv2.CascadeClassifier(str(eye_cascade_file))
                logger.info("Eye cascade loaded successfully")

        except Exception as e:
            logger.warning(f"Could not load face cascades: {e}")

    def detect_faces(self, image: np.ndarray,
                     min_size: Tuple[int, int] = (60, 60)) -> List[SubjectRegion]:
        """
        Detect human faces using Haar cascades with improved QBRIX-quality thresholds

        Args:
            image: Input image (BGR)
            min_size: Minimum face size (lowered to 60x60 for better detection)

        Returns:
            List of detected face regions
        """
        if self.face_cascade is None:
            logger.warning("Face cascade not loaded, skipping face detection")
            return []

        # Convert to grayscale for detection
        gray = self.cv2.cvtColor(image, self.cv2.COLOR_BGR2GRAY)

        # Apply histogram equalization for better detection in varying lighting
        gray = self.cv2.equalizeHist(gray)

        # Detect faces with improved parameters
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.08,  # More thorough search (was 1.1)
            minNeighbors=4,    # Slightly more lenient (was 5) for better recall
            minSize=min_size,
            flags=self.cv2.CASCADE_SCALE_IMAGE
        )

        detected = []
        h_img, w_img = image.shape[:2]

        for (x, y, w, h) in faces:
            # Calculate face position and size metrics for confidence scoring
            face_area = w * h
            image_area = w_img * h_img
            face_ratio = face_area / image_area

            # Check if face is reasonably centered (within middle 80% of image)
            center_x = x + w / 2
            center_y = y + h / 2
            is_centered = (0.2 * w_img < center_x < 0.8 * w_img and
                          0.2 * h_img < center_y < 0.8 * h_img)

            # Base confidence based on face size
            if face_ratio > 0.15:  # Large face (>15% of image)
                confidence = 0.85
            elif face_ratio > 0.08:  # Medium face (8-15%)
                confidence = 0.80
            else:  # Small face (<8%)
                confidence = 0.75

            # Boost confidence if eyes detected
            if self.eye_cascade is not None:
                face_roi = gray[y:y+h, x:x+w]
                eyes = self.eye_cascade.detectMultiScale(face_roi, minSize=(15, 15))
                if len(eyes) >= 2:
                    confidence = min(0.98, confidence + 0.15)  # High confidence with eyes
                elif len(eyes) == 1:
                    confidence = min(0.90, confidence + 0.08)  # Moderate boost

            # Boost confidence if face is well-centered
            if is_centered:
                confidence = min(0.99, confidence + 0.05)

            region = SubjectRegion(x, y, w, h, confidence, 'face')
            detected.append(region)

        logger.info(f"Detected {len(detected)} faces with confidence scores")
        return detected

    def detect_salient_region(self, image: np.ndarray) -> Optional[SubjectRegion]:
        """
        Detect salient/important region using saliency detection with QBRIX-quality improvements
        Fallback if no faces detected

        Args:
            image: Input image (BGR)

        Returns:
            Most salient region or None
        """
        try:
            # Use static saliency detection
            saliency = self.cv2.saliency.StaticSaliencySpectralResidual_create()
            success, saliency_map = saliency.computeSaliency(image)

            if not success:
                return None

            # Apply Gaussian blur to reduce noise
            saliency_map = self.cv2.GaussianBlur(saliency_map, (9, 9), 0)

            # Threshold to get salient regions
            saliency_map = (saliency_map * 255).astype(np.uint8)
            _, thresh = self.cv2.threshold(saliency_map, 0, 255,
                                          self.cv2.THRESH_BINARY + self.cv2.THRESH_OTSU)

            # Morphological operations to clean up mask
            kernel = self.cv2.getStructuringElement(self.cv2.MORPH_ELLIPSE, (11, 11))
            thresh = self.cv2.morphologyEx(thresh, self.cv2.MORPH_CLOSE, kernel)

            # Find largest salient region
            contours, _ = self.cv2.findContours(thresh, self.cv2.RETR_EXTERNAL,
                                               self.cv2.CHAIN_APPROX_SIMPLE)

            if not contours:
                return None

            # Get largest contour
            largest = max(contours, key=self.cv2.contourArea)
            x, y, w, h = self.cv2.boundingRect(largest)

            # Calculate confidence based on size and position
            h_img, w_img = image.shape[:2]
            area_ratio = (w * h) / (w_img * h_img)

            # Higher confidence for larger, more prominent regions
            if area_ratio > 0.25:  # Large salient region
                confidence = 0.72
            elif area_ratio > 0.15:  # Medium salient region
                confidence = 0.68
            else:  # Small salient region
                confidence = 0.62

            # Expand region slightly to include context (10% padding)
            padding = 0.1
            x = max(0, int(x - w * padding))
            y = max(0, int(y - h * padding))
            w = min(w_img - x, int(w * (1 + 2 * padding)))
            h = min(h_img - y, int(h * (1 + 2 * padding)))

            region = SubjectRegion(x, y, w, h, confidence, 'salient')
            logger.info(f"Detected salient region at ({x}, {y}, {w}, {h}) with confidence {confidence:.2f}")
            return region

        except Exception as e:
            logger.warning(f"Saliency detection failed: {e}")
            return None

    def get_center_region(self, image: np.ndarray,
                          size_factor: float = 0.55) -> SubjectRegion:
        """
        Get center region as fallback with QBRIX-quality improvements
        Assumes subject is in center of image

        Args:
            image: Input image
            size_factor: Size of region relative to image (reduced to 0.55 for tighter crop)

        Returns:
            Center region
        """
        h, w = image.shape[:2]

        # Adjust size factor based on aspect ratio
        aspect_ratio = w / h

        # For portrait orientation (taller than wide), use slightly smaller horizontal crop
        if aspect_ratio < 0.8:  # Portrait
            region_w = int(w * (size_factor * 0.9))  # Tighter horizontal
            region_h = int(h * size_factor)
            logger.info("Detected portrait orientation - using portrait-optimized center crop")
        # For landscape orientation, use slightly smaller vertical crop
        elif aspect_ratio > 1.4:  # Landscape
            region_w = int(w * size_factor)
            region_h = int(h * (size_factor * 0.9))  # Tighter vertical
            logger.info("Detected landscape orientation - using landscape-optimized center crop")
        else:  # Square or moderate aspect ratio
            region_w = int(w * size_factor)
            region_h = int(h * size_factor)

        x = (w - region_w) // 2
        y = (h - region_h) // 2

        # Slightly higher confidence for well-composed images (confidence based on assumption)
        confidence = 0.55

        region = SubjectRegion(x, y, region_w, region_h, confidence, 'center')
        logger.info(f"Using center region as fallback (confidence: {confidence:.2f})")
        return region

    def detect_best_subject(self, image: np.ndarray,
                           expand_faces: bool = True,
                           expansion_factor: float = 1.5) -> SubjectRegion:
        """
        Detect the best subject region using multiple methods
        Priority: Faces > Salient regions > Center region

        Args:
            image: Input image (BGR)
            expand_faces: Expand detected faces to include context
            expansion_factor: How much to expand faces

        Returns:
            Best detected subject region
        """
        logger.info("Detecting best subject region...")

        # Try face detection first
        faces = self.detect_faces(image)

        if faces:
            # Use largest/most confident face
            best_face = max(faces, key=lambda f: f.width * f.height * f.confidence)

            if expand_faces:
                # Expand to include shoulders/context
                h, w = image.shape[:2]
                expanded = best_face.expand(expansion_factor)
                # Clamp to image bounds
                expanded.x = max(0, expanded.x)
                expanded.y = max(0, expanded.y)
                expanded.width = min(w - expanded.x, expanded.width)
                expanded.height = min(h - expanded.y, expanded.height)

                logger.info(f"Using expanded face region (expanded by {expansion_factor}x)")
                return expanded

            logger.info("Using detected face region")
            return best_face

        # Try saliency detection
        salient = self.detect_salient_region(image)
        if salient:
            logger.info("Using salient region")
            return salient

        # Fallback to center
        logger.info("No faces/salient regions found, using center region")
        return self.get_center_region(image)

    def create_emphasis_mask(self, image: np.ndarray,
                            subject_region: SubjectRegion,
                            feather_size: int = 50) -> np.ndarray:
        """
        Create soft mask for emphasized region with smooth edges

        Args:
            image: Input image
            subject_region: Region to emphasize
            feather_size: Pixels to feather edges

        Returns:
            Float mask (0-1), 1=fully emphasized, 0=background
        """
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.float32)

        # Fill subject region with 1.0
        x, y, rw, rh = subject_region.get_bbox()
        mask[y:y+rh, x:x+rw] = 1.0

        # Apply Gaussian blur for smooth transition
        if feather_size > 0:
            mask = self.cv2.GaussianBlur(mask, (feather_size*2+1, feather_size*2+1), 0)
            # Normalize back to 0-1
            if mask.max() > 0:
                mask = mask / mask.max()

        return mask

    def visualize_detection(self, image: np.ndarray,
                           subject_region: SubjectRegion) -> np.ndarray:
        """
        Visualize detected region on image

        Args:
            image: Input image
            subject_region: Detected region

        Returns:
            Image with region marked
        """
        vis = image.copy()
        x, y, w, h = subject_region.get_bbox()

        # Draw rectangle
        color = (0, 255, 0) if subject_region.subject_type == 'face' else (255, 0, 0)
        self.cv2.rectangle(vis, (x, y), (x+w, y+h), color, 3)

        # Add label
        label = f"{subject_region.subject_type} ({subject_region.confidence:.2f})"
        self.cv2.putText(vis, label, (x, y-10), self.cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, color, 2)

        return vis


# Convenience functions
def detect_subject(image_path: str, visualize: bool = False) -> Dict:
    """
    Detect subject in image (convenience function)

    Args:
        image_path: Path to image
        visualize: Save visualization image

    Returns:
        Dictionary with detection results
    """
    cv2 = require_cv2()
    detector = SubjectDetector()

    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")

    # Detect subject
    subject = detector.detect_best_subject(image)
    emphasis_mask = detector.create_emphasis_mask(image, subject)

    # Visualize if requested
    if visualize:
        vis = detector.visualize_detection(image, subject)
        output_path = str(Path(image_path).parent / f"{Path(image_path).stem}_detected.jpg")
        cv2.imwrite(output_path, vis)
        logger.info(f"Saved visualization to {output_path}")

    return {
        'subject_region': subject.to_dict(),
        'emphasis_mask': emphasis_mask,
        'image_shape': image.shape
    }
