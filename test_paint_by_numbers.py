#!/usr/bin/env python3
"""
Manual smoke test for the paint-by-numbers generator.
Wrapped in main() so pytest does not execute it during collection.
"""

import numpy as np


def create_simple_test_image(cv2, filename="test_input.png"):
    """Create a simple test image."""
    print("Creating test image...")

    # Create a 600x600 image with simple shapes
    img = np.zeros((600, 600, 3), dtype=np.uint8)

    # Blue sky
    img[0:300, :] = [135, 206, 235]

    # Green ground
    img[300:, :] = [34, 139, 34]

    # Yellow sun
    cv2.circle(img, (500, 100), 50, (255, 255, 0), -1)

    # Red house
    cv2.rectangle(img, (200, 300), (400, 500), (220, 20, 60), -1)

    # Brown roof
    pts = np.array([[150, 300], [450, 300], [300, 200]], np.int32)
    cv2.fillPoly(img, [pts], (139, 90, 43))

    # White door
    cv2.rectangle(img, (270, 400), (330, 500), (255, 255, 255), -1)

    cv2.imwrite(filename, img)
    print(f"Test image created: {filename}")
    return filename


def main() -> None:
    from paint_by_numbers.utils.opencv import cv2_available, describe_missing_cv2, require_cv2

    if not cv2_available():
        print(describe_missing_cv2())
        return

    cv2 = require_cv2()

    test_image = create_simple_test_image(cv2)

    from paint_by_numbers.main import PaintByNumbersGenerator

    generator = PaintByNumbersGenerator()

    results = generator.generate(
        input_path=test_image,
        output_dir="paint_test_output",
        n_colors=10,
        legend_style="grid"
    )

    print("\n" + "=" * 60)
    print("SUCCESS! ✓")
    print("=" * 60)
    print("\nGenerated files:")
    for key, path in results.items():
        print(f"  {key}: {path}")

    print("\nCheck the 'paint_test_output' directory for results!")


if __name__ == "__main__":
    main()
