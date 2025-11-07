"""
Multi-Region Processor - Process different image regions with different quality levels
Inspired by QBRIX's region emphasis system

Key Features:
- Allocate more colors to emphasized regions (faces)
- Use smaller min_region_size for detailed areas
- Use larger min_region_size for backgrounds
- Smooth blending at region boundaries
"""

import numpy as np
from typing import Dict, Tuple, Optional
from pathlib import Path

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.logger import logger
    from paint_by_numbers.intelligence.subject_detector import SubjectDetector, SubjectRegion
    from paint_by_numbers.utils.opencv import require_cv2
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from config import Config
    from logger import logger
    from intelligence.subject_detector import SubjectDetector, SubjectRegion
    from utils.opencv import require_cv2


class RegionConfig:
    """Configuration for a specific region"""

    def __init__(self, num_colors: int, min_region_size: int,
                 weight: float = 1.0, name: str = "region"):
        """
        Initialize region configuration

        Args:
            num_colors: Number of colors to allocate to this region
            min_region_size: Minimum size for regions in this area
            weight: Processing weight/priority (0-1)
            name: Region name for logging
        """
        self.num_colors = num_colors
        self.min_region_size = min_region_size
        self.weight = weight
        self.name = name


class MultiRegionProcessor:
    """
    Process images with region-specific quality settings
    Similar to QBRIX's approach of emphasizing important areas
    """

    def __init__(self, config: Optional[Config] = None):
        """Initialize multi-region processor"""
        self.config = config or Config()
        self.subject_detector = SubjectDetector()
        self.cv2 = require_cv2()

    def calculate_color_budget(self, total_colors: int,
                               subject_region: SubjectRegion,
                               image_shape: Tuple[int, int]) -> Dict[str, RegionConfig]:
        """
        Calculate intelligent color budget allocation

        Strategy:
        - Face/subject gets 65-75% of colors
        - Background gets 25-35% of colors
        - Adjust based on region sizes

        Args:
            total_colors: Total color budget (e.g., 20 for Original model)
            subject_region: Detected subject region
            image_shape: (height, width) of image

        Returns:
            Dict with 'emphasized' and 'background' configs
        """
        h, w = image_shape[:2]
        total_pixels = h * w

        # Calculate subject region size
        x, y, rw, rh = subject_region.get_bbox()
        subject_pixels = rw * rh
        subject_ratio = subject_pixels / total_pixels

        logger.info(f"Subject occupies {subject_ratio*100:.1f}% of image")

        # Color allocation strategy
        if subject_ratio > 0.5:
            # Subject is large (half the image) - give it 65% of colors
            emphasized_ratio = 0.65
        elif subject_ratio > 0.3:
            # Subject is medium - give it 70% of colors
            emphasized_ratio = 0.70
        else:
            # Subject is small - give it 75% of colors for maximum detail
            emphasized_ratio = 0.75

        # Calculate color allocation
        emphasized_colors = max(1, int(total_colors * emphasized_ratio))
        background_colors = max(1, total_colors - emphasized_colors)

        # Min region sizes based on model
        base_min_size = self.config.MIN_REGION_SIZE

        # Emphasized region: smaller regions for more detail
        emphasized_min_size = int(base_min_size * 0.6)  # 40% smaller

        # Background: larger regions for simplification
        background_min_size = int(base_min_size * 1.8)  # 80% larger

        logger.info(
            f"Color budget: Emphasized={emphasized_colors}, Background={background_colors}"
        )
        logger.info(
            f"Min region sizes: Emphasized={emphasized_min_size}, "
            f"Background={background_min_size}"
        )

        return {
            'emphasized': RegionConfig(
                num_colors=emphasized_colors,
                min_region_size=emphasized_min_size,
                weight=1.0,
                name='emphasized'
            ),
            'background': RegionConfig(
                num_colors=background_colors,
                min_region_size=background_min_size,
                weight=0.4,
                name='background'
            )
        }

    def create_region_masks(self, image: np.ndarray,
                           subject_region: SubjectRegion,
                           feather_pixels: int = 30) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create masks for emphasized and background regions with smooth transition

        Args:
            image: Input image
            subject_region: Subject region
            feather_pixels: Pixels for smooth edge transition

        Returns:
            Tuple of (emphasized_mask, background_mask) as float arrays (0-1)
        """
        # Get emphasis mask (soft edges)
        emphasis_mask = self.subject_detector.create_emphasis_mask(
            image, subject_region, feather_size=feather_pixels
        )

        # Background mask is inverse
        background_mask = 1.0 - emphasis_mask

        logger.info(f"Created region masks with {feather_pixels}px feathering")

        return emphasis_mask, background_mask

    def process_region_separately(self, image: np.ndarray,
                                  mask: np.ndarray,
                                  region_config: RegionConfig,
                                  palette_method: str = 'kmeans') -> Dict:
        """
        Process a specific region with its own parameters

        Args:
            image: Input image (BGR)
            mask: Region mask (0-1 float)
            region_config: Region processing configuration
            palette_method: Color quantization method

        Returns:
            Dict with quantized_image, palette, labels
        """
        # Extract masked region pixels for palette extraction
        # Only use pixels with mask value > 0.5
        binary_mask = (mask > 0.5).astype(np.uint8)
        masked_pixels = image[binary_mask > 0]

        if len(masked_pixels) == 0:
            logger.warning(f"No pixels in {region_config.name} region")
            return None

        logger.info(
            f"Processing {region_config.name} region: "
            f"{len(masked_pixels)} pixels, {region_config.num_colors} colors"
        )

        # Run K-means on masked pixels to get palette
        from paint_by_numbers.core.color_quantizer import ColorQuantizer

        quantizer = ColorQuantizer(self.config)
        quantizer.config.DEFAULT_NUM_COLORS = region_config.num_colors
        quantizer.config.MIN_REGION_SIZE = region_config.min_region_size

        # Extract palette from region pixels
        palette, labels, metrics = quantizer.quantize_colors(
            masked_pixels.reshape(-1, 1, 3),
            n_colors=region_config.num_colors
        )

        return {
            'palette': palette,
            'num_colors': region_config.num_colors,
            'region_config': region_config
        }

    def blend_regions(self, emphasized_result: np.ndarray,
                     background_result: np.ndarray,
                     emphasis_mask: np.ndarray) -> np.ndarray:
        """
        Blend processed emphasized and background regions smoothly

        Args:
            emphasized_result: Processed emphasized region image
            background_result: Processed background region image
            emphasis_mask: Float mask (0-1) for blending

        Returns:
            Blended result image
        """
        # Expand mask to 3 channels
        mask_3d = emphasis_mask[:, :, np.newaxis]

        # Weighted blend
        blended = (emphasized_result * mask_3d +
                   background_result * (1.0 - mask_3d)).astype(np.uint8)

        logger.info("Blended emphasized and background regions")
        return blended

    def process_with_emphasis(self, image: np.ndarray,
                             total_colors: int,
                             auto_detect: bool = True,
                             subject_region: Optional[SubjectRegion] = None) -> Dict:
        """
        Process image with region emphasis (main entry point)

        Args:
            image: Input image (BGR)
            total_colors: Total color budget for entire image
            auto_detect: Automatically detect subject region
            subject_region: Manual subject region (if auto_detect=False)

        Returns:
            Dict with processing results
        """
        logger.info(
            f"=== Multi-Region Processing with Emphasis (Total colors: {total_colors}) ==="
        )

        # 1. Detect or use provided subject region
        if auto_detect or subject_region is None:
            subject_region = self.subject_detector.detect_best_subject(image)
        else:
            logger.info("Using provided subject region")

        # 2. Calculate color budget
        region_configs = self.calculate_color_budget(
            total_colors, subject_region, image.shape[:2]
        )

        # 3. Create region masks
        emphasis_mask, background_mask = self.create_region_masks(
            image, subject_region, feather_pixels=40
        )

        # 4. Process each region separately
        emphasized = self.process_region_separately(
            image, emphasis_mask, region_configs['emphasized']
        )

        background = self.process_region_separately(
            image, background_mask, region_configs['background']
        )

        # 5. Combine palettes (emphasized colors + background colors)
        combined_palette = np.vstack([
            emphasized['palette'],
            background['palette']
        ])

        logger.info(
            f"✅ Multi-region processing complete: "
            f"{len(emphasized['palette'])} emphasized + "
            f"{len(background['palette'])} background = "
            f"{len(combined_palette)} total colors"
        )

        return {
            'combined_palette': combined_palette,
            'emphasized_palette': emphasized['palette'],
            'background_palette': background['palette'],
            'subject_region': subject_region,
            'emphasis_mask': emphasis_mask,
            'background_mask': background_mask,
            'region_configs': region_configs
        }


def process_image_with_face_emphasis(image_path: str,
                                     total_colors: int = 20,
                                     output_dir: Optional[str] = None) -> Dict:
    """
    Convenience function to process image with face emphasis

    Args:
        image_path: Path to input image
        total_colors: Total color budget
        output_dir: Optional output directory for debug images

    Returns:
        Processing results dictionary
    """
    cv2 = require_cv2()
    processor = MultiRegionProcessor()

    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")

    # Process with emphasis
    result = processor.process_with_emphasis(image, total_colors)

    # Save debug visualizations if requested
    if output_dir:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Save subject detection visualization
        vis = processor.subject_detector.visualize_detection(
            image, result['subject_region']
        )
        cv2.imwrite(str(output_path / "subject_detection.jpg"), vis)

        # Save emphasis mask
        mask_vis = (result['emphasis_mask'] * 255).astype(np.uint8)
        cv2.imwrite(str(output_path / "emphasis_mask.jpg"), mask_vis)

        logger.info(f"Saved visualizations to {output_dir}")

    return result
