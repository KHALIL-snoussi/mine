"""
QUALITY-FIRST Configuration
Conservative settings that prioritize output quality over processing speed
"""

# For MAXIMUM QUALITY with less aggressive processing
ULTRA_QUALITY_SETTINGS = {
    "DEFAULT_NUM_COLORS": 30,
    "MIN_REGION_SIZE": 35,
    "MAX_IMAGE_SIZE": (4960, 7016),  # A2 @ 300 DPI
    "FONT_SCALE": 0.28,

    # Edge Detection - Conservative
    "EDGE_THRESHOLD_LOW": 40,        # Less aggressive (was 30)
    "EDGE_THRESHOLD_HIGH": 160,      # More conservative (was 170)

    # Bilateral Filter - Gentler
    "BILATERAL_FILTER_D": 7,         # Larger diameter (was 5)
    "BILATERAL_SIGMA_COLOR": 60,     # More conservative (was 50)
    "BILATERAL_SIGMA_SPACE": 60,     # More conservative (was 50)

    # Morphology
    "MORPHOLOGY_KERNEL_SIZE": 2,

    # Sharpening - REDUCED to prevent artifacts
    "APPLY_SHARPENING": True,
    "SHARPEN_AMOUNT": 0.6,           # REDUCED from 1.0 - prevents halos
    "SHARPEN_RADIUS": 3,             # REDUCED from 4 - more subtle

    # CLAHE - REDUCED to prevent over-enhancement
    "CLAHE_CLIP_LIMIT": 2.5,         # REDUCED from 3.5 - more natural
    "APPLY_LOCAL_CONTRAST": True,

    # Other processing
    "APPLY_TONE_BALANCE": True,
    "AUTO_WHITE_BALANCE": True,
    "USE_UNIFIED_PALETTE": True,
    "UNIFIED_PALETTE_NAME": "classic_24",
    "GENERATE_SVG": True,
    "GENERATE_PDF": True,
}

# Comparison:
"""
CURRENT (ultra_detailed) vs QUALITY-FIRST:

Parameter              Current    Quality-First   Why Changed
-------------------------------------------------------------------
SHARPEN_AMOUNT         1.0        0.6            Too aggressive causes halos
SHARPEN_RADIUS         4          3              More subtle sharpening
CLAHE_CLIP_LIMIT       3.5        2.5            Prevents over-enhancement
BILATERAL_FILTER_D     5          7              Gentler smoothing
BILATERAL_SIGMA        50         60             More natural smoothing
EDGE_THRESHOLD_LOW     30         40             Less aggressive edges
EDGE_THRESHOLD_HIGH    170        160            More conservative edges

RESULT: More natural-looking, fewer artifacts, still excellent quality
TRADEOFF: Slightly less "sharp" but more realistic and printable
"""

# RECOMMENDATION:
"""
For BEST quality:

1. START WITH GOOD INPUT IMAGES
   - Minimum: 2000x2000 pixels
   - Recommended: 3000x3000+ pixels
   - Don't rely on upscaling to fix low quality

2. USE QUALITY-FIRST SETTINGS
   - Less aggressive sharpening
   - More conservative enhancement
   - More natural results

3. TEST AND ADJUST
   - Generate with different settings
   - Compare results
   - Choose what looks best for YOUR images
"""
