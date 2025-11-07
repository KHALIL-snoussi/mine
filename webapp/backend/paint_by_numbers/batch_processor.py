"""
Batch Processing Module - Process multiple images in batch
"""

import os
from pathlib import Path
from typing import List, Optional, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

try:
    from paint_by_numbers.config import Config
    from paint_by_numbers.logger import logger
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from config import Config
    from logger import logger


class BatchProcessor:
    """Process multiple images in batch"""

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize batch processor

        Args:
            config: Configuration object
        """
        self.config = config or Config()
        self.results = []
        self.errors = []

    def process_directory(self, input_dir: str, output_dir: str,
                         recursive: bool = False,
                         file_extensions: List[str] = None,
                         max_workers: int = 4,
                         **kwargs) -> Dict:
        """
        Process all images in a directory

        Args:
            input_dir: Input directory path
            output_dir: Output directory path
            recursive: Process subdirectories recursively
            file_extensions: List of file extensions to process (default: common image formats)
            max_workers: Maximum number of parallel workers
            **kwargs: Additional arguments to pass to generator

        Returns:
            Dictionary with processing results and statistics
        """
        if file_extensions is None:
            file_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff']

        # Find all image files
        input_path = Path(input_dir)
        if not input_path.exists():
            raise FileNotFoundError(f"Input directory not found: {input_dir}")

        image_files = []
        if recursive:
            for ext in file_extensions:
                image_files.extend(input_path.rglob(f"*{ext}"))
                image_files.extend(input_path.rglob(f"*{ext.upper()}"))
        else:
            for ext in file_extensions:
                image_files.extend(input_path.glob(f"*{ext}"))
                image_files.extend(input_path.glob(f"*{ext.upper()}"))

        if not image_files:
            logger.warning(f"No image files found in {input_dir}")
            return {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "results": [],
                "errors": []
            }

        logger.info(f"Found {len(image_files)} images to process")

        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Process images
        self.results = []
        self.errors = []

        # Import here to avoid circular dependency
        from paint_by_numbers.main import PaintByNumbersGenerator

        if max_workers == 1:
            # Sequential processing
            for image_file in tqdm(image_files, desc="Processing images"):
                self._process_single_image(
                    str(image_file),
                    output_dir,
                    PaintByNumbersGenerator,
                    **kwargs
                )
        else:
            # Parallel processing
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {
                    executor.submit(
                        self._process_single_image,
                        str(image_file),
                        output_dir,
                        PaintByNumbersGenerator,
                        **kwargs
                    ): image_file
                    for image_file in image_files
                }

                # Progress bar
                with tqdm(total=len(image_files), desc="Processing images") as pbar:
                    for future in as_completed(futures):
                        pbar.update(1)

        # Return statistics
        return {
            "total": len(image_files),
            "successful": len(self.results),
            "failed": len(self.errors),
            "results": self.results,
            "errors": self.errors
        }

    def process_file_list(self, file_list: List[str], output_dir: str,
                         max_workers: int = 4, **kwargs) -> Dict:
        """
        Process a list of specific image files

        Args:
            file_list: List of image file paths
            output_dir: Output directory path
            max_workers: Maximum number of parallel workers
            **kwargs: Additional arguments to pass to generator

        Returns:
            Dictionary with processing results and statistics
        """
        logger.info(f"Processing {len(file_list)} images")

        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Reset results
        self.results = []
        self.errors = []

        # Import here to avoid circular dependency
        from paint_by_numbers.main import PaintByNumbersGenerator

        if max_workers == 1:
            # Sequential processing
            for image_file in tqdm(file_list, desc="Processing images"):
                self._process_single_image(
                    image_file,
                    output_dir,
                    PaintByNumbersGenerator,
                    **kwargs
                )
        else:
            # Parallel processing
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {
                    executor.submit(
                        self._process_single_image,
                        image_file,
                        output_dir,
                        PaintByNumbersGenerator,
                        **kwargs
                    ): image_file
                    for image_file in file_list
                }

                # Progress bar
                with tqdm(total=len(file_list), desc="Processing images") as pbar:
                    for future in as_completed(futures):
                        pbar.update(1)

        # Return statistics
        return {
            "total": len(file_list),
            "successful": len(self.results),
            "failed": len(self.errors),
            "results": self.results,
            "errors": self.errors
        }

    def _process_single_image(self, input_path: str, output_dir: str,
                             generator_class, **kwargs):
        """
        Process a single image

        Args:
            input_path: Input image path
            output_dir: Output directory
            generator_class: PaintByNumbersGenerator class
            **kwargs: Additional arguments
        """
        try:
            # Create subdirectory for this image
            input_file = Path(input_path)
            image_output_dir = Path(output_dir) / input_file.stem

            # Create generator
            generator = generator_class(config=self.config)

            # Generate
            results = generator.generate(
                input_path=str(input_path),
                output_dir=str(image_output_dir),
                **kwargs
            )

            self.results.append({
                "input": str(input_path),
                "output_dir": str(image_output_dir),
                "files": results
            })

            logger.info(f"Successfully processed: {input_file.name}")

        except Exception as e:
            error_msg = f"Failed to process {input_path}: {str(e)}"
            logger.error(error_msg)
            self.errors.append({
                "input": str(input_path),
                "error": str(e)
            })
